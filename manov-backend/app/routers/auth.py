from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from prisma import Prisma
from app.utils.security import get_password_hash, verify_password, create_access_token

router = APIRouter()
db = Prisma()

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
    user: dict # Kirim info user balik ke frontend

# --- ENDPOINTS ---

@router.post("/register", response_model=Token)
async def register(req: UserRegister):
    if not db.is_connected(): await db.connect()
    
    # 1. Cek Email Terdaftar
    exists = await db.user.find_unique(where={'email': req.email})
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Hash Password
    hashed_pwd = get_password_hash(req.password)
    
    # 3. Create User
    new_user = await db.user.create(data={
        'username': req.username,
        'email': req.email,
        'password': hashed_pwd,
        'role': 'USER',
        'coins': 100 # Bonus pendaftaran 100 koin!
    })
    
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
            "role": new_user.role
        }
    }

@router.post("/login", response_model=Token)
async def login(req: UserLogin):
    if not db.is_connected(): await db.connect()
    
    user = await db.user.find_unique(where={'email': req.email})
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
            "role": user.role
        }
    }