# 📋 Radio AI — Bajarilgan ishlar hisoboti

> Telegram Mini App ichida ishlaydigan **multiyazык interaktiv AI-radio** platformasi
> Konsepsiya: **Jonli chat + Studiya + ИИ-agregatsiya + Moderator + 3 tilli efir**
> So'nggi yangilanish: 8-iyun 2026

---

## 1. Loyiha nima?

Telegram guruhi uchun onlayn-radio platformasi. Foydalanuvchi Telegram ichida Mini App ochadi, **til tanlaydi (RU / LT / EN)**, AI boshlovchi efirini o'z tilida tinglaydi, jonli chatда (Telegram uslubida) suhbatlashadi yoki **studiyaga** (efirga) zayavka yuboradi.

**Asosiy g'oya (boshliq talabi):**
- Radiopotok ostida **jonli chat** ishlaydi — odamlar yozadi, ovozli xabar yuboradi (xuddi Telegram guruhidek).
- Ikki yo'nalish: **«в чат»** (oddiy suhbat) yoki **«в студию»** (efir uchun zayavka).
- ИИ chatда foydalanuvchining **kayfiyatiga qarab** javob beradi.
- Studiyaga yuborilgan xabar chatда **ham ko'rinadi** (dinamika uchun) va **moderator/AI** ga boradi.
- ИИ studiya zayavkalaridan **bitta umumiy mavzu (сливки)** chiqaradi → rus tilida sstsenariy → **avtomatik LT/EN tarjima** → 3 tilli ovoz → 3 parallel Icecast potok.
- Har kim **o'z tilida** tinglaydi, lekin efir mohiyati bitta.

**Stek:** Python + FastAPI + PostgreSQL + WebSocket + Google **Gemini** (matn/tahlil/tarjima) + ElevenLabs/edge-tts (TTS) + faster-whisper (STT) + Telegram Bot + Vanilla JS Mini App + Icecast (3 potok) + cloudflared.

---

## 2. Konsepsiya evolyutsiyasi (nima o'zgardi)

Loyiha bir necha bosqichда qayta ishlandi:
1. **v1**: ИИ har bir odamga 1-на-1 javob berardi, shahar tanlash (Vilnyus/Varshava) bor edi.
2. **v2**: «Jonli chat + ИИ agregatsiya + moderator» — shahar olib tashlandi, global efir.
3. **v3 (joriy)**: `multilang-studio-broadcast` — **multiyazык studiya** konsepsiyasi:
   - Chat va Studiya ajratildi (ikki tugma: matn + ovoz uchun)
   - Poin = limit/balans (sarflanadi), admin qo'lда to'ldiradi
   - RU/LT/EN — interfeys + efir tili
   - 3 parallel Icecast potok (`/live_ru`, `/live_lt`, `/live_en`)
   - ИИ kayfiyatga qarab chatда javob beradi
   - Brend «Sfera5» → **«Radio AI»**

Spec hujjatlar: `.kiro/specs/multilang-studio-broadcast/` (requirements, design, tasks).

---

## 3. To'liq ISHLAYDIGAN funksiyalar ✅

