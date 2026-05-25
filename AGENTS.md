# Manov — Agent Guide

## Project Overview

Manov is a web novel reader & translation platform. It consists of:

- **`manov-backend/`** — FastAPI backend with async SQLModel + Alembic + PostgreSQL
- **`manov-frontend/`** — React/Vite frontend

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | FastAPI (async) |
| ORM | SQLModel (SQLAlchemy 2.x + Pydantic) |
| Migrations | Alembic (async template) |
| Database | PostgreSQL (via `asyncpg`) |
| Frontend | React + Vite |
| Package Manager (backend) | `uv` |

## Directory Structure

```
manov-backend/
  app/
    models.py          # SQLModel table definitions
    database.py        # Async engine + session dependency
    crud.py            # Reusable async CRUD helpers
    main.py            # FastAPI app factory / lifespan
    config.py          # Pydantic-settings config
    routers/           # API route modules
    services/          # Business logic (scraping, translation)
    utils/             # Shared utilities (security, deps, slug)
  tests/               # pytest + async SQLite test DB
  alembic/             # Alembic migration environment
  pyproject.toml       # Dependencies + tool configs
  Dockerfile

manov-frontend/
  src/
  public/
  index.html
  vite.config.ts
```

## Backend Conventions

### Database & Models
- All models live in `app/models.py`.
- Use **camelCase field names** on models to match existing API contracts (e.g., `createdAt`, `chapterNum`).
- Foreign keys use `ondelete="CASCADE"` where Prisma previously had `onDelete: Cascade`.
- Many-to-many relations use an explicit `Link` table with `Relationship(link_model=...)`.

### Async Session Pattern
```python
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session

@router.get("/")
async def handler(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Model).where(...))
    return result.scalars().all()
```

### CRUD Helpers
- Reusable queries live in `app/crud.py`.
- Keep routers thin: routers call `crud` functions, handle HTTP concerns, and return schemas.

### Testing
- Tests use a real **in-memory async SQLite** database (`aiosqlite`).
- The `client` fixture in `tests/conftest.py` overrides `get_session` to inject the test DB.
- No mocking of the database layer — tests exercise real SQLModel logic.

## Common Commands

### Backend
```bash
cd manov-backend

# Install dependencies
uv sync

# Run tests
uv run pytest tests/ -v

# Lint
uv run ruff check app/ tests/
uv run ruff check app/ tests/ --fix

# Run migrations
alembic revision --autogenerate -m "description"
alembic upgrade head

# Run dev server
uv run uvicorn app.main:app --reload

# Create admin user
uv run python create_admin.py
```

### Frontend
```bash
cd manov-frontend
npm install
npm run dev
npm run build
```

## Environment Variables

Copy `manov-backend/.env.example` to `.env` and fill in:

- `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/manov_db`)
- `SECRET_KEY` — JWT signing key
- `DOCS_USERNAME` / `DOCS_PASSWORD` — Basic auth for `/docs`
- `FRONTEND_URL` — CORS + sitemap base URL

## Docker

The backend Dockerfile runs Alembic migrations before starting Uvicorn:
```dockerfile
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```
