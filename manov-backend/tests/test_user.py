"""Tests for the user router (library & history)."""

import pytest

from app.models import History, Novel, User
from app.utils.security import create_access_token, get_password_hash


async def _create_user(db_session, email="test@example.com"):
    user = User(
        username="testuser",
        email=email,
        password=get_password_hash("secret123"),
        role="USER",
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


@pytest.mark.anyio
async def test_get_empty_library(client, db_session):
    user = await _create_user(db_session)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    response = await client.get(
        "/api/user/library",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.anyio
async def test_add_and_remove_library(client, db_session):
    user = await _create_user(db_session)
    novel = await _create_novel(db_session)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    # Add to library
    add_res = await client.post(
        f"/api/user/library/{novel.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert add_res.status_code == 200
    assert "Added" in add_res.json()["message"]

    # Check library
    lib_res = await client.get(
        "/api/user/library",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert lib_res.status_code == 200
    data = lib_res.json()
    assert len(data) == 1
    assert data[0]["id"] == novel.id

    # Check status
    status_res = await client.get(
        f"/api/user/library/check/{novel.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert status_res.json()["isBookmarked"] is True

    # Remove from library
    del_res = await client.delete(
        f"/api/user/library/{novel.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert del_res.status_code == 200

    # Verify empty
    lib_res2 = await client.get(
        "/api/user/library",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert lib_res2.json() == []


@pytest.mark.anyio
async def test_add_duplicate_library(client, db_session):
    user = await _create_user(db_session)
    novel = await _create_novel(db_session)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    await client.post(
        f"/api/user/library/{novel.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    dup_res = await client.post(
        f"/api/user/library/{novel.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert dup_res.status_code == 200
    assert "Already" in dup_res.json()["message"]


@pytest.mark.anyio
async def test_get_history(client, db_session):
    user = await _create_user(db_session)
    novel = await _create_novel(db_session)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    # Manually create a history entry
    history = History(userId=user.id, novelId=novel.id, chapterNum=5)
    db_session.add(history)
    await db_session.commit()

    response = await client.get(
        "/api/user/history",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["lastReadChapter"] == 5
    assert data[0]["id"] == novel.id
