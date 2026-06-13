"""
Aegis Imaging — AI Prescription Detector
Primary: Local forensic analysis (PIL + numpy + cv2)
Fallback: Gemini vision model (triggered on ESCALATE or analysis failure)

Technique stack (local):
  1. ELA  – Error Level Analysis (JPEG re-compression artifacts)
  2. FFT  – Frequency domain analysis (GAN grid patterns)
  3. Noise– High-frequency residual (camera sensor vs AI synthesis)
  4. HSV  – Color saturation uniformity
  5. Edge – Edge coherence
  6. EXIF – Metadata presence
  7. Meta – Dimension / file-size plausibility

Verdict:
  REJECT   – high AI probability  (score > 0.65)
  ESCALATE – uncertain            (0.35–0.65) → triggers Gemini fallback
  APPROVE  – likely authentic     (score < 0.35)
"""

import hashlib
import io
import json
import os
import re
import tempfile
import uuid
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import numpy as np
import cv2
from PIL import Image, ImageChops, ImageEnhance, ImageFilter
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _load(image_bytes: bytes):
    img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_cv  = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
    return img_pil, img_cv


def _phash(image_bytes: bytes) -> str:
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("L").resize((8, 8))
        pixels = list(img.getdata())
        avg = sum(pixels) / len(pixels)
        bits = "".join("1" if p >= avg else "0" for p in pixels)
        return hex(int(bits, 2))[2:].zfill(16)
    except Exception:
        return "0000000000000000"


def _metadata(image_bytes: bytes, filename: str = "") -> dict:
    meta = {"filename": filename, "size_bytes": len(image_bytes)}
    try:
        img = Image.open(io.BytesIO(image_bytes))
        meta.update({"width": img.width, "height": img.height,
                     "format": img.format or "UNKNOWN", "mode": img.mode})
        exif = img._getexif() if hasattr(img, "_getexif") and callable(img._getexif) else None
        meta["has_exif"]   = bool(exif)
        meta["exif_tags"]  = len(exif) if exif else 0
    except Exception as e:
        meta["parse_error"] = str(e)
    return meta


# ─────────────────────────────────────────────
# Local analysis components (each returns 0.0–1.0 AI probability)
# ─────────────────────────────────────────────

def analyze_ela(img_pil: Image.Image, quality: int = 90) -> tuple:
    buf = io.BytesIO()
    img_pil.save(buf, "JPEG", quality=quality)
    buf.seek(0)
    recompressed = Image.open(buf).convert("RGB")
    diff   = ImageChops.difference(img_pil, recompressed)
    arr    = np.array(diff).astype(np.float32)
    mean   = float(np.mean(arr))
    std    = float(np.std(arr))
    uniformity_score = 1.0 - min(1.0, std / (mean + 1e-6) / 3.0)
    range_score      = min(1.0, mean / 15.0)
    score = (uniformity_score * 0.6 + range_score * 0.4)
    return round(min(1.0, max(0.0, score)), 4), {"ela_mean": round(mean, 2), "ela_std": round(std, 2)}


def analyze_fft(img_cv) -> tuple:
    gray  = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    dft   = np.fft.fft2(gray.astype(np.float32))
    shift = np.fft.fftshift(dft)
    mag   = np.log1p(np.abs(shift))
    mag   = (mag - mag.min()) / (mag.max() - mag.min() + 1e-9)
    h, w  = mag.shape
    cy, cx = h // 2, w // 2
    r     = min(h, w) // 8
    y_idx, x_idx = np.ogrid[:h, :w]
    mask  = ((y_idx - cy)**2 + (x_idx - cx)**2) < r**2
    mag[mask] = 0.0
    outer_std  = float(np.std(mag))
    peak_ratio = float(mag.max() - np.percentile(mag, 95))
    score = min(1.0, outer_std * 5.0 + peak_ratio * 2.0)
    return round(score, 4), {"fft_outer_std": round(outer_std, 4), "fft_peak_ratio": round(peak_ratio, 4)}


