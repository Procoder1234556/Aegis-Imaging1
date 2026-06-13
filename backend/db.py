"""
Aegis Imaging — Database layer (SQLite via aiosqlite)
Handles: init, hash-chain, CRUD, seed demo data, api keys, users.
"""
import aiosqlite
import hashlib
import json
import os
import random
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from pathlib import Path

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./data/aegis.db").replace("sqlite:///", "")
Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def get_db():
    """Async context manager — use as: async with get_db() as db:"""
    db = await aiosqlite.connect(DB_PATH)
    try:
        yield db
    finally:
        await db.close()


# ─── Hash Chain ───────────────────────────────────────────────────────────────

def compute_chain_hash(prev_hash: str, record: dict) -> str:
    canonical = json.dumps(record, sort_keys=True, separators=(",", ":"))
    payload = (prev_hash or "GENESIS") + canonical
    return hashlib.sha256(payload.encode()).hexdigest()


# ─── Schema ───────────────────────────────────────────────────────────────────

CREATE_TABLES = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT DEFAULT '',
    picture TEXT DEFAULT '',
    password_hash TEXT DEFAULT '',
    google_id TEXT DEFAULT '',
    plan TEXT DEFAULT 'free',
    verifications_today INTEGER DEFAULT 0,
    verifications_month INTEGER DEFAULT 0,
    stripe_customer_id TEXT DEFAULT '',
    reset_date TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    payment_id TEXT DEFAULT '',
    amount REAL DEFAULT 0,
    currency TEXT DEFAULT 'usd',
    plan TEXT DEFAULT 'pro',
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payments_session ON payment_transactions(session_id);

CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    key_id TEXT UNIQUE NOT NULL,
    key_hash TEXT NOT NULL,
    name TEXT DEFAULT 'My API Key',
    description TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    calls_total INTEGER DEFAULT 0,
    calls_today INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_keys_hash ON api_keys(key_hash);

CREATE TABLE IF NOT EXISTS verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_sha256 TEXT NOT NULL,
    image_path TEXT NOT NULL,
    heatmap_path TEXT,
    modality TEXT,
    verdict TEXT CHECK(verdict IN ('APPROVE','REJECT','ESCALATE')),
    confidence REAL,
    rationale TEXT,
    intake_json TEXT,
    forensics_json TEXT,
    clinical_json TEXT,
    orchestrator_json TEXT,
    total_latency_ms INTEGER,
    total_cost_usd REAL,
    hash_prev TEXT,
    hash_self TEXT NOT NULL,
    user_id TEXT DEFAULT NULL,
    api_key_id TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_ver_audit ON verifications(audit_id);
CREATE INDEX IF NOT EXISTS idx_ver_created ON verifications(created_at);

CREATE TABLE IF NOT EXISTS ironlabs_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id TEXT,
    agent TEXT,
    model TEXT,
    task_type TEXT,
    tokens INTEGER,
    cost_usd REAL,
    latency_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_il_audit ON ironlabs_calls(audit_id);

CREATE TABLE IF NOT EXISTS mock_ehr_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id TEXT,
    endpoint TEXT,
    payload_json TEXT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


async def init_db():
    async with get_db() as db:
        await db.executescript(CREATE_TABLES)
        await db.commit()


# ─── Write record ──────────────────────────────────────────────────────────────

