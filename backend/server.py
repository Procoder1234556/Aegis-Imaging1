"""
Aegis Imaging — FastAPI Backend
Port 8001 | Supervisor managed
"""
import os
import hashlib
from pathlib import Path
from datetime import datetime, timezone

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

# Ensure data dirs
for d in ("data/uploads", "data/heatmaps", "data/hf_cache"):
    Path(d).mkdir(parents=True, exist_ok=True)

from db import init_db, seed_demo_data, get_dashboard_data, get_audit_record, get_recent_audits, log_mock_event
from orchestrator import AsyncOrchestrator

app = FastAPI(title="Aegis Imaging API", version="1.0.0", docs_url="/api/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploads + heatmaps
if Path("data").exists():
    app.mount("/static", StaticFiles(directory="data"), name="static")

orchestrator = AsyncOrchestrator()


@app.on_event("startup")
async def startup():
    await init_db()
    await seed_demo_data()


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "aegis-imaging", "version": "1.0.0"}


# ─── Core API ─────────────────────────────────────────────────────────────────

@app.post("/api/v1/verify")
async def verify_image(
    file: UploadFile = File(...),
    modality: str = Form("xray"),
):
    # Content-type validation
    allowed_types = {"image/jpeg", "image/png", "image/jpg", "application/octet-stream", "application/dicom"}
    allowed_ext   = {".png", ".jpg", ".jpeg", ".dcm"}
    fname = (file.filename or "upload.png").lower()
    ext   = Path(fname).suffix

    if file.content_type not in allowed_types and ext not in allowed_ext:
        raise HTTPException(400, detail="Unsupported file type. Use PNG, JPEG, or DICOM.")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(400, detail="Empty file.")
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(400, detail="File too large (max 20MB).")

    sha256 = hashlib.sha256(contents).hexdigest()
    save_ext = ext if ext in allowed_ext else ".png"
    image_path = Path(f"data/uploads/{sha256}{save_ext}")
    image_path.write_bytes(contents)

    context = {
        "image_path": str(image_path),
        "image_bytes": contents,
        "image_sha256": sha256,
        "modality": modality,
        "filename": file.filename,
    }

    result = await orchestrator.run(context)
    return result


@app.get("/api/v1/audit/{audit_id}")
async def get_audit(audit_id: str):
    record = await get_audit_record(audit_id)
    if not record:
        raise HTTPException(404, detail="Audit record not found.")
    # Serialize agent outputs
    for field in ("intake_json", "forensics_json", "clinical_json", "orchestrator_json"):
        record.setdefault(field, {})
    return {
        "audit_id":         record["audit_id"],
        "created_at":       record["created_at"],
        "modality":         record.get("modality", "xray"),
        "verdict":          record["verdict"],
        "confidence":       record["confidence"],
        "rationale":        record.get("rationale", ""),
        "evidence":         record.get("orchestrator_json", {}).get("evidence", []),
        "heatmap_url":      f"/static/{record['heatmap_path']}" if record.get("heatmap_path") else None,
        "image_url":        f"/static/uploads/{record['image_sha256']}.png" if record.get("image_sha256") else None,
        "agent_outputs": {
            "intake":    record["intake_json"],
            "forensics": record["forensics_json"],
            "clinical":  record["clinical_json"],
            "verdict":   record["orchestrator_json"],
        },
        "total_latency_ms": record.get("total_latency_ms", 0),
        "total_cost_usd":   record.get("total_cost_usd", 0.0),
        "hash_chain": {
            "prev": record.get("hash_prev", "GENESIS"),
            "self": record.get("hash_self", ""),
        },
    }


@app.get("/api/v1/audits")
async def list_audits(limit: int = 50, offset: int = 0):
    records = await get_recent_audits(limit=limit, offset=offset)
    return {"audits": records, "total": len(records)}


@app.get("/api/v1/dashboard")
async def get_dashboard():
    return await get_dashboard_data()


@app.post("/api/v1/mock-ehr")
async def mock_ehr_webhook(request: Request):
    payload = await request.json()
    await log_mock_event("mock-ehr", payload)
    return {"status": "received", "endpoint": "mock-ehr", "audit_id": payload.get("audit_id")}


@app.post("/api/v1/mock-claims")
async def mock_claims_webhook(request: Request):
    payload = await request.json()
    await log_mock_event("mock-claims", payload)
    return {"status": "received", "endpoint": "mock-claims", "audit_id": payload.get("audit_id")}