def analyze_noise(img_cv) -> tuple:
    gray     = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY).astype(np.float32)
    blurred  = cv2.GaussianBlur(gray, (5, 5), 0)
    residual = gray - blurred
    noise_std = float(np.std(residual))
    if noise_std < 1.5:
        score = 0.85
    elif noise_std < 3.0:
        score = 0.55
    elif noise_std < 6.0:
        score = 0.25
    else:
        score = 0.10
    return round(score, 4), {"noise_std": round(noise_std, 3)}


def analyze_color(img_cv) -> tuple:
    hsv    = cv2.cvtColor(img_cv, cv2.COLOR_BGR2HSV).astype(np.float32)
    sat    = hsv[:, :, 1]
    mean_s = float(np.mean(sat))
    std_s  = float(np.std(sat))
    if mean_s > 180 and std_s < 40:
        score = 0.75
    elif mean_s > 140:
        score = 0.45
    elif mean_s < 30:
        score = 0.15
    else:
        score = 0.30
    return round(score, 4), {"color_mean_sat": round(mean_s, 2), "color_std_sat": round(std_s, 2)}


def analyze_edges(img_cv) -> tuple:
    gray   = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    sobel  = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    mag    = np.sqrt(sobel**2 + sobely**2)
    edge_mean = float(np.mean(mag))
    edge_std  = float(np.std(mag))
    regularity = edge_mean / (edge_std + 1e-6)
    if regularity > 2.5:
        score = 0.65
    elif regularity > 1.8:
        score = 0.45
    else:
        score = 0.20
    return round(score, 4), {"edge_mean": round(edge_mean, 2), "edge_regularity": round(regularity, 3)}


def analyze_metadata(meta: dict) -> tuple:
    flags = []
    score = 0.0
    if not meta.get("has_exif"):
        flags.append({"type": "no_exif", "description": "No EXIF metadata — common in AI-generated images", "weight": 0.25})
        score += 0.25
    w, h = meta.get("width", 0), meta.get("height", 0)
    if w and h and w == h and w in (512, 768, 1024, 1536, 2048):
        flags.append({"type": "ai_dimensions", "description": f"Square {w}×{h} — standard AI generation size", "weight": 0.20})
        score += 0.20
    size = meta.get("size_bytes", 0)
    if size < 8000:
        flags.append({"type": "tiny_file", "description": "File too small to be a real camera photo", "weight": 0.15})
        score += 0.15
    return round(min(1.0, score), 4), flags


# ─────────────────────────────────────────────
# Gemini Fallback
# ─────────────────────────────────────────────

