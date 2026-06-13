"""
Aegis Imaging — FastAPI Backend v2
Port 8001 | Auth + Payments + Verification Pipeline
"""
import os
import hashlib
from pathlib import Path
from datetime import datetime, timezone

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

for d in ("data/uploads", "data/heatmaps", "data/hf_cache"):
    Path(d).mkdir(parents=True, exist_ok=True)

from db import init_db, seed_demo_data, get_dashboard_data, get_audit_record, get_recent_audits, log_mock_event
from orchestrator import AsyncOrchestrator
from auth import router as auth_router, get_current_user, optional_user, FREE_DAILY_LIMIT
from payments import router as payments_router

app = FastAPI(title="Aegis Imaging API", version="2.0.0", docs_url="/api/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if Path("data").exists():
    app.mount("/static", StaticFiles(directory="data"), name="static")

app.include_router(auth_router)
app.include_router(payments_router)

orchestrator = AsyncOrchestrator()


@app.on_event("startup")
async def startup():
    await init_db()
    await seed_demo_data()


# ─── Stripe webhook (top-level path) ─────────────────────────
@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    import os
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    body = await request.body()
    sig  = request.headers.get("Stripe-Signature", "")
    stripe = StripeCheckout(api_key=os.getenv("STRIPE_API_KEY",""), webhook_url="")
    try:
        event = await stripe.handle_webhook(body, sig)
        if event.payment_status == "paid":
            meta = event.metadata or {}
            uid  = meta.get("user_id")
            plan = meta.get("plan", "pro")
            if uid:
                from db import get_db
                async with await get_db() as db:
                    await db.execute("UPDATE users SET plan=? WHERE user_id=?", (plan, uid))
                    await db.execute(
                        "UPDATE payment_transactions SET status='completed',payment_status='paid' WHERE session_id=?",
                        (event.session_id,),
                    )
                    await db.commit()
    except Exception:
        pass
    return {"received": True}


# ─── Health ───────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "aegis-imaging", "version": "2.0.0"}


# ─── Verify (protected, plan-limited) ─────────────────────────
@app.post("/api/v1/verify")
async def verify_image(
    request: Request,
    file: UploadFile = File(...),
    modality: str = Form("xray"),
):
    user = await optional_user(request)

    # Plan check
    if user and user["plan"] == "free":
        today = datetime.now(timezone.utc).date().isoformat()
        from db import get_db
        async with await get_db() as db:
            db.row_factory = __import__("aiosqlite").Row
            cur = await db.execute(
                "SELECT COUNT(*) as cnt FROM verifications "
                "WHERE audit_id LIKE ? AND date(created_at)=date('now')",
                (f"%{user.get('user_id','none')}%",),
            )
            # simplified: track verifications_today on user row
            cur2 = await db.execute("SELECT verifications_today, reset_date FROM users WHERE user_id=?",
                                    (user["user_id"],))
            u = await cur2.fetchone()
            if u:
                reset_date = u["reset_date"] or ""
                today_str = today
                v_today = u["verifications_today"] if reset_date == today_str else 0
                if v_today >= FREE_DAILY_LIMIT:
                    raise HTTPException(429, f"Free plan: {FREE_DAILY_LIMIT} verifications/day. Upgrade for unlimited.")
                # Update count
                await db.execute(
                    "UPDATE users SET verifications_today=?, reset_date=? WHERE user_id=?",
                    (v_today + 1, today_str, user["user_id"])
                )
                await db.commit()

    # File validation
    allowed_ext = {".png", ".jpg", ".jpeg", ".dcm"}
    fname = (file.filename or "upload.png").lower()
    ext   = Path(fname).suffix
    contents = await file.read()
    if not contents:
        raise HTTPException(400, "Empty file")
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 20MB)")

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
        "user_id": user["user_id"] if user else None,
    }
    return await orchestrator.run(context)


@app.get("/api/v1/audit/{audit_id}")
async def get_audit(audit_id: str, request: Request):
    record = await get_audit_record(audit_id)
    if not record:
        raise HTTPException(404, "Audit record not found")
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
async def mock_ehr(request: Request):
    payload = await request.json()
    await log_mock_event("mock-ehr", payload)
    return {"status": "received"}


@app.post("/api/v1/mock-claims")
async def mock_claims(request: Request):
    payload = await request.json()
    await log_mock_event("mock-claims", payload)
    return {"status": "received"}
