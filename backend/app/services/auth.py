from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserLogin, UserRegister
from app.services.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_session_id,
    get_refresh_token_expiration,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.services.email_verification import create_and_send_verification_otp


def register_user(db: Session, user_data: UserRegister) -> User:
    """Register a new user."""
    if db.query(User).filter(User.username == user_data.username).first():
        raise ValueError("Username already exists.")

    if (
        user_data.email
        and db.query(User)
        .filter(User.email == user_data.email)
        .first()
    ):
        raise ValueError("Email already exists.")


    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        email_verified=False,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if new_user.email:
        try:
            create_and_send_verification_otp(db=db, user=new_user)
        except Exception:
            # User created, verification dispatch attempted
            pass

    return new_user


def _issue_tokens(
    db: Session,
    user: User,
    session_id: UUID,
) -> Token:
    """Generate a token pair and stage its refresh-token record."""
    token_data = {
        "sub": str(user.id),
        "sid": str(session_id),
    }
    refresh_expires_at = get_refresh_token_expiration()

    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(
        data=token_data,
        expires_at=refresh_expires_at,
    )

    db.add(
        RefreshToken(
            user_id=user.id,
            session_id=session_id,
            token_hash=hash_refresh_token(refresh_token),
            expires_at=refresh_expires_at,
        )
    )

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


def _parse_refresh_token_claims(refresh_token: str) -> tuple[UUID, UUID]:
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise ValueError("Invalid refresh token.")

    try:
        user_id = UUID(str(payload["sub"]))
        session_id = UUID(str(payload["sid"]))
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError("Invalid refresh token.") from exc

    return user_id, session_id


def _get_locked_user(db: Session, user_id: UUID) -> User | None:
    return (
        db.query(User)
        .filter(User.id == user_id)
        .with_for_update()
        .one_or_none()
    )


def _get_locked_refresh_token(
    db: Session,
    *,
    token_hash: str,
    user_id: UUID,
    session_id: UUID,
    now: datetime,
) -> RefreshToken:
    stored_token = (
        db.query(RefreshToken)
        .filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.user_id == user_id,
        RefreshToken.session_id == session_id,
    )
    .with_for_update()
    .one_or_none()
    )

    if (
        stored_token is None
        or stored_token.expires_at <= now
    ):
        raise ValueError("Invalid refresh token.")

    return stored_token


def _revoke_session_tokens(
    db: Session,
    *,
    user_id: UUID,
    session_id: UUID,
    now: datetime,
) -> None:
    (
        db.query(RefreshToken)
        .filter(
            RefreshToken.user_id == user_id,
            RefreshToken.session_id == session_id,
            RefreshToken.is_revoked.is_(False),
        )
        .update(
            {
                RefreshToken.is_revoked: True,
                RefreshToken.revoked_at: now,
            },
            synchronize_session=False,
        )
    )


def login_user(db: Session, credentials: UserLogin) -> Token:
    """
    Authenticate a user and create a new session.
    """

    identifier = credentials.username.strip()

    if "@" in identifier:
        user = (
            db.query(User)
            .filter(User.email == identifier)
            .first()
        )
    else:
        user = (
            db.query(User)
            .filter(User.username == identifier)
            .first()
        )

    if user is None or not user.is_active:
        raise ValueError("Invalid username or password.")

    if not verify_password(
        credentials.password,
        user.password_hash,
    ):
        raise ValueError("Invalid username or password.")

    if not user.email_verified:
        raise ValueError("Please verify your email before logging in.")

    try:
        token_pair = _issue_tokens(
            db=db,
            user=user,
            session_id=generate_session_id(),
        )

        user.last_login_at = datetime.now(timezone.utc)

        db.commit()

        return token_pair

    except Exception:
        db.rollback()
        raise


def refresh_access_token(db: Session, refresh_token: str) -> Token:
    """Rotate a refresh token and return a replacement token pair."""
    user_id, session_id = _parse_refresh_token_claims(refresh_token)
    now = datetime.now(timezone.utc)
    token_hash = hash_refresh_token(refresh_token)
    token_pair: Token | None = None
    token_reuse_detected = False

    try:
        user = _get_locked_user(db, user_id)
        if user is None or not user.is_active:
            raise ValueError("Invalid refresh token.")

        stored_token = _get_locked_refresh_token(
            db,
            token_hash=token_hash,
            user_id=user_id,
            session_id=session_id,
            now=now,
        )

        if stored_token.is_revoked:
            _revoke_session_tokens(
                db,
                user_id=user_id,
                session_id=session_id,
                now=now,
            )
            token_reuse_detected = True
        else:
            stored_token.is_revoked = True
            stored_token.revoked_at = now
            token_pair = _issue_tokens(db, user, session_id)

        db.commit()
    except Exception:
        db.rollback()
        raise

    if token_reuse_detected or token_pair is None:
        raise ValueError("Invalid refresh token.")

    return token_pair


def logout_session(db: Session, refresh_token: str) -> None:
    """Revoke the active refresh-token family for one session."""
    user_id, session_id = _parse_refresh_token_claims(refresh_token)
    now = datetime.now(timezone.utc)

    try:
        user = _get_locked_user(db, user_id)
        if user is None:
            raise ValueError("Invalid refresh token.")

        stored_token = _get_locked_refresh_token(
            db,
            token_hash=hash_refresh_token(refresh_token),
            user_id=user_id,
            session_id=session_id,
            now=now,
        )
        if stored_token.is_revoked:
            raise ValueError("Invalid refresh token.")

        _revoke_session_tokens(
            db,
            user_id=user_id,
            session_id=session_id,
            now=now,
        )
        db.commit()
    except Exception:
        db.rollback()
        raise


def logout_all_sessions(db: Session, user_id: UUID) -> None:
    """Revoke every refresh-token family belonging to a user."""
    now = datetime.now(timezone.utc)

    try:
        user = _get_locked_user(db, user_id)
        if user is None:
            raise ValueError("User not found.")

        (
            db.query(RefreshToken)
            .filter(
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked.is_(False),
            )
            .update(
                {
                    RefreshToken.is_revoked: True,
                    RefreshToken.revoked_at: now,
                },
                synchronize_session=False,
            )
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
