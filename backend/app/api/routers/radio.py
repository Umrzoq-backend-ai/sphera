import os

import httpx
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.responses import FileResponse, StreamingResponse

from app.core.database import db
from app.core.models import (
    RadioStatus,
    RadioStatusUpdate,
    SegmentRegister,
    SegmentOut,
    OkResponse,
)
from app.core.dependencies import require_role, decode_token
from app.core.state import get_state, VALID_CITIES, AUDIO_DIR
from app.core.ws_manager import manager
from app.services import broadcast

router = APIRouter(prefix="/radio", tags=["radio"])

ROLE_LEVELS = {"slusatel": 0, "aktivniy": 1, "doverenniy": 2, "admin": 99}

ICECAST_HOST = os.getenv("ICECAST_HOST", "localhost")
ICECAST_PORT = int(os.getenv("ICECAST_PORT", "8000"))
BROADCAST_LANGS = ("ru", "lt", "en")


@router.get("/live/{lang}")
async def live_proxy(lang: str):
    """Icecast oqimini backend orqali proxy qiladi (telefon localhost'ни ko'rmaydi).

    Frontend `<origin>/radio/live/{lang}` ни tinglaydi → backend Icecast
    `/live_{lang}` mountини uzatadi. Tunnel orqali ham ishlaydi.
    """
    if lang not in BROADCAST_LANGS:
        raise HTTPException(status_code=404, detail="Unknown stream language")

    upstream = f"http://{ICECAST_HOST}:{ICECAST_PORT}/live_{lang}"

    async def _pump():
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream("GET", upstream) as resp:
                    if resp.status_code != 200:
                        return
                    async for chunk in resp.aiter_bytes(8192):
                        yield chunk
        except Exception:
            return

    return StreamingResponse(_pump(), media_type="audio/mpeg")


@router.get("/status", response_model=RadioStatus)
async def radio_status(city: str = Query(...)):
    if city not in VALID_CITIES:
        raise HTTPException(status_code=400, detail="Unknown city")
    st = get_state(city)
    return RadioStatus(**st.to_dict(listeners_count=manager.listeners_count(city)))


@router.post("/status", response_model=OkResponse)
async def update_radio_status(payload: RadioStatusUpdate):
    if payload.city not in VALID_CITIES:
        raise HTTPException(status_code=400, detail="Unknown city")

    st = get_state(payload.city)
    st.is_live = payload.is_live
    st.broadcaster_type = payload.broadcaster_type
    st.broadcaster_name = payload.broadcaster_name

    if payload.script:
        await db.execute(
            """
            INSERT INTO broadcasts (city, script, broadcaster_type, duration_sec)
            VALUES ($1, $2, $3, $4)
            """,
            payload.city,
            payload.script,
            payload.broadcaster_type,
            payload.duration_sec,
        )

    await manager.broadcast(
        payload.city,
        {
            "type": "radio_status",
            "data": st.to_dict(listeners_count=manager.listeners_count(payload.city)),
        },
    )
    return OkResponse()


@router.post("/segment", response_model=SegmentOut)
async def register_segment(payload: SegmentRegister):
    """radio-host yangi AI ovoz segmentini ro'yxatga oladi."""
    if payload.city not in VALID_CITIES:
        raise HTTPException(status_code=400, detail="Unknown city")

    st = get_state(payload.city)
    st.is_live = True
    if st.broadcaster_type != "doverenniy":
        st.broadcaster_type = "ai"
        st.broadcaster_name = "AI Host"

    seg = st.add_segment(payload.filename, payload.script, payload.duration_sec)

    await db.execute(
        """
        INSERT INTO broadcasts (city, script, broadcaster_type, duration_sec)
        VALUES ($1, $2, 'ai', $3)
        """,
        payload.city,
        payload.script,
        payload.duration_sec,
    )

    url = f"/radio/audio/{payload.city}/{payload.filename}"

    # Tinglovchilarga yangi segment haqida xabar
    await manager.broadcast(
        payload.city,
        {
            "type": "new_segment",
            "data": {
                "id": seg["id"],
                "url": url,
                "script": payload.script,
                "duration_sec": payload.duration_sec,
                "broadcaster_type": st.broadcaster_type,
                "broadcaster_name": st.broadcaster_name,
            },
        },
    )

    return SegmentOut(
        id=seg["id"],
        filename=payload.filename,
        script=payload.script,
        duration_sec=payload.duration_sec,
        url=url,
    )


