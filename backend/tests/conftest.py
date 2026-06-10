import os
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from httpx import AsyncClient, ASGITransport

# Set env before importing app
os.environ["DISABLE_GROUP_CHECK"] = "true"
os.environ["SECRET_KEY"] = "test_secret_key_32chars_long_ok!"
os.environ["ADMIN_IDS"] = "123456"

from app.core.database import db


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def patch_db():
    """Patch db methods directly on the singleton instance."""
    db._original_pool = db.pool
    db.pool = MagicMock()  # prevent NoneType errors

    db.fetch = AsyncMock(return_value=[])
    db.fetchrow = AsyncMock(return_value=None)
    db.fetchval = AsyncMock(return_value=1)
    db.execute = AsyncMock()
    db.connect = AsyncMock()
    db.disconnect = AsyncMock()

    yield db

    db.pool = db._original_pool


@pytest.fixture
async def client(patch_db):
    """Create test client with mocked lifespan."""
    with patch("app.services.continuous.start", new_callable=AsyncMock), \
         patch("app.services.continuous.stop", new_callable=AsyncMock), \
         patch("app.services.aggregator.aggregation_loop", new_callable=AsyncMock):
        from app.main import app
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
