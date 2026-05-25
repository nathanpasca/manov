# Manov Backend — Agent Guide

## Context

This backend was migrated from **Prisma Client Python** to **SQLModel + Alembic + SQLAlchemy (async)**. All database access is async-only via `AsyncSession`.

## Key Files

| File | Purpose |
|---|---|
| `app/models.py` | SQLModel `table=True` definitions for all entities |
| `app/database.py` | `create_async_engine`, `async_sessionmaker`, `get_session` dependency |
| `app/crud.py` | Reusable async CRUD operations (get/create/update/delete/upsert) |
| `app/main.py` | FastAPI app, lifespan (creates tables on startup), router registration |
| `app/config.py` | `Pydantic BaseSettings` loaded from `.env` |
| `alembic/env.py` | Alembic async migration environment; imports `app.models` for autogenerate |

## Query Patterns

### Read one by PK
```python
novel = await session.get(Novel, novel_id)
```

### Read one by unique field
```python
novel = await session.scalar(select(Novel).where(Novel.slug == slug))
```

### Read many with eager loading
```python
from sqlalchemy.orm import selectinload

result = await session.execute(
    select(Novel)
    .options(selectinload(Novel.genres), selectinload(Novel.chapters))
    .order_by(Novel.updatedAt.desc())
    .offset(skip)
    .limit(limit)
)
novels = result.scalars().all()
```

### Create
```python
novel = Novel(title="...", slug="...")
session.add(novel)
await session.commit()
await session.refresh(novel)
```

### Update
```python
novel = await session.get(Novel, id)
novel.title = "New Title"
await session.commit()
await session.refresh(novel)
```

### Upsert (manual)
```python
obj = await session.scalar(select(Model).where(...))
if obj:
    obj.field = new_value
else:
    obj = Model(...)
    session.add(obj)
await session.commit()
await session.refresh(obj)
```

### Delete
```python
obj = await session.get(Model, id)
if obj:
    await session.delete(obj)
    await session.commit()
```

### Count
```python
from sqlalchemy import func
count = await session.scalar(select(func.count()).select_from(Novel))
```

## Important Rules

1. **Never use `session.exec()`** — that is sync-only. Always use `await session.execute(...)` with `AsyncSession`.
2. **Always `await session.commit()`** after writes, then `await session.refresh(obj)` if you need auto-generated fields.
3. **Use `selectinload`** for eager-loading relationships to avoid N+1 queries.
4. **Pass `session` explicitly** — routers receive it via `Depends(get_session)`; background tasks use `AsyncSessionLocal()` directly.
5. **CamelCase model attributes** — keep `createdAt`, `chapterNum`, etc. to match existing API responses without schema changes.

## Migrations

```bash
# Generate migration from current models
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Current version
alembic current
```

The async Alembic template is used (`alembic init -t async`). `alembic/env.py` imports all models so `SQLModel.metadata` is populated for autogenerate.

## Testing

Tests run against an in-memory `sqlite+aiosqlite:///:memory:` database. The `setup_database` fixture creates/drops tables automatically. Tests should create real model instances via `db_session` and make HTTP calls through the `client` fixture.

## Linting

```bash
uv run ruff check app/ tests/
uv run ruff check app/ tests/ --fix
```
