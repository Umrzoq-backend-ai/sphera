from fastapi import WebSocket


class ConnectionManager:
    """Shahar bo'yicha WebSocket xonalarini boshqaradi."""

    def __init__(self) -> None:
        self.rooms: dict[str, list[WebSocket]] = {}

    async def connect(self, city: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.rooms.setdefault(city, []).append(websocket)

    def disconnect(self, city: str, websocket: WebSocket) -> None:
        conns = self.rooms.get(city)
        if conns and websocket in conns:
            conns.remove(websocket)
        if conns is not None and not conns:
            self.rooms.pop(city, None)

    def listeners_count(self, city: str) -> int:
        return len(self.rooms.get(city, []))

    async def broadcast(self, city: str, data: dict) -> None:
        conns = list(self.rooms.get(city, []))
        dead: list[WebSocket] = []
        for ws in conns:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(city, ws)


manager = ConnectionManager()
