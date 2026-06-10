// Kirish — auth qilamiz va to'g'ridan radio ekraniga o'tamiz.
// Til tanlash endi "Анонсы" ekranining ichida (asosiy ekran).

async function initEntry() {
    try {
        await authenticate();
    } catch (e) {
        console.error("Auth error:", e);
    }
    // Global efirga (yagona xona) o'tamiz — boshlang'ich ekran "Анонсы"
    localStorage.setItem(LS_CITY, "global");
    window.location.replace("radio.html?city=global");
}

document.addEventListener("DOMContentLoaded", initEntry);
