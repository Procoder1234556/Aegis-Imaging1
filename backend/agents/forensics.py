"""
Forensics Agent — visual artifact detection via HF detectors + FFT + vision LLM.
Mid-tier model with vision support.
"""
import asyncio
import json
import re

from agents.base import BaseAgent
from ironlabs_router import IronLabsRouter
from hf_detectors import detect_ai


def _analyze_fft(image_bytes: bytes) -> dict:
    try:
        import numpy as np
        from PIL import Image
        import io

        img = Image.open(io.BytesIO(image_bytes)).convert("L")
        arr = np.array(img, dtype=float)
        f = np.fft.fft2(arr)
        fshift = np.fft.fftshift(f)
        mag = 20 * np.log(np.abs(fshift) + 1)

        h, w = mag.shape
        center = mag[h // 4 : 3 * h // 4, w // 4 : 3 * w // 4]
        mean_energy = float(np.mean(center))
        # Higher energy in mid-frequencies = more likely AI-generated
        ai_score = min(1.0, max(0.0, (mean_energy - 80) / 40))

        return {
            "score": round(ai_score, 3),
            "mean_energy": round(mean_energy, 2),
            "evidence": [{"fft_mean_energy": round(mean_energy, 2), "ai_likelihood": round(ai_score, 3)}],
        }
    except Exception as e:
        return {"score": 0.5, "evidence": [{"fft": "failed", "error": str(e)}]}


class ForensicsAgent(BaseAgent):
    name = "forensics"

    def __init__(self):
        self.router = IronLabsRouter()

    async def run(self, context: dict) -> dict:
        image_bytes: bytes = context.get("image_bytes", b"")
        image_path: str = context.get("image_path", "")
        audit_id: str = context.get("audit_id", "")

        # Run HF detectors + FFT in parallel
        hf_task = detect_ai(image_bytes)
        fft_task = asyncio.get_event_loop().run_in_executor(None, _analyze_fft, image_bytes)

        prompt = """You are a forensic image analyst specializing in AI-generated medical images.
Examine this image for signs of AI generation or manipulation.

Look for:
1. Unnatural frequency artifacts or texturing
2. Inconsistent noise patterns between regions
3. Oversmoothing or unnatural sharpness transitions
4. AI generation artifacts (repeating patterns, grid structures)
5. Anatomical impossibilities or unnatural tissue boundaries

Return ONLY valid JSON:
{
  "ai_probability": 0.0-1.0,
  "confidence": 0.0-1.0,
  "regions": [{"label": "artifact type", "bbox": [x1,y1,x2,y2], "score": 0.0-1.0}],
  "reasoning": "brief explanation"
}
where bbox values are fractions 0-1, ai_probability 1.0 means definitely AI-generated."""

        hf_r, fft_r, (llm_text, tele) = await asyncio.gather(
            hf_task, fft_task,
            self.router.route("forensics_analysis", prompt, image_path=image_path, audit_id=audit_id)
        )

        llm_data = {"ai_probability": 0.5, "regions": [], "reasoning": "Analysis complete."}
        try:
            clean = llm_text.strip()
            if "```" in clean:
                clean = clean.split("```json")[-1].split("```")[0].strip()
            llm_data = json.loads(clean)
        except Exception:
            nums = re.findall(r'"ai_probability":\s*([\d.]+)', llm_text)
            if nums:
                llm_data["ai_probability"] = float(nums[0])

        hf_score = hf_r.get("ensemble_score", 0.5)
        fft_score = fft_r.get("score", 0.5)
        llm_ai_prob = float(llm_data.get("ai_probability", 0.5))

        # Weighted ensemble: HF 50% + FFT 20% + LLM 30%
        ai_prob = 0.5 * hf_score + 0.2 * fft_score + 0.3 * llm_ai_prob
        trust_score = 1.0 - ai_prob

        evidence = []
        for e in hf_r.get("evidence", []):
            evidence.append({**e, "source_agent": "forensics", "type": "hf_detector"})
        for e in fft_r.get("evidence", []):
            evidence.append({**e, "source_agent": "forensics", "type": "fft_analysis"})
        for r in llm_data.get("regions", []):
            evidence.append({
                "type": "visual_artifact",
                "region": r.get("bbox"),
                "score": r.get("score", 0.7),
                "source_agent": "forensics",
                "description": r.get("label", "Artifact"),
            })

        return {
            "score": round(trust_score, 3),
            "ai_probability": round(ai_prob, 3),
            "hf_score": round(hf_score, 3),
            "fft_score": round(fft_score, 3),
            "llm_ai_prob": round(llm_ai_prob, 3),
            "suspicious_regions": llm_data.get("regions", []),
            "reasoning": llm_data.get("reasoning", ""),
            "evidence": evidence,
            "_telemetry": tele,
        }
