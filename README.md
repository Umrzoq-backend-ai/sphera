# 📻 Sphera — Radio AI

Telegram Mini App ichida ishlaydigan **multitilli interaktiv AI-radio** platformasi.

> Chat + Studiya + AI agregatsiya + 3 tilli efir (RU / LT / EN)

---

## Tuzilma

```
sphera/
├── backend/               # FastAPI (Python 3.12)
│   ├── app/
│   │   ├── main.py        # Ilova entry point
│   │   ├── core/          # DB, auth, state, WebSocket
│   │   ├── api/routers/   # REST endpointlar
│   │   ├── services/      # AI, TTS, STT, broadcast
│   │   ├── db/schema.sql  # PostgreSQL schema
│   │   └── host/          # AI radio host (fon)
│   ├── tests/
│   ├── Dockerfile
│   └── pyproject.toml
│
├── frontend/              # Vanilla JS Mini App
│   ├── index.html         # Anons ekrani
│   ├── pages/             # radio.html, admin.html
│   ├── app.js             # Asosiy logika
│   ├── lib/               # config.js, i18n.js
│   └── style.css
│
├── bot/                   # Telegram bot
│   ├── bot.py
│   └── Dockerfile
│
├── infra/
│   ├── icecast/           # icecast.xml (3 mount)
│   └── scripts/           # run-dev.sh, stop-dev.sh
│
├── .env.example
├── docker-compose.yml
└── Makefile
```

---

## Tez ishga tushirish

```bash
# 1. Muhit sozlash
cp .env.example .env
# .env ichida BOT_TOKEN, ADMIN_IDS, GEMINI_KEY ni to'ldiring

# 2. Virtual muhit va paketlar
python3 -m venv .venv
.venv/bin/pip install -e backend/

# 3. Dev serverni ishga tushirish
make dev          # yoki: bash infra/scripts/run-dev.sh

# To'xtatish
make stop
```

### Docker (production)
```bash
docker compose up -d
```

---

## Asosiy API

| Method | Endpoint | Ta'rif |
|--------|----------|--------|
| POST | `/auth/telegram` | Login |
| GET | `/radio/status/{city}` | Efir holati |
| WS | `/radio/ws/{city}` | Real-time ulanish |
| POST | `/chat/message` | Chatga xabar |
| POST | `/messages/studio` | Studiyaga xabar |
| GET | `/admin/drafts` | AI drafts |
| POST | `/admin/drafts/{id}/approve` | Efirga chiqarish |

Swagger: `http://localhost:8001/docs`

---

## Stek

| Qatlam | Texnologiya |
|--------|-------------|
| Backend | FastAPI + asyncpg + PostgreSQL |
| AI | Google Gemini 2.5 Flash |
| TTS | ElevenLabs + edge-tts (fallback) |
| STT | faster-whisper |
| Audio | Icecast2 (3 mount: `/live_ru`, `/live_lt`, `/live_en`) |
| Frontend | Vanilla JS + WebSocket |
| Bot | python-telegram-bot |
| Tunnel (dev) | cloudflared |



env






# ===== Telegram Bot =====
# BotFather /newbot dan olgan tokeningizni shu yerga qo'ying:
BOT_TOKEN=8858693463:AAEf2t1kWgBD6gv7-Nlm7si1HPABdRA9C-0

# Admin telegram_id lar (vergul bilan). O'z ID ingizni @userinfobot dan oling:
ADMIN_IDS=5580566610

# ===== Guruhga bog'liqlik (Community-bound) =====
# Telegram guruh chat_id (masalan -1001234567890). Bo'sh = dev rejim.
COMMUNITY_CHAT_ID=
# Dev'da true (tekshiruv o'chiq), production'da false:
DISABLE_GROUP_CHECK=true

# ===== Mini App / API manzillari =====
# Hozir mahalliy test uchun. Production da: https://app.sfera5.world
MINI_APP_URL=https://biology-looking-casio-calculation.trycloudflare.com/index.html
API_URL=https://biology-looking-casio-calculation.trycloudflare.com
INTERNAL_API_URL=http://localhost:8001
RADIO_PUBLIC_URL=http://localhost:8000

# React frontend build papkasi (backend static files serve qiladi)
MINIAPP_DIR=frontend/dist

# ===== Frontend (Vite) Environment Variables =====
# VITE_ prefix bilan frontendga o'tadi
VITE_API_URL=https://biology-looking-casio-calculation.trycloudflare.com
VITE_WS_URL=wss://biology-looking-casio-calculation.trycloudflare.com
VITE_RADIO_URL=https://biology-looking-casio-calculation.trycloudflare.com
VITE_DEFAULT_CITY=global

# ===== Database (mahalliy dev klaster) =====
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_NAME=radio_db

# ===== AI / Radio =====
# Google AI Studio dan bepul olinadi (ixtiyoriy, bo'lmasa default matn):
GEMINI_KEY=AQ.Ab8RN6LlPzR4NMtBCRdo97_MhnY18Ny7UwW6baf381ZHy8iabw
WHISPER_MODEL=small
USE_ICECAST=false
AUDIO_DIR=/tmp/sfera5_audio
UPLOAD_DIR=/tmp/sfera5_uploads

# ===== Xavfsizlik =====
SECRET_KEY=devsecretkey1234567890devsecret

# ===== Icecast (production Docker uchun) =====
ICECAST_PASS=IcecastPass2025!
ICECAST_HOST=localhost
ICECAST_PORT=8000

# ===== TTS (ElevenLabs asosiy, edge-tts fallback) =====
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=
ELEVEN_MODEL=eleven_multilingual_v2
ELEVEN_VOICE_RU=
ELEVEN_VOICE_LT=
ELEVEN_VOICE_EN=
TTS_FALLBACK_EDGE=true

# ===== Studio cost-model (Поинты) =====
COST_CHAT=1
COST_CHAT_VOICE=1
COST_STUDIO=1
COST_STUDIO_VOICE=2
INITIAL_POINTS=50
DB_PASS=postgres
