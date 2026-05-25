import asyncio

from app.config import settings
from app.database import AsyncSessionLocal
from app.models import User
from app.utils.security import get_password_hash


async def create_super_admin():
    # Debug: Print URL to confirm (masked)
    url = settings.DATABASE_URL
    if url:
        print(f"DEBUG: Using DATABASE_URL: {url.replace('password123', '****')}")

    async with AsyncSessionLocal() as session:
        print("--- 👑 CREATING SUPER ADMIN ---")

        username = input("Username: ")
        email = input("Email: ")
        password = input("Password: ")

        # Cek apakah email sudah ada
        from sqlmodel import select

        result = await session.execute(select(User).where(User.email == email))
        exists = result.scalar_one_or_none()
        if exists:
            print("❌ Email sudah terdaftar!")
            return

        # Hash Password
        hashed_pwd = get_password_hash(password)

        # Create User dengan Role ADMIN
        user = User(
            username=username,
            email=email,
            password=hashed_pwd,
            role="ADMIN",
            coins=999999,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        print(f"✅ Sukses! Admin {user.username} telah dibuat.")
        print("Sekarang kamu bisa login dan mendapatkan token untuk akses dashboard.")


if __name__ == "__main__":
    asyncio.run(create_super_admin())
