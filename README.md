# Manov

A web novel reader & AI translation platform. Browse, read, and manage translated novels with an immersive reading experience.

## Features

- **Novel Directory** — Browse novels with cover art, genres, ratings, and chapter counts
- **Immersive Reader** — Customizable font size, theme (light/sepia/dark), and font family with smart text parsing
- **User Library** — Bookmark novels and track reading history
- **Social** — Rate novels and comment on chapters
- **Admin Dashboard** — Scrape novels, manage chapters, edit translations, and trigger AI translation pipelines
- **SEO-Ready** — JSON-LD structured data, Open Graph tags, sitemap generation

## Architecture

```
manov/
├── manov-backend/   FastAPI + SQLModel + Alembic + PostgreSQL
└── manov-frontend/  React + Vite + Tailwind CSS
```

| Layer | Technology |
|---|---|
| Backend | FastAPI (async) |
| ORM | SQLModel (SQLAlchemy 2.x + Pydantic) |
| Migrations | Alembic (async) |
| Database | PostgreSQL (via `asyncpg`) |
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Package Manager (backend) | `uv` |

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 15+ (or Docker)

### 1. Clone & setup backend

```bash
cd manov-backend

# Copy environment variables
cp .env.example .env
# Edit .env and set DATABASE_URL, SECRET_KEY, etc.

# Install dependencies
uv sync

# Run migrations
uv run alembic upgrade head

# Start dev server
uv run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### 2. Setup frontend

```bash
cd manov-frontend

# Copy environment variables
cp .env.example .env
# Edit .env and set VITE_API_URL, VITE_FRONTEND_URL

npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 3. Create an admin user

```bash
cd manov-backend
uv run python create_admin.py
```

## Environment Variables

### Backend (`manov-backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (`postgresql+asyncpg://user:pass@host:port/db`) |
| `SECRET_KEY` | JWT signing key |
| `DOCS_USERNAME` | Basic auth username for `/docs` |
| `DOCS_PASSWORD` | Basic auth password for `/docs` |
| `FRONTEND_URL` | CORS origin + sitemap base URL |

### Frontend (`manov-frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_FRONTEND_URL` | Canonical frontend URL (SEO / JSON-LD) |

## Docker

```bash
docker-compose up -d
```

This starts PostgreSQL and the backend. Migrations run automatically before Uvicorn starts.

## Testing

```bash
cd manov-backend
uv run pytest tests/ -v
uv run ruff check app/ tests/
```

## Deployment

### Dokploy

1. Connect your GitHub repo
2. Set environment variables in the Dokploy dashboard
3. The Dockerfile handles migrations automatically via `CMD`
4. Create an admin user by exec'ing into the running container:
   ```bash
   docker exec -it <container> python create_admin.py
   ```

## API Documentation

Protected by Basic Auth (set via `DOCS_USERNAME` / `DOCS_PASSWORD`):

- Swagger UI: `/docs`
- ReDoc: `/redoc`

## License

MIT
