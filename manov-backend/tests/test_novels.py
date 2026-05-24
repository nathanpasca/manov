"""Smoke tests for the novels router."""

from unittest.mock import patch

import pytest


@pytest.mark.anyio
async def test_get_all_novels(client, mock_db):
    """GET /api/novels should return a list of novels."""
    from unittest.mock import MagicMock

    mock_novel = MagicMock()
    mock_novel.id = 1
    mock_novel.title = "Test Novel"
    mock_novel.slug = "test-novel"
    mock_novel.coverUrl = None
    mock_novel.status = "ONGOING"
    mock_novel.author = None
    mock_novel.genres = []
    mock_novel.chapters = []
    mock_novel.synopsis = None
    mock_novel.averageRating = 0.0
    mock_novel.ratingCount = 0
    mock_novel.dict.return_value = {
        "id": 1,
        "title": "Test Novel",
        "slug": "test-novel",
        "coverUrl": None,
        "status": "ONGOING",
        "author": None,
        "genres": [],
        "chapters": [],
        "synopsis": None,
        "averageRating": 0.0,
        "ratingCount": 0,
    }

    mock_db.novel.find_many.return_value = [mock_novel]

    with patch("app.routers.novels.db", mock_db):
        response = await client.get("/api/novels")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["title"] == "Test Novel"


@pytest.mark.anyio
async def test_get_novel_detail(client, mock_db):
    """GET /api/novels/{slug} should return novel details."""
    mock_novel = mock_db.novel.find_unique.return_value
    mock_novel.id = 1
    mock_novel.title = "Test Novel"
    mock_novel.slug = "test-novel"
    mock_novel.originalTitle = "Original Title"
    mock_novel.coverUrl = None
    mock_novel.status = "ONGOING"
    mock_novel.author = None
    mock_novel.genres = []
    mock_novel.chapters = []
    mock_novel.synopsis = None
    mock_novel.averageRating = 0.0
    mock_novel.ratingCount = 0
    mock_novel.updatedAt = None

    with patch("app.routers.novels.db", mock_db):
        response = await client.get("/api/novels/test-novel")

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "test-novel"
    assert data["title"] == "Test Novel"


@pytest.mark.anyio
async def test_get_novel_detail_not_found(client, mock_db):
    """GET /api/novels/{slug} for a non-existent novel should return 404."""
    mock_db.novel.find_unique.return_value = None

    with patch("app.routers.novels.db", mock_db):
        response = await client.get("/api/novels/nonexistent")

    assert response.status_code == 404
    assert "Novel not found" in response.json()["detail"]


@pytest.mark.anyio
async def test_get_genres(client, mock_db):
    """GET /api/genres should return a list of genres."""
    mock_genre = mock_db.genre.find_many.return_value[0]
    mock_genre.id = 1
    mock_genre.name = "Fantasy"

    mock_db.genre.find_many.return_value = [mock_genre]

    with patch("app.routers.novels.db", mock_db):
        response = await client.get("/api/genres")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["name"] == "Fantasy"
