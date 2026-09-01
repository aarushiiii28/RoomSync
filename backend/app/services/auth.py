import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserLogin, UserRegister
from app.services.cognito import (
    cognito_confirm_forgot_password,
    cognito_confirm_sign_up,
    cognito_forgot_password,
    cognito_get_user,
    cognito_initiate_auth,
    cognito_refresh_auth,
    cognito_resend_confirmation_code,
    cognito_sign_up,
    is_cognito_configured,
)
from app.services.security import hash_password, verify_password, create_access_token, create_refresh_token

logger = logging.getLogger("roomsync.auth")


def register_user(db: Session, user_data: UserRegister) -> User:
    """
    Register a new user in Cognito. If Cognito is enabled, user is NOT written to database
    until email is successfully verified through AWS.
    """
    clean_username = user_data.username.strip()
    clean_email = user_data.email.strip().lower() if user_data.email else None

    # Check verified duplicates in local database
    verified_user_username = (
        db.query(User)
        .filter(func.lower(User.username) == clean_username.lower(), User.email_verified.is_(True))
        .first()
    )
    if verified_user_username:
        raise ValueError("Username unavailable.")

    if clean_email:
        verified_user_email = (
            db.query(User)
            .filter(func.lower(User.email) == clean_email)
            .first()
        )
        if verified_user_email:
            raise ValueError("An account already exists for this email. Please log in instead.")

    # Register in Amazon Cognito User Pool / local fallback
    cognito_res = cognito_sign_up(
        username=clean_username,
        email=clean_email or clean_username,
        password=user_data.password,
    )

    user_sub = cognito_res.get("user_sub")
    user_confirmed = cognito_res.get("user_confirmed", False)

    new_user = User(
        id=uuid4(),
        username=clean_username,
        email=clean_email,
        cognito_sub=str(user_sub) if user_sub else None,
        password_hash=hash_password(user_data.password) if user_data.password else None,
        email_verified=bool(user_confirmed),
        is_active=True,
    )

    # If AWS Cognito is configured, do NOT write to database until email is verified!
    if not is_cognito_configured():
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    return new_user


def login_user(db: Session, credentials: UserLogin) -> Token:
    """
    Authenticate a user via AWS Cognito, with a local password fallback.
    If Cognito is configured but returns NotAuthorizedException or is unreachable,
    and the user exists locally with a valid password_hash, use that instead.
    """
    identifier = credentials.username.strip()
    now = datetime.now(timezone.utc)

    # Look up user in local DB to resolve username if email was provided
    user = (
        db.query(User)
        .filter(
            (func.lower(User.email) == identifier.lower())
            | (func.lower(User.username) == identifier.lower())
        )
        .first()
    )
    cognito_identifier = user.username if user and user.username else identifier

    # ── Try Cognito first ──────────────────────────────────────────────────────
    cognito_error: Optional[Exception] = None
    auth_result = None

    try:
        auth_result = cognito_initiate_auth(
            username=cognito_identifier,
            password=credentials.password,
        )
    except ValueError as exc:
        cognito_error = exc
    except Exception as exc:
        # Covers NoCredentialsError, EndpointConnectionError, etc.
        cognito_error = exc

    # ── If Cognito succeeded, use its tokens ───────────────────────────────────
    if auth_result is not None:
        access_token = auth_result.get("access_token", "")
        refresh_token = auth_result.get("refresh_token", "")
        token_type = auth_result.get("token_type", "bearer")

        if is_cognito_configured() and access_token:
            cognito_profile = cognito_get_user(access_token)
            username_val = cognito_profile.get("username") or cognito_identifier
            email_val = cognito_profile.get("email") or (identifier if "@" in identifier else None)
            sub_val = cognito_profile.get("sub")

            user_by_sub = None
            if sub_val:
                user_by_sub = db.query(User).filter(User.cognito_sub == sub_val).first()
            
            if not user_by_sub and email_val:
                user_by_email = db.query(User).filter(func.lower(User.email) == email_val.lower()).first()
                if user_by_email:
                    if user_by_email.cognito_sub and user_by_email.cognito_sub != sub_val:
                        raise ValueError("This email is linked to a different sign-in method. Please try logging in the way you originally signed up, or contact support.")
                    
                    if not user_by_email.cognito_sub:
                        logger.info(f"MATCHING_PATH: email_match_backfilled_sub for native login (email: {email_val})")
                    else:
                        logger.info(f"MATCHING_PATH: Resolved native login via email fallback (sub already matched) for {email_val}")
                        
                    user_by_sub = user_by_email
                    user_by_sub.cognito_sub = sub_val
                else:
                    logger.info(f"MATCHING_PATH: No existing user found during native login for {email_val}")
            else:
                if user_by_sub:
                    logger.info(f"MATCHING_PATH: Resolved native login via direct cognito_sub hit for sub {sub_val}")
            
            user = user_by_sub

            if not user:
                raise ValueError("User profile not found locally. Please contact support or migrate data.")

        if user:
            user.last_login_at = now
            user.email_verified = True
            db.commit()

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type=token_type,
        )

    # ── Cognito failed — try local password fallback ───────────────────────────
    # This handles: missing AWS credentials, Cognito outage, or password mismatch
    # where the user registered before Cognito was configured.
    if user and user.password_hash and user.is_active:
        if not verify_password(credentials.password, user.password_hash):
            raise ValueError(f"DEBUG: verify_password failed for user {user.username}. Password provided: len={len(credentials.password)}")
        # Success path...

        if not user.email_verified:
            raise ValueError("Please verify your email before logging in.")

        # Issue local JWT tokens (same format Cognito would return)
        token_payload = {
            "sub": str(user.id),
            "username": user.username or str(user.id),
        }
        access_token = create_access_token(token_payload)
        refresh_token = create_refresh_token(token_payload)

        user.last_login_at = now
        db.commit()

        logger.info(
            "User %s authenticated via local password fallback (Cognito error: %s)",
            user.username,
            cognito_error,
        )

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
        )

    # ── Nothing worked — surface the original Cognito error ───────────────────
    # If we get here, neither Cognito nor local fallback succeeded
    logger.warning("All authentication methods failed for identifier: %s", identifier)
    raise ValueError(f"DEBUG: Invalid username or password fallback reached. user={user is not None}, has_hash={bool(user and user.password_hash)}, is_active={bool(user and user.is_active)}, cognito_err={str(cognito_error)}")


