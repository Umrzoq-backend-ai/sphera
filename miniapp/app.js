// Sfera5 Radio — asosiy ekran logikasi
// Konsepsiya: jonli chat (Telegram uslubi) + ИИ agregatsiya + moderator.
// ИИ chatда 1-на-1 javob bermaydi.

function getCityFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("city") || localStorage.getItem(LS_CITY) || "global";
}

const CITY = getCityFromUrl();

let ws = null;
let isPlaying = false;
let isLive = false;
let mediaRecorder = null;
let audioChunks = [];
let profileData = null;
let currentScreen = "anons";

const ROLE_NAMES = {
    slusatel: "Слушатель",
    aktivniy: "Активный",
    doverenniy: "Доверенный",
    admin: "Администратор",
};
const TONE_NAMES = {
    optimist: "Оптимист 😊",
    melanxolik: "Меланхолик 😔",
    ratsional: "Рациональный 🧩",
};
const FOCUS_NAMES = {
    vnutrenniy: "Внутренний",
    vneshniy: "Внешний",
};
const LANG_NAMES = { ru: "Русский", lt: "Lietuvių", en: "English" };
const BROADCAST_LANGS = ["ru", "lt", "en"];

function currentBroadcastLang() {
    return getLang();  // til = interfeys + efir potoki (bitta tanlov)
}
function streamUrlForLang(lang) {
    // Backend proxy orqali — tunnel/telefonда ham ishlaydi (Icecast localhost yashirin)
    return `${API_URL}/radio/live/${lang}`;
}

const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const visualizer = document.getElementById("visualizer");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");

// ---------- Init ----------
async function init() {
    applyTranslations();
    buildVisualizerBars();

    if (!getToken()) {
        try { await authenticate(); } catch (e) { console.error("Auth failed:", e); }
    }

    await loadProfile();
    await loadAnnouncements();
    await loadRadioStatus();
    await loadChatHistory();
    connectWebSocket();
    await setupRadioStream();
    bindEvents();
    setupNav();
    setupLangPills();
    maybeShowOnboarding();
}

// ---------- Onboarding ----------
function maybeShowOnboarding() {
    if (!localStorage.getItem("sfera5_onboarded")) {
        document.getElementById("onboarding").classList.remove("hidden");
    }
}

// ---------- Navigation (3 ekran) ----------
function setupNav() {
    document.querySelectorAll(".nav-item").forEach((btn) => {
        btn.addEventListener("click", () => switchScreen(btn.getAttribute("data-nav"), btn));
    });
}

function switchScreen(name, btn) {
    currentScreen = name;
    document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
    const target = document.getElementById("screen-" + name);
    if (target) target.classList.remove("hidden");

    document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    if (name === "profile") renderProfile();
    if (name === "efir") setTimeout(scrollChatBottom, 50);
}

// ---------- Til tanlash (interfeys + efir potoki) ----------
function setupLangPills() {
    const pills = document.querySelectorAll(".lang-pill");
    pills.forEach((b) => {
        if (b.getAttribute("data-lang") === getLang()) b.classList.add("active");
        b.addEventListener("click", async () => {
            const lang = b.getAttribute("data-lang");
            setLang(lang);
            pills.forEach((x) => x.classList.remove("active"));
            b.classList.add("active");
            // Interfeys tilini saqlaymiz
            try {
                await fetch(`${API_URL}/users/me/language`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", ...authHeaders() },
                    body: JSON.stringify({ language: lang }),
                });
            } catch (e) { console.error(e); }
            // Efir tilini (broadcast_lang) saqlaymiz
            try {
                await fetch(`${API_URL}/users/me/broadcast-lang`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", ...authHeaders() },
                    body: JSON.stringify({ broadcast_lang: lang }),
                });
            } catch (e) { console.error(e); }
            applyTranslations();
            if (profileData) document.getElementById("pf-lang").textContent =
                LANG_NAMES[lang] || lang;
            // Efir potokini sahifani qayta yuklamasdan almashtiramiz
            switchStreamToLang(lang);
        });
    });
}

// Tanlangan til potokiga audio.src ni o'tkazadi (Icecast rejimida)
function switchStreamToLang(lang) {
    if (!useIcecast) return;  // dev (playlist) rejimida potok URL yo'q
    const url = streamUrlForLang(lang);
    if (audio.src !== url) {
        audio.src = url;
        if (isPlaying) audio.play().catch(() => {});
    }
}

