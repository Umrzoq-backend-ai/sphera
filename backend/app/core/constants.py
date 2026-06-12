"""INTRA GROUP — konstantlar (single source of truth)."""

# Darajalar (levels)
LEVELS: dict[int, str] = {
    1: "Слушатель",
    2: "Слушатель",
    3: "Слушатель и Ведущий",
}

# Tillar
SUPPORTED_LANGUAGES = {"ru", "en", "lt"}

# Point narxlari (kasr)
COST_TEXT_MESSAGE = 0.001     # 1 ta matn xabar
COST_VOICE_MESSAGE = 0.005   # 1 ta ovozli xabar

# Boshlang'ich point (ro'yxatdan o'tganda)
INITIAL_POINTS = 5.0

# Level chegaralari (point miqdoriga qarab AVTOMATIK ko'tariladi)
# Level 1: 0–99 point | Level 2: 100–999 | Level 3: 1000+ (ведущий)
LEVEL_THRESHOLDS: list[tuple[int, int]] = [
    (3, 1000),   # >= 1000 point → level 3 (ведущий)
    (2, 100),    # >= 100 point  → level 2
    (1, 0),      # boshlang'ich   → level 1
]


def level_for_points(points) -> int:
    """Point miqdoriga qarab levelni hisoblaydi (avtomatik ko'tarilish)."""
    p = float(points)
    for level, threshold in LEVEL_THRESHOLDS:
        if p >= threshold:
            return level
    return 1


# Level 3 = ведущий (efirga chiqish huquqi)
ROLE_LEVELS: dict[str, int] = {
    "listener": 1,
    "broadcaster": 3,
    "admin": 99,
}
