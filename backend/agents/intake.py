"""
Intake Agent — metadata extraction, SHA-256, perceptual hash, synthetic DB check.
Cheap model (Llama 8B via IronLabs / gpt-4o-mini fallback).
"""
import hashlib
import io
import json
import os
from pathlib import Path

from agents.base import BaseAgent
from ironlabs_router import IronLabsRouter

SYNTHETIC_DB_PATH = Path("data/synthetic_hash_db.json")


def _load_synthetic_db() -> set:
    if SYNTHETIC_DB_PATH.exists():
        try:
            data = json.loads(SYNTHETIC_DB_PATH.read_text())
            return set(data.get("hashes", []))
        except Exception:
            pass
    return set()


def _compute_phash_simple(image_bytes: bytes) -> str:
    """Simplified perceptual hash using Pillow (no imagehash lib needed)."""
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes)).convert("L").resize((8, 8))
        pixels = list(img.getdata())
        avg = sum(pixels) / len(pixels)
        bits = "".join("1" if p >= avg else "0" for p in pixels)
        return hex(int(bits, 2))[2:].zfill(16)
    except Exception:
        return "0000000000000000"


def _extract_basic_metadata(image_bytes: bytes, filename: str = "") -> dict:
    meta = {"filename": filename, "size_bytes": len(image_bytes)}
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes))
        meta["width"] = img.width
        meta["height"] = img.height
        meta["format"] = img.format or "UNKNOWN"
        meta["mode"] = img.mode
        exif = img._getexif() if hasattr(img, "_getexif") and img._getexif() else {}
        if exif:
            meta["has_exif"] = True
            meta["exif_tags"] = len(exif)
        else:
            meta["has_exif"] = False
    except Exception as e:
        meta["parse_error"] = str(e)
    return meta


class IntakeAgent(BaseAgent):
    name = "intake"

    def __init__(self):
        self.router = IronLabsRouter()
        self.synthetic_hashes = _load_synthetic_db()

    async def run(self, context: dict) -> dict:
        image_bytes: bytes = context.get("image_bytes", b"")
        filename: str = context.get("filename", "upload.png")
        audit_id: str = context.get("audit_id", "")

        sha256 = hashlib.sha256(image_bytes).hexdigest()
        phash = _compute_phash_simple(image_bytes)
        meta = _extract_basic_metadata(image_bytes, filename)

        hash_match = sha256 in self.synthetic_hashes or phash in self.synthetic_hashes
        anomalies = []

        if hash_match:
            anomalies.append({"type": "hash_match", "description": "SHA-256 matches known synthetic image"})

        if not meta.get("has_exif"):
            anomalies.append({"type": "missing_exif", "description": "No EXIF metadata (common in AI-generated images)"})

        if meta.get("width") and meta.get("height"):
            w, h = meta["width"], meta["height"]
            if w == h and w in (512, 768, 1024, 1536):
                anomalies.append({"type": "suspicious_dimensions", "description": f"Square {w}×{h} — common AI generation size"})

        # Use LLM for structured metadata reasoning
        prompt = f"""Analyze these image metadata characteristics and return a JSON object:
Filename: {filename}
Size: {meta.get('size_bytes', 0)} bytes
Dimensions: {meta.get('width','?')}×{meta.get('height','?')}
Format: {meta.get('format','?')}
Has EXIF: {meta.get('has_exif', False)}
EXIF tags: {meta.get('exif_tags', 0)}
Hash match in synthetic DB: {hash_match}
Anomalies detected: {anomalies}

Return ONLY valid JSON:
{{"metadata_complete": true/false, "triage_score": 0.0-1.0, "summary": "brief note"}}
where triage_score is authenticity confidence (1.0 = definitely real, 0.0 = definitely fake)."""

        text, tele = await self.router.route(
            "metadata_extraction", prompt, audit_id=audit_id
        )

        triage_score = 0.7
        summary = "Metadata analysis complete."
        try:
            j = json.loads(text.strip().split("```json")[-1].split("```")[0].strip() if "```" in text else text.strip())
            triage_score = float(j.get("triage_score", 0.7))
            summary = j.get("summary", summary)
        except Exception:
            if "0." in text:
                import re
                nums = re.findall(r"0\.\d+", text)
                if nums:
                    triage_score = float(nums[0])

        if hash_match:
            triage_score = min(triage_score, 0.1)

        return {
            "score": round(triage_score, 3),
            "metadata": meta,
            "sha256": sha256,
            "phash": phash,
            "hash_match": hash_match,
            "anomalies": anomalies,
            "metadata_complete": not bool(anomalies),
            "summary": summary,
            "evidence": [{"type": a["type"], "score": 0.8, "source_agent": "intake", "description": a["description"]} for a in anomalies],
            "_telemetry": tele,
        }
