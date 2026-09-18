from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from urllib.parse import urlencode
import httpx
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_current_user, hash_password
from app.models import User
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(func.lower(User.email) == payload.email.strip().lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenResponse(access_token=create_access_token(str(user.id), user.role), user=UserOut.model_validate(user))

@router.get("/google/login")
def google_login():
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(503, "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend/.env.")
    query = urlencode({"client_id": settings.google_client_id, "redirect_uri": settings.google_redirect_uri, "response_type": "code", "scope": "openid email profile", "prompt": "select_account"})
    return RedirectResponse("https://accounts.google.com/o/oauth2/v2/auth?" + query)

@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient(timeout=10) as client:
        exchanged = await client.post("https://oauth2.googleapis.com/token", data={"code": code, "client_id": settings.google_client_id, "client_secret": settings.google_client_secret, "redirect_uri": settings.google_redirect_uri, "grant_type": "authorization_code"})
        if exchanged.is_error: raise HTTPException(401, "Google sign-in could not be verified.")
        profile_response = await client.get("https://openidconnect.googleapis.com/v1/userinfo", headers={"Authorization": "Bearer " + exchanged.json()["access_token"]})
    profile = profile_response.json()
    if not profile.get("email_verified"): raise HTTPException(401, "A verified Google email is required.")
    user = db.query(User).filter(func.lower(User.email) == profile["email"].lower()).first()
    if not user:
        user = User(name=profile.get("name") or profile["email"], email=profile["email"].lower(), password_hash=hash_password("google-oauth-account"), role="DOCTOR", specialty="Clinical Team")
        db.add(user); db.commit(); db.refresh(user)
    token = create_access_token(str(user.id), user.role)
    return RedirectResponse("http://localhost:5173/login?google_token=" + token)

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user