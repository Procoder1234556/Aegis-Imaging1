"""
Aegis Imaging — Email router (Resend)
Sends verification report summaries via email.
"""
import os
import asyncio
import logging

import resend
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/email", tags=["email"])

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL   = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")


class ReportEmailRequest(BaseModel):
    recipient_email: str
    audit_id: str
    verdict: str
    confidence: float
    created_at: str
    pharmacy_name: str = "Your Pharmacy"


def _build_report_html(data: ReportEmailRequest) -> str:
    verdict_color = {
        "APPROVE": "#22C55E",
        "REJECT":  "#DC2626",
        "ESCALATE":"#D97706",
    }.get(data.verdict, "#6B7280")

    verdict_label = {
        "APPROVE": "VALID",
        "REJECT":  "FORGED",
        "ESCALATE":"SUSPICIOUS",
    }.get(data.verdict, data.verdict)

    confidence_pct = f"{round(data.confidence * 100)}%"

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#F2F4F8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F4F8;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1B47DB,#3B67F5);padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;text-align:center;line-height:36px;font-size:18px;">&#x1F6E1;</div>
                    <span style="color:#FFFFFF;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Aegis Imaging</span>
                  </div>
                  <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px;">Prescription Verification Report</p>
                </td>
                <td align="right">
                  <div style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:8px;padding:8px 16px;display:inline-block;">
                    <span style="color:#FFFFFF;font-size:12px;font-weight:600;">VERIFIED</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Verdict -->
        <tr>
          <td style="padding:36px 40px 24px;">
            <p style="font-size:13px;color:#7B8FA6;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Verification Result</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:24px 28px;border-left:4px solid {verdict_color};">
                  <div style="font-size:28px;font-weight:900;color:{verdict_color};letter-spacing:1px;">{verdict_label}</div>
                  <div style="font-size:13px;color:#7B8FA6;margin-top:4px;">AI confidence: <strong style="color:#1C2B34;">{confidence_pct}</strong></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Details -->
        <tr>
          <td style="padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-bottom:16px;">
                  <div style="font-size:11px;color:#7B8FA6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Audit ID</div>
                  <div style="font-size:13px;color:#1C2B34;font-family:monospace;font-weight:600;">{data.audit_id}</div>
                </td>
                <td width="50%" style="padding-bottom:16px;">
                  <div style="font-size:11px;color:#7B8FA6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Date</div>
                  <div style="font-size:13px;color:#1C2B34;">{data.created_at[:10]}</div>
                </td>
              </tr>
              <tr>
                <td width="50%">
                  <div style="font-size:11px;color:#7B8FA6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Pharmacy</div>
                  <div style="font-size:13px;color:#1C2B34;">{data.pharmacy_name}</div>
                </td>
                <td width="50%">
                  <div style="font-size:11px;color:#7B8FA6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Confidence Score</div>
                  <div style="font-size:13px;color:{verdict_color};font-weight:700;">{confidence_pct}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #E8EDF5;margin:0;" /></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;">
            <p style="font-size:12px;color:#7B8FA6;margin:0;line-height:1.6;">
              This report was generated by Aegis Imaging AI. The SHA-256 audit chain ensures
              this record is tamper-evident. For compliance or legal questions, contact
              your pharmacy administrator.
            </p>
            <p style="font-size:11px;color:#9B9B9B;margin:12px 0 0;">
              &copy; 2026 Aegis Imaging &bull; Powered by 5-Agent AI Pipeline
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


@router.post("/send-report")
async def send_report_email(body: ReportEmailRequest):
    if not RESEND_API_KEY:
        raise HTTPException(503, "Email service not configured. Add RESEND_API_KEY to backend environment.")

    resend.api_key = RESEND_API_KEY
    html_content = _build_report_html(body)

    params = {
        "from": SENDER_EMAIL,
        "to": [body.recipient_email],
        "subject": f"Aegis Imaging Verification Report — {body.audit_id}",
        "html": html_content,
    }

    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        return {"status": "sent", "email_id": result.get("id", ""), "recipient": body.recipient_email}
    except Exception as e:
        logger.error(f"Resend error: {e}")
        raise HTTPException(500, f"Failed to send email: {str(e)}")
