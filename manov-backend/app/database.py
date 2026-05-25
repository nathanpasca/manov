"""Async SQLAlchemy engine and session dependency."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

# Convert Prisma-style postgresql:// to SQLAlchemy async postgresql+asyncpg://
_database_url = settings.DATABASE_URL
if _database_url.startswith("postgresql://"):
    _database_url = _database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(_database_url, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