### 3.1. Interfeys (3 ekran)
- **Анонсы** (boshlang'ich): til tanlash RU/LT/EN + 2 banner oynasi (admin tahrirlaydi)
- **Эфир**: AI radio pleer + jonli chat (ixcham, ekranга sig'adi)
- **Профиль**: ID, **balans (POINT)**, rol, daraja, psixotip

### 3.2. Til tanlash — RU / LT / EN
- Bitta tanlov hammasini boshqaradi: interfeys tili + efir potoki tili
- Polyak (PL) butunlay olib tashlandi
- Backend: `users.language` (interfeys) + `users.broadcast_lang` (efir)
- Tanlaганда `/live_{lang}` potokiga avtomatik o'tadi (Icecast rejimida)

### 3.3. Jonli chat — Telegram uslubi (asosiy)
- Pastда: 🎤 mikrofon + matn maydoni (doim ko'rinadi)
- Ikki tugma: **«Отправить в чат»** / **«Отправить в студию»**
- Matn ham, **ovoz** ham — ikkala yo'nalishga yuborilishi mumkin
- Ovoz yozilgach «в чат / в студию» tanlash so'raladi (xuddi Telegramдек)
- Ovozli xabar chatда audio-pleer ko'rinishida

### 3.4. ИИ kayfiyatga qarab javob (Gemini)
- Odam chatga yozsa, ИИ **psixotipini** aniqlaydi (optimist/melanxolik/ratsional)
- Kayfiyatga **MOS** javob beradi (quvnoq / hamdard / aniq)
- Chatда «🤖 ИИ-ведущий» sifatida ko'rinadi
- Gemini kvota tugaganда kalit so'z fallback ishlaydi (tizim to'xtamaydi)

### 3.5. Poin tizimi (cost-модель)
- Poin = **balans/limit** (sarflanadi), admin **qo'lда** to'ldiradi (`/admin/points/add`)
- Chat matn/ovoz — limit oladi; Studiya: matn = 1 poin, ovoz = 2 poin (STT uchun)
- Atomar yechim — balans hech qachon manfiy bo'lmaydi
- Avto rol ko'tarilishi YO'Q — rollar qo'lда (`/admin/users/{id}/role`)

### 3.6. Studiya «sehri»
- Studiyaga yuborilgan xabar: (a) chatга dublanadi — hamma ko'radi, (b) `messages(is_for_studio=true)` belgilanadi → moderator/AI ga
- Faqat `aktivniy`+ rol studiyaga yubora oladi
- Ovoz studiyaga: fonда STT → AI tahlil, audiofayl **darhol o'chiriladi** (media saqlanmaydi)

### 3.7. ИИ-agregatsiya
- `services/aggregator.py` — fon jarayoni
- Studiya zayavkalaridan (RU/LT/EN aralash) **bitta rus sstsenariy** chiqaradi («сливки»)
- `broadcast_drafts` (pending) → moderatorga WebSocket xabar

### 3.8. Multiyazык efir (ядро)
- Moderator draftни tasdiqlasa → **avtomatik tarjima** (RU → LT, EN) Gemini orqali
- Har til uchun TTS ovoz (ElevenLabs asosiy, edge-tts fallback) — 3 mp3
- 3 parallel Icecast potok: `/live_ru`, `/live_lt`, `/live_en`
- Har kim o'z tilini tinglaydi, mohiyat bitta

### 3.9. Moderator paneli (mobile)
- `admin.html` — telefonда qulay
- Studio draftlarni ko'rish, tahrirlash, «Одобрить» / «Отклонить»
- Anons banner oynalarini tahrirlash
- Faqat «Одобрить» bosilgach matn → tarjima → TTS → efir

### 3.10. Telegram bot
- `/start`, `/radio`, `/profile`, `/admin`, `/help`
- WebApp menu tugmasi avtomatik
- Brend «Radio AI» (Sfera5 butunlay olib tashlandi)

### 3.11. Android stabillik
- `Telegram.WebApp` to'g'ri init (disableVerticalSwipes, enableClosingConfirmation)
- Real viewport balandligi (`--app-vh`) — skrinshot/fokus o'zgarганда app yopilmaydi
- Layout ixcham — chat input doim ko'rinadi (ekranга sig'adi)

---

## 4. Texnik tuzilma (asosiy o'zgargan fayllar)

```
sfera5-radio/
├── radio-api/                       ← FastAPI backend
│   ├── routers/
│   │   ├── chat.py                  ← chat (limit) + studiya + ИИ kayfiyat-javob
│   │   ├── messages.py              ← ovoz chat/studiya (destination), STT, auto-delete
│   │   ├── users.py                 ← /me/broadcast-lang (RU/LT/EN)
│   │   └── admin.py                 ← approve → tarjima + 3 TTS + 3 push; anonslar; poin/rol
│   ├── services/
│   │   ├── points.py                ← spend() cost-модель (atomar, manfiy emas)
│   │   ├── aggregator.py            ← studiya zayavkalaridan «сливки» → draft
│   │   ├── gemini.py                ← generate + translate (LT/EN)
│   │   ├── tts.py                   ← ElevenLabs + edge-tts fallback, multilang
│   │   ├── broadcast.py             ← 3 potok Icecast (push_files_multilang)
│   │   ├── psychotype.py            ← kayfiyat aniqlash
│   │   └── assistant.py             ← kayfiyatga mos javob
│   ├── state.py                     ← stream_url(lang) → /live_{lang}
│   ├── models.py                    ← broadcast_lang, draft tarjimalar
│   └── db/schema.sql                ← is_for_studio, lang, broadcast_lang, script_lt/en, audio_*
├── radio-host/main.py               ← AI host (AI_AUTO_BROADCAST flag)
├── telegram-bot/bot.py              ← Radio AI brend, /admin
├── miniapp/
│   ├── index.html / radio.html      ← 3 ekran, 2 tugma, cache-bust ?v=7
│   ├── app.js                       ← chat/studiya/ovoz logikasi, AI javob
│   ├── admin.html/.css/.js          ← moderator paneli
│   ├── style.css                    ← ixcham layout (chat doim ko'rinadi)
│   ├── i18n.js                      ← RU/LT/EN tarjimalar
│   └── config.js                    ← Android-stabil TG init
├── icecast.xml                      ← 3 mountpoint (/live_ru, /live_lt, /live_en)
├── run-dev.sh / stop-dev.sh         ← dev ishga tushirish/to'xtatish
└── .kiro/specs/multilang-studio-broadcast/  ← requirements + design + tasks
```

**Baza jadvallari:** users (+broadcast_lang), psychotypes, messages (+is_for_studio, +lang), chat_messages, broadcasts, cities, points_history, announcements, broadcast_drafts (+script_lt/en, +audio_ru/lt/en)

---

## 5. Test natijalari (haqiqiy, 9-iyun) — TZ v2.0 bo'yicha 10/10 ✅

| TZ bo'lim | Test | Natija |
|---|---|---|
| §2 | Auth (Telegram) + profil/balans | ✅ |
| §7 | Vilnyus shahri (arxitektura kengaytirishga tayyor) | ✅ |
| §3.1 | Chatда matn yozish (limit bilan) | ✅ |
| §10 | AI psixotip-javob (kayfiyatga qarab) | ✅ |
| §3.2 | Studiyaga yuborish | ✅ |
| §3.2 | Studiya xabari chatда ham ko'rinadi | ✅ |
| §3 | **Ovoz → chatga + tarixда saqlanadi** (bug tuzatildi) | ✅ |
| §3 | Ovoz → studiyaga | ✅ |
| — | **Fayl → chatga + tarixда saqlanadi** (yangi) | ✅ |
| §7 | Approve → 3 til efir (RU/LT/EN) | ✅ |

### TZ v2.0 bo'yicha tuzatilган muhim kamchiliklar
1. 🔴→✅ **Ovozli xabar chatда saqlanmasdi** — endi `chat_messages.message_type` + `audio_file_path` orqali saqlanadi (sahifa yangilanса yo'qolmaydi, qayta tinglash mumkin)
2. 🆕 **Fayl yuborish (📎)** — Telegram uslubida rasm/hujjat/audio (`/messages/file`, 20MB gacha, tur tekshiruvi)
3. ✅ **Vilnyus shahri** qo'shildi (TZ: hozircha Vilnyus, arxitektura kengaytirishga tayyor)
4. ✅ Chat xabar turlari (`text` | `voice` | `studio` | `studio_voice` | `file`) — TZ §3.3 `message_type` bo'yicha

---

## 6. Ishga tushirish

```bash
cd /mnt/d/ai_astitentbot/sfera5-radio
bash run-dev.sh      # PG + backend + AI host + tunnel + bot
bash stop-dev.sh     # to'xtatish
```

Bot: **@sfera5radio_bot** → /start → «Войти в радио».
Admin panel: Профиль → «🛠 Админ-панель» yoki botда `/admin`.

---

## 7. Muhim eslatmalar

1. **Dev muhit vaqtinchalik** — cloudflared tunnel URL har ishga tushganда o'zgaradi. Eski versiya keshlanmasligi uchun fayllarга `?v=7` qo'shilgan.
2. **Gemini bepul kalit** — kunlik kvota cheklangan; tugaganда fallback (kalit so'z tahlili / RU matn) ishlaydi. Production'да pullik/katta kvota kerak.
3. **3 tilli Icecast efir** — to'liq faqat **serverга joylaganда** ishlaydi (`USE_ICECAST=true`). Dev'да AI segment playlist rejimi (tushib qolmaydi). `icecast.xml` tayyor.
4. **ElevenLabs** — `.env` da `ELEVENLABS_API_KEY` qo'yilsa ishlaydi, aks holda edge-tts fallback.
5. **Media saqlanmaydi** — ovozli xabarlar STT'dan keyin darhol o'chiriladi.
6. **Efir faqat moderator orqali** — ИИ matni avtomatik efirga chiqmaydi.
7. **Fundament saqlandi** — WebSocket arxitekturasi, JWT auth, asyncpg baza buzilmadi (additiv migratsiya).

---

## 8. Serverга joylash uchun qoladiganlar

- ✅ **Icecast 3 tilli efir LOKALДА ULANDI VA ISHLAYAPTI** (9-iyun):
  - Icecast2 o'rnatildi, `icecast.local.xml` (3 mount: /live_ru, /live_lt, /live_en) bilan ishga tushdi
  - `USE_ICECAST=true`, `ICECAST_HOST=localhost`
  - Moderator approve → tarjima → 3 TTS → Icecast 3 mountга push → **3 mount aktiv** ✅
  - Backend proxy `/radio/live/{lang}` qo'shildi → telefon tunnel orqali Icecast oqimini eshitadi ✅
  - To'liq zanjir test qilindi: studiya → agregatsiya → approve → 3 til → Icecast → proxy → telefon ✅
- `ELEVENLABS_API_KEY` qo'yilsa sifatli TTS (hozir edge-tts fallback ishlaydi)
- `COMMUNITY_CHAT_ID` + `DISABLE_GROUP_CHECK=false` → faqat guruh a'zolari kiradi
- Doimiy domen (tunnel o'rniga) → URL o'zgarmaydi
- **Uzluksiz oqim** — hozir har segment alohida push bo'ladi (orasiда qisqa jimlik). To'liq uzluksiz radio uchun liquidsoap yoki FFmpeg concat demoni qo'shish mumkin (keyingi bosqich)

### Icecast'ни qayta ishga tushirish (lokal test)
```bash
# Icecast (3 mount)
icecast2 -c /mnt/d/ai_astitentbot/sfera5-radio/icecast.local.xml &
# .env da USE_ICECAST=true, ICECAST_HOST=localhost
bash run-dev.sh
```