@router.get("/playlist", response_model=list[SegmentOut])
async def playlist(city: str = Query(...)):
    """Shahar uchun oxirgi AI segmentlar ro'yxati."""
    if city not in VALID_CITIES:
        raise HTTPException(status_code=400, detail="Unknown city")
    st = get_state(city)
    return [
        SegmentOut(
            id=s["id"],
            filename=s["filename"],
            script=s["script"],
            duration_sec=s["duration_sec"],
            url=f"/radio/audio/{city}/{s['filename']}",
        )
        for s in st.segments
    ]


@router.get("/audio/{city}/{filename}")
async def get_audio(city: str, filename: str):
    """AI ovoz segment faylini qaytaradi (ichki rejim)."""
    if city not in VALID_CITIES:
        raise HTTPException(status_code=400, detail="Unknown city")
    # Yo'l xavfsizligi — faqat fayl nomi
    safe_name = os.path.basename(filename)
    path = os.path.join(AUDIO_DIR, city, safe_name)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Segment not found")
    return FileResponse(path, media_type="audio/mpeg")


@router.post("/live/start", response_model=OkResponse)
async def live_start(
    city: str = Query(...),
    user: dict = Depends(require_role("doverenniy")),
):
    if city not in VALID_CITIES:
        raise HTTPException(status_code=400, detail="Unknown city")

    st = get_state(city)
    st.is_live = True
    st.broadcaster_type = "doverenniy"
    st.broadcaster_name = user["full_name"] or user["username"] or "Doverenniy"

    await manager.broadcast(
        city,
        {
            "type": "radio_status",
            "data": st.to_dict(listeners_count=manager.listeners_count(city)),
        },
    )
    return OkResponse(detail={"city": city, "broadcaster": st.broadcaster_name})


@router.post("/live/stop", response_model=OkResponse)
async def live_stop(
    city: str = Query(...),
    user: dict = Depends(require_role("doverenniy")),
):
    if city not in VALID_CITIES:
        raise HTTPException(status_code=400, detail="Unknown city")

    st = get_state(city)
    st.broadcaster_type = "ai"
    st.broadcaster_name = "AI Host"

    await manager.broadcast(
        city,
        {
            "type": "radio_status",
            "data": st.to_dict(listeners_count=manager.listeners_count(city)),
        },
    )
    return OkResponse(detail={"city": city})


@router.websocket("/{city}/broadcast/ws")
async def broadcast_ws(websocket: WebSocket, city: str, token: str = Query(...)):
    """Doverenniy mikrofon audiosini Icecast'ga uzatadi (PDF: jonli efir).

    Audio: webm/opus binary chunklar. Faqat doverenniy/admin.
    """
    # Shahar tekshiruvi
    if city not in VALID_CITIES:
        await websocket.close(code=4404)
        return

    # Token + rol tekshiruvi
    try:
        telegram_id = decode_token(token)
    except HTTPException:
        await websocket.close(code=4401)
        return

    user = await db.fetchrow("SELECT * FROM users WHERE telegram_id = $1", telegram_id)
    if user is None:
        await websocket.close(code=4401)
        return
    if ROLE_LEVELS.get(user["role"], 0) < ROLE_LEVELS["doverenniy"]:
        await websocket.close(code=4403)  # huquq yo'q
        return

    await websocket.accept()

    # Dev rejim: Icecast yo'q — jonli efir mavjud emas (Requirement 6.5)
    if not broadcast.is_available():
        await websocket.send_json({
            "type": "broadcast_unavailable",
            "reason": "icecast_disabled",
        })
        await websocket.close(code=1000)
        return

    # Bitta shaharда bitta broadcaster (Requirement 5.5)
    if broadcast.is_busy(city):
        await websocket.send_json({
            "type": "broadcast_busy",
            "reason": "city_already_live",
        })
        await websocket.close(code=1000)
        return

    name = user["full_name"] or user["username"] or "Doverenniy"
    session = broadcast.open_session(city, name)
    if session is None:
        await websocket.send_json({"type": "broadcast_busy"})
        await websocket.close(code=1000)
        return

    # Efir holatini live qilamiz
    st = get_state(city)
    st.is_live = True
    st.broadcaster_type = "doverenniy"
    st.broadcaster_name = name
    await manager.broadcast(city, {
        "type": "radio_status",
        "data": st.to_dict(listeners_count=manager.listeners_count(city)),
    })
    await websocket.send_json({"type": "broadcast_started"})

    try:
        while True:
            chunk = await websocket.receive_bytes()
            ok = broadcast.feed(city, chunk)
            if not ok:
                await websocket.send_json({"type": "broadcast_error"})
                break
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        broadcast.close_session(city)
        # AI hostга qaytaramiz
        st.broadcaster_type = "ai"
        st.broadcaster_name = "AI Host"
        await manager.broadcast(city, {
            "type": "radio_status",
            "data": st.to_dict(listeners_count=manager.listeners_count(city)),
        })
