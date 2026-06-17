#!/bin/bash
# INTRA GROUP — bitta komanda bilan hammasi ishga tushadi
# Ishlatish: bash start.sh

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==============================="
echo "  INTRA GROUP — ishga tushish"
echo "==============================="

# .env o'qish
load_env() {
    while IFS= read -r line; do
        line="${line%%#*}"  # izohlarni olib tashlash
        line="${line%"${line##*[![:space:]]}"}"  # trailing space
        [ -z "$line" ] && continue
        [[ "$line" == *"="* ]] || continue
        export "$line"
    done < "$ROOT/.env"
}
load_env
echo "[1/5] .env yuklandi ✓"

# PostgreSQL tekshirish
pg_isready -q 2>/dev/null || { echo "[!] PostgreSQL ishlamayapti. Avval: sudo service postgresql start"; exit 1; }
echo "[2/5] PostgreSQL ✓"

# Redis tekshirish
redis-cli ping -q >/dev/null 2>&1 || { echo "[!] Redis ishlamayapti. Avval: sudo service redis-server start"; exit 1; }
echo "[3/5] Redis ✓"

# Tunnel ishga tushirish (fonda)
echo "[4/5] Cloudflare tunnel ishga tushmoqda..."
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 1
cloudflared tunnel --url http://localhost:8001 > /tmp/tunnel.log 2>&1 &
TUNNEL_PID=$!

# Tunnel URL kutish (max 15s)
TUNNEL_URL=""
for i in $(seq 1 15); do
    TUNNEL_URL=$(grep -o "https://[a-z0-9-]*\.trycloudflare\.com" /tmp/tunnel.log 2>/dev/null | head -1)
    [ -n "$TUNNEL_URL" ] && break
    sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
    echo "[!] Tunnel URL topilmadi. Internet aloqasini tekshiring."
    exit 1
fi
echo "[4/5] Tunnel: $TUNNEL_URL ✓"

# Frontend .env va build
printf "VITE_API_URL=%s\nVITE_WS_URL=%s\nVITE_DEFAULT_CITY=global\n" \
    "$TUNNEL_URL" "${TUNNEL_URL/https:/wss:}" > "$ROOT/frontend/.env"

echo "[4/5] Frontend build bo'lmoqda..."
cd "$ROOT/frontend"
/usr/local/bin/node node_modules/vite/bin/vite.js build --logLevel silent 2>/dev/null \
    || node node_modules/vite/bin/vite.js build --logLevel silent
cd "$ROOT"
echo "[4/5] Frontend build ✓"

# .env da URL yangilash
sed -i "s|^MINI_APP_URL=.*|MINI_APP_URL=$TUNNEL_URL/index.html|" "$ROOT/.env"
sed -i "s|^API_URL=.*|API_URL=$TUNNEL_URL|" "$ROOT/.env"

# Backend ishga tushirish (fonda)
echo "[5/5] Backend ishga tushmoqda..."
pkill -f run_backend.py 2>/dev/null || true
sleep 1
python3 "$ROOT/run_backend.py" > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Backend tayyor bo'lishini kutish (max 15s)
for i in $(seq 1 15); do
    curl -s http://localhost:8001/health >/dev/null 2>&1 && break
    sleep 1
done

curl -s http://localhost:8001/health >/dev/null 2>&1 || {
    echo "[!] Backend ishga tushmadi. Log: cat /tmp/backend.log"
    exit 1
}
echo "[5/5] Backend ✓"

# Bot ishga tushirish (fonda)
pkill -f run_bot.py 2>/dev/null || true
sleep 2
python3 "$ROOT/run_bot.py" > /tmp/bot.log 2>&1 &
BOT_PID=$!

echo ""
echo "==============================="
echo "✅ INTRA GROUP ishga tushdi!"
echo "==============================="
echo ""
echo "Mini App: $TUNNEL_URL"
echo "Bot:      @sfera5radio_bot"
echo "Backend:  http://localhost:8001"
echo ""
echo "To'xtatish uchun: bash stop.sh"
echo ""

# PID'larni saqlash
echo "$TUNNEL_PID $BACKEND_PID $BOT_PID" > /tmp/intra_pids.txt
