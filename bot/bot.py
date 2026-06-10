import os
import logging

import httpx
from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    WebAppInfo,
    MenuButtonWebApp,
)
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("telegram-bot")

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
MINI_APP_URL = os.getenv("MINI_APP_URL", "https://app.sfera5.world")
INTERNAL_API_URL = os.getenv("INTERNAL_API_URL", "http://radio-api:8001")
ADMIN_IDS = {
    int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip().isdigit()
}

# Admin panel URL — SPA route /admin (React Router). index.html ni kesib /admin qo'shamiz.
def _admin_url() -> str:
    base = MINI_APP_URL
    for suffix in ("/index.html", "/radio.html"):
        if base.endswith(suffix):
            base = base[: -len(suffix)]
            break
    return base.rstrip("/") + "/admin"


ROLE_NAMES = {
    "slusatel": "Слушатель",
    "aktivniy": "Активный",
    "doverenniy": "Доверенный",
    "admin": "Администратор",
}


def webapp_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [[InlineKeyboardButton("📻 Войти в радио", web_app=WebAppInfo(url=MINI_APP_URL))]]
    )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = (
        "🎙 *Radio AI* — Интерактивное радио\n\n"
        "Слушайте прямой эфир на своём языке и общайтесь в живом чате.\n"
        "ИИ собирает заявки в студию и формирует мультиязычный эфир!"
    )
    await update.message.reply_text(
        text, reply_markup=webapp_keyboard(), parse_mode="Markdown"
    )


async def admin_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Faqat adminlar uchun — moderatsiya va anonslar paneli."""
    user = update.effective_user
    if user.id not in ADMIN_IDS:
        await update.message.reply_text("🔒 Эта команда только для администраторов.")
        return
    kb = InlineKeyboardMarkup(
        [[InlineKeyboardButton("🛠 Открыть админку", web_app=WebAppInfo(url=_admin_url()))]]
    )
    await update.message.reply_text(
        "🛠 *Админ-панель*\n\nМодерация эфира и редактирование анонсов.",
        reply_markup=kb, parse_mode="Markdown",
    )


async def radio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Joriy global efir holati."""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{INTERNAL_API_URL}/radio/status",
                params={"city": "global"},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:  # noqa: BLE001
            log.warning("status failed: %s", exc)
            await update.message.reply_text("⚠️ Не удалось получить статус эфира.")
            return

    if data.get("is_live"):
        btype = data.get("broadcaster_type")
        who = "🤖 ИИ ведущий" if btype == "ai" else f"🔴 {data.get('broadcaster_name')}"
        text = (
            "🎵 *Прямой эфир* — В ЭФИРЕ\n\n"
            f"Ведущий: {who}\n"
            f"Слушателей: {data.get('listeners_count', 0)}"
        )
    else:
        text = "📻 Эфир сейчас не активен. Заходите в приложение!"

    await update.message.reply_text(text, parse_mode="Markdown")


async def profile(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    async with httpx.AsyncClient() as client:
        try:
            auth = await client.post(
                f"{INTERNAL_API_URL}/auth/telegram",
                json={
                    "telegram_id": user.id,
                    "username": user.username,
                    "full_name": user.full_name,
                },
                timeout=10,
            )
            auth.raise_for_status()
            d = auth.json()
        except Exception as exc:  # noqa: BLE001
            log.warning("profile auth failed: %s", exc)
            await update.message.reply_text("⚠️ Не удалось получить профиль.")
            return

    role = ROLE_NAMES.get(d.get("role"), d.get("role"))
    text = (
        f"👤 *Профиль*\n\n"
        f"ID: `{user.id}`\n"
        f"Роль: {role}\n"
        f"Поинты: {d.get('points', 0)}"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = (
        "*Команды Radio AI:*\n\n"
        "/start — Открыть радио\n"
        "/radio — Текущий статус эфира\n"
        "/profile — Ваш профиль и поинты\n"
        "/admin — Админ-панель (для администраторов)\n"
        "/help — Список команд"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def _post_init(application: Application) -> None:
    """Bot ishga tushganda menu tugmasini WebApp ga sozlaydi."""
    try:
        await application.bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                text="📻 Радио", web_app=WebAppInfo(url=MINI_APP_URL)
            )
        )
        log.info("Menu button WebApp ga sozlandi: %s", MINI_APP_URL)
    except Exception as exc:  # noqa: BLE001
        log.warning("menu button set failed: %s", exc)


def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN is not set")

    from telegram.request import HTTPXRequest

    request = HTTPXRequest(
        connect_timeout=30.0,
        read_timeout=30.0,
        write_timeout=30.0,
        pool_timeout=30.0,
    )
    app = (
        Application.builder()
        .token(BOT_TOKEN)
        .request(request)
        .get_updates_request(
            HTTPXRequest(connect_timeout=30.0, read_timeout=30.0)
        )
        .post_init(_post_init)
        .build()
    )

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("radio", radio))
    app.add_handler(CommandHandler("profile", profile))
    app.add_handler(CommandHandler("admin", admin_cmd))
    app.add_handler(CommandHandler("help", help_cmd))

    log.info("Radio AI Telegram bot ishga tushdi. MINI_APP_URL=%s", MINI_APP_URL)
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
