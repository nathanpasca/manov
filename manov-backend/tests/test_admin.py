"""Tests for admin router including CORS, novel deletion, and composite agent endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlmodel import select

from app.main import app
from app.models import Chapter, ChapterTranslation, Genre, Novel, NovelGenreLink
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


class TestCompositeAgentEndpoints:
    """Tests for the composite agent endpoints: novel+chapters creation, bulk chapters, and translation update."""

    async def test_create_novel_with_chapters(self, admin_client, db_session):
        """POST /admin/novels/with-chapters should create a novel and its chapters."""
        payload = {
            "title": "Agent Novel",
            "originalTitle": "Original Agent Novel",
            "author": "Agent Author",
            "coverUrl": "https://example.com/cover.jpg",
            "synopsis": "A novel created by an agent.",
            "status": "ONGOING",
            "chapters": [
                {"chapterNum": 1, "title": "Chapter 1", "content": "Content of chapter 1."},
                {"chapterNum": 2, "title": "Chapter 2", "content": "Content of chapter 2."},
            ],
        }

        response = await admin_client.post("/api/admin/novels/with-chapters", json=payload)
        assert response.status_code == 200

        data = response.json()
        assert data["novelId"] is not None
        assert data["slug"] == "agent-novel"
        assert data["chaptersCreated"] == 2
        assert len(data["translationIds"]) == 2

        # Verify chapters were created with rawTitle and rawContent
        result = await db_session.execute(
            select(Chapter).where(Chapter.novelId == data["novelId"])
        )
        chapters = result.scalars().all()
        assert len(chapters) == 2
        for ch in chapters:
            assert ch.rawTitle is not None
            assert ch.rawContent is not None

    async def test_bulk_add_chapters(self, admin_client, db_session):
        """POST /admin/novels/{id}/chapters/bulk should add multiple chapters."""
        novel = Novel(
            slug="bulk-novel",
            title="Bulk Novel",
            originalTitle="Original Bulk Novel",
            author="Author",
        )
        db_session.add(novel)
        await db_session.commit()
        await db_session.refresh(novel)

        payload = {
            "chapters": [
                {"chapterNum": 1, "title": "Bulk Ch 1", "content": "Bulk content 1."},
                {"chapterNum": 2, "title": "Bulk Ch 2", "content": "Bulk content 2."},
            ]
        }

        response = await admin_client.post(f"/api/admin/novels/{novel.id}/chapters/bulk", json=payload)
        assert response.status_code == 200

        data = response.json()
        assert data["novelId"] == novel.id
        assert data["chaptersAdded"] == 2
        assert len(data["translationIds"]) == 2

        # Verify raw fields
        result = await db_session.execute(
            select(Chapter).where(Chapter.novelId == novel.id)
        )
        chapters = result.scalars().all()
        assert len(chapters) == 2
        for ch in chapters:
            assert ch.rawTitle is not None
            assert ch.rawContent is not None

    async def test_bulk_add_chapters_conflict(self, admin_client, db_session):
        """POST /admin/novels/{id}/chapters/bulk should return 409 if a chapter number already exists."""
        novel = Novel(
            slug="conflict-novel",
            title="Conflict Novel",
            originalTitle="Original Conflict Novel",
            author="Author",
        )
        db_session.add(novel)
        await db_session.commit()
        await db_session.refresh(novel)

        # Pre-create chapter 1
        chapter = Chapter(novelId=novel.id, chapterNum=1, rawTitle="Existing", rawContent="Existing content.")
        db_session.add(chapter)
        await db_session.commit()
        await db_session.refresh(chapter)

        payload = {
            "chapters": [
                {"chapterNum": 1, "title": "New Ch 1", "content": "New content 1."},
            ]
        }

        response = await admin_client.post(f"/api/admin/novels/{novel.id}/chapters/bulk", json=payload)
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    async def test_update_chapter_translation_content(self, admin_client, db_session):
        """PUT /admin/chapters/{translation_id}/content should update a translation."""
        novel = Novel(
            slug="update-novel",
            title="Update Novel",
            originalTitle="Original Update Novel",
            author="Author",
        )
        db_session.add(novel)
        await db_session.commit()
        await db_session.refresh(novel)

        chapter = Chapter(
            novelId=novel.id,
            chapterNum=1,
            rawTitle="Old Title",
            rawContent="Old content.",
        )
        db_session.add(chapter)
        await db_session.commit()
        await db_session.refresh(chapter)

        translation = ChapterTranslation(
            chapterId=chapter.id,
            language="EN",
            title="Old Title",
            content="Old content.",
        )
        db_session.add(translation)
        await db_session.commit()
        await db_session.refresh(translation)

        payload = {"title": "Updated Title", "content": "Updated content."}
        response = await admin_client.put(f"/api/admin/chapters/{translation.id}/content", json=payload)
        assert response.status_code == 200

        data = response.json()
        assert data["message"] == "Chapter updated"
        assert data["translationId"] == translation.id

        # Verify DB state (refresh cached object to force re-read from DB)
        await db_session.refresh(translation)
        assert translation.title == "Updated Title"
        assert translation.content == "Updated content."
