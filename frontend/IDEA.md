# 📻 Sphera — Radio AI

> **Telegram Mini App ichida ishlaydigan multitilli interaktiv AI-radio platformasi**

---

## 💡 Asosiy g'oya

Odatdagi radio eshitish emas — tinglovchilar **efirga ta'sir qiladi**.

Foydalanuvchi Telegram Mini App'ni ochadi, o'z tilini tanlaydi (RU / LT / EN), AI boshlovchi efirini tinglaydi, va parallelda jonli chatda suhbatlashadi yoki to'g'ridan-to'g'ri **studiyaga zayavka** yuboradi. AI tinglovchilarning xabarlarini tahlil qilib, asosiy mavzuni ajratadi va efir ssenariyini yaratadi — moderator tasdiqlaydi, 3 tilda ovozlanadi va efirga chiqadi.

```
Tinglovchi xabari → AI tahlil → Ssenariy → Moderator → Tarjima → TTS → Efir
```

---

## 🎯 Muammo va yechim

| Muammo | Yechim |
|--------|--------|
| Oddiy radio — bir tomonlama | Tinglovchilar efir mavzusini shakllantirishga hissa qo'shadi |
| Til to'siqlari | Bir efir — 3 tilda (RU/LT/EN) parallel |
| AI javoblari shaxssiz | Psixotip tahlili — kayfiyatga mos individual javob |
| Moderator yuklamasi | AI dastlabki ssenariy yozadi, moderator faqat tasdiqlaydi |

---

## 🔄 Foydalanuvchi yo'li

```
Telegram → /start → Mini App → Til tanlash
                                    ↓
                             Efir ekrani
                          ┌──────────────────┐
                          │  🎵 AI Radio      │
                          │  ───────────────  │
                          │  [Jonli chat]     │
                          │  ...              │
                          │  ─────────────────│
                          │  🎤  [Xabar yoz]  │
                          │  [Chatga] [Studiyaga] │
                          └──────────────────┘
```

**Ikki yo'nalish:**
- **Chatga** → hamma ko'radi, AI kayfiyatga qarab javob beradi
- **Studiyaga** → AI agregatsiya → moderator paneli → efir

---

## ⚙️ Qanday ishlaydi

### 1. Til tanlash
Foydalanuvchi RU / LT / EN tanlaydi → interfeys va efir potoki o'sha tilda ishlaydi. Hamma bir efirni tinglaydi, lekin har kim o'z tilida.

### 2. Jonli chat
Telegram uslubidagi chat — matn va ovoz xabarlar. AI har bir xabar ortidagi kayfiyatni (optimist / melanxolik / ratsional) aniqlaydi va mos javob beradi.

### 3. Studiya zayavkasi
Foydalanuvchi "Studiyaga" yuborsa — xabar chatda ham ko'rinadi (dinamika uchun) va AI navbatiga tushadi. Ozgina poin sarflanadi.

### 4. AI agregatsiya
Har 2 daqiqada AI studiya zayavkalarini ko'rib chiqadi, **asosiy mavzuni ("сливки")** ajratadi va rus tilida efir ssenariysi yozadi.

### 5. Multitilli efir
Moderator ssenariyni tasdiqlaydi:
```
RU ssenariy → Gemini tarjima → LT + EN
     ↓               ↓              ↓
  ElevenLabs TTS  edge-tts      edge-tts
     ↓               ↓              ↓
 /live_ru       /live_lt       /live_en   (Icecast)
```

---

## 🧩 Texnik arxitektura

