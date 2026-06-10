#!/bin/bash
# Sfera5 Radio — barcha dev jarayonlarni to'xtatadi
echo "Sfera5 dev jarayonlari to'xtatilmoqda..."
pkill -f "uvicorn main:app" 2>/dev/null && echo " - Backend to'xtadi"
pkill -f "radio-host/main.py" 2>/dev/null && echo " - AI Host to'xtadi"
pkill -f "telegram-bot/bot.py" 2>/dev/null && echo " - Bot to'xtadi"
pkill -f "cloudflared tunnel" 2>/dev/null && echo " - Tunnel to'xtadi"
pkill -f "postgres -D" 2>/dev/null && echo " - PostgreSQL to'xtadi"
echo "Tayyor."
