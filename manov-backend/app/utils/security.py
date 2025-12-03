import hashlib
import bcrypt # <--- Kita pakai ini langsung
from datetime import datetime, timedelta
from jose import jwt
from dotenv import load_dotenv
import os

load_dotenv()

# Secret Key
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 minggu

def get_password_hash(password: str) -> str:
    """
    Mengubah password jadi hash.
    Flow: Input -> SHA256 (64 chars) -> Bcrypt -> Hash String
    """
    # 1. SHA256 Pre-hashing (Agar panjang selalu 64 karakter, aman dari limit 72 bytes)
    sha_password = hashlib.sha256(password.encode('utf-8')).hexdigest()
    
    # 2. Bcrypt Hashing
    # bcrypt butuh input dalam bentuk BYTES, bukan string
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(sha_password.encode('utf-8'), salt)
    
    # Kembalikan sebagai string agar bisa disimpan di Postgres
    return hashed_bytes.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifikasi password saat login.
    """
    # 1. Hash inputan user dengan SHA256 dulu
    sha_password = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    
    # 2. Cek dengan bcrypt
    # Pastikan keduanya dalam bentuk bytes
    return bcrypt.checkpw(
        sha_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt