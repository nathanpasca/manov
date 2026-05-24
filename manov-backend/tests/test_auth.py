"""Smoke tests for the authentication router."""

from unittest.mock import patch

import pytest


@pytest.mark.anyio
async def test_register_success(client, mock_db):
    """Registering a new user should return a token and user info."""
    mock_user = mock_db.user.create.return_value
    mock_user.id = 1
    mock_user.username = "testuser"
    mock_user.email = "test@example.com"
    mock_user.coins = 100
    mock_user.role = "USER"

    mock_db.user.find_unique.return_value = None

    with patch("app.routers.auth.db", mock_db):
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
    mock_db.user.create.assert_awaited_once()


@pytest.mark.anyio
async def test_register_duplicate_email(client, mock_db):
    """Registering with an existing email should return 400."""
    mock_existing = mock_db.user.find_unique.return_value
    mock_existing.email = "test@example.com"

    with patch("app.routers.auth.db", mock_db):
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
async def test_login_success(client, mock_db):
    """Logging in with valid credentials should return a token."""
    mock_user = mock_db.user.find_unique.return_value
    mock_user.id = 1
    mock_user.username = "testuser"
    mock_user.email = "test@example.com"
    mock_user.coins = 100
    mock_user.role = "USER"
    mock_user.password = (
        "$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    )

    with patch("app.routers.auth.db", mock_db), \
         patch("app.routers.auth.verify_password", return_value=True):
        response = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "secret123"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test@example.com"


@pytest.mark.anyio
async def test_login_invalid_credentials(client, mock_db):
    """Logging in with invalid credentials should return 400."""
    mock_db.user.find_unique.return_value = None

    with patch("app.routers.auth.db", mock_db):
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
