"""Chat router — INTRA GROUP v3.0.

- Matn xabar: -0.001 point
- Ovozli xabar: -0.005 point
- WebSocket real-time
- Point yetmasa — xabar yuborilmaydi
"""

import asyncio
import logging
from datetime import datetime

from fastapi import (
    APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query,
)

from app.core.database import db
from app.core.models import ChatMessageRequest, ChatMessageOut, OkResponse
from app.core.dependencies import get_current_user, decode_token
from app.core.ws_manager import manager
from app.services import points as points_service

log = logging.getLogger("chat")

router = APIRouter(prefix="/chat", tags=["chat"])


def _display_name(user: dict) -> str:
    return user.get("display_name") or user.get("username") or user.get("full_name") or f"id{user['telegram_id']}"


@router.get("/history", response_model=list[ChatMessageOut])
async def get_chat_history(limit: int = 50):
    """Oxirgi chat xabarlari."""
    rows = await db.fetch(
        """
        SELECT c.id, u.username, u.display_name, c.message, c.message_type,
               c.audio_file_path, c.created_at
        FROM chat_messages c
        LEFT JOIN users u ON u.id = c.user_id
        ORDER BY c.created_at DESC
        LIMIT $1
        """,
        limit,
    )
    rows = list(reversed(rows))
    out = []
    for r in rows:
        voice_url = None
        if r["message_type"] == "voice" and r["audio_file_path"]:
            voice_url = f"/messages/voice/{r['audio_file_path']}"
        out.append(ChatMessageOut(
            id=r["id"],
            username=r["username"],
            display_name=r["display_name"],
            message=r["message"],
            message_type=r["message_type"] or "text",
            voice_url=voice_url,
            created_at=r["created_at"],
        ))
    return out


@router.post("/send", response_model=OkResponse)
async def send_message(
    payload: ChatMessageRequest,
    user: dict = Depends(get_current_user),
):
    """Matn xabar yuborish — 0.001 point sarflanadi."""
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")

    # Point sarflash
    spent = await points_service.spend_text(user["id"])
    if not spent["ok"]:
        raise HTTPException(
            status_code=402,
            detail={"error": "insufficient_points", "points": str(spent["points"])},
        )

    row = await db.fetchrow(
        """
        INSERT INTO chat_messages (user_id, message, message_type)
        VALUES ($1, $2, 'text')
        RETURNING id, created_at
        """,
        user["id"], payload.message.strip(),
    )

    # Broadcast
    await manager.broadcast("global", {
        "type": "chat",
        "data": {
            "id": row["id"],
            "username": user["username"],
            "display_name": _display_name(user),
            "message": payload.message.strip(),
            "message_type": "text",
            "created_at": row["created_at"].isoformat(),
        },
    })

    return OkResponse(detail={"points": str(spent["points"])})


@router.websocket("/ws")
async def chat_ws(websocket: WebSocket, token: str = Query(...)):
    """Real-time chat WebSocket."""
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

    await manager.connect("global", websocket)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "chat":
                message = (data.get("message") or "").strip()
                if not message:
                    continue

                spent = await points_service.spend_text(user["id"])
                if not spent["ok"]:
                    await websocket.send_json({
                        "type": "error",
                        "data": {"error": "insufficient_points", "points": str(spent["points"])},
                    })
                    continue

                row = await db.fetchrow(
                    """
                    INSERT INTO chat_messages (user_id, message, message_type)
                    VALUES ($1, $2, 'text')
                    RETURNING id, created_at
                    """,
                    user["id"], message,
                )

                await manager.broadcast("global", {
                    "type": "chat",
                    "data": {
                        "id": row["id"],
                        "username": user["username"],
                        "display_name": user["display_name"] or user["full_name"],
                        "message": message,
                        "message_type": "text",
                        "created_at": row["created_at"].isoformat(),
                    },
                })

                await websocket.send_json({
                    "type": "balance",
                    "data": {"points": str(spent["points"])},
                })

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect("global", websocket)
    except Exception:
        manager.disconnect("global", websocket)
