"""
Database layer — SQLite via aiosqlite.
Handles: init, hash-chain, CRUD, seed demo data.
"""
import aiosqlite
import asyncio
import hashlib
import json
import os
import random
from datetime import datetime, timezone, timedelta
from pathlib import Path

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./data/aegis.db").replace("sqlite:///", "")
Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)


async def get_db():
    return await aiosqlite.connect(DB_PATH)


# ─── Hash Chain ───────────────────────────────────────────────────────────────

def compute_chain_hash(prev_hash: str, record: dict) -> str:
    canonical = json.dumps(record, sort_keys=True, separators=(",", ":"))
    payload = (prev_hash or "GENESIS") + canonical
    return hashlib.sha256(payload.encode()).hexdigest()


# ─── Schema ───────────────────────────────────────────────────────────────────

CREATE_TABLES = """
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
    hash_self TEXT NOT NULL
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
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(CREATE_TABLES)
        await db.commit()


# ─── Write record ──────────────────────────────────────────────────────────────

async def write_verification(row: dict) -> str:
    """Insert record; returns hash_self."""
    async with aiosqlite.connect(DB_PATH) as db:
        # Get last hash
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
                row.get("modality", "xray"),
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
    async with aiosqlite.connect(DB_PATH) as db:
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
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO mock_ehr_events (audit_id, endpoint, payload_json)
               VALUES (?,?,?)""",
            (payload.get("audit_id"), endpoint, json.dumps(payload)),
        )
        await db.commit()


# ─── Read operations ──────────────────────────────────────────────────────────

def _row_to_dict(row, cursor) -> dict:
    return {col[0]: row[i] for i, col in enumerate(cursor.description)}