// ---------- Анонсы (banner oynalari) ----------
async function loadAnnouncements() {
    try {
        const resp = await fetch(`${API_URL}/admin/announcements`);
        if (!resp.ok) return;
        const data = await resp.json();
        renderBanner("banner1", data.banner1);
        renderBanner("banner2", data.banner2);
    } catch (e) {
        console.error("Announcements error:", e);
    }
}

function renderBanner(prefix, b) {
    if (!b) return;
    const title = document.getElementById(prefix + "Title");
    const text = document.getElementById(prefix + "Text");
    const img = document.getElementById(prefix + "Img");
    if (title) title.textContent = b.title || "";
    if (text) text.textContent = b.text || "";
    if (img) {
        if (b.image_url) {
            img.style.backgroundImage = `url('${b.image_url}')`;
            img.classList.add("has-img");
        } else {
            img.textContent = b.emoji || "📻";
        }
    }
}

// ---------- Visualizer ----------
function buildVisualizerBars() {
    const core = document.getElementById("vizCore");
    core.innerHTML = "";
    for (let i = 0; i < 16; i++) {
        const bar = document.createElement("span");
        bar.className = "bar";
        bar.style.animationDelay = (i * 0.06) + "s";
        core.appendChild(bar);
    }
}

// ---------- Profile ----------
async function loadProfile() {
    try {
        const resp = await fetch(`${API_URL}/users/me`, { headers: authHeaders() });
        if (!resp.ok) return;
        const data = await resp.json();
        profileData = data;
        document.getElementById("userId").textContent = data.telegram_id;
        document.getElementById("points").textContent = data.points;
        localStorage.setItem(LS_ROLE, data.role);

        const level = Math.floor((data.points || 0) / 100) + 1;
        document.getElementById("level").textContent = level;

        const isDoverenniy = data.role === "doverenniy" || data.role === "admin";
        if (isDoverenniy) {
            document.getElementById("goLiveBtn").classList.remove("hidden");
        }
    } catch (e) {
        console.error("Profile error:", e);
    }
}

function renderProfile() {
    if (!profileData) return;
    const d = profileData;
    document.getElementById("pf-id").textContent = d.telegram_id;
    document.getElementById("pf-role").textContent = ROLE_NAMES[d.role] || d.role;
    document.getElementById("pf-lang").textContent = LANG_NAMES[getLang()] || getLang();
    document.getElementById("pf-points-big").textContent = d.points;
    document.getElementById("pf-level").textContent = Math.floor((d.points || 0) / 100) + 1;

    const pt = d.psychotype;
    if (pt) {
        document.getElementById("pf-tone").textContent = TONE_NAMES[pt.emotional_tone] || "—";
        document.getElementById("pf-focus").textContent = FOCUS_NAMES[pt.focus_of_attention] || "—";
        document.getElementById("pf-topic").textContent = pt.key_topic || "—";
    } else {
        document.getElementById("pf-tone").textContent = "Отправьте сообщение";
        document.getElementById("pf-focus").textContent = "—";
        document.getElementById("pf-topic").textContent = "—";
    }

    const hints = {
        slusatel: "🎧 Вы — Слушатель. Общайтесь в чате и копите баллы.",
        aktivniy: "✅ Вы — Активный! Ваши сообщения попадают в сводку эфира.",
        doverenniy: "🔴 Вы — Доверенный! Доступен прямой выход в эфир.",
        admin: "👑 Вы — Администратор. Полный доступ.",
    };
    document.getElementById("roleHint").textContent = hints[d.role] || "";

    // Admin uchun admin panel havolasi
    const adminLink = document.getElementById("adminLink");
    if (adminLink) {
        if (d.role === "admin") adminLink.classList.remove("hidden");
        else adminLink.classList.add("hidden");
    }
}

// ---------- Radio status ----------
async function loadRadioStatus() {
    try {
        const resp = await fetch(`${API_URL}/radio/status?city=${CITY}`);
        const data = await resp.json();
        updateRadioUI(data);
    } catch (e) {
        console.error("Radio status error:", e);
    }
}

