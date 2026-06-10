// i18n — til tanlash (RU / LT / EN). Til = interfeys + efir potoki.
const TRANSLATIONS = {
    ru: {
        lang_name: "Русский",
        brand_sub: "RADIO",
        choose_lang: "Выберите язык",

        // Nav
        nav_anons: "Анонсы",
        nav_efir: "Эфир",
        nav_profile: "Профиль",

        // Анонсы
        anons_title: "📢 АНОНСЫ",
        anons_sub: "Новости и события эфира",
        anons_lang_hint: "Язык интерфейса и эфира",

        // Эфир
        level: "УРОВЕНЬ",
        stream_realtime: "ПОТОК REAL TIME",
        stream_active: "ПОТОК АКТИВЕН",
        activation: "АКТИВАЦИЯ ПОТОКА",
        ai_host: "🤖 ИИ ВЕДУЩИЙ",
        chat_title: "💬 ЖИВОЙ ЧАТ",
        chat_placeholder: "Сообщение...",
        send_to_chat: "Отправить в чат",
        send_to_studio: "Отправить в студию",
        voice_message: "Голосовое сообщение",
        go_live: "🔴 ВЫЙТИ В ПРЯМОЙ ЭФИР",
        end_live: "⏹ ЗАВЕРШИТЬ ЭФИР",

        // Points
        points_label: "POINT",
        points_balance: "Ваш баланс",

        // Profile
        profile_title: "👤 ПРОФИЛЬ",
        pf_role: "Роль", pf_points: "Баллы", pf_level: "Уровень",
        pf_lang: "Язык", pf_tone: "Эмоция", pf_focus: "Фокус", pf_topic: "Тема",
        psycho_title: "🧠 Психотип",

        // Onboarding
        onb_title: "Добро пожаловать в Radio AI!",
        onb_1: "Слушайте прямой эфир на своём языке",
        onb_2: "Общайтесь в чате — это бесплатно",
        onb_3: "Отправляйте заявки в студию для эфира",
        onb_btn: "Начать 🚀",

        // Toasts
        toast_sent_chat: "✅ Отправлено в чат!",
        toast_sent_studio: "🎙 Заявка отправлена в студию!",
        toast_mic_denied: "Нет доступа к микрофону",
        toast_recording: "🎤 Запись... нажмите снова чтобы остановить",
        toast_processing: "⏳ Отправка...",
        toast_accepted: "✅ Принято!",
        toast_short: "⚠️ Слишком коротко, попробуйте ещё раз",
        toast_limit: "⚠️ Недостаточно поинтов на балансе",
        studio_denied_role: "🔒 Студия доступна с роли «Активный»",
        voice_ready: "🎤 Голос записан — выберите, куда отправить:",
    },
    lt: {
        lang_name: "Lietuvių",
        brand_sub: "RADIJAS",
        choose_lang: "Pasirinkite kalbą",

        nav_anons: "Anonsai",
        nav_efir: "Eteris",
        nav_profile: "Profilis",

        anons_title: "📢 ANONSAI",
        anons_sub: "Eterio naujienos ir įvykiai",
        anons_lang_hint: "Sąsajos ir eterio kalba",

        level: "LYGIS",
        stream_realtime: "SRAUTAS REAL TIME",
        stream_active: "SRAUTAS AKTYVUS",
        activation: "SRAUTO AKTYVAVIMAS",
        ai_host: "🤖 DI VEDĖJAS",
        chat_title: "💬 GYVAS POKALBIS",
        chat_placeholder: "Žinutė...",
        send_to_chat: "Siųsti į pokalbį",
        send_to_studio: "Siųsti į studiją",
        voice_message: "Balso žinutė",
        go_live: "🔴 PRADĖTI TIESIOGINĘ",
        end_live: "⏹ BAIGTI ETERĮ",

        points_label: "POINT",
        points_balance: "Jūsų balansas",

        profile_title: "👤 PROFILIS",
        pf_role: "Vaidmuo", pf_points: "Taškai", pf_level: "Lygis",
        pf_lang: "Kalba", pf_tone: "Emocija", pf_focus: "Fokusas", pf_topic: "Tema",
        psycho_title: "🧠 Psichotipas",

        onb_title: "Sveiki atvykę į Radio AI!",
        onb_1: "Klausykitės tiesioginio eterio savo kalba",
        onb_2: "Bendraukite pokalbyje — tai nemokama",
        onb_3: "Siųskite paraiškas į studiją eteriui",
        onb_btn: "Pradėti 🚀",

        toast_sent_chat: "✅ Išsiųsta į pokalbį!",
        toast_sent_studio: "🎙 Paraiška išsiųsta į studiją!",
        toast_mic_denied: "Nėra prieigos prie mikrofono",
        toast_recording: "🎤 Įrašoma... paspauskite dar kartą",
        toast_processing: "⏳ Siunčiama...",
        toast_accepted: "✅ Priimta!",
        toast_short: "⚠️ Per trumpa, bandykite dar kartą",
        toast_limit: "⚠️ Nepakanka taškų balanse",
        studio_denied_role: "🔒 Studija prieinama nuo „Aktyvaus“ vaidmens",
        voice_ready: "🎤 Balsas įrašytas — pasirinkite, kur siųsti:",
    },
    en: {
        lang_name: "English",
        brand_sub: "RADIO",
        choose_lang: "Choose language",

        nav_anons: "News",
        nav_efir: "Live",
        nav_profile: "Profile",

        anons_title: "📢 NEWS",
        anons_sub: "Broadcast news and events",
        anons_lang_hint: "Interface & broadcast language",

        level: "LEVEL",
        stream_realtime: "REAL TIME STREAM",
        stream_active: "STREAM ACTIVE",
        activation: "STREAM ACTIVATION",
        ai_host: "🤖 AI HOST",
        chat_title: "💬 LIVE CHAT",
        chat_placeholder: "Message...",
        send_to_chat: "Send to chat",
        send_to_studio: "Send to studio",
        voice_message: "Voice message",
        go_live: "🔴 GO LIVE",
        end_live: "⏹ END BROADCAST",

        points_label: "POINT",
        points_balance: "Your balance",

        profile_title: "👤 PROFILE",
        pf_role: "Role", pf_points: "Points", pf_level: "Level",
        pf_lang: "Language", pf_tone: "Emotion", pf_focus: "Focus", pf_topic: "Topic",
        psycho_title: "🧠 Psychotype",

        onb_title: "Welcome to Radio AI!",
        onb_1: "Listen to the live broadcast in your language",
        onb_2: "Chat freely — it's free",
        onb_3: "Send requests to the studio for the broadcast",
        onb_btn: "Start 🚀",

        toast_sent_chat: "✅ Sent to chat!",
        toast_sent_studio: "🎙 Request sent to studio!",
        toast_mic_denied: "No microphone access",
        toast_recording: "🎤 Recording... tap again to stop",
        toast_processing: "⏳ Sending...",
        toast_accepted: "✅ Accepted!",
        toast_short: "⚠️ Too short, please try again",
        toast_limit: "⚠️ Not enough points on balance",
        studio_denied_role: "🔒 Studio available from the «Active» role",
        voice_ready: "🎤 Voice recorded — choose where to send:",
    },
};

const LS_LANG = "sfera5_lang";

function getLang() {
    return localStorage.getItem(LS_LANG) || "ru";
}

function setLang(lang) {
    if (TRANSLATIONS[lang]) localStorage.setItem(LS_LANG, lang);
}

function t(key) {
    const lang = getLang();
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.ru[key] || key;
}

// data-i18n atributли elementlarni tarjima qiladi
function applyTranslations(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        const val = t(key);
        if (el.hasAttribute("data-i18n-html")) {
            el.innerHTML = val.replace(/\n/g, "<br>");
        } else {
            el.textContent = val;
        }
    });
    root.querySelectorAll("[data-i18n-ph]").forEach((el) => {
        el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
}
