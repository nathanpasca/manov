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
