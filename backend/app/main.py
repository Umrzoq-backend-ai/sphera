"""INTRA GROUP — Production-grade API entry point (v3.0).

Yangi TZ:
- Til tanlash (RU/EN/LT) → Yangilik → Platforma
- Kasr point tizimi (0.001 per text, 0.005 per voice)
- Level tizimi (1-3)
- Point transfer/request/purchase
"""

import os
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.database import db
from app.core import redis as redis_client
from app.api.routers import auth, users, chat, admin, news

setup_logging(debug=settings.debug)
log = logging.getLogger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle."""
    log.info("Starting %s v%s", settings.app_name, settings.app_version)

    # 1. Database (retry bilan)
    await db.connect()

    # 2. Redis (graceful fallback)
    await redis_client.connect()

    log.info("Application started successfully")
    yield

    # Shutdown
    log.info("Shutting down...")
    await redis_client.disconnect()
    await db.disconnect()
    log.info("Shutdown complete")


app = FastAPI(
    title="INTRA GROUP API",
    version="3.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(chat.router)
app.include_router(news.router)
app.include_router(admin.router)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error("Unhandled: %s %s — %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# Health
@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/health/ready")
async def readiness():
    db_ok = await db.health_check()
    redis_ok = redis_client.is_available()
    return {
        "status": "ready" if (db_ok and redis_ok) else "degraded",
        "checks": {"database": db_ok, "redis": redis_ok},
    }


@app.get("/api")
async def api_root():
    return {"service": "INTRA GROUP", "version": "3.0.0", "status": "ok"}


# Mini App statik fayllar
if settings.miniapp_dir and os.path.isdir(settings.miniapp_dir):
    app.mount("/", StaticFiles(directory=settings.miniapp_dir, html=True), name="miniapp")
else:
    @app.get("/")
    async def root():
        return {"service": "INTRA GROUP", "version": "3.0.0", "status": "ok"}
