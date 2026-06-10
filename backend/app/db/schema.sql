CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username    VARCHAR(255),
    full_name   VARCHAR(255),
    city        VARCHAR(50),
    role        VARCHAR(20) DEFAULT 'slusatel',
    points      INTEGER DEFAULT 0,
    language    VARCHAR(5) DEFAULT 'ru',
    created_at  TIMESTAMP DEFAULT NOW(),
    last_seen   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS psychotypes (
    id                 SERIAL PRIMARY KEY,
    user_id            INTEGER REFERENCES users(id) ON DELETE CASCADE,
    focus_of_attention VARCHAR(20),
    emotional_tone     VARCHAR(20),
    key_topic          VARCHAR(100),
    priority_score     INTEGER,
    raw_json           JSONB,
    created_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    city        VARCHAR(50),
    text        TEXT,
    audio_path  VARCHAR(500),
    status      VARCHAR(20) DEFAULT 'pending',
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    city       VARCHAR(50),
    message    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broadcasts (
    id               SERIAL PRIMARY KEY,
    city             VARCHAR(50),
    script           TEXT,
    broadcaster_type VARCHAR(20),
    duration_sec     INTEGER,
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cities (
    id         SERIAL PRIMARY KEY,
    name_ru    VARCHAR(100),
    name_uz    VARCHAR(100),
    country_ru VARCHAR(100) DEFAULT 'Узбекистан',
    country_uz VARCHAR(100) DEFAULT 'Oʻzbekiston',
    slug       VARCHAR(50) UNIQUE,
    lat        FLOAT,
    lng        FLOAT,
    is_active  BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS points_history (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_type  VARCHAR(20) NOT NULL,   -- 'appeal' | 'chat' | 'listen' | 'admin'
    amount      INTEGER NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_points_history_user_day ON points_history(user_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_city ON chat_messages(city, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_city ON messages(city, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_psychotypes_user ON psychotypes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);

INSERT INTO cities (name_ru, name_uz, country_ru, country_uz, slug, lat, lng) VALUES
    ('Прямой эфир', 'Efir', '', '', 'global', 0, 0)
ON CONFLICT (slug) DO NOTHING;

-- ============ Анонсы (2 окна на стартовом экране, редактирует админ) ============
CREATE TABLE IF NOT EXISTS announcements (
    slot       INTEGER PRIMARY KEY,   -- 1 yoki 2
    title      VARCHAR(200) DEFAULT '',
    text       TEXT DEFAULT '',
    emoji      VARCHAR(16) DEFAULT '📻',
    image_url  VARCHAR(500) DEFAULT '',
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO announcements (slot, title, text, emoji) VALUES
    (1, 'Добро пожаловать в эфир!', 'Слушайте прямой эфир и общайтесь в живом чате.', '🎙'),
    (2, 'Как это работает', 'ИИ собирает сообщения чата и формирует выпуск, который модератор выводит в эфир.', '🤖')
ON CONFLICT (slot) DO NOTHING;

-- ============ Черновики эфира (ИИ-агрегация → модератор → эфир) ============
CREATE TABLE IF NOT EXISTS broadcast_drafts (
    id            SERIAL PRIMARY KEY,
    city          VARCHAR(50) NOT NULL,
    main_topic    VARCHAR(200),
    source_count  INTEGER DEFAULT 0,
    script        TEXT NOT NULL,
    status        VARCHAR(20) DEFAULT 'pending',  -- pending | approved | rejected
    moderator_id  BIGINT,
    created_at    TIMESTAMP DEFAULT NOW(),
    decided_at    TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON broadcast_drafts(status, created_at DESC);

-- Chat xabarlari agregatsiyada qayta ishlatilmasligi uchun belgi
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS aggregated BOOLEAN DEFAULT false;

-- ============ multilang-studio-broadcast (refactor) ============
-- Заявки "в студию": пометка + язык исходной заявки
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_for_studio BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS lang VARCHAR(5);  -- ru | lt | en | NULL
CREATE INDEX IF NOT EXISTS idx_messages_studio
    ON messages(is_for_studio, status, created_at DESC);

-- Язык эфира пользователя (RU/LT/EN), отдельно от users.language (интерфейс)
ALTER TABLE users ADD COLUMN IF NOT EXISTS broadcast_lang VARCHAR(5) DEFAULT 'ru';

-- Драфты: переводы (LT/EN) и пути к аудио по языкам
ALTER TABLE broadcast_drafts ADD COLUMN IF NOT EXISTS script_lt TEXT;
ALTER TABLE broadcast_drafts ADD COLUMN IF NOT EXISTS script_en TEXT;
ALTER TABLE broadcast_drafts ADD COLUMN IF NOT EXISTS audio_ru VARCHAR(500);
ALTER TABLE broadcast_drafts ADD COLUMN IF NOT EXISTS audio_lt VARCHAR(500);
ALTER TABLE broadcast_drafts ADD COLUMN IF NOT EXISTS audio_en VARCHAR(500);

-- ============ TZ v2.0 — chat ovozli/fayl xabarlar (persistent) ============
-- Chatда matn/ovoz turini va audio fayl yo'lini saqlaymiz (TZ: message_type, audio_file_path)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text';  -- text | voice | studio | studio_voice
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS audio_file_path VARCHAR(500);

-- Vilnyus shahri (TZ: hozircha faqat Vilnyus, global orqaga moslik uchun qoladi)
INSERT INTO cities (name_ru, name_uz, country_ru, country_uz, slug, lat, lng, is_active) VALUES
    ('Вильнюс', 'Vilnyus', 'Литва', 'Litva', 'vilnius', 54.6872, 25.2797, true)
ON CONFLICT (slug) DO NOTHING;
