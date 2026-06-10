from fastapi import APIRouter, HTTPException, status

from database import db
from models import TelegramAuthRequest, AuthResponse
from dependencies import create_access_token
from services import membership

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/telegram", response_model=AuthResponse)
async def auth_telegram(payload: TelegramAuthRequest):
    # Guruhga bog'liqlik: faqat guruh a'zolari kira oladi (PDF: Community-bound)
    is_member = await membership.check_membership(payload.telegram_id)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ только для участников группы Sfera5.",
        )

    row = await db.fetchrow(
        "SELECT * FROM users WHERE telegram_id = $1", payload.telegram_id
    )

    if row is None:
        from services import points as _points
        row = await db.fetchrow(
            """
            INSERT INTO users (telegram_id, username, full_name, points)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            """,
            payload.telegram_id,
            payload.username,
            payload.full_name,
            _points.INITIAL_POINTS,
        )
    else:
        row = await db.fetchrow(
            """
            UPDATE users
            SET username = COALESCE($2, username),
                full_name = COALESCE($3, full_name),
                last_seen = NOW()
            WHERE telegram_id = $1
            RETURNING *
            """,
            payload.telegram_id,
            payload.username,
            payload.full_name,
        )

    token = create_access_token(payload.telegram_id)

    return AuthResponse(
        token=token,
        role=row["role"],
        points=row["points"],
        city=row["city"],
    )
