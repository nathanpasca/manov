"""Smoke tests for the novels router."""

import pytest

from app.models import Genre, Novel


@pytest.mark.anyio
async def test_get_all_novels(client, db_session):
    """GET /api/novels should return a list of novels."""
    novel = Novel(
        title="Test Novel",
        slug="test-novel",
        originalTitle="Original Title",
        status="ONGOING",
    )
    db_session.add(novel)
    await db_session.commit()

    response = await client.get("/api/novels")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["title"] == "Test Novel"


@pytest.mark.anyio
async def test_get_novel_detail(client, db_session):
    """GET /api/novels/{slug} should return novel details."""
    novel = Novel(
        title="Test Novel",
        slug="test-novel",
        originalTitle="Original Title",
        status="ONGOING",
    )
    db_session.add(novel)
    await db_session.commit()

    response = await client.get("/api/novels/test-novel")

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "test-novel"
    assert data["title"] == "Test Novel"


@pytest.mark.anyio
async def test_get_novel_detail_not_found(client):
    """GET /api/novels/{slug} for a non-existent novel should return 404."""
    response = await client.get("/api/novels/nonexistent")

    assert response.status_code == 404
    assert "Novel not found" in response.json()["detail"]


@pytest.mark.anyio
async def test_get_genres(client, db_session):
    """GET /api/genres should return a list of genres."""
    genre = Genre(name="Fantasy")
    db_session.add(genre)
    await db_session.commit()

    response = await client.get("/api/genres")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["name"] == "Fantasy"


@pytest.mark.anyio
async def test_get_chapter_content(client, db_session):
    """GET /api/novels/{slug}/chapters/{chapter_num} should return chapter content."""
    from app.models import Chapter, ChapterTranslation, Novel

    novel = Novel(
        title="Test Novel",
        slug="test-novel",
        originalTitle="Original",
        status="ONGOING",
    )
    db_session.add(novel)
    await db_session.commit()
    await db_session.refresh(novel)

    chapter = Chapter(novelId=novel.id, chapterNum=1, rawContent="raw")
    db_session.add(chapter)
    await db_session.commit()
    await db_session.refresh(chapter)

    translation = ChapterTranslation(
        chapterId=chapter.id,
        language="EN",
        title="Chapter 1",
        content="Translated content here.",
    )
    db_session.add(translation)
    await db_session.commit()

    response = await client.get("/api/novels/test-novel/chapters/1")

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Chapter 1"
    assert data["content"] == "Translated content here."
    assert data["chapterNum"] == 1


@pytest.mark.anyio
async def test_get_chapter_content_not_found(client):
    """GET for a non-existent chapter should return 404."""
    response = await client.get("/api/novels/nonexistent/chapters/999")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_get_chapter_content_with_auth_creates_history(client, db_session):
    """Authenticated request to chapter should create a history entry."""
    from app.models import Chapter, ChapterTranslation, History, Novel, User
    from app.utils.security import create_access_token, get_password_hash

    user = User(
        username="reader",
        email="reader@example.com",
        password=get_password_hash("secret123"),
        role="USER",
        coins=100,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    novel = Novel(
        title="Test Novel",
        slug="test-novel",
        originalTitle="Original",
        status="ONGOING",
    )
    db_session.add(novel)
    await db_session.commit()
    await db_session.refresh(novel)

    chapter = Chapter(novelId=novel.id, chapterNum=1, rawContent="raw")
    db_session.add(chapter)
    await db_session.commit()
    await db_session.refresh(chapter)

    translation = ChapterTranslation(
        chapterId=chapter.id,
        language="EN",
        title="Chapter 1",
        content="Content.",
    )
    db_session.add(translation)
    await db_session.commit()

    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    response = await client.get(
        "/api/novels/test-novel/chapters/1",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    # Verify history was created
    from sqlmodel import select as sm_select
    history = await db_session.scalar(
        sm_select(History).where(History.userId == user.id, History.novelId == novel.id)
    )
    assert history is not None
    assert history.chapterNum == 1
