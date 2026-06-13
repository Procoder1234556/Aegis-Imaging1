# Test Credentials

## Application Auth
This application has NO authentication. All endpoints are public.

## API Keys in Backend .env
- IRONLABS_API_KEY: sk_ht5EpxTGSaLu2XpEH2cn1QzxQtQW3skM
- EMERGENT_LLM_KEY: sk-emergent-bB5Bd8a94255fA6Bf3
- HF_TOKEN: (not set — HuggingFace detectors return neutral 0.5 score)

## Demo Audit IDs (seeded on startup)
The system seeds 20 records on startup. Check /api/v1/audits for current IDs.
Examples from seeding:
- AEG-YYYYMMDD-00001 through AEG-YYYYMMDD-00020

## Endpoints
- Backend: http://localhost:8001 (internal) or https://116d1460-522f-4c36-8a17-8dc656c92c5d.preview.emergentagent.com (external)
- Frontend: http://localhost:3000 (internal) or https://116d1460-522f-4c36-8a17-8dc656c92c5d.preview.emergentagent.com (external)

## Database
- SQLite at /app/data/aegis.db
- No password required
