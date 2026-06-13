"""
HuggingFace AI-image detectors.
Calls multiple HF models in parallel and returns an ensemble score.
Falls back gracefully if HF_TOKEN is missing or API is slow.
"""
import os
import asyncio
import hashlib
import json
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN", "")
HF_HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}
CACHE_DIR = Path("data/hf_cache")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

DETECTORS = [
    "Organika/sdxl-detector",
    "umm-maybe/AI-image-detector",
]


async def _call_one(client: httpx.AsyncClient, model: str, image_bytes: bytes) -> dict:
    url = f"https://api-inference.huggingface.co/models/{model}"
    try:
        r = await client.post(
            url, headers=HF_HEADERS, content=image_bytes, timeout=15.0
        )
        r.raise_for_status()
        return {"model": model, "result": r.json()}
    except Exception as e:
        return {"model": model, "error": str(e)}


async def detect_ai(image_bytes: bytes) -> dict:
    """Returns ensemble AI-detection score [0..1] and evidence list."""
    sha = hashlib.sha256(image_bytes).hexdigest()
    cache_path = CACHE_DIR / f"{sha}.json"
    if cache_path.exists():
        return json.loads(cache_path.read_text())

    if not HF_TOKEN:
        # No token: return neutral score
        return {"ensemble_score": 0.5, "evidence": [{"note": "HF_TOKEN not set — using neutral score"}]}

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(
            *[_call_one(client, m, image_bytes) for m in DETECTORS]
        )

    scores = []
    evidence = []
    for r in results:
        if "error" in r:
            evidence.append({"detector": r["model"], "error": r["error"]})
            continue
        data = r.get("result", [])
        if isinstance(data, list):
            for item in data:
                label = str(item.get("label", "")).lower()
                if "fake" in label or "ai" in label or "artificial" in label or "generated" in label:
                    score = float(item.get("score", 0.5))
                    scores.append(score)
                    evidence.append({
                        "detector": r["model"], "label": item["label"], "score": score
                    })
        elif isinstance(data, dict) and "label" in data:
            label = data["label"].lower()
            if "fake" in label or "ai" in label:
                score = float(data.get("score", 0.5))
                scores.append(score)
                evidence.append({"detector": r["model"], "label": data["label"], "score": score})

    ensemble_score = sum(scores) / len(scores) if scores else 0.5
    out = {"ensemble_score": round(ensemble_score, 4), "evidence": evidence}

    try:
        cache_path.write_text(json.dumps(out))
    except Exception:
        pass

    return out
