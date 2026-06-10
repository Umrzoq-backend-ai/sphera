// Админка — модерация эфира + редактирование анонсов

async function initAdmin() {
    try {
        await authenticate();
    } catch (e) {
        console.error("Auth error:", e);
    }
    setupTabs();
    bindAnnouncementSave();
    await loadDrafts();
    await loadAnnouncementsToForm();
}

function setupTabs() {
    document.querySelectorAll(".atab").forEach((b) => {
        b.addEventListener("click", () => {
            const tab = b.getAttribute("data-tab");
            document.querySelectorAll(".atab").forEach((x) => x.classList.remove("active"));
            b.classList.add("active");
            document.querySelectorAll(".admin-screen").forEach((s) => s.classList.add("hidden"));
            document.getElementById("tab-" + tab).classList.remove("hidden");
            if (tab === "moder") loadDrafts();
        });
    });
}

function showAuthError() {
    document.getElementById("authError").classList.remove("hidden");
}

// ===== Черновики (модерация) =====
async function loadDrafts() {
    const list = document.getElementById("draftsList");
    list.innerHTML = '<div class="admin-empty">Загрузка…</div>';
    try {
        const resp = await fetch(`${API_URL}/admin/drafts?status=pending`, {
            headers: authHeaders(),
        });
        if (resp.status === 403) { showAuthError(); list.innerHTML = ""; return; }
        const drafts = await resp.json();
        if (!drafts.length) {
            list.innerHTML = '<div class="admin-empty">Нет черновиков. ИИ ещё собирает заявки студии…</div>';
            return;
        }
        list.innerHTML = "";
        drafts.forEach(renderDraft);
    } catch (e) {
        console.error(e);
        list.innerHTML = '<div class="admin-empty">Ошибка загрузки.</div>';
    }
}

function renderDraft(d) {
    const list = document.getElementById("draftsList");
    const card = document.createElement("div");
    card.className = "draft-card";
    const time = new Date(d.created_at).toLocaleString("ru-RU", {
        hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit",
    });
    card.innerHTML = `
        <div class="draft-meta">
            <span class="draft-topic">📌 ${escapeHtml(d.main_topic || "—")}</span>
            <span>${d.source_count} сообщ. · ${time}</span>
        </div>
        <textarea class="draft-script">${escapeHtml(d.script)}</textarea>
        <div class="draft-actions">
            <button class="draft-btn reject">✕ Отклонить</button>
            <button class="draft-btn approve">✓ Одобрить → эфир</button>
        </div>`;
    const ta = card.querySelector(".draft-script");
    card.querySelector(".approve").addEventListener("click", () => approveDraft(d.id, ta.value, card));
    card.querySelector(".reject").addEventListener("click", () => rejectDraft(d.id, card));
    list.appendChild(card);
}

async function approveDraft(id, script, card) {
    try {
        // Avval tahrirlangan matnni saqlaymiz
        await fetch(`${API_URL}/admin/drafts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ script }),
        });
        const resp = await fetch(`${API_URL}/admin/drafts/${id}/approve`, {
            method: "POST",
            headers: authHeaders(),
        });
        if (!resp.ok) throw new Error("approve failed");
        card.remove();
        showToast("✅ Одобрено — выпуск в эфире!");
        checkEmpty();
    } catch (e) {
        console.error(e);
        showToast("⚠️ Ошибка одобрения");
    }
}

async function rejectDraft(id, card) {
    try {
        await fetch(`${API_URL}/admin/drafts/${id}/reject`, {
            method: "POST",
            headers: authHeaders(),
        });
        card.remove();
        showToast("Черновик отклонён");
        checkEmpty();
    } catch (e) {
        console.error(e);
        showToast("⚠️ Ошибка");
    }
}

function checkEmpty() {
    const list = document.getElementById("draftsList");
    if (!list.querySelector(".draft-card")) {
        list.innerHTML = '<div class="admin-empty">Нет черновиков. ИИ ещё собирает заявки студии…</div>';
    }
}

// ===== Анонсы =====
async function loadAnnouncementsToForm() {
    try {
        const resp = await fetch(`${API_URL}/admin/announcements`);
        const data = await resp.json();
        fillSlot(1, data.banner1);
        fillSlot(2, data.banner2);
    } catch (e) {
        console.error(e);
    }
}

function fillSlot(slot, b) {
    if (!b) return;
    const box = document.querySelector(`.anons-edit[data-slot="${slot}"]`);
    if (!box) return;
    box.querySelector('[data-f="emoji"]').value = b.emoji || "";
    box.querySelector('[data-f="title"]').value = b.title || "";
    box.querySelector('[data-f="text"]').value = b.text || "";
    box.querySelector('[data-f="image_url"]').value = b.image_url || "";
}

function bindAnnouncementSave() {
    document.querySelectorAll(".adm-save").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const slot = btn.getAttribute("data-slot");
            const box = document.querySelector(`.anons-edit[data-slot="${slot}"]`);
            const payload = {
                emoji: box.querySelector('[data-f="emoji"]').value,
                title: box.querySelector('[data-f="title"]').value,
                text: box.querySelector('[data-f="text"]').value,
                image_url: box.querySelector('[data-f="image_url"]').value,
            };
            try {
                const resp = await fetch(`${API_URL}/admin/announcements/${slot}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", ...authHeaders() },
                    body: JSON.stringify(payload),
                });
                if (resp.status === 403) { showAuthError(); return; }
                if (!resp.ok) throw new Error("save failed");
                showToast(`✅ Окно ${slot} сохранено`);
            } catch (e) {
                console.error(e);
                showToast("⚠️ Ошибка сохранения");
            }
        });
    });
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
}

let toastTimer = null;
function showToast(text) {
    const toast = document.getElementById("toast");
    toast.textContent = text;
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add("hidden"), 3000);
}

document.addEventListener("DOMContentLoaded", initAdmin);
