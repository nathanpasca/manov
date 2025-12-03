from fastapi import FastAPI
from prisma import Prisma
from app.routers import novels, admin, auth, user, genres, social

from contextlib import asynccontextmanager


# --- LIFESPAN MANAGER (Cara modern connect DB di FastAPI) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect DB
    db = Prisma()
    await db.connect()
    print("✅ Database Connected")
    yield
    # Shutdown: Disconnect DB
    if db.is_connected():
        await db.disconnect()
        print("❌ Database Disconnected")

app = FastAPI(lifespan=lifespan, title="Manov API")

# --- CORS (PENTING BUAT REACT NANTI) ---
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://manov.nathanpasca.com"], # URL Frontend React nanti
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTER ROUTER ---
# --- REGISTER ROUTER ---
app.include_router(novels.router, prefix="/api", tags=["Novels"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(genres.router, prefix="/api", tags=["Genres"])
app.include_router(social.router, prefix="/api", tags=["Social"])
@app.get("/")
def read_root():
    return {"message": "Welcome to Manov API"}