# Aegis Imaging — Test Credentials

## Registered test accounts (SQLite — persists across restarts in /app/data/aegis.db)

| Account | Email | Password | Plan | Notes |
|---------|-------|----------|------|-------|
| Test Pharmacy | testpharmacy@rxguard.test | Test1234! | free | Created by testing agent iter 2 |
| Auth Fix Test | auth_fix_test@test.com | Test1234 | free | Created for auth fix validation |
| CORS Fix Test | corsfix@test.com | Fix1234 | free | Created for CORS/auth fix validation |

## How to use in test scripts
```python
BASE = "https://116d1460-522f-4c36-8a17-8dc656c92c5d.preview.emergentagent.com"
# login
r = requests.post(f"{BASE}/api/auth/login", json={"email": "testpharmacy@rxguard.test", "password": "Test1234!"})
token = r.json()["session_token"]
headers = {"Authorization": f"Bearer {token}"}
```

## Admin / Seed
- No admin account — there is no admin role in this app
- 20 seed audit records pre-loaded at startup from `db.py`
