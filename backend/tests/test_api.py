"""Tests for Sphera Radio API endpoints."""
import pytest
from unittest.mock import AsyncMock, patch

from app.core.database import db
from app.core.dependencies import create_access_token


pytestmark = pytest.mark.asyncio


# ─── Health & Root ───────────────────────────────────────────────────────────

async def test_api_root(client):
    resp = await client.get("/api")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


async def test_health(client, patch_db):
    db.fetchval = AsyncMock(return_value=1)
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


async def test_health_unhealthy(client, patch_db):
    db.fetchval = AsyncMock(side_effect=Exception("connection refused"))
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "unhealthy"


# ─── Auth ────────────────────────────────────────────────────────────────────

async def test_auth_telegram_new_user(client, patch_db):
    user_data = {"id": 1, "telegram_id": 111, "role": "slusatel", "points": 50, "city": None}
    db.fetchrow = AsyncMock(side_effect=[None, user_data])

    resp = await client.post("/auth/telegram", json={
        "telegram_id": 111,
        "username": "testuser",
        "full_name": "Test User",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["role"] == "slusatel"
    assert data["points"] == 50


async def test_auth_telegram_existing_user(client, patch_db):
    existing = {"id": 1, "telegram_id": 222, "role": "aktivniy", "points": 100, "city": "vilnius"}
    db.fetchrow = AsyncMock(side_effect=[existing, existing])

    resp = await client.post("/auth/telegram", json={
        "telegram_id": 222,
        "username": "existing",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "aktivniy"
    assert data["city"] == "vilnius"


# ─── Users ───────────────────────────────────────────────────────────────────

async def test_get_me_unauthorized(client):
    resp = await client.get("/users/me")
    # HTTPBearer returns 403 when no token is provided
    assert resp.status_code in (401, 403)


async def test_get_me(client, patch_db):
    user_row = {"id": 1, "telegram_id": 111, "role": "slusatel", "points": 50,
                "city": "vilnius", "broadcast_lang": "ru", "username": "test", "full_name": "T"}
    db.fetchrow = AsyncMock(side_effect=[user_row, None])  # user lookup, psychotype
    db.execute = AsyncMock()

    token = create_access_token(111)
    resp = await client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["telegram_id"] == 111
    assert data["role"] == "slusatel"


async def test_update_city_invalid(client, patch_db):
    user_row = {"id": 1, "telegram_id": 111, "role": "slusatel", "points": 50,
                "city": None, "broadcast_lang": "ru", "username": "t", "full_name": "T"}
    db.fetchrow = AsyncMock(return_value=user_row)
    db.execute = AsyncMock()

    token = create_access_token(111)
    resp = await client.put("/users/me/city",
                            headers={"Authorization": f"Bearer {token}"},
                            json={"city": "nonexistent_city"})
    assert resp.status_code == 400


async def test_update_language(client, patch_db):
    user_row = {"id": 1, "telegram_id": 111, "role": "slusatel", "points": 50,
                "city": "vilnius", "broadcast_lang": "ru", "username": "t", "full_name": "T"}
    db.fetchrow = AsyncMock(return_value=user_row)
    db.execute = AsyncMock()

    token = create_access_token(111)
    resp = await client.put("/users/me/language",
                            headers={"Authorization": f"Bearer {token}"},
                            json={"language": "lt"})
    assert resp.status_code == 200
    assert resp.json()["ok"] is True


async def test_update_language_invalid(client, patch_db):
    user_row = {"id": 1, "telegram_id": 111, "role": "slusatel", "points": 50,
                "city": "vilnius", "broadcast_lang": "ru", "username": "t", "full_name": "T"}
    db.fetchrow = AsyncMock(return_value=user_row)
    db.execute = AsyncMock()

    token = create_access_token(111)
    resp = await client.put("/users/me/language",
                            headers={"Authorization": f"Bearer {token}"},
                            json={"language": "fr"})
    assert resp.status_code == 400


async def test_update_broadcast_lang(client, patch_db):
    user_row = {"id": 1, "telegram_id": 111, "role": "slusatel", "points": 50,
                "city": "vilnius", "broadcast_lang": "ru", "username": "t", "full_name": "T"}
    db.fetchrow = AsyncMock(return_value=user_row)
    db.execute = AsyncMock()

    token = create_access_token(111)
    resp = await client.put("/users/me/broadcast-lang",
                            headers={"Authorization": f"Bearer {token}"},
                            json={"broadcast_lang": "en"})
    assert resp.status_code == 200


# ─── Radio ───────────────────────────────────────────────────────────────────

async def test_radio_status(client, patch_db):
    """Radio status endpoint - city must be in VALID_CITIES."""
    from app.core.state import VALID_CITIES
    VALID_CITIES.add("vilnius")

    resp = await client.get("/radio/status", params={"city": "vilnius"})
    assert resp.status_code == 200
    data = resp.json()
    assert "is_live" in data


# ─── Token ───────────────────────────────────────────────────────────────────

async def test_invalid_token(client):
    resp = await client.get("/users/me", headers={"Authorization": "Bearer invalidtoken123"})
    assert resp.status_code == 401


# ─── Dependencies ────────────────────────────────────────────────────────────

def test_create_and_decode_token():
    from app.core.dependencies import create_access_token, decode_token
    token = create_access_token(999)
    assert decode_token(token) == 999


def test_decode_invalid_token():
    from app.core.dependencies import decode_token
    from fastapi import HTTPException
    with pytest.raises(HTTPException):
        decode_token("garbage.token.here")
