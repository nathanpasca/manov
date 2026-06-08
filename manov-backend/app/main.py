import secrets
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from fastapi_mcp import FastApiMCP

from app.config import settings
from app.database import engine
from app.middleware.rate_limit import limiter
from app.routers import admin, admin_api_keys, auth, genres, novels, sitemap, social, user


# --- LIFESPAN MANAGER ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("✅ Manov API started")
    yield
    await engine.dispose()
    print("❌ Database engine disposed")


app = FastAPI(
    lifespan=lifespan,
    title="Manov API",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

# --- RATE LIMITING ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# --- SECURITY FOR DOCS ---
security = HTTPBasic()


def get_current_username(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = settings.DOCS_USERNAME
    correct_password = settings.DOCS_PASSWORD

    current_username_bytes = credentials.username.encode("utf8")
    correct_username_bytes = correct_username.encode("utf8")
    is_correct_username = secrets.compare_digest(current_username_bytes, correct_username_bytes)

    current_password_bytes = credentials.password.encode("utf8")
    correct_password_bytes = correct_password.encode("utf8")
    is_correct_password = secrets.compare_digest(current_password_bytes, correct_password_bytes)

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


# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTER ROUTER ---
app.include_router(novels.router, prefix="/api", tags=["Novels"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(admin_api_keys.router, prefix="/api/admin", tags=["Admin API Keys"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(genres.router, prefix="/api", tags=["Genres"])
app.include_router(social.router, prefix="/api", tags=["Social"])
app.include_router(sitemap.router)

# --- MCP SERVER ---
mcp = FastApiMCP(
    app,
    name="manov-admin",
    description="MCP tools for managing novels and chapters in Manov.",
)
mcp.mount_http()


@app.get("/")
def read_root():
    return {"message": "Welcome to Manov API"}
