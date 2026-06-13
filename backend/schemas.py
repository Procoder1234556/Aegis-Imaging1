from pydantic import BaseModel
from typing import Optional, Any


class EvidenceItem(BaseModel):
    type: str
    region: Optional[list[float]] = None
    score: float
    source_agent: str
    description: Optional[str] = None


class HashChain(BaseModel):
    prev: str
    self_hash: str


class AgentOutput(BaseModel):
    agent: str
    score: float
    evidence: list[dict]
    latency_ms: int
    error: Optional[str] = None


class VerifyResponse(BaseModel):
    audit_id: str
    verdict: str
    confidence: float
    rationale: str
    evidence: list[dict]
    heatmap_url: Optional[str] = None
    agent_outputs: dict[str, Any]
    total_latency_ms: int
    total_cost_usd: float
    hash_chain: dict[str, str]
    image_url: Optional[str] = None
    modality: str
    created_at: str


class DashboardTotals(BaseModel):
    verifications_today: int
    approve: int
    reject: int
    escalate: int
    total: int


class DashboardLatency(BaseModel):
    p50_ms: int
    p95_ms: int
    avg_ms: int


class DashboardCost(BaseModel):
    total_usd: float
    by_model: dict[str, float]
    saved_vs_top_tier_usd: float
    saved_percent: float


class DashboardResponse(BaseModel):
    totals: DashboardTotals
    latency: DashboardLatency
    cost: DashboardCost
    recent_audits: list[dict]
    latency_series: list[dict]


class AuditRecord(BaseModel):
    audit_id: str
    created_at: str
    modality: str
    verdict: str
    confidence: float
    rationale: str
    evidence: list[dict]
    heatmap_url: Optional[str]
    image_url: Optional[str]
    agent_outputs: dict[str, Any]
    total_latency_ms: int
    total_cost_usd: float
    hash_chain: dict[str, str]
