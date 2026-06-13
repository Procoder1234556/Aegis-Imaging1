"""Backend API tests for Aegis Imaging"""
import pytest
import requests
import os
from pathlib import Path
import io

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


class TestHealth:
    def test_health_endpoint(self):
        r = requests.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert "service" in data
        print(f"Health OK: {data}")


class TestDashboard:
    def test_dashboard_returns_200(self):
        r = requests.get(f"{BASE_URL}/api/v1/dashboard")
        assert r.status_code == 200
        data = r.json()
        print(f"Dashboard keys: {list(data.keys())}")

    def test_dashboard_structure(self):
        r = requests.get(f"{BASE_URL}/api/v1/dashboard")
        data = r.json()
        assert "totals" in data
        assert "latency" in data
        assert "cost" in data
        assert "recent_audits" in data

    def test_dashboard_totals_20_records(self):
        r = requests.get(f"{BASE_URL}/api/v1/dashboard")
        data = r.json()
        totals = data["totals"]
        assert totals["total"] == 20, f"Expected 20 total records, got {totals['total']}"
        print(f"Totals: {totals}")

    def test_dashboard_approve_reject_counts(self):
        r = requests.get(f"{BASE_URL}/api/v1/dashboard")
        data = r.json()
        totals = data["totals"]
        assert totals["approve"] == 11, f"Expected 11 approvals, got {totals['approve']}"
        assert totals["reject"] == 6, f"Expected 6 rejections, got {totals['reject']}"
        print(f"Approve: {totals['approve']}, Reject: {totals['reject']}")

    def test_dashboard_cost_savings(self):
        r = requests.get(f"{BASE_URL}/api/v1/dashboard")
        data = r.json()
        cost = data["cost"]
        assert cost["saved_percent"] == 68.6
        print(f"Cost savings: {cost['saved_percent']}%")

    def test_dashboard_latency_series(self):
        r = requests.get(f"{BASE_URL}/api/v1/dashboard")
        data = r.json()
        assert "latency_series" in data
        print(f"Latency series count: {len(data['latency_series'])}")


class TestAudits:
    def test_audits_list_200(self):
        r = requests.get(f"{BASE_URL}/api/v1/audits")
        assert r.status_code == 200
        data = r.json()
        assert "audits" in data
        assert "total" in data
        print(f"Audits total: {data['total']}")

    def test_audits_list_20_records(self):
        r = requests.get(f"{BASE_URL}/api/v1/audits")
        data = r.json()
        assert len(data["audits"]) == 20, f"Expected 20 audits, got {len(data['audits'])}"

    def test_audit_detail_by_id(self):
        r = requests.get(f"{BASE_URL}/api/v1/audits")
        audits = r.json()["audits"]
        audit_id = audits[0]["audit_id"]

        r2 = requests.get(f"{BASE_URL}/api/v1/audit/{audit_id}")
        assert r2.status_code == 200
        detail = r2.json()
        assert detail["audit_id"] == audit_id
        assert "verdict" in detail
        assert "confidence" in detail
        assert "agent_outputs" in detail
        assert "hash_chain" in detail
        print(f"Audit detail fields: {list(detail.keys())}")

    def test_audit_detail_agent_outputs(self):
        r = requests.get(f"{BASE_URL}/api/v1/audits")
        audit_id = r.json()["audits"][0]["audit_id"]

        r2 = requests.get(f"{BASE_URL}/api/v1/audit/{audit_id}")
        detail = r2.json()
        ao = detail["agent_outputs"]
        assert "intake" in ao
        assert "forensics" in ao
        assert "clinical" in ao
        assert "verdict" in ao

    def test_audit_detail_hash_chain(self):
        r = requests.get(f"{BASE_URL}/api/v1/audits")
        audit_id = r.json()["audits"][0]["audit_id"]

        r2 = requests.get(f"{BASE_URL}/api/v1/audit/{audit_id}")
        detail = r2.json()
        hc = detail["hash_chain"]
        assert "prev" in hc
        assert "self" in hc
        print(f"Hash chain: prev={hc['prev'][:16]}..., self={hc['self'][:16]}...")

    def test_audit_not_found(self):
        r = requests.get(f"{BASE_URL}/api/v1/audit/NONEXISTENT-ID")
        assert r.status_code == 404


class TestVerify:
    def test_verify_accepts_image_upload(self):
        # Create a minimal PNG (1x1 white pixel)
        png_bytes = (
            b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
            b'\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00'
            b'\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18'
            b'\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        )
        files = {"file": ("test.png", io.BytesIO(png_bytes), "image/png")}
        data = {"modality": "xray"}
        r = requests.post(f"{BASE_URL}/api/v1/verify", files=files, data=data, timeout=60)
        assert r.status_code == 200
        result = r.json()
        assert "verdict" in result or "audit_id" in result
        print(f"Verify result keys: {list(result.keys())}")

    def test_verify_rejects_empty_file(self):
        files = {"file": ("empty.png", io.BytesIO(b""), "image/png")}
        r = requests.post(f"{BASE_URL}/api/v1/verify", files=files, data={"modality": "xray"}, timeout=30)
        assert r.status_code == 400
