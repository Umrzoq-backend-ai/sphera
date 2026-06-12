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

# Level chegaralari (point asosida avtomatik ko'tarilmaydi — admin qiladi)
# Level 3 = ведущий (efirga chiqish huquqi)
ROLE_LEVELS: dict[str, int] = {
    "listener": 1,
    "broadcaster": 3,
    "admin": 99,
}
