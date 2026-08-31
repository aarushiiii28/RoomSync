import logging
from uuid import UUID, uuid4
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.services.cognito import verify_cognito_token
from app.services.security import decode_access_token, decode_token

logger = logging.getLogger("roomsync.auth")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def log_debug(msg):
    with open("auth_debug.txt", "a") as f:
        f.write(msg + "\n")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Validate a Cognito-issued or local JWT access token, extract its verified identity claims,
    and resolve the corresponding active RoomSync User database record.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    log_debug(f"DEBUG: get_current_user called with token starting with {token[:10]}")

    payload = None
    is_cognito = False

    # 1. Try verifying with Cognito
    try:
        payload = verify_cognito_token(token)
        is_cognito = True
        log_debug(f"DEBUG: verify_cognito_token succeeded. Payload: {payload}")
    except Exception as e:
        log_debug(f"DEBUG: verify_cognito_token failed: {e}")
        # 2. Try verifying with local HS256 JWT
        try:
            payload = decode_access_token(token)
        except Exception:
            try:
                payload = decode_token(token)
            except Exception as exc:
                logger.warning("Token verification failed: %s", exc)
                raise credentials_exception

    if not payload:
        raise credentials_exception

    sub = payload.get("sub")
    if not sub:
        raise credentials_exception

    # 1. Try direct primary key lookup (used by local JWTs)
    try:
        user_uuid = UUID(str(sub))
        user = (
            db.query(User)
            .filter(
                User.id == user_uuid,
                User.is_active.is_(True),
            )
            .first()
        )
        if user:
            return user
    except (ValueError, TypeError, AttributeError):
        pass

    # 2. Lookup by cognito_sub
    user = (
        db.query(User)
        .filter(
            User.cognito_sub == str(sub),
            User.is_active.is_(True),
        )
        .first()
    )
    if user:
        return user

    # 3. Secondary lookup by username or email
    username = payload.get("username") or payload.get("cognito:username")
    email = payload.get("email")
    log_debug(f"DEBUG: Step 3 lookup. username={username}, email={email}")

    if username or email:
        filter_clauses = []
        if username:
            filter_clauses.append(func.lower(User.username) == username.lower())
        if email:
            filter_clauses.append(func.lower(User.email) == email.lower())

        user = db.query(User).filter(User.is_active.is_(True), or_(*filter_clauses)).first()
        if user:
            log_debug(f"DEBUG: User found by email/username! {user.email}")
            if is_cognito and not user.cognito_sub:
                user.cognito_sub = str(sub)
                if email and not user.email:
                    user.email = email.lower()
                user.email_verified = True
                db.commit()
                db.refresh(user)
            return user


    log_debug("DEBUG: Reached bottom, returning 401")
    raise credentials_exception
