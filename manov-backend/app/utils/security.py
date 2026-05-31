import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

import bcrypt
from jose import jwt

from app.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
RESET_TOKEN_EXPIRE_MINUTES = settings.RESET_TOKEN_EXPIRE_MINUTES


def get_password_hash(password: str) -> str:
    """
    Mengubah password jadi hash.
    Flow: Input -> SHA256 (64 chars) -> Bcrypt -> Hash String
    """
    # 1. SHA256 Pre-hashing (Agar panjang selalu 64 karakter, aman dari limit 72 bytes)
    sha_password = hashlib.sha256(password.encode("utf-8")).hexdigest()

    # 2. Bcrypt Hashing
    # bcrypt butuh input dalam bentuk BYTES, bukan string
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(sha_password.encode("utf-8"), salt)

    # Kembalikan sebagai string agar bisa disimpan di Postgres
    return hashed_bytes.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifikasi password saat login.
    """
    # 1. Hash inputan user dengan SHA256 dulu
    sha_password = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()

    # 2. Cek dengan bcrypt
    # Pastikan keduanya dalam bentuk bytes
    return bcrypt.checkpw(
        sha_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ---------------------------------------------------------------------------
# Password Reset Token
# ---------------------------------------------------------------------------
def generate_reset_token() -> tuple[str, str]:
    """Generate a reset token and its SHA-256 hash. Returns (token, hash)."""
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token, token_hash


def hash_reset_token(token: str) -> str:
    """Hash a reset token with SHA-256."""
    return hashlib.sha256(token.encode()).hexdigest()


def verify_reset_token(token: str, stored_hash: str) -> bool:
    """Timing-safe verification of reset token against stored hash."""
    if not token or not stored_hash:
        return False
    return hmac.compare_digest(hash_reset_token(token), stored_hash)


def get_reset_token_expiry() -> datetime:
    """Return the expiry datetime for a reset token."""
    return datetime.now(UTC) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
