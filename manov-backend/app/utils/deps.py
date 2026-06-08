from datetime import UTC, datetime

from fastapi import Depends, Header, HTTPException, Query, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database import AsyncSessionLocal, get_session
from app.models import ApiKey, User
from app.utils.security import ALGORITHM, SECRET_KEY, verify_api_key

# Ini memberitahu FastAPI: "Kalau butuh token, ambil dari Header Authorization: Bearer ..."
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Tugas: Memastikan user mengirim token yang valid.
    Output: Data user (id, role, email)
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # 1. Decode Token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")

        if user_id is None:
            raise credentials_exception

        return {"id": int(user_id), "role": role}

    except JWTError:
        raise credentials_exception from None


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict | None:
    """Return user dict if a valid token is present, otherwise None."""
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        if user_id is None:
            return None
        return {"id": int(user_id), "role": role}
    except JWTError:
        return None


async def get_current_user_from_api_key(
    request: Request,
    x_api_key: str | None = Header(None, alias="X-API-Key"),
    session: AsyncSession = Depends(get_session),
) -> dict | None:
    key = x_api_key or request.query_params.get("api_key")
    if not key:
        return None

    prefix = key[:8]
    result = await session.execute(
        select(ApiKey, User)
        .join(User, ApiKey.userId == User.id)
        .where(ApiKey.isActive, ApiKey.keyPrefix == prefix)
    )
    rows = result.all()

    for api_key_row, user in rows:
        if verify_api_key(key, api_key_row.keyHash):
            async with AsyncSessionLocal() as side_session:
                api_key_row.lastUsedAt = datetime.now(UTC).replace(tzinfo=None)
                await side_session.merge(api_key_row)
                await side_session.commit()
            return {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "username": user.username,
            }
    return None


async def get_current_admin(
    user: dict = Depends(get_current_user),
    api_user: dict | None = Depends(get_current_user_from_api_key),
):
    """
    Tugas: Memastikan user yang login adalah ADMIN.
    Supports both JWT (Bearer token) and API key (header or query param).
    """
    resolved = user if user else api_user
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    if resolved.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource (Admin only)",
        )
    return resolved
