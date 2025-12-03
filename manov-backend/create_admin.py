import asyncio
from prisma import Prisma
from app.utils.security import get_password_hash
from dotenv import load_dotenv

load_dotenv(override=True)

import os

async def create_super_admin():
    # Debug: Print URL to confirm (masked)
    url = os.environ.get("DATABASE_URL")
    if url:
        print(f"DEBUG: Using DATABASE_URL: {url.replace('password123', '****')}")
    
    # Pass URL explicitly to avoid any env var ambiguity in the subprocess
    db = Prisma(datasource={'url': url})
    await db.connect()

    print("--- 👑 CREATING SUPER ADMIN ---")
    
    username = input("Username: ")
    email = input("Email: ")
    password = input("Password: ")

    # Cek apakah email sudah ada
    exists = await db.user.find_unique(where={'email': email})
    if exists:
        print("❌ Email sudah terdaftar!")
        await db.disconnect()
        return

    # Hash Password
    hashed_pwd = get_password_hash(password)

    # Create User dengan Role ADMIN
    user = await db.user.create(data={
        'username': username,
        'email': email,
        'password': hashed_pwd,
        'role': 'ADMIN', # <--- Kuncinya disini
        'coins': 999999  # Admin kita kasih koin unlimited buat testing
    })

    print(f"✅ Sukses! Admin {user.username} telah dibuat.")
    print("Sekarang kamu bisa login dan mendapatkan token untuk akses dashboard.")

    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(create_super_admin())