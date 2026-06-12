"""Points service — INTRA GROUP v3.0.

Kasr son bilan (NUMERIC(12,4)):
- Text xabar: -0.001 point
- Ovozli xabar: -0.005 point
- Transfer: bir foydalanuvchidan ikkinchisiga
- So'rov: "menga point bering" request
- Sotib olish: EUR → points
"""

import logging
from decimal import Decimal

from app.core.database import db
from app.core.constants import (
    COST_TEXT_MESSAGE, COST_VOICE_MESSAGE, INITIAL_POINTS, level_for_points,
)

log = logging.getLogger("points")


async def recompute_level(user_id: int) -> int:
    """Point miqdoriga qarab levelni avtomatik yangilaydi.

    Level 3 ga yetganda role = broadcaster (ведущий).
    """
    points = await get_balance(user_id)
    level = level_for_points(points)
    role = "broadcaster" if level >= 3 else "listener"
    # admin rolini saqlab qolamiz
    await db.execute(
        """
        UPDATE users
        SET level = $2,
            role = CASE WHEN role = 'admin' THEN 'admin' ELSE $3 END
        WHERE id = $1
        """,
        user_id, level, role,
    )
    return level


async def get_balance(user_id: int) -> Decimal:
    """Joriy balans."""
    val = await db.fetchval("SELECT points FROM users WHERE id = $1", user_id)
    return Decimal(str(val)) if val else Decimal("0")


async def spend(user_id: int, event_type: str, cost: Decimal) -> dict:
    """Point sarflash (xabar yuborish uchun). Atomik, manfiy bo'lmaydi.

    Returns: {"ok": True/False, "points": yangi_balans}
    """
    if cost <= 0:
        bal = await get_balance(user_id)
        return {"ok": True, "points": bal}

    row = await db.fetchrow(
        """
        UPDATE users SET points = points - $2
        WHERE id = $1 AND points >= $2
        RETURNING points
        """,
        user_id, cost,
    )
    if row is None:
        bal = await get_balance(user_id)
        return {"ok": False, "points": bal, "reason": "insufficient_points"}

    await db.execute(
        """
        INSERT INTO points_transactions (user_id, amount, event_type, description)
        VALUES ($1, $2, $3, $4)
        """,
        user_id, -cost, event_type, f"Spent {cost} for {event_type}",
    )
    return {"ok": True, "points": row["points"]}


async def spend_text(user_id: int) -> dict:
    """Matn xabar uchun point sarflash."""
    return await spend(user_id, "text_message", Decimal(str(COST_TEXT_MESSAGE)))


async def spend_voice(user_id: int) -> dict:
    """Ovozli xabar uchun point sarflash."""
    return await spend(user_id, "voice_message", Decimal(str(COST_VOICE_MESSAGE)))


async def transfer(from_user_id: int, to_user_id: int, amount: Decimal) -> dict:
    """Bir foydalanuvchidan ikkinchisiga point o'tkazish."""
    if amount <= 0:
        return {"ok": False, "reason": "invalid_amount"}
    if from_user_id == to_user_id:
        return {"ok": False, "reason": "cannot_transfer_to_self"}

    # Atomik: avval olib, keyin qo'shish
    row = await db.fetchrow(
        """
        UPDATE users SET points = points - $2
        WHERE id = $1 AND points >= $2
        RETURNING points
        """,
        from_user_id, amount,
    )
    if row is None:
        return {"ok": False, "reason": "insufficient_points"}

    await db.execute(
        "UPDATE users SET points = points + $2 WHERE id = $1",
        to_user_id, amount,
    )

    # Tarix yozish
    await db.execute(
        """
        INSERT INTO points_transactions (user_id, amount, event_type, description, related_user_id)
        VALUES ($1, $2, 'transfer_out', $3, $4)
        """,
        from_user_id, -amount, f"Transfer to user #{to_user_id}", to_user_id,
    )
    await db.execute(
        """
        INSERT INTO points_transactions (user_id, amount, event_type, description, related_user_id)
        VALUES ($1, $2, 'transfer_in', $3, $4)
        """,
        to_user_id, amount, f"Received from user #{from_user_id}", from_user_id,
    )

    # Level avtomatik qayta hisoblash (ikkala foydalanuvchi uchun)
    await recompute_level(from_user_id)
    await recompute_level(to_user_id)

    return {"ok": True, "points": row["points"]}


async def create_request(from_user_id: int, to_user_id: int, amount: Decimal, message: str = "") -> dict:
    """Point so'rovi yaratish (from so'rayapti, to berishi kerak)."""
    if amount <= 0:
        return {"ok": False, "reason": "invalid_amount"}

    row = await db.fetchrow(
        """
        INSERT INTO points_requests (from_user_id, to_user_id, amount, message)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        """,
        from_user_id, to_user_id, amount, message,
    )
    return {"ok": True, "request_id": row["id"]}


async def decide_request(request_id: int, deciding_user_id: int, approve: bool) -> dict:
    """Point so'rovini tasdiqlash yoki rad etish."""
    req = await db.fetchrow(
        "SELECT * FROM points_requests WHERE id = $1 AND status = 'pending'",
        request_id,
    )
    if req is None:
        return {"ok": False, "reason": "request_not_found"}
    if req["to_user_id"] != deciding_user_id:
        return {"ok": False, "reason": "not_your_request"}

    if approve:
        # Point o'tkazish
        result = await transfer(req["to_user_id"], req["from_user_id"], req["amount"])
        if not result["ok"]:
            return result
        await db.execute(
            "UPDATE points_requests SET status = 'approved', decided_at = NOW() WHERE id = $1",
            request_id,
        )
    else:
        await db.execute(
            "UPDATE points_requests SET status = 'rejected', decided_at = NOW() WHERE id = $1",
            request_id,
        )

    return {"ok": True, "status": "approved" if approve else "rejected"}


async def add_points_admin(user_id: int, amount: Decimal) -> dict:
    """Admin tomonidan point qo'shish."""
    row = await db.fetchrow(
        "UPDATE users SET points = points + $2 WHERE id = $1 RETURNING points",
        user_id, amount,
    )
    if row is None:
        return {"ok": False, "reason": "user_not_found"}
    await db.execute(
        """
        INSERT INTO points_transactions (user_id, amount, event_type, description)
        VALUES ($1, $2, 'gift', 'Admin gift')
        """,
        user_id, amount,
    )
    # Level avtomatik qayta hisoblash
    new_level = await recompute_level(user_id)
    return {"ok": True, "points": row["points"], "level": new_level}
