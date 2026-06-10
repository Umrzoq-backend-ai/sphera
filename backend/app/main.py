import os
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import db
from app.api.routers import auth, cities, users, radio, messages, chat, admin
from app.core.state import set_valid_cities

MINIAPP_DIR = os.getenv("MINIAPP_DIR", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    # Bazadan amaldagi shaharlar ro'yxatini yuklaymiz
    try:
        rows = await db.fetch("SELECT slug FROM cities WHERE is_active = true")
        set_valid_cities([r["slug"] for r in rows])
    except Exception:
        pass
    # Guruhga bog'liqlik konfiguratsiyasi ogohlantirishi
    from app.services import membership
    if not membership.is_enabled():
        print("[WARN] Group membership check DISABLED (dev mode). "
              "Production: set COMMUNITY_CHAT_ID and DISABLE_GROUP_CHECK=false.")
    else:
        print(f"[INFO] Community-bound enabled for chat {membership.COMMUNITY_CHAT_ID}")

    # ИИ-agregatsiya fon jarayoni (chat → draft → moderator)
    from app.services import aggregator
    from app.core.state import VALID_CITIES
    agg_task = asyncio.create_task(
        aggregator.aggregation_loop(lambda: VALID_CITIES)
    )

    # Uzluksiz multiyazык Icecast oqimi (USE_ICECAST=true bo'lганда)
    from app.services import continuous
    await continuous.start()

    yield

    agg_task.cancel()
    await continuous.stop()
    await db.disconnect()


app = FastAPI(title="Sfera5 Radio API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cities.router)
app.include_router(users.router)
app.include_router(radio.router)
app.include_router(messages.router)
app.include_router(chat.router)
app.include_router(admin.router)


@app.get("/health")
async def health():
    try:
        await db.fetchval("SELECT 1")
        return {"status": "healthy"}
    except Exception as exc:  # noqa: BLE001
        return {"status": "unhealthy", "error": str(exc)}


@app.get("/api")
async def api_root():
    return {"service": "Sfera5 Radio API", "status": "ok"}


# Mini App statik fayllarini serve qilamiz (agar MINIAPP_DIR berilgan bo'lsa).
# Bu bitta domen/tunnel orqali frontend + backend ishlashini ta'minlaydi.
if MINIAPP_DIR and os.path.isdir(MINIAPP_DIR):
    app.mount("/", StaticFiles(directory=MINIAPP_DIR, html=True), name="miniapp")
else:
    @app.get("/")
    async def root():
        return {"service": "Sfera5 Radio API", "status": "ok"}