function updateRadioUI(data) {
    const name = document.getElementById("broadcasterName");
    if (data.is_live) {
        if (data.broadcaster_type === "doverenniy") {
            name.textContent = "🔴 " + (data.broadcaster_name || "В ЭФИРЕ");
            if (!isLive && data.use_icecast && data.stream_url) {
                switchToLiveStream(data.stream_url);
            }
        } else {
            name.textContent = "🤖 ИИ ВЕДУЩИЙ";
        }
    } else {
        name.textContent = "АКТИВАЦИЯ ПОТОКА";
    }
    if (typeof data.listeners_count === "number") {
        const lbl = document.getElementById("listenersLabel");
        if (lbl) lbl.textContent = "🎧 " + data.listeners_count;
    }
}

function switchToLiveStream(streamUrl) {
    if (audio.src !== streamUrl) {
        audio.src = streamUrl;
        if (isPlaying) audio.play().catch(() => {});
    }
}

// ---------- Radio stream (Icecast yoki AI segment playlist) ----------
let useIcecast = false;
let playlist = [];
let currentSegIdx = -1;

async function setupRadioStream() {
    audio.volume = 0.8;
    try {
        const resp = await fetch(`${API_URL}/radio/status?city=${CITY}`);
        const data = await resp.json();
        useIcecast = !!data.use_icecast;
    } catch (e) {
        console.error(e);
    }

    if (useIcecast) {
        // Tanlangan til potokini tinglaymiz (/live_{lang})
        audio.src = streamUrlForLang(currentBroadcastLang());
    } else {
        audio.addEventListener("ended", playNextSegment);
        await loadPlaylist();
    }
}

async function loadPlaylist() {
    try {
        const resp = await fetch(`${API_URL}/radio/playlist?city=${CITY}`);
        playlist = await resp.json();
    } catch (e) {
        console.error("Playlist error:", e);
        playlist = [];
    }
}

function handleNewSegment(seg) {
    playlist.push({
        id: seg.id,
        url: seg.url,
        script: seg.script,
        duration_sec: seg.duration_sec,
    });
    if (isPlaying && (audio.paused || audio.ended)) {
        playNextSegment();
    }
}

function playNextSegment() {
    if (!playlist.length) {
        visualizer.classList.remove("playing");
        return;
    }
    currentSegIdx = (currentSegIdx + 1) % playlist.length;
    const seg = playlist[currentSegIdx];
    audio.src = `${API_URL}${seg.url}`;
    if (isPlaying) {
        audio.play().catch((e) => console.error("Segment play:", e));
        visualizer.classList.add("playing");
    }
}

function togglePlay() {
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        playBtn.textContent = "▶";
        visualizer.classList.remove("playing");
        return;
    }

    isPlaying = true;
    playBtn.textContent = "⏸";

    if (!useIcecast && (!audio.src || audio.src === location.href)) {
        if (playlist.length) {
            playNextSegment();
            return;
        }
        showToast("⏳ Ожидание эфира ИИ-ведущего...");
        isPlaying = false;
        playBtn.textContent = "▶";
        return;
    }

    audio.play().then(() => {
        visualizer.classList.add("playing");
    }).catch((e) => {
        showToast("Не удалось запустить поток");
        console.error("Play error:", e);
        isPlaying = false;
        playBtn.textContent = "▶";
    });
}

// ---------- Chat history ----------
async function loadChatHistory() {
    try {
        const resp = await fetch(`${API_URL}/chat/${CITY}`);
        const messages = await resp.json();
        chatMessages.innerHTML = "";
        messages.forEach(addChatMessage);
        scrollChatBottom();
    } catch (e) {
        console.error("Chat history error:", e);
    }
}

