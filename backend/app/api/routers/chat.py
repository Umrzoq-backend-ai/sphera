import asyncio
from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    Query,
)

from app.core.database import db
from app.core.models import ChatMessageRequest, ChatMessageOut, OkResponse
from app.core.dependencies import get_current_user, decode_token
from app.core.state import VALID_CITIES, get_state
from app.core.ws_manager import manager
from app.services import points

router = APIRouter(prefix="/chat", tags=["chat"])

ROLE_LEVELS = {"slusatel": 0, "aktivniy": 1, "doverenniy": 2, "admin": 99}


def _display_name(user: dict) -> str:
    return user["username"] or user["full_name"] or f"id{user['telegram_id']}"


async def _ai_mood_reply(city: str, user_id: int, text: str):
    """ИИ отвечает в чат, подстраиваясь под настроение пользователя (психотип).

    Фоновая задача: анализирует эмоцию → генерирует короткий ответ ведущего →
    шлёт в чат как «🤖 ИИ-ведущий». Не блокирует основной поток.
    """
    try:
        from app.services import psychotype as _pt, assistant as _as
        analysis = await _pt.analyze(text)
        # Сохраняем психотип (для профиля пользователя)
        try:
            await db.execute(
                """
                INSERT INTO psychotypes
                  (user_id, focus_of_attention, emotional_tone, key_topic, priority_score, raw_json)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                user_id, analysis["focus_of_attention"], analysis["emotional_tone"],
                analysis["key_topic"], analysis["priority_score"], analysis["raw_json"],
            )
        except Exception:
            pass
        reply = await _as.answer_message(text, analysis)
        if reply:
            await manager.broadcast(city, {
                "type": "chat",
                "data": {
                    "username": "🤖 ИИ-ведущий",
                    "message": reply,
                    "kind": "ai",
                    "created_at": datetime.utcnow().isoformat(),
                },
            })
    except Exception:
        pass


async def _handle_studio(websocket: WebSocket, user: dict, city: str, data: dict):
    """Заявка в студию: роль aktivniy+, списание поинта, дубль в чат + флаг для ИИ/модератора."""
    text = (data.get("message") or "").strip()
    if not text:
        return
    # Доступ только aktivniy+ (Req 5.1)
    if ROLE_LEVELS.get(user["role"], 0) < ROLE_LEVELS["aktivniy"]:
        await websocket.send_json({"type": "studio_denied", "data": {"reason": "role"}})
        return
    # Списание лимита (Req 5.2)
    spent = await points.spend(user["id"], "studio", points.COST["studio"])
    if not spent["ok"]:
        await websocket.send_json({
            "type": "limit_exceeded",
            "data": {"event": "studio", "points": spent["points"]},
        })
        return
    # (а) Дубль в общий чат — динамика, видят все (Req 6.1)
    row = await db.fetchrow(
        """
        INSERT INTO chat_messages (user_id, city, message, message_type)
        VALUES ($1, $2, $3, 'studio')
        RETURNING created_at
        """,
        user["id"], city, text,
    )
    await manager.broadcast(city, {
        "type": "chat",
        "data": {
            "username": _display_name(user),
            "message": text,
            "created_at": row["created_at"].isoformat(),
        },
    })
    # (б) Пометка для ИИ + модератора (Req 6.2)
    lang = data.get("lang") if data.get("lang") in ("ru", "lt", "en") else None
    await db.execute(
        """
        INSERT INTO messages (user_id, city, text, status, is_for_studio, lang)
        VALUES ($1, $2, $3, 'pending', true, $4)
        """,
        user["id"], city, text, lang,
    )
    # Психотип (фоновый анализ, не критичен)
    try:
        from app.services import psychotype as _pt
        analysis = await _pt.analyze(text)
        await db.execute(
            """
            INSERT INTO psychotypes
              (user_id, focus_of_attention, emotional_tone, key_topic, priority_score, raw_json)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            user["id"], analysis["focus_of_attention"],
            analysis["emotional_tone"], analysis["key_topic"],
            analysis["priority_score"], analysis["raw_json"],
        )
    except Exception:
        pass
    await websocket.send_json({"type": "studio_ack", "data": {"points": spent["points"]}})


