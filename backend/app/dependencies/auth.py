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

    payload = None
    is_cognito = False

    # 1. Try verifying with Cognito
    try:
        payload = verify_cognito_token(token)
        is_cognito = True
    except Exception:
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

    if username or email:
        filter_clauses = []
        if username:
            filter_clauses.append(func.lower(User.username) == username.lower())
        if email:
            filter_clauses.append(func.lower(User.email) == email.lower())

        user = db.query(User).filter(User.is_active.is_(True), or_(*filter_clauses)).first()
        if user:
            if is_cognito and not user.cognito_sub:
                user.cognito_sub = str(sub)
                if email and not user.email:
                    user.email = email.lower()
                user.email_verified = True
                db.commit()
                db.refresh(user)
            return user

    # 4. If Cognito token is valid but user record not staged in DB, auto-create it
    if is_cognito:
        new_username = username or f"user_{str(sub)[:8]}"
        clean_email = email.lower() if email else None

        existing_username = db.query(User).filter(func.lower(User.username) == new_username.lower()).first()
        if existing_username:
            new_username = f"{new_username}_{str(uuid4())[:4]}"

        new_user = User(
            username=new_username,
            email=clean_email,
            cognito_sub=str(sub),
            email_verified=True,
            is_active=True,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    raise credentials_exception
