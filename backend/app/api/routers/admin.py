import os
import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.database import db
from app.core.models import (
    RoleUpdateRequest,
    PointsAddRequest,
    OkResponse,
    AnnouncementOut,
    AnnouncementsResponse,
    AnnouncementUpdate,
    DraftOut,
    DraftEditRequest,
)
from app.core.dependencies import require_admin
from app.core.state import VALID_CITIES, AUDIO_DIR, get_state
from app.core.ws_manager import manager
from app.services import tts, broadcast

router = APIRouter(prefix="/admin", tags=["admin"])

VALID_ROLES = {"slusatel", "aktivniy", "doverenniy", "admin"}


# ============ Foydalanuvchi boshqaruvi ============
@router.post("/users/{user_id}/role", response_model=OkResponse)
async def set_role(
    user_id: int,
    payload: RoleUpdateRequest,
    admin: dict = Depends(require_admin),
):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    result = await db.execute(
        "UPDATE users SET role = $1 WHERE id = $2", payload.role, user_id
    )
    if result.endswith("0"):
        raise HTTPException(status_code=404, detail="User not found")
    return OkResponse(detail={"user_id": user_id, "role": payload.role})


@router.post("/points/add", response_model=OkResponse)
async def add_points(
    payload: PointsAddRequest,
    admin: dict = Depends(require_admin),
):
    row = await db.fetchrow(
        """
        UPDATE users SET points = points + $2
        WHERE telegram_id = $1
        RETURNING points
        """,
        payload.telegram_id, payload.amount,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="User not found")
    return OkResponse(detail={"telegram_id": payload.telegram_id, "points": row["points"]})


# ============ Анонсы (стартовый экран — 2 окна) ============
@router.get("/announcements", response_model=AnnouncementsResponse)
async def get_announcements():
    """Ommaviy: startovыy ekran banner oynalari (auth shart emas)."""
    rows = await db.fetch(
        "SELECT slot, title, text, emoji, image_url FROM announcements ORDER BY slot"
    )
    by_slot = {r["slot"]: AnnouncementOut(**dict(r)) for r in rows}
    return AnnouncementsResponse(banner1=by_slot.get(1), banner2=by_slot.get(2))


@router.put("/announcements/{slot}", response_model=OkResponse)
async def update_announcement(
    slot: int,
    payload: AnnouncementUpdate,
    admin: dict = Depends(require_admin),
):
    if slot not in (1, 2):
        raise HTTPException(status_code=400, detail="slot must be 1 or 2")
    await db.execute(
        """
        INSERT INTO announcements (slot, title, text, emoji, image_url, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (slot) DO UPDATE SET
            title = EXCLUDED.title,
            text = EXCLUDED.text,
            emoji = EXCLUDED.emoji,
            image_url = EXCLUDED.image_url,
            updated_at = NOW()
        """,
        slot, payload.title, payload.text, payload.emoji, payload.image_url,
    )
    return OkResponse(detail={"slot": slot})


# ============ Эфир модерация (ИИ-черновики → одобрить → эфир) ============
@router.get("/drafts", response_model=list[DraftOut])
async def list_drafts(
    status: str = "pending",
    admin: dict = Depends(require_admin),
):
    rows = await db.fetch(
        """
        SELECT id, city, main_topic, source_count, script, script_lt, script_en,
               status, created_at
        FROM broadcast_drafts
        WHERE status = $1
        ORDER BY created_at DESC
        LIMIT 50
        """,
        status,
    )
    return [DraftOut(**dict(r)) for r in rows]


@router.put("/drafts/{draft_id}", response_model=OkResponse)
async def edit_draft(
    draft_id: int,
    payload: DraftEditRequest,
    admin: dict = Depends(require_admin),
):
    """Moderator ИИ matnini tahrirlaydi."""
    if not payload.script.strip():
        raise HTTPException(status_code=400, detail="Empty script")
    result = await db.execute(
        "UPDATE broadcast_drafts SET script = $1 WHERE id = $2 AND status = 'pending'",
        payload.script, draft_id,
    )
    if result.endswith("0"):
        raise HTTPException(status_code=404, detail="Draft not found or already decided")
    return OkResponse(detail={"draft_id": draft_id})