async def _gemini_fallback(image_bytes: bytes, filename: str) -> tuple:
    """
    Call Gemini vision model to determine if image is AI-generated.
    Used when local forensics yields ESCALATE (inconclusive) result.
    Returns (result_dict, None) on success or (None, error_message) on failure.
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        return None, "Gemini API key is not configured."

    ext = Path(filename).suffix.lower() or ".jpg"
    mime_map = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".png": "image/png", ".webp": "image/webp",
    }
    mime_type = mime_map.get(ext, "image/jpeg")

    tmp_path = None
    try:
        from emergentintegrations.llm.chat import (
            LlmChat, UserMessage, FileContentWithMimeType, TextDelta, StreamDone
        )

        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as f:
            f.write(image_bytes)
            tmp_path = f.name

        chat = LlmChat(
            api_key=api_key,
            session_id=f"aegis-{uuid.uuid4().hex[:8]}",
            system_message=(
                "You are a forensic image analyst specializing in detecting AI-generated images. "
                "Always respond with only valid JSON."
            ),
        ).with_model("gemini", "gemini-3.5-flash")

        image_file = FileContentWithMimeType(file_path=tmp_path, mime_type=mime_type)

        prompt = (
            "Examine this image carefully and determine whether it is AI-generated or a real photograph/scanned document. "
            "Consider: unnatural textures, AI diffusion artifacts, overly smooth gradients, absence of camera sensor noise, "
            "handwriting authenticity, paper/printing signs. "
            "Respond with ONLY this JSON (no markdown, no explanation outside JSON): "
            '{"is_ai_generated": true, "confidence": 0.85, "reasoning": "brief reason"}'
        )

        response_text = ""
        async for ev in chat.stream_message(
            UserMessage(text=prompt, file_contents=[image_file])
        ):
            if isinstance(ev, TextDelta):
                response_text += ev.content
            elif isinstance(ev, StreamDone):
                break

        # Extract JSON from response
        match = re.search(r'\{.*?\}', response_text, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            return {
                "is_ai_generated": bool(parsed.get("is_ai_generated", False)),
                "confidence": float(parsed.get("confidence", 0.5)),
                "reasoning": str(parsed.get("reasoning", "Gemini analysis complete.")),
                "model": "gemini-3.5-flash",
            }, None

        return None, "Gemini returned an unreadable response. Please try again."

    except Exception as e:
        raw = str(e).lower()
        # Detect quota / billing exhaustion
        if any(kw in raw for kw in ["quota", "resource_exhausted", "rate limit", "billing", "insufficient funds"]):
            return None, "Your Gemini API key quota is exhausted. Please top up your key or replace it."
        # Detect invalid/expired key
        if any(kw in raw for kw in ["authenticationerror", "api_key_invalid", "api key not valid", "invalid api key", "401", "403"]):
            return None, "Your Gemini API key is invalid or expired. Please replace it."
        print(f"[Gemini fallback error]: {e}")
        return None, "Gemini verification is temporarily unavailable. Please try again shortly."
    finally:
        if tmp_path:
            Path(tmp_path).unlink(missing_ok=True)


# ─────────────────────────────────────────────
# Master pipeline
# ─────────────────────────────────────────────

async def run_verification(
    image_bytes: bytes,
    filename: str = "upload.jpg",
    user_id: Optional[str] = None,
    api_key_id: Optional[str] = None,
) -> dict:
    t0        = time.time()
    audit_id  = f"AGS-{uuid.uuid4().hex[:12].upper()}"
    sha256    = hashlib.sha256(image_bytes).hexdigest()
    phash     = _phash(image_bytes)
    meta      = _metadata(image_bytes, filename)
    now       = datetime.now(timezone.utc).isoformat()
    gemini_used = False
    local_failed = False

    # ── Run local forensic modules ──────────────────────────
    try:
        img_pil, img_cv = _load(image_bytes)
        meta_score, anomalies = analyze_metadata(meta)

        ela_score,   ela_info   = analyze_ela(img_pil)
        fft_score,   fft_info   = analyze_fft(img_cv)
        noise_score, noise_info = analyze_noise(img_cv)
        color_score, color_info = analyze_color(img_cv)
        edge_score,  edge_info  = analyze_edges(img_cv)

        weights = {
            "noise": 0.30,
            "ela":   0.25,
            "fft":   0.15,
            "color": 0.15,
            "edge":  0.10,
            "meta":  0.05,
        }
        ai_score = (
            weights["noise"] * noise_score +
            weights["ela"]   * ela_score   +
            weights["fft"]   * fft_score   +
            weights["color"] * color_score +
            weights["edge"]  * edge_score  +
            weights["meta"]  * meta_score
        )
        ai_score = round(float(ai_score), 4)

        components = [
            {"name": "Noise Analysis",   "score": noise_score, "info": noise_info, "weight": weights["noise"]},
            {"name": "ELA",              "score": ela_score,   "info": ela_info,   "weight": weights["ela"]},
            {"name": "FFT Spectrum",     "score": fft_score,   "info": fft_info,   "weight": weights["fft"]},
            {"name": "Color Uniformity", "score": color_score, "info": color_info, "weight": weights["color"]},
            {"name": "Edge Coherence",   "score": edge_score,  "info": edge_info,  "weight": weights["edge"]},
            {"name": "Metadata Checks",  "score": meta_score,  "info": {"flags": anomalies}, "weight": weights["meta"]},
        ]

        # Initial local verdict
        if ai_score > 0.65:
            verdict    = "REJECT"
            confidence = round(0.50 + ai_score * 0.48, 3)
            top_flag   = max(components, key=lambda c: c["score"])
            rationale  = (
                f"AI-generation probability: {round(ai_score*100)}%. "
                f"Strongest signal: {top_flag['name']} ({round(top_flag['score']*100)}%). "
                + (" ".join(a["description"] for a in anomalies) if anomalies else "")
            ).strip()
        elif ai_score < 0.35:
            verdict    = "APPROVE"
            confidence = round(0.50 + (1 - ai_score) * 0.48, 3)
            rationale  = (
                f"Authentic image probability: {round((1-ai_score)*100)}%. "
                "Noise and compression patterns consistent with real camera capture."
            )
        else:
            verdict    = "ESCALATE"
            confidence = round(0.40 + abs(0.5 - ai_score) * 0.3, 3)
            rationale  = (
                f"Inconclusive AI probability: {round(ai_score*100)}%. "
                "Mixed forensic signals. Escalating to AI analysis."
            )

        forensics_json = {
            "ai_score":   ai_score,
            "components": components,
            "model":      "local-forensic-v1 (ELA+FFT+Noise+Color+Edge)",
            "error":      None,
        }

    except Exception as e:
        # Local analysis failed (e.g. unsupported format like PDF)
        local_failed = True
        ai_score  = 0.5
        verdict   = "ESCALATE"
        confidence = 0.40
        rationale = "Local forensic analysis failed — escalating to AI analysis."
        anomalies = []
        components = []
        forensics_json = {
            "ai_score":   ai_score,
            "components": components,
            "model":      "local-forensic-v1",
            "error":      str(e),
        }

    # ── Gemini fallback on ESCALATE ─────────────────────────
    if verdict == "ESCALATE":
        gemini, gemini_error = await _gemini_fallback(image_bytes, filename)
        if gemini:
            gemini_used = True
            if gemini["is_ai_generated"]:
                verdict    = "REJECT"
                confidence = round(gemini["confidence"], 3)
                rationale  = f"Gemini AI analysis: {gemini['reasoning']}"
            else:
                verdict    = "APPROVE"
                confidence = round(gemini["confidence"], 3)
                rationale  = f"Gemini AI analysis: {gemini['reasoning']}"

            forensics_json["gemini_analysis"] = gemini
            forensics_json["model"] = f"local-forensic-v1 + {gemini['model']} (fallback)"
        else:
            # Gemini needed but failed — do NOT return an unverified result
            raise HTTPException(
                status_code=503,
                detail=gemini_error or "Verification requires Gemini AI but it is unavailable. Please try again.",
            )

    latency_ms = round((time.time() - t0) * 1000)

    return {
        "audit_id":         audit_id,
        "created_at":       now,
        "image_sha256":     sha256,
        "image_path":       filename,
        "verdict":          verdict,
        "confidence":       confidence,
        "rationale":        rationale,
        "modality":         "prescription",
        "total_latency_ms": latency_ms,
        "total_cost_usd":   0.0,
        "user_id":          user_id,
        "api_key_id":       api_key_id,
        "heatmap_path":     None,
        "gemini_used":      gemini_used,
        "intake_json": {
            "sha256": sha256, "phash": phash,
            "metadata": meta,
            "anomalies": anomalies if not local_failed else [],
        },
        "forensics_json": forensics_json,
        "clinical_json":      {"components": components if not local_failed else []},
        "orchestrator_json":  {
            "pipeline":   forensics_json["model"],
            "latency_ms": latency_ms,
            "gemini_used": gemini_used,
        },
    }
