"""
Async Orchestrator — fans out to Agents 1-3 in parallel, then Verdict, then Audit.
Hard timeout: 10s on the full pipeline.
"""
import asyncio
import hashlib
import time
import uuid
from datetime import datetime, timezone

from agents.intake import IntakeAgent
from agents.forensics import ForensicsAgent
from agents.clinical import ClinicalAgent
from agents.verdict import VerdictAgent
from agents.audit import AuditAgent

PIPELINE_TIMEOUT_SEC = 10


class AsyncOrchestrator:
    def __init__(self):
        self.intake   = IntakeAgent()
        self.forensics = ForensicsAgent()
        self.clinical  = ClinicalAgent()
        self.verdict   = VerdictAgent()
        self.audit     = AuditAgent()

    async def run(self, context: dict) -> dict:
        start = time.time()

        # Generate audit_id if not present
        now = datetime.now(timezone.utc)
        audit_id = f"AEG-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        context["audit_id"] = audit_id

        try:
            result = await asyncio.wait_for(
                self._pipeline(context, start), timeout=PIPELINE_TIMEOUT_SEC
            )
            return result
        except asyncio.TimeoutError:
            return self._timeout_response(audit_id)
        except Exception as e:
            return self._error_response(audit_id, str(e))

    async def _pipeline(self, context: dict, start: float) -> dict:
        # Stage 1: parallel fan-out (Intake, Forensics, Clinical)
        intake_r, forensics_r, clinical_r = await asyncio.gather(
            self.intake.execute(context),
            self.forensics.execute(context),
            self.clinical.execute(context),
            return_exceptions=True,
        )

        # Normalize exceptions
        for name, result in [("intake", intake_r), ("forensics", forensics_r), ("clinical", clinical_r)]:
            if isinstance(result, Exception):
                context[name] = {"score": 0.5, "evidence": [], "error": str(result), "agent": name}
            else:
                context[name] = result

        # Stage 2: Verdict
        verdict_r = await self.verdict.execute(context)
        if isinstance(verdict_r, Exception):
            verdict_r = {"decision": "ESCALATE", "confidence": 0.5, "rationale": "Verdict agent failed.", "score": 0.5, "evidence": []}
        context["verdict"] = verdict_r

        # Compute total latency
        total_latency = int((time.time() - start) * 1000)
        context["_total_latency_ms"] = total_latency

        # Stage 3: Audit (writes to DB, generates heatmap)
        audit_r = await self.audit.execute(context)
        context["audit"] = audit_r

        # Build final response
        return self._build_response(context, total_latency)

    def _build_response(self, ctx: dict, total_latency: int) -> dict:
        verdict_out  = ctx.get("verdict", {})
        intake_out   = ctx.get("intake", {})
        forensics_out = ctx.get("forensics", {})
        clinical_out = ctx.get("clinical", {})
        audit_out    = ctx.get("audit", {})

        all_evidence = list(audit_out.get("evidence", []))

        image_sha = ctx.get("image_sha256", "")
        image_url = f"/static/uploads/{image_sha}.png" if image_sha and ctx.get("image_path") else None

        return {
            "audit_id": ctx["audit_id"],
            "verdict": verdict_out.get("decision", "ESCALATE"),
            "confidence": verdict_out.get("confidence", 0.5),
            "rationale": verdict_out.get("rationale", ""),
            "evidence": all_evidence[:10],
            "heatmap_url": audit_out.get("heatmap_url"),
            "image_url": image_url,
            "agent_outputs": {
                "intake":    {k: v for k, v in intake_out.items() if k != "_telemetry"},
                "forensics": {k: v for k, v in forensics_out.items() if k != "_telemetry"},
                "clinical":  {k: v for k, v in clinical_out.items() if k != "_telemetry"},
                "verdict":   {k: v for k, v in verdict_out.items() if k != "_telemetry"},
            },
            "total_latency_ms": total_latency,
            "total_cost_usd": audit_out.get("total_cost_usd", 0.0),
            "hash_chain": {
                "prev": "GENESIS",
                "self": audit_out.get("hash_self", ""),
            },
            "modality": ctx.get("modality", "xray"),
            "created_at": ctx.get("audit", {}).get("created_at", ""),
        }

    def _timeout_response(self, audit_id: str) -> dict:
        return {
            "audit_id": audit_id,
            "verdict": "ESCALATE",
            "confidence": 0.5,
            "rationale": "Verification pipeline timed out; human review required.",
            "evidence": [],
            "heatmap_url": None,
            "agent_outputs": {},
            "total_latency_ms": 10000,
            "total_cost_usd": 0.0,
            "hash_chain": {"prev": "GENESIS", "self": "timeout"},
            "modality": "unknown",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "error": "timeout",
        }

    def _error_response(self, audit_id: str, error: str) -> dict:
        return {
            "audit_id": audit_id,
            "verdict": "ESCALATE",
            "confidence": 0.5,
            "rationale": "Verification system encountered an error; escalated for human review.",
            "evidence": [],
            "heatmap_url": None,
            "agent_outputs": {},
            "total_latency_ms": 0,
            "total_cost_usd": 0.0,
            "hash_chain": {"prev": "GENESIS", "self": "error"},
            "modality": "unknown",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "error": error,
        }