@router.post("/drafts/{draft_id}/reject", response_model=OkResponse)
async def reject_draft(
    draft_id: int,
    admin: dict = Depends(require_admin),
):
    await db.execute(
        """
        UPDATE broadcast_drafts
        SET status = 'rejected', moderator_id = $2, decided_at = NOW()
        WHERE id = $1
        """,
        draft_id, admin["telegram_id"],
    )
    return OkResponse(detail={"draft_id": draft_id, "status": "rejected"})


@router.post("/drafts/{draft_id}/approve", response_model=OkResponse)
async def approve_draft(
    draft_id: int,
    admin: dict = Depends(require_admin),
):
    """Одобрить → перевод (LT/EN) → 3× TTS → 3× Icecast push (Шаг 3-4).

    Только здесь запускается мультиязычный конвейер генерации эфира.
    """
    import asyncio
    from app.services import gemini

    draft = await db.fetchrow(
        "SELECT * FROM broadcast_drafts WHERE id = $1", draft_id
    )
    if draft is None:
        raise HTTPException(status_code=404, detail="Draft not found")
    if draft["status"] != "pending":
        raise HTTPException(status_code=400, detail="Draft already decided")

    city = draft["city"]
    script_ru = draft["script"]
    duration = max(15, int(len(script_ru.split()) / 2.5))

    # 1. Перевод RU → LT, EN (фолбэк на RU при сбое — Req 9.3)
    scripts = {"ru": script_ru}
    for lang in ("lt", "en"):
        try:
            scripts[lang] = await gemini.translate(script_ru, lang)
        except Exception:
            scripts[lang] = script_ru

    # 2. TTS: 3 аудио (ElevenLabs primary, edge fallback, изоляция сбоев — Req 10.4)
    city_dir = os.path.join(AUDIO_DIR, city)
    os.makedirs(city_dir, exist_ok=True)
    try:
        paths = await tts.synthesize_multilang(scripts, city_dir)  # {lang: path}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"TTS failed: {exc}")
    if not paths:
        raise HTTPException(status_code=500, detail="TTS produced no audio")

    def _basename(p):
        return os.path.basename(p) if p else None

    # 3. БД: переводы + аудио + статус approved
    await db.execute(
        """
        UPDATE broadcast_drafts
        SET status = 'approved', script_lt = $2, script_en = $3,
            audio_ru = $4, audio_lt = $5, audio_en = $6,
            moderator_id = $7, decided_at = NOW()
        WHERE id = $1
        """,
        draft_id, scripts.get("lt"), scripts.get("en"),
        _basename(paths.get("ru")), _basename(paths.get("lt")), _basename(paths.get("en")),
        admin["telegram_id"],
    )
    await db.execute(
        """
        INSERT INTO broadcasts (city, script, broadcaster_type, duration_sec)
        VALUES ($1, $2, 'ai', $3)
        """,
        city, script_ru, duration,
    )

    # 4. Состояние эфира + сегменты по языкам (для dev-плейлиста)
    st = get_state(city)
    st.is_live = True
    if st.broadcaster_type != "doverenniy":
        st.broadcaster_type = "ai"
        st.broadcaster_name = "AI Host"

    # 5. Icecast мультипоток (production): push в /live_{lang}
    if broadcast.is_available():
        try:
            asyncio.create_task(
                asyncio.to_thread(broadcast.push_files_multilang, paths)
            )
        except Exception:
            pass

    # 6. Уведомить слушателей: per-lang сегмент (Req 11.2, 11.3)
    for lang, p in paths.items():
        fname = _basename(p)
        seg = st.add_segment(fname, scripts.get(lang, script_ru), duration)
        await manager.broadcast(city, {
            "type": "new_segment",
            "data": {
                "id": seg["id"],
                "lang": lang,
                "url": f"/radio/audio/{city}/{fname}",
                "script": scripts.get(lang, script_ru),
                "duration_sec": duration,
                "broadcaster_type": st.broadcaster_type,
                "broadcaster_name": st.broadcaster_name,
                "is_live": True,
                "listeners_count": manager.listeners_count(city),
                "use_icecast": broadcast.is_available(),
            },
        })

    return OkResponse(detail={
        "draft_id": draft_id, "status": "approved",
        "langs": list(paths.keys()),
    })
