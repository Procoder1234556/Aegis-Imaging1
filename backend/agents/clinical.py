"""
Clinical Agent — anatomy plausibility assessment via vision LLM.
Mid-tier vision model (Claude Haiku Vision via IronLabs / fallback).
"""
import json
import re

from agents.base import BaseAgent
from ironlabs_router import IronLabsRouter


class ClinicalAgent(BaseAgent):
    name = "clinical"

    def __init__(self):
        self.router = IronLabsRouter()

    async def run(self, context: dict) -> dict:
        image_path: str = context.get("image_path", "")
        modality: str = context.get("modality", "xray")
        audit_id: str = context.get("audit_id", "")

        prompt = f"""You are a board-certified radiologist reviewing a {modality.upper()} image submitted for authenticity verification.

Step 1: Describe what you see (anatomical region, view, key features).
Step 2: Rate clinical plausibility 0.0–1.0:
  - Does the anatomy obey normal physiology?
  - Are there impossible features (extra organs, mirrored asymmetry, impossible densities)?
  - Are labels/markers consistent with real imaging equipment?
  - Is the noise/artifact pattern consistent with real scanner hardware?

Step 3: List any impossibilities with bounding boxes [x1,y1,x2,y2] as image-coordinate fractions (0–1).

Return ONLY valid JSON:
{{
  "description": "anatomical description",
  "plausibility": 0.0-1.0,
  "modality_match": true/false,
  "impossibilities": [
    {{"description": "finding", "bbox": [0.1, 0.2, 0.5, 0.7], "severity": "high/medium/low"}}
  ]
}}
where plausibility 1.0 = anatomically perfect, 0.0 = physically impossible."""

        text, tele = await self.router.route(
            "clinical_reasoning", prompt,
            system_message="You are a senior radiologist with 20 years of experience in medical image authenticity verification.",
            image_path=image_path,
            audit_id=audit_id,
        )

        result_data = {"plausibility": 0.7, "description": "Clinical analysis complete.", "impossibilities": []}
        try:
            clean = text.strip()
            if "```" in clean:
                clean = clean.split("```json")[-1].split("```")[0].strip()
            result_data = json.loads(clean)
        except Exception:
            nums = re.findall(r'"plausibility":\s*([\d.]+)', text)
            if nums:
                result_data["plausibility"] = float(nums[0])

        plausibility = float(result_data.get("plausibility", 0.7))
        impossibilities = result_data.get("impossibilities", [])

        evidence = []
        for imp in impossibilities:
            evidence.append({
                "type": "clinical_impossibility",
                "region": imp.get("bbox"),
                "score": {"high": 0.9, "medium": 0.7, "low": 0.5}.get(imp.get("severity", "medium"), 0.7),
                "source_agent": "clinical",
                "description": imp.get("description", "Anatomical anomaly"),
            })

        return {
            "score": round(plausibility, 3),
            "plausibility": round(plausibility, 3),
            "description": result_data.get("description", ""),
            "modality_match": result_data.get("modality_match", True),
            "impossibilities": impossibilities,
            "evidence": evidence,
            "_telemetry": tele,
        }
