"""
Stripe payment routes — plan upgrades for Aegis Imaging.
Free → Pro ($29/month) → Enterprise ($99/month).
"""
import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest
)
from db import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["payments"])

STRIPE_KEY = os.getenv("STRIPE_API_KEY", "sk_test_emergent")

# Fixed plans — amounts defined server-side only (security)
PLANS = {
    "pro":        {"amount": 29.00, "currency": "usd", "label": "Aegis Pro"},
    "enterprise": {"amount": 99.00, "currency": "usd", "label": "Aegis Enterprise"},
}


class CheckoutRequest(BaseModel):
    plan: str
    origin_url: str


@router.post("/checkout")
async def create_checkout(body: CheckoutRequest, request: Request):
    user = await get_current_user(request)

    if body.plan not in PLANS:
        raise HTTPException(400, "Invalid plan")

    plan_info = PLANS[body.plan]
    origin = body.origin_url.rstrip("/")

    webhook_url = f"{str(request.base_url)}api/webhook/stripe"
    stripe = StripeCheckout(api_key=STRIPE_KEY, webhook_url=webhook_url)

    success_url = f"{origin}/billing?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url  = f"{origin}/billing"

    checkout_req = CheckoutSessionRequest(
        amount=plan_info["amount"],
        currency=plan_info["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["user_id"],
            "email":   user["email"],
            "plan":    body.plan,
        },
    )
    session = await stripe.create_checkout_session(checkout_req)

    # Record pending transaction
    async with get_db() as db:
        await db.execute(
            "INSERT INTO payment_transactions"
            "(user_id, session_id, amount, currency, plan, status, payment_status, created_at)"
            " VALUES(?,?,?,?,?,?,?,?)",
            (user["user_id"], session.session_id, plan_info["amount"],
             plan_info["currency"], body.plan, "pending", "unpaid",
             datetime.now(timezone.utc).isoformat()),
        )
        await db.commit()

    return {"url": session.url, "session_id": session.session_id}


@router.get("/status/{session_id}")
async def payment_status(session_id: str, request: Request):
    user = await get_current_user(request)
    webhook_url = f"{str(request.base_url)}api/webhook/stripe"
    stripe = StripeCheckout(api_key=STRIPE_KEY, webhook_url=webhook_url)
    status = await stripe.get_checkout_status(session_id)

    async with get_db() as db:
        db.row_factory = __import__("aiosqlite").Row

        # Idempotency: only upgrade once
        cur = await db.execute(
            "SELECT status FROM payment_transactions WHERE session_id=?", (session_id,)
        )
        tx = await cur.fetchone()

        if tx and tx["status"] != "completed" and status.payment_status == "paid":
            # Upgrade user plan
            meta = status.metadata or {}
            plan = meta.get("plan", "pro")
            uid  = meta.get("user_id", user["user_id"])

            await db.execute("UPDATE users SET plan=? WHERE user_id=?", (plan, uid))
            await db.execute(
                "UPDATE payment_transactions SET status='completed', payment_status=? "
                "WHERE session_id=?",
                (status.payment_status, session_id),
            )
            await db.commit()

    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount": status.amount_total,
        "session_id": session_id,
    }


@router.post("/../../api/webhook/stripe")
async def stripe_webhook(request: Request):
    body   = await request.body()
    sig    = request.headers.get("Stripe-Signature", "")
    webhook_url = f"{str(request.base_url)}api/webhook/stripe"
    stripe = StripeCheckout(api_key=STRIPE_KEY, webhook_url=webhook_url)
    try:
        event = await stripe.handle_webhook(body, sig)
        if event.payment_status == "paid":
            meta = event.metadata or {}
            uid  = meta.get("user_id")
            plan = meta.get("plan", "pro")
            if uid:
                async with get_db() as db:
                    await db.execute("UPDATE users SET plan=? WHERE user_id=?", (plan, uid))
                    await db.execute(
                        "UPDATE payment_transactions SET status='completed', payment_status='paid' "
                        "WHERE session_id=?",
                        (event.session_id,),
                    )
                    await db.commit()
    except Exception:
        pass
    return {"received": True}


@router.get("/plans")
async def list_plans():
    return {
        "plans": [
            {"id": "free",       "name": "Free",        "price": 0,  "limit": "3 verifications/day",   "features": ["3 verifications/day", "SHA-256 audit", "Basic dashboard"]},
            {"id": "pro",        "name": "Pro",         "price": 29, "limit": "Unlimited",              "features": ["Unlimited verifications", "Heatmap exports", "Priority processing", "Full audit trail", "API access"]},
            {"id": "enterprise", "name": "Enterprise",  "price": 99, "limit": "Unlimited + team",       "features": ["Everything in Pro", "Team accounts", "DICOM support", "Custom webhooks", "SLA guarantee", "Dedicated support"]},
        ]
    }
