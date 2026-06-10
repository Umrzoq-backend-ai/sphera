"""Points_Service — avtomatik ball berish va rol ko'tarish (PDF talabi).

Ball qoidalari:
  - murojaat (appeal): +10
  - chat xabar: +1  (kunlik max 20)
  - tinglash (listen): 1 daqiqaga +1  (kunlik max 30)

Rol chegaralari:
  slusatel=0, aktivniy=50, doverenniy=200
Ball faqat ko'tariladi (pasaymaydi), admin avtomatik o'zgarmaydi.
"""

from database import db
import os

# Ball qiymatlari
POINTS_APPEAL = 10
POINTS_CHAT = 1
POINTS_LISTEN = 1

# Kunlik limitlar
CAP_CHAT_PER_DAY = 20
CAP_LISTEN_PER_DAY = 30

# Rol chegaralari (yuqoridan pastga)
ROLE_THRESHOLDS = [("doverenniy", 200), ("aktivniy", 50), ("slusatel", 0)]
ROLE_LEVELS = {"slusatel": 0, "aktivniy": 1, "doverenniy": 2, "admin": 99}

DAILY_CAP = {"chat": CAP_CHAT_PER_DAY, "listen": CAP_LISTEN_PER_DAY}

# ============ Cost-модель (multilang-studio-broadcast) ============
# Стоимость действий, списываемых с баланса (Поинты).
# Босс: чат тоже с лимитом; студия дороже (голос дороже из-за STT).
COST = {
    "chat": int(os.getenv("COST_CHAT", "1")),                  # текст в чат
    "chat_voice": int(os.getenv("COST_CHAT_VOICE", "1")),      # голос в чат
    "studio": int(os.getenv("COST_STUDIO", "1")),             # текст в студию
    "studio_voice": int(os.getenv("COST_STUDIO_VOICE", "2")),  # голос в студию (STT)
}

# Стартовый баланс новым пользователям (чтобы могли участвовать; админ пополняет)
INITIAL_POINTS = int(os.getenv("INITIAL_POINTS", "50"))


async def spend(user_id: int, event_type: str, cost: int) -> dict:
    """Списывает лимит (Поинты) за действие. Атомарно, без ухода в минус.

    Возвращает:
      {"ok": True,  "points": новый_остаток}       — успешно списано
      {"ok": False, "points": текущий, "reason": "insufficient_limit"} — не хватило
    """
    if cost <= 0:
        cur = await db.fetchval("SELECT points FROM users WHERE id = $1", user_id)
        return {"ok": True, "points": int(cur or 0)}

    # Атомарное условное списание: уменьшаем только если хватает баланса
    row = await db.fetchrow(
        """
        UPDATE users SET points = points - $2
        WHERE id = $1 AND points >= $2
        RETURNING points
        """,
        user_id, cost,
    )
    if row is None:
        cur = await db.fetchval("SELECT points FROM users WHERE id = $1", user_id)
        return {"ok": False, "points": int(cur or 0), "reason": "insufficient_limit"}

    await db.execute(
        "INSERT INTO points_history (user_id, event_type, amount) VALUES ($1, $2, $3)",
        user_id, event_type, -cost,
    )
    return {"ok": True, "points": row["points"]}


def role_for_points(points: int) -> str:
    """Berilgan ballga mos eng yuqori (admin bo'lmagan) rol."""
    for role, threshold in ROLE_THRESHOLDS:
        if points >= threshold:
            return role
    return "slusatel"


async def _today_awarded(user_id: int, event_type: str) -> int:
    val = await db.fetchval(
        """
        SELECT COALESCE(SUM(amount), 0) FROM points_history
        WHERE user_id = $1 AND event_type = $2
          AND created_at >= date_trunc('day', (now() AT TIME ZONE 'utc'))
        """,
        user_id,
        event_type,
    )
    return int(val or 0)


async def award(user_id: int, event_type: str, amount: int) -> dict:
    """Foydalanuvchiga ball qo'shadi (kunlik limit bilan), rolni tekshiradi.

    Qaytaradi: {points, role, promoted, new_role, awarded}
    """
    # Kunlik limit
    cap = DAILY_CAP.get(event_type)
    if cap is not None:
        already = await _today_awarded(user_id, event_type)
        remaining = max(0, cap - already)
        amount = min(amount, remaining)

    if amount <= 0:
        row = await db.fetchrow(
            "SELECT points, role, telegram_id FROM users WHERE id = $1", user_id
        )
        if row is None:
            return {"points": 0, "role": "slusatel", "promoted": False,
                    "new_role": "slusatel", "awarded": 0}
        return {"points": row["points"], "role": row["role"], "promoted": False,
                "new_role": row["role"], "awarded": 0}

    # Atomik ball qo'shish
    row = await db.fetchrow(
        """
        UPDATE users SET points = points + $2
        WHERE id = $1
        RETURNING points, role, telegram_id
        """,
        user_id,
        amount,
    )
    if row is None:
        return {"points": 0, "role": "slusatel", "promoted": False,
                "new_role": "slusatel", "awarded": 0}

    await db.execute(
        "INSERT INTO points_history (user_id, event_type, amount) VALUES ($1, $2, $3)",
        user_id,
        event_type,
        amount,
    )

    promoted, new_role = await _maybe_promote(user_id, row["points"], row["role"])

    return {
        "points": row["points"],
        "role": new_role,
        "promoted": promoted,
        "new_role": new_role,
        "awarded": amount,
    }


async def _maybe_promote(user_id: int, points: int, current_role: str):
    """Ball yetarli bo'lsa rolni ko'taradi. admin tegmaydi, pasaymaydi."""
    if current_role == "admin":
        return False, current_role

    target = role_for_points(points)
    if ROLE_LEVELS.get(target, 0) > ROLE_LEVELS.get(current_role, 0):
        await db.execute(
            "UPDATE users SET role = $1 WHERE id = $2", target, user_id
        )
        return True, target
    return False, current_role
