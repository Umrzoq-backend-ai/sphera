#!/bin/bash
# ============================================================
#  Sfera5 Radio — DEV ishga tushirish skripti (tunnel rejimi)
#  Bitta buyruq bilan: Postgres + Backend + AI Host + Bot + Tunnel
# ============================================================
set -e
cd "$(dirname "$0")"
ROOT="$(pwd)"

PG_BIN="/usr/lib/postgresql/16/bin"
PGDATA="$ROOT/.pgdata"
VENV="$ROOT/.venv/bin"
LOGDIR="$ROOT/.logs"
mkdir -p "$LOGDIR"

# .env ni yuklaymiz
set -a; [ -f .env ] && . ./.env; set +a

echo "================================"
echo "  Sfera5 Radio — DEV ishga tushish"
echo "================================"

# --- 1. PostgreSQL ---
if ! "$PG_BIN/pg_isready" -h /tmp -p 5433 >/dev/null 2>&1; then
    echo "[1/5] PostgreSQL ishga tushmoqda (port 5433)..."
    "$PG_BIN/postgres" -D "$PGDATA" -p 5433 -k /tmp > "$LOGDIR/postgres.log" 2>&1 &
    sleep 3
else
    echo "[1/5] PostgreSQL allaqachon ishlayapti."
fi

# Baza/schema mavjudligini ta'minlaymiz
"$PG_BIN/psql" -h /tmp -p 5433 -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='radio_db'" 2>/dev/null | grep -q 1 || \
    "$PG_BIN/psql" -h /tmp -p 5433 -U postgres -c "CREATE DATABASE radio_db" 2>/dev/null
"$PG_BIN/psql" -h /tmp -p 5433 -U postgres -d radio_db -f radio-api/db/schema.sql > /dev/null 2>&1 || true

# Umumiy dev env
export DB_HOST=/tmp DB_PORT=5433 DB_USER=postgres DB_PASS="" DB_NAME=radio_db
export SECRET_KEY="${SECRET_KEY:-devsecretkey1234567890devsecret}"
export ADMIN_IDS="${ADMIN_IDS:-999999}"
export UPLOAD_DIR=/tmp/sfera5_uploads
export AUDIO_DIR=/tmp/sfera5_audio
export USE_ICECAST="${USE_ICECAST:-false}"
export ICECAST_HOST="${ICECAST_HOST:-localhost}"
export ICECAST_PORT="${ICECAST_PORT:-8000}"
export ICECAST_PASS="${ICECAST_PASS:-IcecastPass2025!}"
export WHISPER_MODEL=small
export GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.5-flash}"
export RADIO_PUBLIC_URL="${RADIO_PUBLIC_URL:-http://localhost:8000}"
export MINIAPP_DIR="$ROOT/miniapp"
export INTERNAL_API_URL=http://localhost:8001

# --- 2. Backend ---
echo "[2/5] Backend (FastAPI) ishga tushmoqda (port 8001)..."
"$VENV/uvicorn" main:app --host 0.0.0.0 --port 8001 --app-dir radio-api \
    > "$LOGDIR/backend.log" 2>&1 &
sleep 4

# --- 3. AI Radio Host ---
echo "[3/5] AI Radio Host ishga tushmoqda..."
SEGMENT_INTERVAL=180 "$VENV/python" radio-host/main.py > "$LOGDIR/radio-host.log" 2>&1 &
sleep 2

# --- 4. Tunnel (cloudflared) ---
echo "[4/5] HTTPS tunnel ochilmoqda..."
./bin/cloudflared tunnel --url http://localhost:8001 --no-autoupdate \
    > "$LOGDIR/tunnel.log" 2>&1 &
sleep 8
TUNNEL_URL=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" "$LOGDIR/tunnel.log" | head -1)

if [ -z "$TUNNEL_URL" ]; then
    echo "  ⚠️  Tunnel URL hali tayyor emas. .logs/tunnel.log ni tekshiring."
else
    echo "  ✅ Tunnel: $TUNNEL_URL"
    # Bot uchun MINI_APP_URL ni yangilaymiz
    export MINI_APP_URL="$TUNNEL_URL/index.html"
fi

# --- 5. Telegram bot ---
if [ -n "$BOT_TOKEN" ] && [ "$BOT_TOKEN" != "BU_YERGA_BOTFATHER_TOKENINI_QOYING" ]; then
    echo "[5/5] Telegram bot ishga tushmoqda..."
    "$VENV/python" telegram-bot/bot.py > "$LOGDIR/bot.log" 2>&1 &
    sleep 2
else
    echo "[5/5] ⚠️  BOT_TOKEN .env da yo'q — bot ishga tushmadi."
fi

echo ""
echo "================================"
echo "  ✅ HAMMASI ISHGA TUSHDI"
echo "================================"
echo "  Mini App:  ${TUNNEL_URL:-http://localhost:8001}/index.html"
echo "  API:       ${TUNNEL_URL:-http://localhost:8001}/health"
echo "  Loglar:    $LOGDIR/"
echo ""
echo "  To'xtatish uchun:  bash stop-dev.sh"
echo "================================"
