"""RxGuard Backend API Tests"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

TEST_EMAIL = "testpharmacy@rxguard.test"
TEST_PASSWORD = "Test1234!"
TEST_NAME = "Test Pharmacy"


class TestHealth:
    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_robots_txt(self):
        r = requests.get(f"{BASE_URL}/robots.txt")
        assert r.status_code == 200


class TestAuth:
    def test_register(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME,
            "avatar_color": "#1B47DB"
        })
        # 200 or 409 (already exists)
        assert r.status_code in (200, 409)
        if r.status_code == 200:
            data = r.json()
            assert "session_token" in data

    def test_login(self):
        # Ensure user exists first
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME,
        })
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert r.status_code == 200
        data = r.json()
        assert "session_token" in data
        assert data["email"] == TEST_EMAIL

    def test_login_wrong_password(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": "wrongpassword"
        })
        assert r.status_code == 401

    def test_me_unauthenticated(self):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401


@pytest.fixture(scope="module")
def auth_token():
    requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": TEST_EMAIL, "password": TEST_PASSWORD, "name": TEST_NAME
    })
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL, "password": TEST_PASSWORD
    })
    if r.status_code == 200:
        return r.json()["session_token"]
    pytest.skip("Auth failed")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


class TestAPIKeys:
    def test_list_keys_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/keys")
        assert r.status_code == 401

    def test_list_keys(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/keys", headers=auth_headers)
        assert r.status_code == 200
        assert "keys" in r.json()

    def test_create_key(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/keys", json={"name": "TEST_Key", "description": "test"},
                          headers=auth_headers)
        # 200 or 403 (limit reached)
        assert r.status_code in (200, 403)
        if r.status_code == 200:
            data = r.json()
            assert "key" in data
            assert data["key"].startswith("rxg_live_")
            assert "key_id" in data

    def test_create_key_returns_raw_key(self, auth_headers):
        # Revoke existing keys first to make room
        keys_r = requests.get(f"{BASE_URL}/api/keys", headers=auth_headers)
        existing = keys_r.json().get("keys", [])
        for k in existing:
            if k["is_active"]:
                requests.delete(f"{BASE_URL}/api/keys/{k['key_id']}", headers=auth_headers)

        r = requests.post(f"{BASE_URL}/api/keys", json={"name": "TEST_RawKey"},
                          headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["key"].startswith("rxg_live_")
        # cleanup
        requests.delete(f"{BASE_URL}/api/keys/{data['key_id']}", headers=auth_headers)


class TestPublicEndpoints:
    def test_stats(self):
        r = requests.get(f"{BASE_URL}/api/stats")
        assert r.status_code == 200
        data = r.json()
        assert "total_verified" in data
        assert "fraud_blocked" in data

    def test_dashboard(self):
        r = requests.get(f"{BASE_URL}/api/v1/dashboard")
        assert r.status_code == 200

    def test_audits(self):
        r = requests.get(f"{BASE_URL}/api/v1/audits")
        assert r.status_code == 200
        assert "audits" in r.json()


class TestEmailEndpoint:
    def test_email_no_key_returns_503(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/email/send-report", json={
            "recipient_email": "test@example.com",
            "audit_id": "AEG-20260101-00001",
            "verdict": "APPROVE",
            "confidence": 0.95,
            "created_at": "2026-01-01T00:00:00",
            "pharmacy_name": "Test Pharmacy"
        }, headers=auth_headers)
        # Expected: 503 since RESEND_API_KEY not configured
        assert r.status_code == 503