function addChatMessage(msg) {
    const div = document.createElement("div");
    const time = new Date(msg.created_at).toLocaleTimeString("ru-RU", {
        hour: "2-digit", minute: "2-digit",
    });

    const myName = profileData
        ? (profileData.username || profileData.full_name || ("id" + profileData.telegram_id))
        : null;
    const isAi = (msg.username || "").includes("ИИ") || msg.kind === "ai";
    const isMine = myName && msg.username === myName;

    if (isAi) div.className = "chat-msg ai-msg";
    else if (isMine) div.className = "chat-msg my-msg";
    else div.className = "chat-msg other-msg";

    // Ovozli yoki fayl xabar — maxsus ko'rinish
    let body;
    if (msg.voice_url) {
        body = `<div class="voice-player">
            <button class="voice-play" data-url="${escapeAttr(msg.voice_url)}">▶</button>
            <span class="voice-wave">🎵 ${msg.duration_sec ? msg.duration_sec + "ʺ" : "голосовое"}</span>
        </div>`;
    } else if (msg.file_url) {
        const fname = msg.file_name || (msg.message || "файл").replace(/^📎\s*/, "");
        body = `<a class="file-chip" href="${escapeAttr(msg.file_url.startsWith('http') ? msg.file_url : API_URL + msg.file_url)}" target="_blank" rel="noopener">
            <span class="file-ic">📎</span>
            <span class="file-name">${escapeHtml(fname)}</span>
        </a>`;
    } else {
        body = `<div class="msg-text">${escapeHtml(msg.message || "")}</div>`;
    }

    if (isMine) {
        div.innerHTML = `<div class="bubble">${body}<span class="time">${time}</span></div>`;
    } else {
        div.innerHTML = `<div class="bubble">
            <span class="name">${escapeHtml(msg.username || "Гость")}</span>
            ${body}
            <span class="time">${time}</span></div>`;
    }
    chatMessages.appendChild(div);

    // Ovozli pleer tugmasi
    const vp = div.querySelector(".voice-play");
    if (vp) {
        vp.addEventListener("click", () => playVoiceBubble(vp));
    }
}

function playVoiceBubble(btn) {
    const url = btn.getAttribute("data-url");
    const full = url.startsWith("http") ? url : `${API_URL}${url}`;
    const a = new Audio(full);
    btn.textContent = "⏸";
    a.play().catch(() => { btn.textContent = "▶"; });
    a.addEventListener("ended", () => { btn.textContent = "▶"; });
}

function scrollChatBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
}
function escapeAttr(str) {
    return String(str == null ? "" : str).replace(/"/g, "&quot;");
}

// ---------- WebSocket ----------
function connectWebSocket() {
    const token = getToken();
    ws = new WebSocket(`${WS_URL}/chat/${CITY}/ws?token=${encodeURIComponent(token)}`);

    ws.onopen = () => console.log("WS connected");

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "chat") {
            addChatMessage(data.data);
            scrollChatBottom();
        } else if (data.type === "radio_status") {
            updateRadioUI(data.data);
        } else if (data.type === "presence") {
            updateRadioUI(data.data.radio);
        } else if (data.type === "new_segment") {
            updateRadioUI(data.data);
            handleNewSegment(data.data);
        } else if (data.type === "role_up") {
            if (profileData && data.data.telegram_id === profileData.telegram_id) {
                const names = { aktivniy: "Активный", doverenniy: "Доверенный 🔴" };
                showToast("🎉 Новая роль: " + (names[data.data.role] || data.data.role));
                loadProfile();
            }
        } else if (data.type === "studio_ack") {
            // Studio zayavkasi qabul qilindi — balansni yangilaymiz
            updatePointsDisplay(data.data.points);
            showToast(t("toast_sent_studio"));
        } else if (data.type === "limit_exceeded") {
            // Balans yetarli emas
            updatePointsDisplay(data.data.points);
            showToast(t("toast_limit"));
        } else if (data.type === "studio_denied") {
            // Rol yetarli emas (aktivniy+ kerak)
            showToast(t("studio_denied_role"));
        } else if (data.type === "balance") {
            // Chat xabari uchun limit yechildi — balansni yangilaymiz
            updatePointsDisplay(data.data.points);
        }
    };

    ws.onclose = () => {
        console.log("WS closed, reconnecting in 3s...");
        setTimeout(connectWebSocket, 3000);
    };
    ws.onerror = (e) => console.error("WS error:", e);

    setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
        }
    }, 30000);
}

