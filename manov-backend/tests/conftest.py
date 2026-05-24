"""Shared pytest fixtures."""

import os
from unittest.mock import AsyncMock, MagicMock

# Set dummy env vars before importing the app (which loads Settings eagerly)
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest")

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def mock_db():
    """Return a mock Prisma client with async action stubs."""
    db = MagicMock()

    # Helper to make nested attribute access return async mocks
    def _make_async_mock(*args, **kwargs):
        return AsyncMock(*args, **kwargs)

    # Common Prisma actions used in the app
    db.user.find_unique = AsyncMock()
    db.user.create = AsyncMock()
    db.user.find_first = AsyncMock()

    db.novel.find_many = AsyncMock()
    db.novel.find_unique = AsyncMock()
    db.novel.create = AsyncMock()
    db.novel.delete = AsyncMock()
    db.novel.update = AsyncMock()

    db.chapter.find_unique = AsyncMock()
    db.chapter.find_first = AsyncMock()
    db.chapter.create = AsyncMock()
    db.chapter.delete = AsyncMock()
    db.chapter.delete_many = AsyncMock()

    db.chaptertranslation.find_first = AsyncMock()
    db.chaptertranslation.create = AsyncMock()
    db.chaptertranslation.update = AsyncMock()

    db.genre.find_many = AsyncMock()
    db.genre.create = AsyncMock()
    db.genre.delete = AsyncMock()

    db.rating.find_many = AsyncMock()
    db.rating.upsert = AsyncMock()
    db.rating.find_unique = AsyncMock()

    db.comment.find_many = AsyncMock()
    db.comment.find_unique = AsyncMock()
    db.comment.create = AsyncMock()
    db.comment.delete = AsyncMock()

    db.library.find_many = AsyncMock()
    db.library.find_unique = AsyncMock()
    db.library.create = AsyncMock()
    db.library.delete_many = AsyncMock()

    db.history.find_many = AsyncMock()
    db.history.upsert = AsyncMock()

    return db


@pytest.fixture
async def client():
    """Yield an async HTTP client for the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