```
┌─────────────────────────────────────────────┐
│              Telegram Mini App               │
│         (Vanilla JS + WebSocket)             │
└──────────────────┬──────────────────────────┘
                   │ HTTPS / WS
┌──────────────────▼──────────────────────────┐
│            FastAPI Backend                   │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Auth   │ │  Chat    │ │   Admin      │  │
│  │  JWT    │ │  Studio  │ │   Drafts     │  │
│  └─────────┘ └──────────┘ └──────────────┘  │
│  ┌─────────────────────────────────────────┐ │
│  │           Services                      │ │
│  │  Gemini AI │ TTS │ STT │ Broadcast      │ │
│  └─────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼──────┐    ┌─────────▼────────┐
│  PostgreSQL  │    │   Icecast2        │
│  (users,     │    │  /live_ru         │
│   messages,  │    │  /live_lt         │
│   drafts)    │    │  /live_en         │
└──────────────┘    └──────────────────┘
```

---

## 🛠 Texnologiyalar

| Qatlam | Texnologiya | Sabab |
|--------|-------------|-------|
| Frontend | Vanilla JS + WebSocket | Telegram Mini App uchun engil |
| Backend | FastAPI (Python 3.12) | Async, tez, OpenAPI |
| Database | PostgreSQL + asyncpg | Ishonchli, async |
| AI | Google Gemini 2.5 Flash | Matn, tarjima, tahlil |
| TTS | ElevenLabs + edge-tts | Sifatli ovoz + bepul fallback |
| STT | faster-whisper | Lokal, tez |
| Audio stream | Icecast2 | 3 parallel mount |
| Auth | JWT (Telegram WebApp data) | Maxsus login kerak emas |
| Bot | python-telegram-bot | Mini App entry point |
| Dev tunnel | cloudflared | HTTPS lokal testda |

---

## 👥 Foydalanuvchi rollari

| Rol | Imkoniyat |
|-----|-----------|
| `slusatel` | Efir tinglash, chatga yozish |
| `aktivniy` | + Studiyaga zayavka yuborish |
| `doverenniy` | + Jonli mikrofon (kelgusida) |
| `admin` | + Moderator paneli, poin berish, rol o'zgartirish |

**Poin tizimi:** Har bir xabar uchun poin sarflanadi. Admin qo'lda to'ldiradi. Balans manfiy bo'lmaydi.

| Amal | Narxi |
|------|-------|
| Chatga matn | 1 poin |
| Chatga ovoz | 1 poin |
| Studiyaga matn | 1 poin |
| Studiyaga ovoz | 2 poin (STT uchun) |

---

## 📱 Ekranlar

### 1. Boshlang'ich ekran
- Til tanlash (RU / LT / EN)
- 2 ta banner (admin tahrirlaydi) — yangiliklar, qoidalar

### 2. Efir ekrani
- Mini audio-pleer (Icecast stream yoki AI segment)
- Jonli chat (Telegram uslubi) — matn + ovoz + fayl
- Ikki tugma: **Chatga** / **Studiyaga**
- AI javoblari real vaqtda

### 3. Profil ekrani
- Telegram ID, ism
- Balans (POINT)
- Rol va daraja
- Psixotip tahlili

### 4. Moderator paneli (`/admin`)
- Kutayotgan AI draftlar
- Tahrirlash va tasdiqlash
- Banner boshqaruvi
- Foydalanuvchi/poin boshqaruvi

---

## 🚀 Keyingi bosqichlar

- [ ] Liquidsoap — segmentlar orasidagi jimlikni yo'q qilish (uzluksiz oqim)
- [ ] ElevenLabs API key — sifatli ovoz
- [ ] Doimiy domen — tunnel o'rniga
- [ ] Guruh a'zoligi tekshiruvi (`COMMUNITY_CHAT_ID`)
- [ ] Statistika paneli — tinglovchilar soni, top mavzular
- [ ] Push bildirishnomalar — yangi efir boshlanishi haqida

---

## 📂 Loyiha tuzilmasi

```
sphera/
├── backend/app/          ← FastAPI + barcha logika
├── frontend/             ← Telegram Mini App (shu papka)
├── bot/                  ← Telegram bot
├── infra/                ← Icecast config, skriptlar
├── docker-compose.yml    ← Production deploy
└── Makefile              ← make dev / make up
```

---

*Sphera Radio AI — tinglovchi efirni shakllantiradigan platforma.*