@router.get("/{city}", response_model=list[ChatMessageOut])
async def get_chat_history(city: str):
    if city not in VALID_CITIES:
        raise HTTPException(status_code=400, detail="Unknown city")

    rows = await db.fetch(
        """
        SELECT u.username AS username, c.message AS message, c.created_at AS created_at,
               c.message_type AS message_type, c.audio_file_path AS audio_file_path
        FROM chat_messages c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.city = $1
        ORDER BY c.created_at DESC
        LIMIT 50
        """,
        city,
    )
    rows = list(reversed(rows))
    out = []
    for r in rows:
        mt = r["message_type"] or "text"
        afp = r["audio_file_path"]
        voice_url = None
        file_url = None
        if mt in ("voice", "studio_voice") and afp:
            voice_url = f"/messages/voice/{afp}"
        elif mt == "file" and afp:
            file_url = f"/messages/file/{afp}"
        out.append(ChatMessageOut(
            username=r["username"],
            message=r["message"],
            created_at=r["created_at"],
            message_type=mt,
            voice_url=voice_url,
            file_url=file_url,
        ))
    return out


@router.post("/{city}", response_model=OkResponse)
async def post_chat_message(
    city: str,
    payload: ChatMessageRequest,
    user: dict = Depends(get_current_user),
):
    if city not in VALID_CITIES:
        raise HTTPException(status_code=400, detail="Unknown city")
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")

    # Чат с лимитом (босс)
    spent = await points.spend(user["id"], "chat", points.COST["chat"])
    if not spent["ok"]:
        raise HTTPException(
            status_code=402,
            detail={"error": "insufficient_limit", "points": spent["points"]},
        )

    row = await db.fetchrow(
        """
        INSERT INTO chat_messages (user_id, city, message)
        VALUES ($1, $2, $3)
        RETURNING created_at
        """,
        user["id"],
        city,
        payload.message,
    )

    username = user["username"] or user["full_name"] or f"id{user['telegram_id']}"
    await manager.broadcast(
        city,
        {
            "type": "chat",
            "data": {
                "username": username,
                "message": payload.message,
                "created_at": row["created_at"].isoformat(),
            },
        },
    )
    return OkResponse(detail={"points": spent["points"]})


@router.websocket("/{city}/ws")
async def chat_ws(websocket: WebSocket, city: str, token: str = Query(...)):
    if city not in VALID_CITIES:
        await websocket.close(code=4404)
        return

    try:
        telegram_id = decode_token(token)
    except HTTPException:
        await websocket.close(code=4401)
        return

    user = await db.fetchrow(
        "SELECT * FROM users WHERE telegram_id = $1", telegram_id
    )
    if user is None:
        await websocket.close(code=4401)
        return

    # Guruhga bog'liqlik: a'zo bo'lmasa WS rad etiladi (PDF: Community-bound)
    from app.services import membership
    if not await membership.is_member_cached(telegram_id):
        await websocket.close(code=4403)
        return

    await manager.connect(city, websocket)
    await _notify_presence(city)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "chat":
                # Обычный чат с лимитом (босс: «в чат, но у него будет лимит»)
                message = (data.get("message") or "").strip()
                if not message:
                    continue
                spent = await points.spend(user["id"], "chat", points.COST["chat"])
                if not spent["ok"]:
                    await websocket.send_json({
                        "type": "limit_exceeded",
                        "data": {"event": "chat", "points": spent["points"]},
                    })
                    continue
                row = await db.fetchrow(
                    """
                    INSERT INTO chat_messages (user_id, city, message, message_type)
                    VALUES ($1, $2, $3, 'text')
                    RETURNING created_at
                    """,
                    user["id"],
                    city,
                    message,
                )
                await manager.broadcast(
                    city,
                    {
                        "type": "chat",
                        "data": {
                            "username": _display_name(user),
                            "message": message,
                            "created_at": row["created_at"].isoformat(),
                        },
                    },
                )
                # Баланс пользователю
                await websocket.send_json({
                    "type": "balance",
                    "data": {"points": spent["points"]},
                })
                # ИИ отвечает по настроению (фоном, не блокирует)
                asyncio.create_task(_ai_mood_reply(city, user["id"], message))
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

            elif msg_type in ("studio", "server_message"):
                # "Отправить в студию" (server_message — устаревший контракт, Req 15.3)
                await _handle_studio(websocket, user, city, data)

    except WebSocketDisconnect:
        manager.disconnect(city, websocket)
        await _notify_presence(city)
    except Exception:
        manager.disconnect(city, websocket)
        await _notify_presence(city)


async def _notify_presence(city: str) -> None:
    st = get_state(city)
    await manager.broadcast(
        city,
        {
            "type": "presence",
            "data": {
                "listeners_count": manager.listeners_count(city),
                "radio": st.to_dict(listeners_count=manager.listeners_count(city)),
            },
        },
    )
