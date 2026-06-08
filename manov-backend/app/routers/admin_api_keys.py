from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.middleware.rate_limit import limiter
from app.models import ApiKey
from app.utils.deps import get_current_admin
from app.utils.security import generate_api_key

router = APIRouter(dependencies=[Depends(get_current_admin)])


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class ApiKeyCreateResponse(BaseModel):
    id: int
    name: str
    key: str
    keyPrefix: str
    createdAt: datetime


class ApiKeyResponse(BaseModel):
    id: int
    name: str
    keyPrefix: str
    isActive: bool
    lastUsedAt: datetime | None
    createdAt: datetime


@router.post("/api-keys", response_model=ApiKeyCreateResponse)
@limiter.limit("10/minute")
async def create_api_key(
    request: Request,
    req: ApiKeyCreateRequest,
    user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    full_key, key_hash = generate_api_key()
    api_key = ApiKey(
        userId=user["id"],
        name=req.name,
        keyHash=key_hash,
        keyPrefix=full_key[:8],
        isActive=True,
    )
    session.add(api_key)
    await session.commit()
    await session.refresh(api_key)
    return {
        "id": api_key.id,
        "name": api_key.name,
        "key": full_key,
        "keyPrefix": api_key.keyPrefix,
        "createdAt": api_key.createdAt,
    }


@router.get("/api-keys", response_model=list[ApiKeyResponse])
async def list_api_keys(
    user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(ApiKey).where(ApiKey.userId == user["id"])
    )
    return list(result.scalars().all())


@router.delete("/api-keys/{key_id}")
@limiter.limit("10/minute")
async def revoke_api_key(
    request: Request,
    key_id: int,
    user: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.userId == user["id"])
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    key.isActive = False
    await session.commit()
    return {"message": "API key revoked"}
