import asyncio
from prisma import Prisma
from app.utils.security import get_password_hash

async def create_super_admin():
    db = Prisma()
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