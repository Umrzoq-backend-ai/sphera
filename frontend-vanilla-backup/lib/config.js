// API manzili — frontend va backend bitta origin'da (FastAPI statik serve qiladi).
// Localhost:8080 (alohida server) bo'lsa ham 8001 ga yo'naltiramiz.
const IS_PORT_8080 = location.port === "8080";
const API_URL = IS_PORT_8080 ? `http://${location.hostname}:8001` : location.origin;
const WS_URL = API_URL.replace(/^http/, "ws");
const RADIO_URL = API_URL;

// Telegram WebApp init — Android'da stabil ishlashi uchun
const tg = window.Telegram ? window.Telegram.WebApp : null;

function initTelegramWebApp() {
    if (!tg) return;
    try {
        tg.ready();
        tg.expand();

        // Android: screenshot/fokus o'zgarganda app yopilib ketmasligi uchun
        // closing confirmation va vertical swipe'ni o'chiramiz
        if (typeof tg.disableVerticalSwipes === "function") {
            tg.disableVerticalSwipes();
        }
        if (typeof tg.enableClosingConfirmation === "function") {
            // Tasodifiy yopilishni oldini olamiz (Android swipe-down crash)
            tg.enableClosingConfirmation();
        }

        // viewport o'zgarsa (klaviatura, fokus) — balandlikni qayta hisoblaymiz
        if (typeof tg.onEvent === "function") {
            tg.onEvent("viewportChanged", applyViewportHeight);
        }

        // Telegram theme ranglari (status bar bilan mos)
        try {
            if (tg.setHeaderColor) tg.setHeaderColor("#060a14");
            if (tg.setBackgroundColor) tg.setBackgroundColor("#060a14");
        } catch (e) { /* eski versiyalar */ }

        applyViewportHeight();
    } catch (e) {
        console.error("TG init error:", e);
    }
}

// Real viewport balandligini CSS o'zgaruvchiga yozamiz (Android klaviatura/skrinshot bagi)
function applyViewportHeight() {
    let h = window.innerHeight;
    if (tg && tg.viewportStableHeight) {
        h = tg.viewportStableHeight;
    } else if (tg && tg.viewportHeight) {
        h = tg.viewportHeight;
    }
    document.documentElement.style.setProperty("--app-vh", h + "px");
}

// Brauzer resize/orientatsiya o'zgarishida ham yangilaymiz
window.addEventListener("resize", applyViewportHeight);
window.addEventListener("orientationchange", () => setTimeout(applyViewportHeight, 200));

initTelegramWebApp();

// localStorage kalitlari
const LS_TOKEN = "sfera5_token";
const LS_CITY = "sfera5_city";
const LS_ROLE = "sfera5_role";

// Telegram foydalanuvchisi
function getTgUser() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        return tg.initDataUnsafe.user;
    }
    // Brauzerda test uchun fallback
    return { id: 999999, username: "test_user", first_name: "Test" };
}

// Auth — token oladi va saqlaydi
async function authenticate() {
    const user = getTgUser();
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
    const resp = await fetch(`${API_URL}/auth/telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            telegram_id: user.id,
            username: user.username || null,
            full_name: fullName || null,
        }),
    });
    if (!resp.ok) throw new Error("Auth failed");
    const data = await resp.json();
    localStorage.setItem(LS_TOKEN, data.token);
    localStorage.setItem(LS_ROLE, data.role);
    if (data.city) localStorage.setItem(LS_CITY, data.city);
    return data;
}

function getToken() {
    return localStorage.getItem(LS_TOKEN);
}

function authHeaders() {
    return { "Authorization": `Bearer ${getToken()}` };
}
