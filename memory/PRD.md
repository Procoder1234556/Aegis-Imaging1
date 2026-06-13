# Aegis Imaging — PRD & Memory

## Original Problem Statement
Build a PharmEasy-inspired **Prescription Verification API platform** for online pharmacies.
Hackathon submission with judges PPT section, live stats, social proof, API key management, auth, reports, email sharing, light/dark mode.

## Project Name
**Aegis Imaging** (formerly RxGuard during development)

## Architecture
- **Frontend:** React CRA + Tailwind CSS + Framer Motion + Recharts, port 3000
- **Backend:** FastAPI + SQLite (aiosqlite), port 8001, supervisor-managed
- **AI Pipeline:** 5-Agent orchestrator (IronLabs API + Emergent Universal Key fallback)
- **Auth:** JWT sessions (SQLite) + Emergent Google OAuth
- **Payments:** Stripe (via emergentintegrations)
- **Email:** Resend (needs RESEND_API_KEY in backend/.env)

## Tech Stack
- Frontend: React 18, Tailwind CSS, Framer Motion, Recharts, Lucide-React
- Backend: FastAPI 0.110, aiosqlite, httpx, numpy, Pillow
- LLM Router: IronLabs API → Emergent Universal Key fallback
- DB: SQLite at data/aegis.db
- Email: Resend SDK (resend>=2.0.0)

## Key API Endpoints
- GET  /api/health
- GET  /api/stats              — public landing page stats
- POST /api/auth/register      — accepts {email, password, name, avatar_color}
- POST /api/auth/login
- GET  /api/auth/me
- GET  /api/auth/google        — Google OAuth redirect
- POST /api/auth/logout
- GET  /api/keys               — list user's API keys (auth required)
- POST /api/keys               — create API key (auth required)
- DELETE /api/keys/:id         — revoke API key
- POST /api/email/send-report  — send verification report via Resend
- POST /api/v1/verify          — internal prescription verification
- POST /api/v1/verify-prescription — external (X-API-Key auth)
- GET  /api/v1/audits
- GET  /api/v1/audit/:id
- GET  /api/v1/dashboard

## Frontend Routes
- /               — Landing page (hackathon-ready: judges section, news feed, pricing)
- /login          — Login/Register with avatar picker, Google SSO
- /profile        — User profile, reports, email report, share to Twitter
- /dashboard      — Analytics dashboard (KPI tiles, charts, audit table)
- /api-keys       — API Key management (create, view, revoke)
- /verify         — Upload prescription
- /billing        — Stripe billing (plan upgrade)
- /audit/:id      — Audit detail

## What's Been Implemented
### Phase 1 (2026-06-13) — Pivot from generic medical imaging
- [x] New DB schema: users, user_sessions, api_keys, verifications, payment_transactions
- [x] Auth: email/password + Google OAuth (Emergent)
- [x] Stripe payments integration
- [x] 5-Agent AI pipeline (IronLabs + Emergent fallback)

### Phase 2 (2026-06-14) — UI & Features
- [x] Landing.js — full hackathon page (judges PPT, news feed, social proof marquee, pricing)
- [x] Login.js — PharmEasy-inspired, avatar color picker, theme toggle
- [x] Profile.js — stats, reports table, email report modal, share to Twitter
- [x] ThemeContext.js — light/dark mode (localStorage: aegis-imaging-theme)
- [x] ApiKeys.js — full API key management page
- [x] SideBar — updated branding, API Keys nav item, profile link
- [x] email_router.py — Resend integration (awaiting RESEND_API_KEY)
- [x] robots.txt + SEO meta tags (index.html)
- [x] News cards clickable → open source publication in new tab
- [x] Project renamed: RxGuard → Aegis Imaging throughout

### Phase 3 (2026-06-14) — AI Verification Overhaul
- [x] ai_detector.py — Local forensic analysis (ELA+FFT+Noise+Color+Edge) as primary
- [x] Gemini 2.5 Flash as fallback (triggered on ESCALATE 0.35-0.65 range)
- [x] GEMINI_API_KEY added to backend/.env
- [x] hf_detector.py replaced by ai_detector.py (server.py import updated)
- [x] Landing page tech stack updated to reflect Gemini instead of HuggingFace/SDXL
- [x] Full test suite: 9/9 backend + frontend all passing (iteration_4.json)

## Environment Variables Required
### Backend (.env)
- GEMINI_API_KEY=<user-provided, set in backend/.env>
- RESEND_API_KEY=<get from resend.com>
- SENDER_EMAIL=onboarding@resend.dev (or verified domain)
- DATABASE_URL, SECRET_KEY, IRONLABS_API_KEY, EMERGENT_LLM_KEY, STRIPE_API_KEY (all set)

## Prioritized Backlog

### P0 — Need RESEND_API_KEY to activate
- [ ] Email report sending (infrastructure ready, needs API key)

### P1 — High
- [ ] Stripe billing upgrade flow — frontend billing page to connect to backend
- [ ] Real PDF download for reports (currently uses window.print())
- [ ] DICOM file support (pydicom)

### P2 — Medium
- [ ] Audit search/filter on dashboard
- [ ] WebSocket real-time updates for live verification progress
- [ ] Dark mode on dashboard/sidebar (currently only Login/Profile have theme toggle)

### Future Backlog
- [ ] Real EHR integration (FHIR)
- [ ] Batch verification API
- [ ] Custom webhook configuration UI
- [ ] Model fine-tuning on prescription datasets
