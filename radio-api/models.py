from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel


# ---------- Auth ----------
class TelegramAuthRequest(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    full_name: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    role: str
    points: int
    city: Optional[str] = None


# ---------- Cities ----------
class CityOut(BaseModel):
    slug: str
    name_ru: str
    name_uz: str
    country_ru: Optional[str] = None
    country_uz: Optional[str] = None
    lat: float
    lng: float
    listeners_count: int = 0


# ---------- Users ----------
class PsychotypeOut(BaseModel):
    focus_of_attention: Optional[str] = None
    emotional_tone: Optional[str] = None
    key_topic: Optional[str] = None
    priority_score: Optional[int] = None


class UserMeOut(BaseModel):
    telegram_id: int
    role: str
    points: int
    city: Optional[str] = None
    broadcast_lang: Optional[str] = "ru"
    psychotype: Optional[PsychotypeOut] = None


class UpdateCityRequest(BaseModel):
    city: str


class UpdateLanguageRequest(BaseModel):
    language: str


class UpdateBroadcastLangRequest(BaseModel):
    broadcast_lang: str  # ru | lt | en


class GeoSearchResult(BaseModel):
    slug: str
    name_ru: str
    country_ru: Optional[str] = None
    lat: float
    lng: float


class EnsureCityRequest(BaseModel):
    name: str
    country: Optional[str] = None
    lat: float
    lng: float


# ---------- Radio ----------
class RadioStatus(BaseModel):
    is_live: bool
    broadcaster_type: Optional[str] = None
    broadcaster_name: Optional[str] = None
    listeners_count: int = 0
    stream_url: Optional[str] = None


class RadioStatusUpdate(BaseModel):
    city: str
    is_live: bool
    broadcaster_type: Optional[str] = None
    broadcaster_name: Optional[str] = None
    script: Optional[str] = None
    duration_sec: Optional[int] = None


class SegmentRegister(BaseModel):
    city: str
    filename: str
    script: str
    duration_sec: int


class SegmentOut(BaseModel):
    id: int
    filename: str
    script: str
    duration_sec: int
    url: str


# ---------- Messages ----------
class TextMessageRequest(BaseModel):
    city: str
    text: str
    lang: Optional[str] = None  # ru | lt | en


class MessageResponse(BaseModel):
    transcript: Optional[str] = None
    psychotype: Optional[PsychotypeOut] = None
    ai_reply: Optional[str] = None
    voice_url: Optional[str] = None
    points: Optional[int] = None


# ---------- Chat ----------
class ChatMessageRequest(BaseModel):
    message: str


class ChatMessageOut(BaseModel):
    username: Optional[str] = None
    message: str
    created_at: datetime
    message_type: str = "text"
    voice_url: Optional[str] = None
    file_url: Optional[str] = None


# ---------- Admin ----------
class RoleUpdateRequest(BaseModel):
    role: str


class PointsAddRequest(BaseModel):
    telegram_id: int
    amount: int


class OkResponse(BaseModel):
    ok: bool = True
    detail: Optional[Any] = None


# ---------- Анонсы (стартовый экран) ----------
class AnnouncementOut(BaseModel):
    slot: int
    title: str = ""
    text: str = ""
    emoji: str = "📻"
    image_url: str = ""


class AnnouncementsResponse(BaseModel):
    banner1: Optional[AnnouncementOut] = None
    banner2: Optional[AnnouncementOut] = None


class AnnouncementUpdate(BaseModel):
    title: str = ""
    text: str = ""
    emoji: str = "📻"
    image_url: str = ""


# ---------- Эфир черновики (ИИ-агрегация → модератор) ----------
class DraftOut(BaseModel):
    id: int
    city: str
    main_topic: Optional[str] = None
    source_count: int = 0
    script: str
    script_lt: Optional[str] = None
    script_en: Optional[str] = None
    status: str
    created_at: datetime


class DraftEditRequest(BaseModel):
    script: str
