#!/bin/bash
# ============================================================
#  Sphera Radio AI — FULL DEV (barcha komponentlar)
#  PostgreSQL + Backend + Frontend + AI Host + Tunnel + Bot
# ============================================================
cd "$(git rev-parse --show-toplevel)"
ROOT="$(pwd)"

PG_BIN="/usr/lib/postgresql/16/bin"
PGDATA="$ROOT/.pgdata"
VENV="$ROOT/.venv/bin"
LOGDIR="$ROOT/.logs"
mkdir -p "$LOGDIR" /tmp/sphera_uploads /tmp/sphera_audio

set -a; [ -f .env ] && . ./.env; set +a

PIDS=()

cleanup() {
    echo ""
    echo "🛑 To'xtatilmoqda..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null
    done
    kill $(lsof -ti:8001) 2>/dev/null || true
    kill $(lsof -ti:5173) 2>/dev/null || true
    "$PG_BIN/pg_ctl" stop -D "$PGDATA" -m fast 2>/dev/null || true
    echo "✅ Hammasi to'xtatildi."
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "╔══════════════════════════════════╗"
echo "║   Sphera Radio AI — FULL DEV    ║"
echo "╚══════════════════════════════════╝"

# ── 1. PostgreSQL ────────────────────────────────────────────
if ! "$PG_BIN/pg_isready" -h /tmp -p 5433 >/dev/null 2>&1; then
    echo "[1/6] PostgreSQL ishga tushmoqda (port 5433)..."
    if [ ! -f "$PGDATA/PG_VERSION" ]; then
        "$PG_BIN/initdb" -D "$PGDATA" --auth=trust >/dev/null 2>&1
    fi
    "$PG_BIN/postgres" -D "$PGDATA" -p 5433 -k /tmp > "$LOGDIR/postgres.log" 2>&1 &
    PIDS+=($!)
    sleep 3
    if ! "$PG_BIN/pg_isready" -h /tmp -p 5433 >/dev/null 2>&1; then
        echo "  ❌ PostgreSQL ishga tushmadi! Log: $LOGDIR/postgres.log"
        exit 1
    fi
else
    echo "[1/6] ✅ PostgreSQL allaqachon ishlayapti."
fi

DB_ROLE="$(whoami)"
"$PG_BIN/psql" -h /tmp -p 5433 -U "$DB_ROLE" -d postgres -tc \
    "SELECT 1 FROM pg_database WHERE datname='radio_db'" 2>/dev/null | grep -q 1 || \
    "$PG_BIN/createdb" -h /tmp -p 5433 -U "$DB_ROLE" radio_db 2>/dev/null || true
"$PG_BIN/psql" -h /tmp -p 5433 -U "$DB_ROLE" -d radio_db \
    -f backend/app/db/schema.sql > /dev/null 2>&1 || true

export DB_HOST=/tmp DB_PORT=5433 DB_USER="$DB_ROLE" DB_PASS="" DB_NAME=radio_db
export SECRET_KEY="${SECRET_KEY:-devsecretkey1234567890devsecret}"
export ADMIN_IDS="${ADMIN_IDS:-999999}"
export UPLOAD_DIR=/tmp/sphera_uploads
export AUDIO_DIR=/tmp/sphera_audio
export USE_ICECAST="${USE_ICECAST:-false}"
export ICECAST_HOST="${ICECAST_HOST:-localhost}"
export ICECAST_PORT="${ICECAST_PORT:-8000}"
export ICECAST_PASS="${ICECAST_PASS:-IcecastPass2025!}"
export WHISPER_MODEL="${WHISPER_MODEL:-small}"
export GEMINI_MODEL="${GEMINI_MODEL:-gemini-2.5-flash}"
export RADIO_PUBLIC_URL="${RADIO_PUBLIC_URL:-http://localhost:8000}"
export MINIAPP_DIR="$ROOT/frontend/dist"
export INTERNAL_API_URL=http://localhost:8001
export REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"

# ── 2. Backend (FastAPI) ─────────────────────────────────────
echo "[2/6] Backend (FastAPI) ishga tushmoqda (port 8001)..."
kill $(lsof -ti:8001) 2>/dev/null || true
sleep 1
cd "$ROOT/backend"
"$VENV/uvicorn" app.main:app --host 0.0.0.0 --port 8001 --reload \
    > "$LOGDIR/backend.log" 2>&1 &
PIDS+=($!)
cd "$ROOT"
sleep 3

# Backend ishlayaptimi tekshirish
if ! curl -s http://localhost:8001/health >/dev/null 2>&1; then
    echo "  ⚠️  Backend hali javob bermayapti (log: $LOGDIR/backend.log)"
fi

# ── 3. Frontend (Vite dev) ───────────────────────────────────
echo "[3/6] Frontend (Vite) ishga tushmoqda (port 5173)..."
kill $(lsof -ti:5173) 2>/dev/null || true
cd "$ROOT/frontend"
"$ROOT/frontend/node_modules/.bin/vite" --host > "$LOGDIR/frontend.log" 2>&1 &
PIDS+=($!)
cd "$ROOT"
sleep 2

# ── 4. AI Radio Host ────────────────────────────────────────
echo "[4/6] AI Radio Host ishga tushmoqda..."
SEGMENT_INTERVAL="${SEGMENT_INTERVAL:-180}" PYTHONPATH="$ROOT/backend" \
    "$VENV/python" backend/app/host/main.py > "$LOGDIR/radio-host.log" 2>&1 &
PIDS+=($!)
sleep 1

# ── 5. Tunnel ────────────────────────────────────────────────
if command -v cloudflared >/dev/null 2>&1 || [ -f "$ROOT/bin/cloudflared" ]; then
    echo "[5/6] HTTPS tunnel ochilmoqda..."
    CFTOOL="${ROOT}/bin/cloudflared"
    [ ! -f "$CFTOOL" ] && CFTOOL="cloudflared"
    "$CFTOOL" tunnel --url http://localhost:8001 --no-autoupdate \
        > "$LOGDIR/tunnel.log" 2>&1 &
    PIDS+=($!)
    sleep 8
    TUNNEL_URL=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" "$LOGDIR/tunnel.log" | head -1)
    if [ -n "$TUNNEL_URL" ]; then
        echo "  ✅ Tunnel: $TUNNEL_URL"
    else
        echo "  ⚠️  Tunnel URL tayyor emas (log: $LOGDIR/tunnel.log)"
    fi
else
    echo "[5/6] ⚠️  cloudflared topilmadi — tunnel o'tkazildi."
fi

# ── 6. Telegram Bot ──────────────────────────────────────────
if [ -n "$BOT_TOKEN" ] && [ "$BOT_TOKEN" != "your_botfather_token_here" ]; then
    echo "[6/6] Telegram bot ishga tushmoqda..."
    "$VENV/python" bot/bot.py > "$LOGDIR/bot.log" 2>&1 &
    PIDS+=($!)
else
    echo "[6/6] ⚠️  BOT_TOKEN yo'q — bot ishga tushmadi."
fi

# ── Natija ───────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ Barcha servislar ishga tushdi!              ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Frontend : http://localhost:5173               ║"
echo "║  Backend  : http://localhost:8001               ║"
echo "║  API docs : http://localhost:8001/docs          ║"
[ -n "$TUNNEL_URL" ] && \
echo "║  Tunnel   : $TUNNEL_URL  ║"
echo "║  Loglar   : $LOGDIR/                           ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  To'xtatish: Ctrl+C                            ║"
echo "╚══════════════════════════════════════════════════╝"

# Barcha background processlarni kutish
wait
