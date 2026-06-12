#!/bin/bash
# Sphera Backend — ishga tushirish skripti
set -e
cd "$(dirname "$0")"

VENV=".venv/bin"
LOGDIR=".logs"
PGDATA=".pgdata"
mkdir -p "$LOGDIR" /tmp/sphera_uploads /tmp/sphera_audio

# .env yuklash
set -a; [ -f .env ] && . ./.env; set +a

# --- PostgreSQL ---
if ! pg_isready -h /tmp -p 5433 >/dev/null 2>&1; then
    echo "[1/2] PostgreSQL ishga tushmoqda (port 5433)..."
    if [ ! -f "$PGDATA/PG_VERSION" ]; then
        initdb -D "$PGDATA" --auth=trust >/dev/null 2>&1
    fi
    pg_ctl -D "$PGDATA" -l "$LOGDIR/postgres.log" -o "-p 5433 -k /tmp" start >/dev/null 2>&1
    sleep 2
    psql -h /tmp -p 5433 -U "$(whoami)" -d postgres -tc \
        "SELECT 1 FROM pg_database WHERE datname='radio_db'" | grep -q 1 || \
        psql -h /tmp -p 5433 -U "$(whoami)" -d postgres -c "CREATE DATABASE radio_db" >/dev/null 2>&1
    psql -h /tmp -p 5433 -U "$(whoami)" -d radio_db -f backend/app/db/schema.sql >/dev/null 2>&1 || true
else
    echo "[1/2] PostgreSQL allaqachon ishlayapti."
fi

# --- Backend ---
echo "[2/2] Backend (FastAPI) ishga tushmoqda (port 8001)..."
export DB_HOST=/tmp
export DB_PORT=5433
export DB_USER=$(whoami)
export DB_PASS=""
export DB_NAME=radio_db
export SECRET_KEY="${SECRET_KEY:-devsecretkey1234567890devsecret}"
export ADMIN_IDS="${ADMIN_IDS:-5580566610}"
export UPLOAD_DIR=/tmp/sphera_uploads
export AUDIO_DIR=/tmp/sphera_audio
export USE_ICECAST="${USE_ICECAST:-false}"
export WHISPER_MODEL="${WHISPER_MODEL:-small}"
export RADIO_PUBLIC_URL="${RADIO_PUBLIC_URL:-http://localhost:8000}"
export MINIAPP_DIR="$(pwd)/frontend"
export INTERNAL_API_URL=http://localhost:8001

# Agar port band bo'lsa — tozalash
kill $(lsof -ti:8001) 2>/dev/null || true
sleep 1

cd backend
"../$VENV/uvicorn" app.main:app --host 0.0.0.0 --port 8001 --reload

