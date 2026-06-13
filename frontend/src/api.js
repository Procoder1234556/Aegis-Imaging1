const BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const VERDICT = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  ESCALATE: 'ESCALATE',
};

export async function verifyImage(file, modality) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('modality', modality);
  const r = await fetch(`${BASE}/api/v1/verify`, { method: 'POST', body: fd });
  if (!r.ok) throw new Error(`Verify failed: ${r.status}`);
  return r.json();
}

export async function getAudit(auditId) {
  const r = await fetch(`${BASE}/api/v1/audit/${auditId}`);
  if (!r.ok) throw new Error(`Audit not found: ${r.status}`);
  return r.json();
}

export async function getDashboard() {
  const r = await fetch(`${BASE}/api/v1/dashboard`);
  if (!r.ok) throw new Error(`Dashboard failed: ${r.status}`);
  return r.json();
}

export async function getAudits(limit = 50, offset = 0) {
  const r = await fetch(`${BASE}/api/v1/audits?limit=${limit}&offset=${offset}`);
  if (!r.ok) throw new Error(`Audits failed: ${r.status}`);
  return r.json();
}

export async function sendMockEHR(auditId, payload) {
  const r = await fetch(`${BASE}/api/v1/mock-ehr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audit_id: auditId, ...payload }),
  });
  if (!r.ok) throw new Error(`EHR mock failed: ${r.status}`);
  return r.json();
}

export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}${path}`;
}
