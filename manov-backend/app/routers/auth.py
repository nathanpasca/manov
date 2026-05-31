from datetime import UTC

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import create_user, get_user_by_email
from app.database import get_session
from app.middleware.rate_limit import limiter
from app.models import User
from app.utils.deps import get_current_user
from app.utils.security import (
    create_access_token,
    generate_reset_token,
    get_password_hash,
    get_reset_token_expiry,
    verify_password,
    verify_reset_token,
)

router = APIRouter()


# --- SCHEMA ---
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict  # Kirim info user balik ke frontend


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# --- ENDPOINTS ---


@router.post("/register", response_model=Token)
@limiter.limit("5/minute")
async def register(request: Request, req: UserRegister, session: AsyncSession = Depends(get_session)):
    # 1. Cek Email Terdaftar
    exists = await get_user_by_email(session, req.email)
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Hash Password
    hashed_pwd = get_password_hash(req.password)

    # 3. Create User
    new_user = User(
        username=req.username,
        email=req.email,
        password=hashed_pwd,
        role="USER",
        coins=100,  # Bonus pendaftaran 100 koin!
    )
    await create_user(session, new_user)

    # 4. Auto Login (Generate Token)
    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "coins": new_user.coins,
            "role": new_user.role,
        },
    }


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, req: UserLogin, session: AsyncSession = Depends(get_session)):
    user = await get_user_by_email(session, req.email)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if not verify_password(req.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "coins": user.coins,
            "role": user.role,
        },
    }


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    from app.crud import get_user_by_id

    db_user = await get_user_by_id(session, user["id"])
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "role": db_user.role,
        "coins": db_user.coins,
    }


@router.post("/forgot-password")
@limiter.limit("3/hour")
async def forgot_password(
    request: Request, req: ForgotPasswordRequest, session: AsyncSession = Depends(get_session)
):
    """Request a password reset token. Always returns the same message to prevent email enumeration."""
    user = await get_user_by_email(session, req.email)

    if user:
        token, token_hash = generate_reset_token()
        user.resetTokenHash = token_hash
        user.resetTokenExpires = get_reset_token_expiry()
        await session.commit()
        # NOTE: In production, send token via email. For dev, return it in response.
        return {
            "message": "If the email exists, a reset link has been sent.",
            "token": token,  # Remove this in production — send via email instead
        }

    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(
    request: Request, req: ResetPasswordRequest, session: AsyncSession = Depends(get_session)
):
    """Reset password using a valid reset token."""

    # Find user by iterating through users with reset tokens (not ideal, but works for now)
    # Better approach: store token -> user mapping or use a dedicated lookup
    from sqlalchemy import select

    from app.models import User as UserModel

    result = await session.execute(
        select(UserModel).where(UserModel.resetTokenHash.isnot(None))
    )
    users_with_tokens = result.scalars().all()

    user = None
    for u in users_with_tokens:
        if verify_reset_token(req.token, u.resetTokenHash):
            user = u
            break

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    # Check expiry
    from datetime import datetime
    if user.resetTokenExpires and user.resetTokenExpires.replace(tzinfo=UTC) < datetime.now(UTC):
        raise HTTPException(status_code=400, detail="Token expired")

    # Update password and clear token
    user.password = get_password_hash(req.new_password)
    user.resetTokenHash = None
    user.resetTokenExpires = None
    await session.commit()

    return {"message": "Password reset successful"}
