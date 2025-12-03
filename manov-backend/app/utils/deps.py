from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from prisma import Prisma
from app.utils.security import SECRET_KEY, ALGORITHM

# Ini memberitahu FastAPI: "Kalau butuh token, ambil dari Header Authorization: Bearer ..."
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
db = Prisma()

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
        raise credentials_exception

async def get_current_admin(user: dict = Depends(get_current_user)):
    """
    Tugas: Memastikan user yang login adalah ADMIN.
    """
    if user["role"] != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource (Admin only)"
        )
    return user