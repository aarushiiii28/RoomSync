import re


def normalize_email(email: str) -> str:
    """Return *email* in lowercase-stripped form."""
    return email.strip().lower()


def normalize_username(username: str) -> str:
    """Return *username* stripped of leading/trailing whitespace."""
    return username.strip()


def is_valid_email(email: str) -> bool:
    """Basic e-mail format check (Pydantic's EmailStr is preferred in schemas)."""
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return bool(re.match(pattern, email))


def clamp(value: float, min_value: float, max_value: float) -> float:
    """Clamp *value* to [*min_value*, *max_value*]."""
    return max(min_value, min(max_value, value))


def paginate(query, page: int, page_size: int):
    """Apply offset/limit pagination to a SQLAlchemy *query*.

    Args:
        query: A SQLAlchemy ``Select`` statement.
        page: 1-indexed page number.
        page_size: Number of items per page.

    Returns:
        The modified query with offset and limit applied.
    """
    offset = (page - 1) * page_size
    return query.offset(offset).limit(page_size)
