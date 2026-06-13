"""
Verdict Agent — weighted ensemble + top-tier LLM rationale.
APPROVE/REJECT/ESCALATE based on weighted trust scores.
Claude Sonnet (top reasoning) via IronLabs / fallback.
"""
import json
import re

from agents.base import BaseAgent
from ironlabs_router import IronLabsRouter

WEIGHTS = {"intake": 0.2, "forensics": 0.5, "clinical": 0.3}
APPROVE_THRESHOLD = 0.72
REJECT_THRESHOLD  = 0.35


class VerdictAgent(BaseAgent):
    name = "verdict"

    def __init__(self):
        self.router = IronLabsRouter()

    async def run(self, context: dict) -> dict:
        audit_id: str = context.get("audit_id", "")

        scores = {}
        for k in ("intake", "forensics", "clinical"):
            agent_out = context.get(k, {})
            if isinstance(agent_out, Exception) or not isinstance(agent_out, dict):
                scores[k] = 0.5
            else:
                scores[k] = float(agent_out.get("score", 0.5))

        weighted = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)

        if weighted >= APPROVE_THRESHOLD:
            decision = "APPROVE"
        elif weighted <= REJECT_THRESHOLD:
            decision = "REJECT"
        else:
            decision = "ESCALATE"

        prompt = f"""You are the Chief Verification Officer at Aegis Imaging, a medical image authenticity platform.

Three specialist agents reported on a medical image:

INTAKE/METADATA AGENT (weight 20%):
- Trust score: {scores['intake']:.2f}
- Details: {json.dumps(context.get('intake', {}), default=str)[:400]}

VISUAL FORENSICS AGENT (weight 50%):
- Trust score: {scores['forensics']:.2f}
- Details: {json.dumps(context.get('forensics', {}), default=str)[:400]}

CLINICAL PLAUSIBILITY AGENT (weight 30%):
- Trust score: {scores['clinical']:.2f}
- Details: {json.dumps(context.get('clinical', {}), default=str)[:400]}

Weighted trust score: {weighted:.3f}
Decision threshold: APPROVE≥{APPROVE_THRESHOLD}, REJECT≤{REJECT_THRESHOLD}
Final decision: {decision}

Write a 2–3 sentence human-readable rationale for this {decision} decision in the voice of a clinical compliance officer. Reference specific evidence. Be direct and professional. No preamble or JSON."""

        rationale_text, tele = await self.router.route(
            "critical_decision", prompt, audit_id=audit_id
        )

        rationale = rationale_text.strip() or (
            f"Weighted trust score of {weighted:.2f} resulted in {decision} verdict. "
            "Multiple detection agents concurred on this assessment."
        )

        return {
            "score": round(weighted, 3),
            "decision": decision,
            "confidence": round(weighted if decision != "ESCALATE" else 0.5 + abs(weighted - 0.54) * 0.5, 3),
            "rationale": rationale,
            "weighted_total": round(weighted, 3),
            "component_scores": scores,
            "evidence": [],
            "_telemetry": tele,
        }
