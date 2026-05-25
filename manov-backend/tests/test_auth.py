"""Smoke tests for the authentication router."""

import pytest

from app.models import User
from app.utils.security import get_password_hash


@pytest.mark.anyio
async def test_register_success(client):
    """Registering a new user should return a token and user info."""
    response = await client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "secret123",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["role"] == "USER"


@pytest.mark.anyio
async def test_register_duplicate_email(client, db_session):
    """Registering with an existing email should return 400."""
    existing = User(
        username="existing",
        email="test@example.com",
        password=get_password_hash("secret123"),
        role="USER",
        coins=100,
    )
    db_session.add(existing)
    await db_session.commit()

    response = await client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "secret123",
        },
    )

    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


@pytest.mark.anyio
async def test_login_success(client, db_session):
    """Logging in with valid credentials should return a token."""
    user = User(
        username="testuser",
        email="test@example.com",
        password=get_password_hash("secret123"),
        role="USER",
        coins=100,
    )
    db_session.add(user)
    await db_session.commit()

    response = await client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "secret123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test@example.com"


@pytest.mark.anyio
async def test_login_invalid_credentials(client):
    """Logging in with invalid credentials should return 400."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "wrong@example.com", "password": "secret123"},
    )

    assert response.status_code == 400
    assert "Incorrect" in response.json()["detail"]


@pytest.mark.anyio
async def test_protected_route_without_token(client):
    """Accessing a protected route without a token should return 401."""
    response = await client.get("/api/user/library")
    assert response.status_code == 401
