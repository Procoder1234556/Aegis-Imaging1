"""
Auth router — email/password + Emergent Google OAuth.
Sessions stored in SQLite, returned as httpOnly cookies + Bearer token.
"""
import os, uuid, hashlib, secrets
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

load_dotenv()

from db import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "aegis-secret")
SESSION_TTL_DAYS = 7

PLANS = {"free": 0, "pro": 29, "enterprise": 99}
FREE_DAILY_LIMIT = 3

# ─── Pydantic models ──────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    picture: str = ""
    plan: str = "free"
    verifications_today: int = 0
    created_at: str


# ─── Password hashing ────────────────────────────────────────

def hash_password(password: str) -> str:
    import bcrypt
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    import bcrypt
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


# ─── Session helpers ─────────────────────────────────────────

def _new_session_token() -> str:
    return secrets.token_urlsafe(48)

async def _create_session(user_id: str) -> str:
    token = _new_session_token()
    expires = datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
    async with get_db() as db:
        await db.execute(
            "INSERT INTO user_sessions(user_id, session_token, expires_at, created_at) VALUES(?,?,?,?)",
            (user_id, token, expires.isoformat(), datetime.now(timezone.utc).isoformat()),
        )
        await db.commit()
    return token

def _set_session_cookie(response: Response, token: str):
    response.set_cookie(
        key="session_token", value=token,
        max_age=SESSION_TTL_DAYS * 86400,
        path="/", httponly=True, secure=True, samesite="none",
    )


# ─── Get current user dependency ─────────────────────────────

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")

    async with get_db() as db:
        db.row_factory = __import__("aiosqlite").Row
        cur = await db.execute(
            "SELECT s.user_id, s.expires_at FROM user_sessions s WHERE s.session_token=?", (token,)
        )
        session = await cur.fetchone()
        if not session:
            raise HTTPException(401, "Invalid session")

        expires = session["expires_at"]
        if isinstance(expires, str):
            expires = datetime.fromisoformat(expires)
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            raise HTTPException(401, "Session expired")

        cur = await db.execute(
            "SELECT user_id, email, name, picture, plan, verifications_today, created_at "
            "FROM users WHERE user_id=?", (session["user_id"],)
        )
        user = await cur.fetchone()
        if not user:
            raise HTTPException(401, "User not found")
        return dict(user)

async def optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


# ─── Routes ─────────────────────────────────────────────────

@router.post("/register")
async def register(body: RegisterRequest, response: Response):
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    async with get_db() as db:
        db.row_factory = __import__("aiosqlite").Row
        cur = await db.execute("SELECT user_id FROM users WHERE email=?", (body.email.lower(),))
        if await cur.fetchone():
            raise HTTPException(409, "Email already registered")

        user_id = f"user_{uuid.uuid4().hex[:12]}"
        pw_hash = hash_password(body.password)
        await db.execute(
            "INSERT INTO users(user_id,email,name,picture,password_hash,plan,verifications_today,created_at) "
            "VALUES(?,?,?,?,?,?,?,?)",
            (user_id, body.email.lower(), body.name or body.email.split("@")[0],
             "", pw_hash, "free", 0, datetime.now(timezone.utc).isoformat()),
        )
        await db.commit()

    token = await _create_session(user_id)
    _set_session_cookie(response, token)
    return {"session_token": token, "user_id": user_id, "email": body.email, "plan": "free"}


@router.post("/login")
async def login(body: LoginRequest, response: Response):
    async with get_db() as db:
        db.row_factory = __import__("aiosqlite").Row
        cur = await db.execute(
            "SELECT user_id, email, name, picture, password_hash, plan "
            "FROM users WHERE email=?", (body.email.lower(),)
        )
        user = await cur.fetchone()

    if not user or not user["password_hash"]:
        raise HTTPException(401, "Invalid email or password")
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")

    token = await _create_session(user["user_id"])
    _set_session_cookie(response, token)
    return {"session_token": token, "user_id": user["user_id"],
            "email": user["email"], "name": user["name"], "plan": user["plan"]}


@router.get("/google")
async def google_login(request: Request):
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    origin = request.headers.get("origin") or str(request.base_url).rstrip("/")
    redirect_url = f"{origin}/dashboard"
    auth_url = f"https://auth.emergentagent.com/?redirect={__import__('urllib.parse', fromlist=['quote']).quote(redirect_url)}"
    return {"url": auth_url}


@router.get("/google/callback")
async def google_callback(session_id: str, response: Response):
    """Exchange Emergent session_id for a persistent session token."""
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=10,
        )
    if r.status_code != 200:
        raise HTTPException(401, "Google auth failed")

    data = r.json()
    email = data.get("email", "").lower()
    name  = data.get("name", email.split("@")[0])
    picture = data.get("picture", "")
    google_id = data.get("id", "")
    emergent_session = data.get("session_token", "")

    async with get_db() as db:
        db.row_factory = __import__("aiosqlite").Row
        cur = await db.execute("SELECT user_id, plan FROM users WHERE email=?", (email,))
        existing = await cur.fetchone()

        if existing:
            user_id = existing["user_id"]
            await db.execute(
                "UPDATE users SET name=?, picture=?, google_id=? WHERE user_id=?",
                (name, picture, google_id, user_id)
            )
        else:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.execute(
                "INSERT INTO users(user_id,email,name,picture,google_id,plan,verifications_today,created_at) "
                "VALUES(?,?,?,?,?,?,?,?)",
                (user_id, email, name, picture, google_id, "free", 0, datetime.now(timezone.utc).isoformat()),
            )
        await db.commit()

    token = await _create_session(user_id)
    _set_session_cookie(response, token)
    return {"session_token": token, "user_id": user_id, "email": email, "name": name, "plan": "free"}


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user


@router.post("/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        async with get_db() as db:
            await db.execute("DELETE FROM user_sessions WHERE session_token=?", (token,))
            await db.commit()
    response.delete_cookie("session_token", path="/")
    return {"status": "logged out"}
