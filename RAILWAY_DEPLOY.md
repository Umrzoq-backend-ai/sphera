# Railway.com Deploy Qo'llanmasi

## 1. railway.app ga kiring → New Project → Deploy from GitHub

GitHub repo: `Umrzoq-backend-ai/sphera`

---

## 2. Backend Service sozlamalari

**Settings → Source:**
- Root Directory: `/` (blank)
- railway.toml avtomatik topiladi

**Variables bo'limiga bu ENV ni qo'shing:**

```
# Telegram
BOT_TOKEN=<BotFather dan olingan token>
ADMIN_IDS=<sizning Telegram ID>
DISABLE_GROUP_CHECK=true

# Railway PostgreSQL (pastda yaratiladi, avtomatik to'ldiriladi)
# DATABASE_URL=<Railway PostgreSQL beradi>
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USER=${{Postgres.PGUSER}}
DB_PASS=${{Postgres.PGPASSWORD}}
DB_NAME=${{Postgres.PGDATABASE}}

# Railway Redis (pastda yaratiladi)
REDIS_URL=${{Redis.REDIS_URL}}

# App URL (deploy bo'lgandan keyin to'ldirasiz)
MINI_APP_URL=https://<railway-url>.railway.app
API_URL=https://<railway-url>.railway.app
INTERNAL_API_URL=https://<railway-url>.railway.app

# Security
SECRET_KEY=<random 32 belgi, masalan: openssl rand -hex 16>
ALLOWED_ORIGINS=https://<railway-url>.railway.app

# AI
GEMINI_KEY=<Google AI Studio dan>

# Debug (production da false)
DEBUG=false

# Boshqalar
USE_ICECAST=false
AUDIO_DIR=/tmp/sphera_audio
UPLOAD_DIR=/tmp/sphera_uploads
```

---

## 3. PostgreSQL qo'shish

Railway → New → Database → PostgreSQL  
Variables da `${{Postgres.PGHOST}}` va h.k. avtomatik to'ldiriladi

---

## 4. Redis qo'shish

Railway → New → Database → Redis  
`${{Redis.REDIS_URL}}` avtomatik to'ldiriladi

---

## 5. Bot Service (alohida)

Railway → New Service → GitHub (xuddi shu repo)  
Settings → Source:
- Root Directory: `bot`

Variables:
```
BOT_TOKEN=<xuddi yuqoridagi>
INTERNAL_API_URL=https://<backend-url>.railway.app
MINI_APP_URL=https://<backend-url>.railway.app
```

---

## Deploy bo'lgandan keyin

1. Backend URL ni oling (masalan `https://sphera-production.up.railway.app`)
2. `MINI_APP_URL`, `API_URL`, `ALLOWED_ORIGINS` ga shu URLni kiriting
3. Telegram BotFather → Bot Settings → Menu Button → URL ni yangilang
4. `/start` bosib test qiling ✅
