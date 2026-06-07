"""Tests for the social router (ratings & comments)."""

import pytest

from app.models import Chapter, Novel, User
from app.utils.security import create_access_token, get_password_hash


async def _create_user(db_session, email="test@example.com", role="USER"):
    user = User(
        username="testuser",
        email=email,
        password=get_password_hash("secret123"),
        role=role,
        coins=100,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


async def _create_novel(db_session, title="Test Novel", slug="test-novel"):
    novel = Novel(
        title=title,
        slug=slug,
        originalTitle="Original",
        status="ONGOING",
    )
    db_session.add(novel)
    await db_session.commit()
    await db_session.refresh(novel)
    return novel


async def _create_chapter(db_session, novel_id, chapter_num=1):
    chapter = Chapter(
        novelId=novel_id,
        chapterNum=chapter_num,
        rawContent="Raw content",
    )
    db_session.add(chapter)
    await db_session.commit()
    await db_session.refresh(chapter)
    return chapter


@pytest.mark.anyio
async def test_rate_novel_is_disabled(client, db_session):
    """Quick star ratings without a review are no longer accepted."""
    user = await _create_user(db_session)
    novel = await _create_novel(db_session)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    response = await client.post(
        f"/api/novels/{novel.id}/rate",
        json={"score": 5},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    data = response.json()
    assert "disabled" in data["detail"].lower() or "review" in data["detail"].lower()


@pytest.mark.anyio
async def test_multiple_reviews_combine_stats(client, db_session):
    """Multiple written reviews should combine into a single aggregate rating."""
    user1 = await _create_user(db_session, email="user1@example.com")
    user2 = await _create_user(db_session, email="user2@example.com")
    novel = await _create_novel(db_session)
    token1 = create_access_token(data={"sub": str(user1.id), "role": user1.role})
    token2 = create_access_token(data={"sub": str(user2.id), "role": user2.role})

    await client.post(
        f"/api/novels/{novel.id}/reviews",
        json={"score": 3, "content": "It was okay"},
        headers={"Authorization": f"Bearer {token1}"},
    )
    response = await client.post(
        f"/api/novels/{novel.id}/reviews",
        json={"score": 5, "content": "Loved it!"},
        headers={"Authorization": f"Bearer {token2}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["average"] == 4.0  # (3 + 5) / 2
    assert data["count"] == 2


@pytest.mark.anyio
async def test_review_returned_in_library_status(client, db_session):
    """check_library_status should return the user's review score."""
    user = await _create_user(db_session)
    novel = await _create_novel(db_session)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    await client.post(
        f"/api/novels/{novel.id}/reviews",
        json={"score": 4, "content": "Better on reflection"},
        headers={"Authorization": f"Bearer {token}"},
    )

    response = await client.get(
        f"/api/user/library/check/{novel.id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["userRating"] == 4


@pytest.mark.anyio
async def test_combined_stats_review_overrides_legacy_rating(client, db_session):
    """If a legacy Rating row exists for a user, their Review score takes precedence."""
    from app.crud import upsert_rating

    user = await _create_user(db_session)
    novel = await _create_novel(db_session)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    # Simulate a pre-existing legacy quick rating (no longer creatable via API)
    await upsert_rating(db_session, user.id, novel.id, 1)

    response = await client.post(
        f"/api/novels/{novel.id}/reviews",
        json={"score": 5, "content": "Changed my mind"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    # Only one user, using the review score; legacy rating is overridden
    assert data["average"] == 5.0
    assert data["count"] == 1


@pytest.mark.anyio
async def test_post_novel_comment(client, db_session):
    user = await _create_user(db_session)
    novel = await _create_novel(db_session)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    response = await client.post(
        f"/api/novels/{novel.id}/comments",
        json={"content": "Great novel!"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Great novel!"
    assert data["username"] == "testuser"


@pytest.mark.anyio
async def test_post_chapter_comment(client, db_session):
    user = await _create_user(db_session)
    novel = await _create_novel(db_session)
    chapter = await _create_chapter(db_session, novel.id)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    response = await client.post(
        f"/api/chapters/{chapter.id}/comments",
        json={"content": "Amazing chapter!"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Amazing chapter!"


@pytest.mark.anyio
async def test_delete_own_comment(client, db_session):
    user = await _create_user(db_session)
    novel = await _create_novel(db_session)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    # Post a comment
    post_res = await client.post(
        f"/api/novels/{novel.id}/comments",
        json={"content": "To be deleted"},
        headers={"Authorization": f"Bearer {token}"},
    )
    comment_id = post_res.json()["id"]

    # Delete it
    del_res = await client.delete(
        f"/api/comments/{comment_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert del_res.status_code == 200


@pytest.mark.anyio
async def test_delete_comment_unauthorized(client, db_session):
    user1 = await _create_user(db_session, email="user1@example.com")
    user2 = await _create_user(db_session, email="user2@example.com")
    novel = await _create_novel(db_session)
    token1 = create_access_token(data={"sub": str(user1.id), "role": user1.role})
    token2 = create_access_token(data={"sub": str(user2.id), "role": user2.role})

    post_res = await client.post(
        f"/api/novels/{novel.id}/comments",
        json={"content": "Not yours"},
        headers={"Authorization": f"Bearer {token1}"},
    )
    comment_id = post_res.json()["id"]

    del_res = await client.delete(
        f"/api/comments/{comment_id}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert del_res.status_code == 403


@pytest.mark.anyio
async def test_comment_sanitization(client, db_session):
    user = await _create_user(db_session)
    novel = await _create_novel(db_session)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    response = await client.post(
        f"/api/novels/{novel.id}/comments",
        json={"content": "<script>alert('xss')</script>Hello"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "<script>" not in data["content"]
    assert "Hello" in data["content"]
