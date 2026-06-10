from fastapi import APIRouter, Depends, HTTPException

from app.core.database import db
from app.core.models import UserMeOut, UpdateCityRequest, UpdateLanguageRequest, UpdateBroadcastLangRequest, PsychotypeOut, OkResponse
from app.core.dependencies import get_current_user
from app.core.state import VALID_CITIES

router = APIRouter(prefix="/users", tags=["users"])

VALID_LANGUAGES = {"ru", "lt", "en"}
VALID_BROADCAST_LANGS = {"ru", "lt", "en"}


@router.get("/me", response_model=UserMeOut)
async def get_me(user: dict = Depends(get_current_user)):
    pt_row = await db.fetchrow(
        """
        SELECT focus_of_attention, emotional_tone, key_topic, priority_score
        FROM psychotypes
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        """,
        user["id"],
    )

    psychotype = None
    if pt_row is not None:
        psychotype = PsychotypeOut(
            focus_of_attention=pt_row["focus_of_attention"],
            emotional_tone=pt_row["emotional_tone"],
            key_topic=pt_row["key_topic"],
            priority_score=pt_row["priority_score"],
        )

    return UserMeOut(
        telegram_id=user["telegram_id"],
        role=user["role"],
        points=user["points"],
        city=user["city"],
        broadcast_lang=user.get("broadcast_lang") or "ru",
        psychotype=psychotype,
    )


@router.put("/me/city", response_model=OkResponse)
async def update_city(
    payload: UpdateCityRequest, user: dict = Depends(get_current_user)
):
    if payload.city not in VALID_CITIES:
        raise HTTPException(status_code=400, detail="Unknown city")

    await db.execute(
        "UPDATE users SET city = $1 WHERE id = $2", payload.city, user["id"]
    )
    return OkResponse(detail={"city": payload.city})


@router.put("/me/language", response_model=OkResponse)
async def update_language(
    payload: UpdateLanguageRequest, user: dict = Depends(get_current_user)
):
    if payload.language not in VALID_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported language")

    await db.execute(
        "UPDATE users SET language = $1 WHERE id = $2", payload.language, user["id"]
    )
    return OkResponse(detail={"language": payload.language})


@router.put("/me/broadcast-lang", response_model=OkResponse)
async def update_broadcast_lang(
    payload: UpdateBroadcastLangRequest, user: dict = Depends(get_current_user)
):
    """Язык эфира (RU/LT/EN) — какой Icecast-поток слушает пользователь."""
    if payload.broadcast_lang not in VALID_BROADCAST_LANGS:
        raise HTTPException(status_code=400, detail="Unsupported broadcast language")

    await db.execute(
        "UPDATE users SET broadcast_lang = $1 WHERE id = $2",
        payload.broadcast_lang, user["id"],
    )
    return OkResponse(detail={"broadcast_lang": payload.broadcast_lang})