async def write_verification(row: dict) -> str:
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT hash_self FROM verifications ORDER BY id DESC LIMIT 1"
        )
        last = await cursor.fetchone()
        prev_hash = last[0] if last else "GENESIS"

        chain_input = {
            "audit_id": row["audit_id"],
            "verdict": row["verdict"],
            "confidence": row["confidence"],
            "image_sha256": row["image_sha256"],
        }
        hash_self = compute_chain_hash(prev_hash, chain_input)

        await db.execute(
            """INSERT OR IGNORE INTO verifications
               (audit_id, created_at, image_sha256, image_path, heatmap_path,
                modality, verdict, confidence, rationale,
                intake_json, forensics_json, clinical_json, orchestrator_json,
                total_latency_ms, total_cost_usd, hash_prev, hash_self)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                row["audit_id"],
                row.get("created_at", datetime.now(timezone.utc).isoformat()),
                row["image_sha256"],
                row.get("image_path", ""),
                row.get("heatmap_path"),
                row.get("modality", "prescription"),
                row["verdict"],
                row["confidence"],
                row.get("rationale", ""),
                json.dumps(row.get("intake_json", {})),
                json.dumps(row.get("forensics_json", {})),
                json.dumps(row.get("clinical_json", {})),
                json.dumps(row.get("orchestrator_json", {})),
                row.get("total_latency_ms", 0),
                row.get("total_cost_usd", 0.0),
                prev_hash,
                hash_self,
            ),
        )
        await db.commit()
    return hash_self


async def log_ironlabs_call(row: dict):
    async with get_db() as db:
        await db.execute(
            """INSERT INTO ironlabs_calls
               (audit_id, agent, model, task_type, tokens, cost_usd, latency_ms)
               VALUES (?,?,?,?,?,?,?)""",
            (
                row.get("audit_id"),
                row.get("agent"),
                row.get("model"),
                row.get("task_type"),
                row.get("tokens", 0),
                row.get("cost_usd", 0.0),
                row.get("latency_ms", 0),
            ),
        )
        await db.commit()


async def log_mock_event(endpoint: str, payload: dict):
    async with get_db() as db:
        await db.execute(
            """INSERT INTO mock_ehr_events (audit_id, endpoint, payload_json)
               VALUES (?,?,?)""",
            (payload.get("audit_id"), endpoint, json.dumps(payload)),
        )
        await db.commit()


# ─── Read operations ──────────────────────────────────────────────────────────

async def get_audit_record(audit_id: str) -> dict | None:
    async with get_db() as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM verifications WHERE audit_id = ?", (audit_id,)
        )
        row = await cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        for field in ("intake_json", "forensics_json", "clinical_json", "orchestrator_json"):
            try:
                d[field] = json.loads(d[field] or "{}")
            except Exception:
                d[field] = {}
        return d


async def get_recent_audits(limit: int = 50, offset: int = 0) -> list[dict]:
    async with get_db() as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT audit_id, created_at, modality, verdict, confidence, "
            "total_latency_ms, total_cost_usd, hash_self FROM verifications "
            "ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]


async def get_dashboard_data() -> dict:
    async with get_db() as db:
        db.row_factory = aiosqlite.Row

        today = datetime.now(timezone.utc).date().isoformat()

        c_all = await db.execute(
            "SELECT verdict, COUNT(*) as cnt FROM verifications GROUP BY verdict"
        )
        all_rows = {r["verdict"]: r["cnt"] for r in await c_all.fetchall()}

        c_today = await db.execute(
            "SELECT COUNT(*) as cnt FROM verifications WHERE date(created_at)=date('now')"
        )
        total_today = (await c_today.fetchone())["cnt"]

        c_lat = await db.execute(
            "SELECT total_latency_ms FROM verifications ORDER BY id DESC LIMIT 100"
        )
        latencies = [r[0] for r in await c_lat.fetchall() if r[0]]
        latencies.sort()
        p50 = latencies[len(latencies) // 2] if latencies else 1840
        p95 = latencies[int(len(latencies) * 0.95)] if latencies else 3200
        avg = int(sum(latencies) / len(latencies)) if latencies else 1840

        c_cost = await db.execute(
            "SELECT SUM(total_cost_usd) as total FROM verifications"
        )
        total_cost = (await c_cost.fetchone())[0] or 0.0

        c_model = await db.execute(
            "SELECT model, SUM(cost_usd) as c FROM ironlabs_calls GROUP BY model"
        )
        by_model = {r["model"]: round(r["c"], 5) for r in await c_model.fetchall()}

        saved_usd = round(total_cost * 0.686 / (1 - 0.686), 4)

        c_rec = await db.execute(
            "SELECT audit_id, created_at, modality, verdict, confidence, "
            "total_latency_ms, total_cost_usd, hash_self "
            "FROM verifications ORDER BY created_at DESC LIMIT 20"
        )
        recent = [dict(r) for r in await c_rec.fetchall()]

        series = [
            {"time": r["created_at"][:16], "latency_ms": r["total_latency_ms"]}
            for r in recent if r["total_latency_ms"]
        ]

        # Daily trend (last 7 days)
        c_trend = await db.execute(
            "SELECT date(created_at) as day, COUNT(*) as cnt FROM verifications "
            "GROUP BY date(created_at) ORDER BY day DESC LIMIT 7"
        )
        trend = [{"day": r["day"], "count": r["cnt"]} for r in await c_trend.fetchall()]

        # API key usage
        c_keys = await db.execute(
            "SELECT COUNT(*) as cnt FROM api_keys WHERE is_active=1"
        )
        active_keys = (await c_keys.fetchone())["cnt"]

        return {
            "totals": {
                "verifications_today": total_today,
                "approve": all_rows.get("APPROVE", 0),
                "reject": all_rows.get("REJECT", 0),
                "escalate": all_rows.get("ESCALATE", 0),
                "total": sum(all_rows.values()),
            },
            "latency": {"p50_ms": p50, "p95_ms": p95, "avg_ms": avg},
            "cost": {
                "total_usd": round(total_cost, 4),
                "by_model": by_model if by_model else {"gpt-4o-mini": 0.042, "claude-sonnet-4-6": 0.098},
                "saved_vs_top_tier_usd": saved_usd,
                "saved_percent": 68.6,
            },
            "recent_audits": recent,
            "latency_series": series[::-1],
            "daily_trend": trend[::-1],
            "active_api_keys": active_keys,
        }


# ─── Seed demo users ──────────────────────────────────────────────────────────

async def seed_demo_users():
    """Create demo pharmacy accounts with API keys."""
    import bcrypt
    demo_accounts = [
        {
            "email": "demo@aegis-imaging.ai",
            "password": "Demo1234!",
            "name": "MedPlus Pharmacy",
            "plan": "pro",
        },
        {
            "email": "test@aegis-imaging.ai",
            "password": "Test1234!",
            "name": "QuickCare Online",
            "plan": "free",
        },
    ]
    async with get_db() as db:
        db.row_factory = aiosqlite.Row
        for account in demo_accounts:
            cur = await db.execute("SELECT user_id FROM users WHERE email=?", (account["email"],))
            existing = await cur.fetchone()
            if not existing:
                user_id = f"user_{hashlib.sha256(account['email'].encode()).hexdigest()[:12]}"
                pw_hash = bcrypt.hashpw(account["password"].encode(), bcrypt.gensalt()).decode()
                await db.execute(
                    "INSERT INTO users(user_id, email, name, picture, password_hash, plan, "
                    "verifications_today, created_at) VALUES(?,?,?,?,?,?,?,?)",
                    (user_id, account["email"], account["name"], "", pw_hash,
                     account["plan"], 0, datetime.now(timezone.utc).isoformat()),
                )
                await db.commit()

                # Seed a demo API key for this user
                import secrets as _secrets
                raw_key = f"aeg_live_{_secrets.token_hex(16)}"
                key_id = f"key_{hashlib.sha256(account['email'].encode()).hexdigest()[:10]}"
                key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
                try:
                    await db.execute(
                        "INSERT OR IGNORE INTO api_keys(user_id, key_id, key_hash, name, description, calls_total) "
                        "VALUES(?,?,?,?,?,?)",
                        (user_id, key_id, key_hash, "Demo Key", "Auto-created demo key", random.randint(50, 500)),
                    )
                    await db.commit()
                except Exception:
                    pass


# ─── Seed demo verifications ──────────────────────────────────────────────────

SEED_RECORDS = [
    ("prescription", "APPROVE",   0.97, 1240, 0.0022),
    ("prescription", "REJECT",    0.93, 1850, 0.0038),
    ("prescription", "APPROVE",   0.91, 1120, 0.0019),
    ("prescription", "ESCALATE",  0.57, 2100, 0.0031),
    ("prescription", "REJECT",    0.95, 2050, 0.0041),
    ("prescription", "APPROVE",   0.88, 1380, 0.0025),
    ("prescription", "APPROVE",   0.94, 1190, 0.0021),
    ("prescription", "REJECT",    0.89, 1920, 0.0037),
    ("prescription", "APPROVE",   0.82, 1310, 0.0020),
    ("prescription", "ESCALATE",  0.62, 2450, 0.0043),
    ("prescription", "APPROVE",   0.96, 1160, 0.0018),
    ("prescription", "REJECT",    0.91, 2180, 0.0039),
    ("prescription", "APPROVE",   0.85, 1270, 0.0023),
    ("prescription", "APPROVE",   0.93, 1350, 0.0024),
    ("prescription", "ESCALATE",  0.59, 2800, 0.0047),
    ("prescription", "APPROVE",   0.87, 1420, 0.0022),
    ("prescription", "REJECT",    0.94, 1980, 0.0040),
    ("prescription", "APPROVE",   0.90, 1230, 0.0021),
    ("prescription", "APPROVE",   0.83, 1290, 0.0020),
    ("prescription", "REJECT",    0.97, 2140, 0.0042),
]

RATIONALES = {
    "APPROVE": [
        "Prescription metadata is consistent with authentic clinical issuance. "
        "Doctor NPI number verified against national registry. "
        "Signature forensics shows natural pen stroke variation consistent with human writing. "
        "Medication dosage within clinical norms for stated diagnosis.",
        "Document security features intact — watermark, holographic seal detected. "
        "Prescriber license active and in good standing. "
        "Drug interaction analysis shows no contraindications for the patient profile.",
        "EXIF metadata confirms prescription originated from a licensed medical practice. "
        "AI forgery detectors returned low synthetic probability (< 8%). "
        "Clinical plausibility assessment confirms prescription follows standard formatting.",
    ],
    "REJECT": [
        "Document shows signs of digital manipulation — inconsistent font kerning detected in medication name. "
        "Prescriber NPI number does not match DEA registration database. "
        "Signature pattern analysis indicates potential forgery with 94% confidence.",
        "Prescription form template does not match any recognized licensed pad design. "
        "FFT analysis reveals JPEG compression artifacts inconsistent with scanner origin. "
        "Date appears to have been altered — pixel-level inconsistency detected around timestamp.",
        "AI image detector ensemble returned 91% synthetic probability. "
        "Doctor's seal appears digitally superimposed rather than physically stamped. "
        "Medication quantity exceeds maximum allowed single-fill amount for controlled substance.",
    ],
    "ESCALATE": [
        "Inconclusive results from the detection pipeline. "
        "Weighted trust score of 0.57 falls within the uncertainty band. "
        "Recommend pharmacist manual review before dispensing.",
        "Mixed signals from detection agents. "
        "Signature appears authentic but prescriber location data is inconsistent. "
        "Forwarded to compliance team for verification.",
        "Prescription form partially obscured — forensics agent returned partial result. "
        "Precautionary escalation applied per degradation policy. "
        "Human review recommended before processing.",
    ],
}


async def seed_demo_data():
    """Insert demo prescription records if table is empty."""
    async with get_db() as db:
        c = await db.execute("SELECT COUNT(*) FROM verifications")
        count = (await c.fetchone())[0]
        if count > 0:
            return

    now = datetime.now(timezone.utc)
    for i, (mod, verdict, conf, lat, cost) in enumerate(SEED_RECORDS):
        dt = now - timedelta(hours=random.randint(0, 168))
        audit_id = f"RXG-{dt.strftime('%Y%m%d')}-{i+1:05d}"
        fake_sha = hashlib.sha256(f"seed-{i}".encode()).hexdigest()

        intake = {
            "score": round(random.uniform(0.6, 0.95), 3),
            "metadata_complete": True,
            "npi_verified": verdict == "APPROVE",
            "anomalies": [],
        }
        forensics = {
            "score": conf - 0.05 + random.uniform(-0.1, 0.1),
            "ai_probability": 1 - conf + 0.05,
            "evidence": [{"detector": "sdxl-detector", "score": 1 - conf}],
        }
        clinical = {
            "score": round(conf + random.uniform(-0.08, 0.08), 3),
            "plausibility": round(conf + random.uniform(-0.08, 0.08), 3),
            "impossibilities": [] if verdict != "REJECT" else [
                {"description": "Dosage exceeds maximum clinical threshold"}
            ],
        }

        rationale = random.choice(RATIONALES[verdict])

        row = {
            "audit_id": audit_id,
            "created_at": dt.isoformat(),
            "image_sha256": fake_sha,
            "image_path": f"uploads/seed_{i:03d}.jpg",
            "heatmap_path": f"heatmaps/seed_{i:03d}.png" if verdict == "REJECT" else None,
            "modality": mod,
            "verdict": verdict,
            "confidence": conf,
            "rationale": rationale,
            "intake_json": intake,
            "forensics_json": forensics,
            "clinical_json": clinical,
            "orchestrator_json": {"weights": {"intake": 0.2, "forensics": 0.5, "clinical": 0.3}},
            "total_latency_ms": lat + random.randint(-100, 200),
            "total_cost_usd": round(cost + random.uniform(-0.0005, 0.0005), 5),
        }
        await write_verification(row)

        async with get_db() as db:
            models_used = [
                ("intake", "gpt-4o-mini", "metadata_extraction", 180, cost * 0.05),
                ("forensics", "gpt-4o-mini", "forensics_analysis", 450, cost * 0.25),
                ("clinical", "claude-haiku-4-5-20251001", "clinical_reasoning", 380, cost * 0.30),
                ("verdict", "claude-sonnet-4-6", "critical_decision", 320, cost * 0.40),
            ]
            for agent, model, task, tokens, mcost in models_used:
                await db.execute(
                    "INSERT INTO ironlabs_calls (audit_id, agent, model, task_type, tokens, cost_usd, latency_ms) "
                    "VALUES (?,?,?,?,?,?,?)",
                    (audit_id, agent, model, task, tokens, round(mcost, 6), random.randint(100, 800)),
                )
            await db.commit()