def google_login_callback(db: Session, code: str, redirect_uri: str | None = None) -> Token:
    """
    Handle Google OAuth callback:
    1. Exchange auth code for tokens via Cognito
    2. Retrieve user info using id_token claims and access token
    3. Ensure user exists in our local DB
    4. Return tokens to client
    """
    from app.services.cognito import cognito_exchange_code_for_token, cognito_get_user
    from jose import jwt

    # 1. Exchange code
    token_resp = cognito_exchange_code_for_token(code, redirect_uri)
    access_token = token_resp.get("access_token")
    id_token = token_resp.get("id_token")
    
    if not access_token and not id_token:
        raise ValueError("Failed to retrieve tokens from Google/Cognito.")

    # 2. Extract user info and sub from id_token claims
    email = None
    username = None
    sub = None

    if id_token:
        try:
            claims = jwt.get_unverified_claims(id_token)
            email = claims.get("email")
            username = claims.get("cognito:username") or claims.get("name") or claims.get("given_name")
            sub = claims.get("sub")
        except Exception as exc:
            logger.warning("Could not read id_token claims: %s", exc)

    if not email and access_token:
        user_info = cognito_get_user(access_token)
        email = user_info.get("email")
        if not username:
            username = user_info.get("username")
        if not sub:
            sub = user_info.get("sub")

    if not sub and access_token:
        try:
            acc_claims = jwt.get_unverified_claims(access_token)
            sub = acc_claims.get("sub")
        except Exception:
            pass

    if not email:
        raise ValueError("Google account did not provide an email address.")

    clean_email = email.strip().lower()

    # 3. Sync local database: Match by cognito_sub first
    now = datetime.now(timezone.utc)
    user = None
    if sub:
        user = db.query(User).filter(User.cognito_sub == str(sub)).first()
        if user:
            logger.info(f"MATCHING_PATH: Resolved Google login via direct cognito_sub hit for sub {sub}")
    
    if not user and clean_email:
        user_by_email = db.query(User).filter(func.lower(User.email) == clean_email).first()
        if user_by_email:
            if user_by_email.cognito_sub and user_by_email.cognito_sub != str(sub):
                raise ValueError(f"DEBUG: Found user {user_by_email.username} with email {clean_email}. DB sub={user_by_email.cognito_sub}, Google sub={sub}. Mismatch!")
            
            if not user_by_email.cognito_sub:
                logger.info(f"MATCHING_PATH: email_match_backfilled_sub for Google login (email: {clean_email})")
            else:
                logger.info(f"MATCHING_PATH: Resolved Google login via email fallback (sub already matched) for {clean_email}")

            user = user_by_email
            user.cognito_sub = str(sub)
        else:
            logger.info(f"MATCHING_PATH: No existing user found during Google login for {clean_email}")

    if not user:
        raise ValueError(f"DEBUG: user_by_email is None for {clean_email}. This will create a NEW user.")
            
        display_name = username.strip() if (username and not username.lower().startswith("google_")) else clean_email.split("@")[0]
        
        # Ensure username uniqueness
        existing_username = db.query(User).filter(func.lower(User.username) == display_name.lower()).first()
        if existing_username:
            display_name = f"{display_name}_{int(now.timestamp()) % 10000}"

        from uuid import uuid4
        user = User(
            id=uuid4(),
            username=display_name,
            email=clean_email,
            cognito_sub=str(sub) if sub else None,
            email_verified=True,
            is_active=True,
            created_at=now,
            last_login_at=now,
        )
        db.add(user)
    else:
        # Existing native account found (e.g. aarushiiiiii28) - associate session and link cognito_sub
        if sub:
            user.cognito_sub = str(sub)
        user.last_login_at = now
        user.email_verified = True

    db.commit()

    return Token(
        access_token=access_token or id_token,
        refresh_token=token_resp.get("refresh_token", ""),
        token_type=token_resp.get("token_type", "bearer"),
    )



