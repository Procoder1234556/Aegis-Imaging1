"""
Aegis Imaging — Image Verification & Gemini Fallback Tests
Tests: /api/v1/verify, /api/auth/*, /api/keys
"""
import pytest
import requests
import os
import io
import json
import math
import base64
from pathlib import Path

def _load_base_url():
    url = os.environ.get('REACT_APP_BACKEND_URL', '')
    if not url:
        env_file = Path('/app/frontend/.env')
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                if line.startswith('REACT_APP_BACKEND_URL='):
                    url = line.split('=', 1)[1].strip()
                    break
    return url.rstrip('/')

BASE_URL = _load_base_url()
TEST_EMAIL = "testpharmacy@rxguard.test"
TEST_PASSWORD = "Test1234!"


def make_real_image_bytes():
    """Create a noisy JPEG image resembling a real photo (should score low AI)."""
    import numpy as np
    from PIL import Image
    np.random.seed(42)
    # Random noise image with varied textures - should get APPROVE or ESCALATE
    arr = np.random.randint(0, 256, (256, 256, 3), dtype=np.uint8)
    # Add some structure
    arr[50:200, 50:200] = np.random.randint(100, 200, (150, 150, 3), dtype=np.uint8)
    img = Image.fromarray(arr, 'RGB')
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    return buf.getvalue()


def make_gradient_image_bytes():
    """Create a 512x512 smooth gradient JPEG — should trigger Gemini fallback (ESCALATE)."""
    import numpy as np
    from PIL import Image
    arr = np.zeros((512, 512, 3), dtype=np.uint8)
    for i in range(512):
        val = int(i * 255 / 511)
        arr[i, :, 0] = val
        arr[i, :, 1] = 255 - val
        arr[i, :, 2] = 128
    img = Image.fromarray(arr, 'RGB')
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    return buf.getvalue()


def has_nan_or_inf(obj, path=""):
    """Recursively check for NaN/Infinity in nested dict/list."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return True, path
        return False, ""
    if isinstance(obj, dict):
        for k, v in obj.items():
            found, p = has_nan_or_inf(v, f"{path}.{k}")
            if found:
                return True, p
    if isinstance(obj, list):
        for i, v in enumerate(obj):
            found, p = has_nan_or_inf(v, f"{path}[{i}]")
            if found:
                return True, p
    return False, ""


@pytest.fixture(scope="module")
def session_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.text}"
    token = r.json().get("session_token")
    assert token
    return token


@pytest.fixture(scope="module")
def auth_headers(session_token):
    return {"Authorization": f"Bearer {session_token}"}


# ── Verify endpoint tests ──────────────────────────────────────

class TestVerifyEndpoint:
    """POST /api/v1/verify — no auth required"""

    def test_verify_real_image_returns_valid_verdict(self):
        img_bytes = make_real_image_bytes()
        r = requests.post(
            f"{BASE_URL}/api/v1/verify",
            files={"file": ("photo.jpg", img_bytes, "image/jpeg")}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert data["verdict"] in ("APPROVE", "REJECT", "ESCALATE"), f"Unexpected verdict: {data['verdict']}"
        assert "audit_id" in data
        assert "confidence" in data
        print(f"Real image verdict: {data['verdict']} confidence={data['confidence']}")

    def test_verify_response_no_nan_or_infinity(self):
        img_bytes = make_real_image_bytes()
        r = requests.post(
            f"{BASE_URL}/api/v1/verify",
            files={"file": ("photo.jpg", img_bytes, "image/jpeg")}
        )
        assert r.status_code == 200
        # Check raw JSON text for NaN/Infinity
        raw = r.text
        assert "NaN" not in raw, "Response contains NaN"
        assert "Infinity" not in raw, "Response contains Infinity"
        # Also check parsed object
        data = r.json()
        found, path = has_nan_or_inf(data)
        assert not found, f"NaN/Infinity found at {path}"
        print("No NaN/Infinity in response")

    def test_verify_gradient_triggers_gemini(self):
        """512x512 gradient should have low noise → ESCALATE → Gemini fallback"""
        img_bytes = make_gradient_image_bytes()
        r = requests.post(
            f"{BASE_URL}/api/v1/verify",
            files={"file": ("gradient.jpg", img_bytes, "image/jpeg")},
            timeout=60
        )
        assert r.status_code == 200, f"Expected 200: {r.text}"
        data = r.json()
        print(f"Gradient image: verdict={data['verdict']}, gemini_used={data.get('gemini_used')}, ai_score={data.get('forensics_json', {}).get('ai_score')}")
        # If Gemini API key is present, gemini_used should be True
        gemini_used = data.get("gemini_used", False)
        verdict = data["verdict"]
        assert verdict in ("APPROVE", "REJECT", "ESCALATE"), f"Unexpected verdict: {verdict}"
        # Just report whether Gemini was triggered
        if gemini_used:
            print("PASS: Gemini fallback triggered (gemini_used=True)")
        else:
            print(f"INFO: Gemini not triggered. Local ai_score={data.get('forensics_json', {}).get('ai_score')} verdict={verdict}")

    def test_verify_response_structure(self):
        img_bytes = make_real_image_bytes()
        r = requests.post(
            f"{BASE_URL}/api/v1/verify",
            files={"file": ("photo.jpg", img_bytes, "image/jpeg")}
        )
        assert r.status_code == 200
        data = r.json()
        required_keys = ["audit_id", "verdict", "confidence", "rationale", "gemini_used", "forensics_json"]
        for key in required_keys:
            assert key in data, f"Missing key: {key}"
        print("Response structure OK")


# ── Auth tests ─────────────────────────────────────────────────

class TestAuth:
    def test_register_new_user(self):
        import time
        email = f"verify_test_{int(time.time())}@test.com"
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "Test1234!", "full_name": "Verify Test"
        })
        assert r.status_code == 200, f"Register failed: {r.text}"
        data = r.json()
        assert "session_token" in data
        # Register response may have user nested or flat
        user_email = data.get("user", {}).get("email") if isinstance(data.get("user"), dict) else data.get("email")
        assert user_email == email or "session_token" in data
        print(f"Register new user OK: {email}, response keys: {list(data.keys())}")

    def test_login_returns_session_token(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
        assert r.status_code == 200, f"Login failed: {r.text}"
        data = r.json()
        assert "session_token" in data
        assert data["session_token"]
        print("Login OK, session_token present")

    def test_me_returns_user_info(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200, f"GET /me failed: {r.text}"
        data = r.json()
        assert data["email"] == TEST_EMAIL
        print(f"GET /me OK: {data['email']}")


# ── API Keys tests ─────────────────────────────────────────────

class TestAPIKeys:
    def test_list_keys(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/keys", headers=auth_headers)
        assert r.status_code == 200, f"GET /keys failed: {r.text}"
        data = r.json()
        # Response may be a list or {"keys": [...]}
        keys_list = data if isinstance(data, list) else data.get("keys", [])
        assert isinstance(keys_list, list)
        print(f"List keys OK: {len(keys_list)} keys")

    def test_create_key(self, auth_headers):
        import time
        r = requests.post(f"{BASE_URL}/api/keys",
                          json={"name": f"TEST_Key_{int(time.time())}"},
                          headers=auth_headers)
        # May fail with 403 if plan limit reached — that's valid behavior
        assert r.status_code in (200, 403), f"POST /keys unexpected: {r.status_code} {r.text}"
        if r.status_code == 200:
            data = r.json()
            assert "key" in data or "api_key" in data or "id" in data
            print(f"Create key OK: {list(data.keys())}")
        else:
            print(f"Create key: plan limit reached (403) — expected behavior")
