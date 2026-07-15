from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database.session import SessionLocal
from app.models.user import User
from app.utils.exceptions import NotAuthenticatedException, InactiveUserException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Database dependency ───────────────────────────────────────────────────────

def get_db() -> Generator[Session, None, None]:
    """Yield a database session, closing it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Auth dependency ───────────────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode JWT and return the authenticated User ORM object."""
    payload = decode_access_token(token)
    if payload is None:
        raise NotAuthenticatedException()

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise NotAuthenticatedException()

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotAuthenticatedException()
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the authenticated user is active."""
    if not current_user.is_active:
        raise InactiveUserException()
    return current_user
