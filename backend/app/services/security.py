import hashlib
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from jose import JWTError, jwt
from pwdlib import PasswordHash

from app.core.config import settings


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def _encode_token(
    data: dict,
    *,
    token_type: str,
    expires_at: datetime,
) -> str:
    to_encode = data.copy()
    to_encode.update(
        {
            "exp": expires_at,
            "iat": datetime.now(timezone.utc),
            "jti": str(uuid4()),
            "type": token_type,
        }
    )

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_access_token(data: dict) -> str:
    """Create a short-lived access token."""
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return _encode_token(
        data,
        token_type="access",
        expires_at=expires_at,
    )


def get_refresh_token_expiration() -> datetime:
    """Return the absolute expiration time used by a new refresh token."""
    return datetime.now(timezone.utc) + timedelta(
    days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )


def create_refresh_token(
    data: dict,
    *,
    expires_at: datetime | None = None,
) -> str:
    """Create a long-lived refresh token with a unique token identifier."""
    return _encode_token(
        data,
        token_type="refresh",
        expires_at=expires_at or get_refresh_token_expiration(),
    )


def decode_token(token: str) -> dict:
    """Validate a JWT's signature and required standard claims."""
    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={
                "require_exp": True,
                "require_sub": True,
            },
        )
    except JWTError as exc:
        raise ValueError("Invalid token.") from exc


def decode_access_token(token: str) -> dict:
    """Validate an access token and reject other JWT types."""
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise ValueError("Invalid access token.")
    return payload


def hash_refresh_token(token: str) -> str:
    """Hash a refresh token before storing or looking it up."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_session_id() -> UUID:
    """Generate a unique session identifier."""
    return uuid4()
