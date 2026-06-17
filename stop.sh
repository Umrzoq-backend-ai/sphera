#!/bin/bash
# INTRA GROUP — hammani to'xtatish
echo "Hammasi to'xtatilmoqda..."
pkill -f "run_backend.py" 2>/dev/null && echo "Backend ✓" || true
pkill -f "run_bot.py"     2>/dev/null && echo "Bot ✓"     || true
pkill -f "cloudflared"    2>/dev/null && echo "Tunnel ✓"  || true
rm -f /tmp/intra_pids.txt
echo "To'xtatildi."