def verify_email_otp(
    db: Session,
    email_or_username: str,
    plain_otp: str,
    username: Optional[str] = None,
) -> str:
    """
    Confirm user registration in AWS Cognito and create/update RoomSync database record once verified.
    """
    clean_identifier = (username or email_or_username).strip()

    # Resolve email to username for Cognito ConfirmSignUp
    user = (
        db.query(User)
        .filter(
            (func.lower(User.email) == clean_identifier.lower())
            | (func.lower(User.username) == clean_identifier.lower())
        )
        .first()
    )
    cognito_username = (
        user.username
        if user and user.username
        else (username.strip() if username else clean_identifier)
    )

    try:
        cognito_confirm_sign_up(username=cognito_username, confirmation_code=plain_otp)
    except ValueError as exc:
        if email_or_username and email_or_username.strip() != cognito_username:
            cognito_confirm_sign_up(username=email_or_username.strip(), confirmation_code=plain_otp)
        else:
            raise exc

    # Insert user in database only once email is successfully verified through AWS
    if not user and is_cognito_configured():
        username_val = username.strip() if username else (cognito_username if "@" not in cognito_username else email_or_username.split("@")[0])
        email_val = email_or_username.strip() if "@" in email_or_username else None

        user = User(
            id=uuid4(),
            username=username_val,
            email=email_val,
            email_verified=True,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user:
        user.email_verified = True
        db.commit()

    return "Email verified successfully."


def resend_verification_otp(
    db: Session,
    email_or_username: str,
    username: Optional[str] = None,
) -> str:
    """
    Request AWS Cognito to resend the verification/confirmation code.
    """
    clean_identifier = (username or email_or_username).strip()

    user = (
        db.query(User)
        .filter(
            (func.lower(User.email) == clean_identifier.lower())
            | (func.lower(User.username) == clean_identifier.lower())
        )
        .first()
    )
    cognito_username = (
        user.username
        if user and user.username
        else (username.strip() if username else clean_identifier)
    )

    try:
        cognito_resend_confirmation_code(username=cognito_username)
    except ValueError as exc:
        if email_or_username and email_or_username.strip() != cognito_username:
            cognito_resend_confirmation_code(username=email_or_username.strip())
        else:
            raise exc

    return "A new verification code has been sent to your email."


def refresh_access_token(db: Session, refresh_token: str, username: Optional[str] = None) -> Token:
    """
    Rotate/refresh access token using Cognito REFRESH_TOKEN_AUTH.
    """
    auth_result = cognito_refresh_auth(refresh_token=refresh_token, username=username)
    return Token(
        access_token=auth_result.get("access_token", ""),
        refresh_token=auth_result.get("refresh_token", refresh_token),
        token_type=auth_result.get("token_type", "bearer"),
    )


def logout_session(db: Session, refresh_token: str) -> None:
    """Logout session."""
    pass


def logout_all_sessions(db: Session, user_id: UUID) -> None:
    """Logout all sessions for a user."""
    pass


def forgot_password_user(db: Session, email_or_username: str) -> str:
    """
    Initiate Cognito forgot-password flow.
    """
    clean_identifier = email_or_username.strip()
    cognito_forgot_password(username=clean_identifier)
    return "A password recovery code has been sent to your email."


def confirm_forgot_password_user(
    db: Session,
    email_or_username: str,
    confirmation_code: str,
    new_password: str,
) -> str:
    """
    Complete Cognito forgot-password flow with new password.
    """
    clean_identifier = email_or_username.strip()
    cognito_confirm_forgot_password(
        username=clean_identifier,
        confirmation_code=confirmation_code,
        new_password=new_password,
    )
    user = (
        db.query(User)
        .filter(
            (func.lower(User.email) == clean_identifier.lower())
            | (func.lower(User.username) == clean_identifier.lower())
        )
        .first()
    )
    if user:
        user.password_hash = hash_password(new_password)
        db.commit()
    return "Password updated successfully. You can now log in."
