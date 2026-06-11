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