async def get_audit_record(audit_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
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
    async with aiosqlite.connect(DB_PATH) as db:
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
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # Totals
        today = datetime.now(timezone.utc).date().isoformat()
        c = await db.execute(
            "SELECT verdict, COUNT(*) as cnt FROM verifications "
            "WHERE date(created_at) = date('now') GROUP BY verdict"
        )
        today_rows = {r["verdict"]: r["cnt"] for r in await c.fetchall()}

        c_all = await db.execute(
            "SELECT verdict, COUNT(*) as cnt FROM verifications GROUP BY verdict"
        )
        all_rows = {r["verdict"]: r["cnt"] for r in await c_all.fetchall()}

        total_today = sum(today_rows.values())

        # Latency
        c_lat = await db.execute(
            "SELECT total_latency_ms FROM verifications ORDER BY id DESC LIMIT 100"
        )
        latencies = [r[0] for r in await c_lat.fetchall() if r[0]]
        latencies.sort()
        p50 = latencies[len(latencies) // 2] if latencies else 1840
        p95 = latencies[int(len(latencies) * 0.95)] if latencies else 3200
        avg = int(sum(latencies) / len(latencies)) if latencies else 1840

        # Cost
        c_cost = await db.execute(
            "SELECT SUM(total_cost_usd) as total FROM verifications"
        )
        total_cost = (await c_cost.fetchone())[0] or 0.0

        c_model = await db.execute(
            "SELECT model, SUM(cost_usd) as c FROM ironlabs_calls GROUP BY model"
        )
        by_model = {r["model"]: round(r["c"], 5) for r in await c_model.fetchall()}

        saved_usd = round(total_cost * 0.686 / (1 - 0.686), 4)

        # Recent audits
        c_rec = await db.execute(
            "SELECT audit_id, created_at, modality, verdict, confidence, "
            "total_latency_ms, total_cost_usd, hash_self "
            "FROM verifications ORDER BY created_at DESC LIMIT 20"
        )
        recent = [dict(r) for r in await c_rec.fetchall()]

        # Latency time series (last 20 records)
        series = [
            {"time": r["created_at"][:16], "latency_ms": r["total_latency_ms"]}
            for r in recent if r["total_latency_ms"]
        ]

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
        }


# ─── Seed demo data ───────────────────────────────────────────────────────────

SEED_RECORDS = [
    ("xray",      "APPROVE",   0.92, 1840, 0.0028),
    ("mri",       "REJECT",    0.91, 2100, 0.0042),
    ("ct",        "APPROVE",   0.88, 1650, 0.0031),
    ("xray",      "ESCALATE",  0.54, 2400, 0.0038),
    ("xray",      "REJECT",    0.94, 1920, 0.0035),
    ("mri",       "APPROVE",   0.85, 1520, 0.0026),
    ("ct",        "APPROVE",   0.91, 1780, 0.0030),
    ("ultrasound","REJECT",    0.87, 2050, 0.0039),
    ("xray",      "APPROVE",   0.79, 1430, 0.0022),
    ("mri",       "ESCALATE",  0.61, 2800, 0.0044),
    ("xray",      "APPROVE",   0.95, 1620, 0.0029),
    ("ct",        "REJECT",    0.89, 2200, 0.0041),
    ("mri",       "APPROVE",   0.83, 1590, 0.0027),
    ("xray",      "APPROVE",   0.90, 1710, 0.0032),
    ("ct",        "ESCALATE",  0.58, 3100, 0.0047),
    ("ultrasound","APPROVE",   0.86, 1480, 0.0024),
    ("xray",      "REJECT",    0.93, 1980, 0.0037),
    ("mri",       "APPROVE",   0.88, 1640, 0.0030),
    ("ct",        "APPROVE",   0.82, 1560, 0.0025),
    ("xray",      "REJECT",    0.96, 2300, 0.0043),
]

RATIONALES = {
    "APPROVE": [
        "Image metadata is consistent with authentic clinical acquisition. "
        "Visual forensics detected no frequency artifacts characteristic of SDXL or diffusion models. "
        "Clinical anatomy presents normal plausibility for the stated modality.",
        "Perceptual hash analysis shows no match against synthetic hash database. "
        "FFT spectrum analysis reveals natural noise patterns without grid artifacts. "
        "Anatomical landmarks are consistent with real human physiology.",
        "EXIF and DICOM metadata confirm authentic scanner origin. "
        "HuggingFace AI-image detectors returned low confidence (< 15%) for synthetic generation. "
        "Clinical plausibility assessment confirms normal imaging characteristics.",
    ],
    "REJECT": [
        "Image exhibits characteristic SDXL frequency artifacts in the high-frequency spectrum. "
        "AI detector ensemble returned 92% synthetic probability. "
        "Anatomical structures show subtle impossibilities inconsistent with real physiology.",
        "FFT analysis detected periodic grid patterns at 64px intervals, a hallmark of GAN generation. "
        "DICOM metadata is absent or inconsistent with manufacturer standards. "
        "Clinical review identified unnatural tissue density gradients.",
        "Perceptual hash matched 3 known synthetic images in the hash database. "
        "AI probability score of 0.91 from ensemble of HuggingFace detectors. "
        "Visual anomalies include mirrored anatomical asymmetry not present in authentic scans.",
    ],
    "ESCALATE": [
        "Inconclusive results from the detection pipeline. "
        "Weighted trust score of 0.54 falls within the uncertainty band. "
        "Recommend human radiologist review before processing claim.",
        "Mixed signals from detection agents. "
        "Forensics shows moderate AI probability (58%) but clinical plausibility is normal. "
        "Forwarded to compliance team for manual verification.",
        "Pipeline timed out partially; forensics agent returned partial result with hf_failed flag. "
        "Precautionary ESCALATE applied as per degradation policy. "
        "Human review recommended.",
    ],
}


async def seed_demo_data():
    """Insert demo records if table is empty."""
    async with aiosqlite.connect(DB_PATH) as db:
        c = await db.execute("SELECT COUNT(*) FROM verifications")
        count = (await c.fetchone())[0]
        if count > 0:
            return  # Already seeded

    now = datetime.now(timezone.utc)
    for i, (mod, verdict, conf, lat, cost) in enumerate(SEED_RECORDS):
        dt = now - timedelta(hours=random.randint(0, 168))
        audit_id = f"AEG-{dt.strftime('%Y%m%d')}-{i+1:05d}"
        fake_sha = hashlib.sha256(f"seed-{i}".encode()).hexdigest()

        intake = {"score": round(random.uniform(0.6, 0.95), 3), "metadata_complete": True, "anomalies": []}
        forensics = {"score": conf - 0.05 + random.uniform(-0.1, 0.1),
                     "ai_probability": 1 - conf + 0.05,
                     "evidence": [{"detector": "sdxl-detector", "score": 1 - conf}]}
        clinical = {"score": round(conf + random.uniform(-0.08, 0.08), 3),
                    "plausibility": round(conf + random.uniform(-0.08, 0.08), 3),
                    "impossibilities": [] if verdict != "REJECT" else [{"description": "Artifact detected", "bbox": [0.3, 0.2, 0.6, 0.7]}]}

        rationale = random.choice(RATIONALES[verdict])

        heatmap_path = f"heatmaps/seed_{i:03d}.png" if verdict == "REJECT" else None

        row = {
            "audit_id": audit_id,
            "created_at": dt.isoformat(),
            "image_sha256": fake_sha,
            "image_path": f"uploads/seed_{i:03d}.png",
            "heatmap_path": heatmap_path,
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

        # Log ironlabs calls for cost chart
        models_used = [
            ("intake", "gpt-4o-mini", "metadata_extraction", 180, cost * 0.05),
            ("forensics", "gpt-4o-mini", "forensics_analysis", 450, cost * 0.25),
            ("clinical", "claude-haiku-4-5-20251001", "clinical_reasoning", 380, cost * 0.30),
            ("verdict", "claude-sonnet-4-6", "critical_decision", 320, cost * 0.40),
        ]
        async with aiosqlite.connect(DB_PATH) as db:
            for agent, model, task, tokens, mcost in models_used:
                await db.execute(
                    "INSERT INTO ironlabs_calls (audit_id, agent, model, task_type, tokens, cost_usd, latency_ms) "
                    "VALUES (?,?,?,?,?,?,?)",
                    (audit_id, agent, model, task, tokens, round(mcost, 6), random.randint(100, 800)),
                )
            await db.commit()
