import secrets
import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from prisma import Prisma
from app.routers import novels, admin, auth, user, genres, social, sitemap

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

app = FastAPI(
    lifespan=lifespan, 
    title="Manov API",
    docs_url=None,
    redoc_url=None,
    openapi_url=None
)

# --- SECURITY FOR DOCS ---
security = HTTPBasic()

def get_current_username(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = os.environ.get("DOCS_USERNAME", "admin")
    correct_password = os.environ.get("DOCS_PASSWORD", "password")
    
    current_username_bytes = credentials.username.encode("utf8")
    correct_username_bytes = correct_username.encode("utf8")
    is_correct_username = secrets.compare_digest(
        current_username_bytes, correct_username_bytes
    )
    
    current_password_bytes = credentials.password.encode("utf8")
    correct_password_bytes = correct_password.encode("utf8")
    is_correct_password = secrets.compare_digest(
        current_password_bytes, correct_password_bytes
    )
    
    if not (is_correct_username and is_correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@app.get("/docs", include_in_schema=False)
async def get_swagger_documentation(username: str = Depends(get_current_username)):
    return get_swagger_ui_html(openapi_url="/openapi.json", title="docs")

@app.get("/redoc", include_in_schema=False)
async def get_redoc_documentation(username: str = Depends(get_current_username)):
    return get_redoc_html(openapi_url="/openapi.json", title="docs")

@app.get("/openapi.json", include_in_schema=False)
async def get_open_api_endpoint(username: str = Depends(get_current_username)):
    return get_openapi(title="Manov API", version="0.1.0", routes=app.routes)

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
app.include_router(sitemap.router)
@app.get("/")
def read_root():
    return {"message": "Welcome to Manov API"}