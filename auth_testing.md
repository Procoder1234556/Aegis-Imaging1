# Auth Testing Playbook — Aegis Imaging

## Step 1: Create Test Session (SQLite version)
```python
import sqlite3, uuid, datetime
DB = '/app/data/aegis.db'
con = sqlite3.connect(DB)
user_id = f"user_{uuid.uuid4().hex[:12]}"
session_token = f"test_session_{uuid.uuid4().hex}"
now = datetime.datetime.utcnow().isoformat()
expires = (datetime.datetime.utcnow() + datetime.timedelta(days=7)).isoformat()
con.execute("INSERT INTO users(user_id,email,name,picture,plan,created_at) VALUES(?,?,?,?,?,?)",
    (user_id,'test@example.com','Test User','',  'free',now))
con.execute("INSERT INTO user_sessions(user_id,session_token,expires_at,created_at) VALUES(?,?,?,?)",
    (user_id,session_token,expires,now))
con.commit()
print("session_token:", session_token)
print("user_id:", user_id)
```

## Step 2: Test Backend API
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)
SESSION_TOKEN="YOUR_SESSION_TOKEN_HERE"

# Check auth
curl -s "$API_URL/api/auth/me" \
  -H "Authorization: Bearer $SESSION_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin))"

# Verify image (protected)
curl -s -X POST "$API_URL/api/v1/verify" \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -F "file=@/tmp/test.png" \
  -F "modality=xray"
```

## Step 3: Browser Session Cookie
```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "116d1460-522f-4c36-8a17-8dc656c92c5d.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://116d1460-522f-4c36-8a17-8dc656c92c5d.preview.emergentagent.com/dashboard")
```

## Checklist
- [ ] POST /api/auth/register creates user + returns session
- [ ] POST /api/auth/login returns session_token
- [ ] GET /api/auth/me returns user data with valid token
- [ ] Google OAuth redirect flow works
- [ ] Protected /verify page redirects to /login when not authenticated  
- [ ] Dashboard loads when authenticated
- [ ] Stripe checkout creates session
- [ ] Logout clears session cookie
