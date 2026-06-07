"""Tests for admin router including CORS and novel deletion."""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlmodel import select

from app.main import app
from app.models import Genre, Novel, NovelGenreLink
from app.utils.security import create_access_token


@pytest.fixture
async def admin_client():
    """Yield an async HTTP client with admin auth headers."""
    token = create_access_token({"sub": "1", "role": "ADMIN"})
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://test", headers={"Authorization": f"Bearer {token}"}
    ) as ac:
        yield ac


@pytest.fixture
async def novel_with_genre(db_session):
    """Create a novel with an associated genre."""
    novel = Novel(
        slug="test-novel",
        title="Test Novel",
        originalTitle="Original Title",
        author="Test Author",
    )
    db_session.add(novel)
    await db_session.commit()
    await db_session.refresh(novel)

    genre = Genre(name="Fantasy")
    db_session.add(genre)
    await db_session.commit()
    await db_session.refresh(genre)

    link = NovelGenreLink(novel_id=novel.id, genre_id=genre.id)
    db_session.add(link)
    await db_session.commit()

    return novel, genre


class TestAdminCors:
    """Verify CORS headers are present on admin DELETE responses."""

    async def test_cors_preflight_admin_delete(self, admin_client):
        """OPTIONS preflight for admin DELETE should return CORS headers."""
        response = await admin_client.options(
            "/api/admin/novels/1",
            headers={
                "Origin": "https://manov.pascarz.site",
                "Access-Control-Request-Method": "DELETE",
                "Access-Control-Request-Headers": "Authorization, Content-Type",
            },
        )
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
        assert "DELETE" in response.headers["access-control-allow-methods"]

    async def test_cors_headers_on_admin_delete_404(self, admin_client):
        """DELETE for non-existent novel should still have CORS headers."""
        response = await admin_client.delete(
            "/api/admin/novels/99999",
            headers={"Origin": "https://manov.pascarz.site"},
        )
        # 404 because novel doesn't exist; but CORS headers must be present
        assert "access-control-allow-origin" in response.headers


class TestAdminDeleteNovel:
    """Test novel deletion via admin router."""

    async def test_delete_novel_without_genre(self, admin_client, db_session):
        """Deleting a novel without genres should succeed."""
        novel = Novel(
            slug="test-novel-no-genre",
            title="Test Novel No Genre",
            originalTitle="Original",
            author="Author",
        )
        db_session.add(novel)
        await db_session.commit()
        await db_session.refresh(novel)

        response = await admin_client.delete(f"/api/admin/novels/{novel.id}")
        assert response.status_code == 200
        assert response.json()["message"] == "Novel deleted successfully"

    async def test_delete_novel_with_genre(self, admin_client, db_session, novel_with_genre):
        """Deleting a novel WITH genres should succeed (cascade delete link rows)."""
        novel, _ = novel_with_genre

        response = await admin_client.delete(f"/api/admin/novels/{novel.id}")
        # If novelgenrelink lacks ondelete=CASCADE, this will fail in PostgreSQL
        assert response.status_code == 200
        assert response.json()["message"] == "Novel deleted successfully"

        # Verify the link is gone
        result = await db_session.execute(
            select(NovelGenreLink).where(NovelGenreLink.novel_id == novel.id)
        )
        assert result.scalar_one_or_none() is None
