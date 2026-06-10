import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from database import db

SECRET_KEY = os.getenv("SECRET_KEY", "change_this_to_a_random_32char_secret")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30

ADMIN_IDS = {
    int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip().isdigit()
}

ROLE_LEVELS = {
    "slusatel": 0,
    "aktivniy": 1,
    "doverenniy": 2,
}

security = HTTPBearer(auto_error=True)


def create_access_token(telegram_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(telegram_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            raise JWTError("no subject")
        return int(sub)
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    telegram_id = decode_token(credentials.credentials)

    # Guruhga bog'liqlik: 600s cache bilan a'zolik tekshiruvi (PDF: Community-bound)
    from services import membership
    if not await membership.is_member_cached(telegram_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Group membership required",
        )

    row = await db.fetchrow(
        "SELECT * FROM users WHERE telegram_id = $1", telegram_id
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    await db.execute(
        "UPDATE users SET last_seen = NOW() WHERE id = $1", row["id"]
    )
    return dict(row)


def require_role(min_role: str):
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        user_level = ROLE_LEVELS.get(user["role"], 0)
        needed = ROLE_LEVELS.get(min_role, 0)
        if user_level < needed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role '{min_role}' or higher",
            )
        return user

    return checker


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["telegram_id"] not in ADMIN_IDS and user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