// Ikki tugma: "chat" yoki "studio". Agar ovoz yozilgan bo'lsa — ovozni yuboradi,
// aks holda matnni yuboradi. (Matn ham, ovoz ham → chat yoki studiya)
function sendMessage(kind) {
    // 1) Ovoz kutilyaptimi? — uni shu yo'nalishga yuboramiz
    if (pendingVoiceBlob) {
        const blob = pendingVoiceBlob;
        clearVoicePending();
        uploadVoice(blob, kind);   // kind = "chat" | "studio"
        return;
    }
    // 2) Aks holda — matn
    const text = chatInput.value.trim();
    if (!text) {
        showToast(t("toast_short"));
        return;
    }
    const lang = currentBroadcastLang();
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: kind, message: text, lang }));
    } else {
        if (kind === "chat") {
            fetch(`${API_URL}/chat/${CITY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ message: text }),
            });
        } else {
            fetch(`${API_URL}/messages/text`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ city: CITY, text, lang }),
            });
        }
    }
    chatInput.value = "";
    showToast(kind === "studio" ? t("toast_sent_studio") : t("toast_sent_chat"));
}

// ---------- Voice message: yozib olib, keyin chat yoki studiyaga yuboriladi ----------
let pendingVoiceBlob = null;  // yozilgan, lekin hali yuborilmagan ovoz

async function toggleRecording() {
    const micBtn = document.getElementById("micBtn");
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        micBtn.classList.remove("recording");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = async () => {
            stream.getTracks().forEach((tr) => tr.stop());
            const blob = new Blob(audioChunks, { type: "audio/webm" });
            if (!blob || blob.size < 1000) {
                showToast(t("toast_short"));
                return;
            }
            // Ovoz yozildi — endi foydalanuvchi "chat" yoki "studiya" tugmasini bossin
            pendingVoiceBlob = blob;
            showVoicePending();
        };

        mediaRecorder.start();
        micBtn.classList.add("recording");
        showToast(t("toast_recording"));
    } catch (e) {
        console.error("Mic error:", e);
        showToast(t("toast_mic_denied"));
    }
}

// Ovoz yozilgach — "yuborish" tugmalarini ovoz rejimiga o'tkazadi
function showVoicePending() {
    const bar = document.getElementById("voicePendingBar");
    if (bar) bar.classList.remove("hidden");
    showToast(t("voice_ready"));
}
function clearVoicePending() {
    pendingVoiceBlob = null;
    const bar = document.getElementById("voicePendingBar");
    if (bar) bar.classList.add("hidden");
}

async function uploadVoice(blob, destination) {
    showToast(t("toast_processing"));
    const fd = new FormData();
    fd.append("city", CITY);
    fd.append("audio_file", blob, "voice.webm");
    fd.append("destination", destination);     // "chat" | "studio"
    fd.append("lang", currentBroadcastLang());
    try {
        const resp = await fetch(`${API_URL}/messages/voice`, {
            method: "POST",
            headers: authHeaders(),
            body: fd,
        });
        if (resp.status === 403) {
            showToast(t("studio_denied_role"));
            return;
        }
        if (resp.status === 402) {
            const d = await resp.json().catch(() => ({}));
            updatePointsDisplay(d?.detail?.points);
            showToast(t("toast_limit"));
            return;
        }
        if (!resp.ok) throw new Error("upload failed " + resp.status);
        const data = await resp.json();
        if (typeof data.points === "number") updatePointsDisplay(data.points);
        // Ovoz chatда pleer sifatida ko'rsatiladi (server broadcast qiladi, lekin o'zimizga ham)
        showToast(destination === "studio" ? t("toast_sent_studio") : t("toast_sent_chat"));
    } catch (e) {
        console.error("Voice upload error:", e);
        showToast("⚠️ Ошибка отправки.");
    }
}

// ---------- Jonli efir (Doverenniy → WebSocket → Icecast) ----------
let broadcastWs = null;
let broadcastRec = null;
let broadcastStream = null;

async function toggleLive() {
    const btn = document.getElementById("goLiveBtn");
    if (isLive) {
        stopBroadcast();
        btn.textContent = t("go_live");
        btn.classList.remove("active");
        showToast("Эфир завершён");
        return;
    }

    try {
        broadcastStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
        showToast(t("toast_mic_denied"));
        return;
    }

    const token = getToken();
    broadcastWs = new WebSocket(`${WS_URL}/radio/${CITY}/broadcast/ws?token=${encodeURIComponent(token)}`);
    broadcastWs.binaryType = "arraybuffer";

    broadcastWs.onmessage = (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        if (msg.type === "broadcast_unavailable") {
            showToast("🔇 Прямой эфир доступен только на сервере (Icecast)");
            stopBroadcast();
        } else if (msg.type === "broadcast_busy") {
            showToast("⚠️ Эфир уже занят другим ведущим");
            stopBroadcast();
        } else if (msg.type === "broadcast_started") {
            isLive = true;
            btn.textContent = t("end_live");
            btn.classList.add("active");
            showToast("🔴 Вы в прямом эфире!");
            startMicRecorder();
        } else if (msg.type === "broadcast_error") {
            showToast("⚠️ Эфир прерван");
            stopBroadcast();
        }
    };

    broadcastWs.onclose = () => { if (isLive) stopBroadcast(); };
    broadcastWs.onerror = () => showToast("Ошибка соединения с эфиром");
}

function startMicRecorder() {
    try {
        broadcastRec = new MediaRecorder(broadcastStream, { mimeType: "audio/webm;codecs=opus" });
    } catch (e) {
        broadcastRec = new MediaRecorder(broadcastStream);
    }
    broadcastRec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0 && broadcastWs && broadcastWs.readyState === 1) {
            e.data.arrayBuffer().then((buf) => {
                if (broadcastWs && broadcastWs.readyState === 1) broadcastWs.send(buf);
            });
        }
    };
    broadcastRec.start(500);
}

function stopBroadcast() {
    isLive = false;
    const btn = document.getElementById("goLiveBtn");
    btn.textContent = t("go_live");
    btn.classList.remove("active");
    try { if (broadcastRec && broadcastRec.state !== "inactive") broadcastRec.stop(); } catch {}
    try { if (broadcastStream) broadcastStream.getTracks().forEach((tr) => tr.stop()); } catch {}
    try { if (broadcastWs && broadcastWs.readyState <= 1) broadcastWs.close(); } catch {}
    broadcastRec = null;
    broadcastStream = null;
    broadcastWs = null;
}

// ---------- Events ----------
function bindEvents() {
    playBtn.addEventListener("click", togglePlay);
    document.getElementById("volume").addEventListener("input", (e) => {
        audio.volume = e.target.value / 100;
    });
    document.getElementById("sendChatBtn").addEventListener("click", () => sendMessage("chat"));
    document.getElementById("sendStudioBtn").addEventListener("click", () => sendMessage("studio"));
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage("chat");
    });
    document.getElementById("micBtn").addEventListener("click", toggleRecording);
    // Fayl yuborish (📎)
    const attachBtn = document.getElementById("attachBtn");
    const fileInput = document.getElementById("fileInput");
    if (attachBtn && fileInput) {
        attachBtn.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", () => {
            if (fileInput.files && fileInput.files[0]) {
                uploadFile(fileInput.files[0]);
                fileInput.value = "";
            }
        });
    }
    const vc = document.getElementById("voiceCancelBtn");
    if (vc) vc.addEventListener("click", clearVoicePending);
    document.getElementById("goLiveBtn").addEventListener("click", toggleLive);
    document.getElementById("onbClose").addEventListener("click", () => {
        localStorage.setItem("sfera5_onboarded", "1");
        document.getElementById("onboarding").classList.add("hidden");
    });
}

// Balansni (poinlar) hamma joyда yangilaydi
function updatePointsDisplay(points) {
    if (typeof points !== "number") return;
    if (profileData) profileData.points = points;
    const top = document.getElementById("points");
    if (top) top.textContent = points;
    const big = document.getElementById("pf-points-big");
    if (big) big.textContent = points;
}

// Fayl yuborish — jonli chatga (Telegram uslubi)
async function uploadFile(file) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
        showToast("⚠️ Файл слишком большой (макс 20MB)");
        return;
    }
    showToast(t("toast_processing"));
    const fd = new FormData();
    fd.append("city", CITY);
    fd.append("file", file, file.name);
    try {
        const resp = await fetch(`${API_URL}/messages/file`, {
            method: "POST",
            headers: authHeaders(),
            body: fd,
        });
        if (resp.status === 402) {
            const d = await resp.json().catch(() => ({}));
            updatePointsDisplay(d?.detail?.points);
            showToast(t("toast_limit"));
            return;
        }
        if (resp.status === 400) {
            showToast("⚠️ Неподдерживаемый тип файла");
            return;
        }
        if (!resp.ok) throw new Error("file upload " + resp.status);
        const data = await resp.json();
        if (typeof data.points === "number") updatePointsDisplay(data.points);
        showToast(t("toast_sent_chat"));
    } catch (e) {
        console.error("File upload error:", e);
        showToast("⚠️ Ошибка отправки файла.");
    }
}

// ---------- Toast ----------
let toastTimer = null;
function showToast(text) {
    const toast = document.getElementById("toast");
    toast.textContent = text;
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add("hidden"), 3500);
}

document.addEventListener("DOMContentLoaded", init);
