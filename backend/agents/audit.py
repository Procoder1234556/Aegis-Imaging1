"""
Audit Agent — writes verification record with hash chain, generates heatmap, fires webhooks.
Cheap model (Llama 8B / gpt-4o-mini) for JSON formatting.
"""
import asyncio
import hashlib
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from agents.base import BaseAgent
from db import write_verification, log_ironlabs_call
from heatmap import overlay_heatmap, generate_fft_heatmap


class AuditAgent(BaseAgent):
    name = "audit"

    async def run(self, context: dict) -> dict:
        audit_id: str = context.get("audit_id", "")
        verdict_out: dict = context.get("verdict", {})
        forensics_out: dict = context.get("forensics", {})
        clinical_out: dict = context.get("clinical", {})
        intake_out: dict = context.get("intake", {})
        image_path: str = context.get("image_path", "")
        modality: str = context.get("modality", "xray")
        sha256: str = context.get("image_sha256", "")

        verdict = verdict_out.get("decision", "ESCALATE")
        confidence = float(verdict_out.get("confidence", 0.5))
        rationale = verdict_out.get("rationale", "")

        # Generate heatmap for REJECT/ESCALATE
        heatmap_path = None
        heatmap_url = None
        regions = []

        for ag in (forensics_out, clinical_out):
            if isinstance(ag, dict):
                for e in ag.get("evidence", []):
                    if isinstance(e, dict) and e.get("region"):
                        regions.append({
                            "bbox": e["region"],
                            "label": e.get("description", "Artifact"),
                            "score": e.get("score", 0.7),
                        })
                for r in ag.get("suspicious_regions", []) + ag.get("impossibilities", []):
                    if isinstance(r, dict) and r.get("bbox"):
                        regions.append({
                            "bbox": r.get("bbox"),
                            "label": r.get("label") or r.get("description", "Region"),
                            "score": r.get("score", 0.7),
                        })

        if verdict in ("REJECT", "ESCALATE") and image_path and Path(image_path).exists():
            if not regions:
                image_bytes = context.get("image_bytes", b"")
                if image_bytes:
                    regions = generate_fft_heatmap(image_bytes)

            if regions:
                heatmap_filename = f"{audit_id.replace('-', '_')}.png"
                heatmap_path = f"data/heatmaps/{heatmap_filename}"
                try:
                    overlay_heatmap(image_path, regions[:5], heatmap_path)
                    heatmap_url = f"/static/heatmaps/{heatmap_filename}"
                except Exception:
                    heatmap_path = None

        # Aggregate evidence
        all_evidence = []
        for ag in (intake_out, forensics_out, clinical_out):
            if isinstance(ag, dict):
                all_evidence.extend(ag.get("evidence", []))

        # Compute costs
        total_cost = 0.0
        for ag in (intake_out, forensics_out, clinical_out, verdict_out):
            if isinstance(ag, dict):
                tele = ag.get("_telemetry", {})
                total_cost += float(tele.get("cost_usd", 0.0))

        # Write to DB
        orchestrator_json = {
            "weights": {"intake": 0.2, "forensics": 0.5, "clinical": 0.3},
            "component_scores": verdict_out.get("component_scores", {}),
            "weighted_total": verdict_out.get("weighted_total", 0.5),
        }

        row = {
            "audit_id": audit_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "image_sha256": sha256,
            "image_path": image_path,
            "heatmap_path": heatmap_path,
            "modality": modality,
            "verdict": verdict,
            "confidence": confidence,
            "rationale": rationale,
            "intake_json": {k: v for k, v in intake_out.items() if k != "_telemetry"} if isinstance(intake_out, dict) else {},
            "forensics_json": {k: v for k, v in forensics_out.items() if k != "_telemetry"} if isinstance(forensics_out, dict) else {},
            "clinical_json": {k: v for k, v in clinical_out.items() if k != "_telemetry"} if isinstance(clinical_out, dict) else {},
            "orchestrator_json": orchestrator_json,
            "total_latency_ms": context.get("_total_latency_ms", 0),
            "total_cost_usd": round(total_cost, 6),
        }
        hash_self = await write_verification(row)

        # Log LLM calls
        for ag in (intake_out, forensics_out, clinical_out, verdict_out):
            if isinstance(ag, dict) and ag.get("_telemetry"):
                await log_ironlabs_call(ag["_telemetry"])

        # Fire webhooks (fire-and-forget)
        asyncio.create_task(_fire_webhooks(audit_id, verdict, confidence))

        return {
            "score": 1.0,
            "audit_id": audit_id,
            "hash_self": hash_self,
            "heatmap_url": heatmap_url,
            "heatmap_path": heatmap_path,
            "evidence": all_evidence,
            "total_cost_usd": round(total_cost, 6),
            "error": None,
        }


async def _fire_webhooks(audit_id: str, verdict: str, confidence: float):
    """Fire mock EHR and claims webhooks, non-blocking."""
    import httpx
    payload = {"audit_id": audit_id, "verdict": verdict, "confidence": confidence}
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post("http://localhost:8001/api/v1/mock-ehr", json=payload)
    except Exception:
        pass
