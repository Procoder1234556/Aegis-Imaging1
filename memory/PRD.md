# Aegis Imaging — Memory / PRD

## Original Problem Statement
Build the P3 Frontend track while referencing architecture and master PRD simultaneously.
Add 3D cinematic look with director-cut premium medical-tech aesthetics offering a smooth, seamless experience.
Build P1 Backend and P2 ML pipeline as well.

## Architecture
- **Frontend:** React CRA + Tailwind CSS + Framer Motion + Recharts, port 3000
- **Backend:** FastAPI + SQLite (aiosqlite), port 8001, supervisor-managed
- **AI Pipeline:** 5-Agent orchestrator using IronLabs API (with Emergent Universal Key fallback)
- **ML:** FFT analysis (numpy), HuggingFace detectors (httpx), PIL heatmaps

## Tech Stack
- Frontend: React 18, Tailwind CSS, Framer Motion, Recharts, Lucide-React, React-Dropzone
- Backend: FastAPI 0.110, aiosqlite, httpx, numpy, Pillow
- LLM Router: IronLabs API (sk_ht...) → Emergent Universal Key fallback (claude-sonnet-4-6, claude-haiku, gpt-4o-mini)
- DB: SQLite at data/aegis.db

## User Choices
- Premium medical-tech glassmorphism design (dark navy + frosted glass cards)
- Seed 20 realistic demo records on startup
- IronLabs API key: stored in backend/.env
- HF_TOKEN: not provided (HF detectors return neutral 0.5 score, FFT analysis active)

## Core Requirements (Static)
1. Medical image upload with drag-drop (PNG, JPEG, DICOM, ≤20MB)
2. 5-agent AI pipeline: Intake → Forensics → Clinical → Verdict → Audit
3. Three verdict types: APPROVE, REJECT, ESCALATE with color-coded results
4. Heatmap overlay for rejected images (PIL-based bounding boxes)
5. SHA-256 hash chain for tamper-evident audit log
6. IronLabs routing → 68.6% cost savings vs all-top-tier models
7. Dashboard with metric tiles, pie/bar/line charts, audit table
8. Audit detail page with collapsible agent JSON and hash chain visualization
9. Mock EHR/Claims webhooks for downstream integration
10. HIPAA-aligned audit trail in SQLite

## What's Been Implemented (2026-06-13)
### Frontend (P3) — All 7 Screens
- [x] Upload page — drag-drop, modality selector, SHA-256 verify flow
- [x] Verifying page — 5 animated agent cards with sequential reveal + live timer
- [x] Approved page — green banner, confidence bar, agent breakdown, CTAs
- [x] Rejected page — red banner, heatmap viewer, evidence list, collapsible toggle
- [x] Escalated page — amber banner, forward-to-reviewer workflow
- [x] Dashboard page — metric tiles, verdict pie, cost bar, latency line, audit table
- [x] Audit Detail page — hash chain vis, collapsible agent JSON cards
- [x] Processing page — EHR webhook confirmation
- [x] NavBar — shield logo, Verify/Dashboard nav, system active badge

### Backend (P1)
- [x] FastAPI server on port 8001
- [x] SQLite with 3 tables (verifications, ironlabs_calls, mock_ehr_events)
- [x] 20 seeded demo records (11 APPROVE, 6 REJECT, 3 ESCALATE)
- [x] AsyncOrchestrator with fan-out pattern (Agents 1-3 parallel, then Verdict, then Audit)
- [x] Hash chain algorithm (SHA-256 chained records)
- [x] All API routes: /verify, /audit/:id, /audits, /dashboard, /mock-ehr, /mock-claims
- [x] Static file serving for uploads + heatmaps

### ML (P2)
- [x] IntakeAgent — metadata extraction, pHash, synthetic DB check, LLM reasoning
- [x] ForensicsAgent — HF detectors + FFT analysis + vision LLM (weighted ensemble)
- [x] ClinicalAgent — vision LLM radiologist persona (anatomical plausibility)
- [x] VerdictAgent — weighted scoring (Intake 20% + Forensics 50% + Clinical 30%) + rationale LLM
- [x] AuditAgent — hash chain write, heatmap generation, webhook firing
- [x] IronLabsRouter — IronLabs primary + Emergent fallback + static fallback
- [x] HF Detectors — Organika/sdxl-detector + umm-maybe/AI-image-detector ensemble
- [x] FFT Analysis — numpy frequency analysis
- [x] PIL Heatmap — bounding box overlay generation

## Prioritized Backlog

### P0 — Critical (unblocked by pending PRDs)
- [ ] Add HF_TOKEN to enable real HuggingFace AI detection (currently returns neutral 0.5)
- [ ] Verify IronLabs API reachability from production environment

### P1 — High
- [ ] DICOM file parser (pydicom) for proper DICOM metadata extraction
- [ ] Audit export (CSV download from dashboard)
- [ ] Dark mode support

### P2 — Medium
- [ ] Real perceptual hash database (synthetic image DB population)
- [ ] Audit search/filter on dashboard
- [ ] WebSocket real-time updates for live verification progress

### Future Backlog
- [ ] Auth/login for multi-user enterprise use
- [ ] Integration with real EHR systems (FHIR)
- [ ] Batch verification API
- [ ] Model fine-tuning on medical imaging datasets

## Next Tasks
1. User provides HF_TOKEN → enable real HuggingFace AI detection
2. Verify IronLabs API endpoint format when it becomes accessible
3. Build DICOM metadata parsing with pydicom
