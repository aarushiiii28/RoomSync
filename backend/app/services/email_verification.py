import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.email_verification import EmailVerification
from app.models.user import User
from app.services.email import send_verification_email


def generate_otp() -> str:
    """
    Generate a cryptographically secure 6-digit OTP string.
    Supports leading zeros (e.g. '048219').
    """
    number = secrets.randbelow(1_000_000)
    return f"{number:06d}"


def hash_otp(otp: str) -> str:
    """
    Securely hash the 6-digit OTP using SHA-256 with the app's secret key as salt.
    Plaintext OTP is never stored in the database.
    """
    salted = f"{settings.SECRET_KEY}:{otp}".encode("utf-8")
    return hashlib.sha256(salted).hexdigest()


def verify_otp_hash(plain_otp: str, stored_hash: str) -> bool:
    """
    Verify a plain 6-digit OTP against the stored SHA-256 hash using constant-time comparison.
    """
    computed = hash_otp(plain_otp)
    return hmac.compare_digest(computed, stored_hash)


def create_and_send_verification_otp(db: Session, user: User) -> None:
    """
    Create a new hashed verification OTP record and send the plaintext OTP via email.
    Invalidates any previous pending verification records for this user.
    """
    now = datetime.now(timezone.utc)

    # Invalidate existing active verification records for this user
    active_records = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.user_id == user.id,
            EmailVerification.used_at == None,
        )
        .all()
    )
    for record in active_records:
        record.used_at = now

    plain_otp = generate_otp()
    hashed_otp = hash_otp(plain_otp)
    expires_at = now + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

    verification = EmailVerification(
        user_id=user.id,
        otp_hash=hashed_otp,
        expires_at=expires_at,
        attempts=0,
        used_at=None,
        created_at=now,
        last_sent_at=now,
    )

    db.add(verification)
    db.commit()

    sent = True
    if user.email:
        sent = send_verification_email(to_email=user.email, otp_code=plain_otp)

    return sent


def _to_utc(dt: datetime) -> datetime:
    """Normalize offset-naive and offset-aware datetimes to UTC timezone."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def verify_email_otp(db: Session, email_or_username: str, plain_otp: str) -> str:
    """
    Verify the submitted 6-digit OTP for the specified user or email address.
    """
    clean_identifier = email_or_username.strip()
    user = (
        db.query(User)
        .filter(
            (User.email.ilike(clean_identifier)) | (User.username == clean_identifier)
        )
        .first()
    )

    if not user:
        raise ValueError("User not found.")

    if user.email_verified:
        return "Email is already verified."

    now = datetime.now(timezone.utc)

    # Fetch latest verification record
    verification = (
        db.query(EmailVerification)
        .filter(EmailVerification.user_id == user.id)
        .order_by(desc(EmailVerification.created_at))
        .first()
    )

    if not verification:
        raise ValueError("No verification code found. Please request a new code.")

    if verification.used_at is not None:
        raise ValueError("This verification code has already been used. Please request a new code.")

    if now > _to_utc(verification.expires_at):
        raise ValueError("Verification code has expired. Please request a new code.")

    if verification.attempts >= settings.OTP_MAX_ATTEMPTS:
        # Invalidate the record
        verification.used_at = now
        db.commit()
        raise ValueError("Too many failed attempts. This code has been invalidated. Please request a new code.")

    # Check OTP
    is_valid = verify_otp_hash(plain_otp.strip(), verification.otp_hash)

    if not is_valid:
        verification.attempts += 1
        if verification.attempts >= settings.OTP_MAX_ATTEMPTS:
            verification.used_at = now
            db.commit()
            raise ValueError("Too many failed attempts. This code has been invalidated. Please request a new code.")
        db.commit()
        remaining = settings.OTP_MAX_ATTEMPTS - verification.attempts
        raise ValueError(f"Invalid verification code. {remaining} attempt(s) remaining.")

    # OTP is valid!
    verification.used_at = now
    user.email_verified = True
    db.commit()

    return "Email verified successfully."


def resend_verification_otp(db: Session, email_or_username: str) -> str:
    """
    Resend a new 6-digit OTP to the user, respecting cooldown and invalidating prior OTPs.
    """
    clean_identifier = email_or_username.strip()
    user = (
        db.query(User)
        .filter(
            (User.email.ilike(clean_identifier)) | (User.username == clean_identifier)
        )
        .first()
    )

    if not user:
        raise ValueError("User not found.")

    if user.email_verified:
        return "Email is already verified."

    if not user.email:
        raise ValueError("User does not have an email address associated.")

    now = datetime.now(timezone.utc)

    # Check cooldown on latest verification
    latest_verification = (
        db.query(EmailVerification)
        .filter(EmailVerification.user_id == user.id)
        .order_by(desc(EmailVerification.last_sent_at))
        .first()
    )

    if latest_verification:
        elapsed = (now - _to_utc(latest_verification.last_sent_at)).total_seconds()
        if elapsed < settings.OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed)
            raise ValueError(f"Please wait {remaining} second(s) before requesting a new code.")

    # Generate and send new OTP
    sent = create_and_send_verification_otp(db=db, user=user)
    if not sent:
        raise ValueError("We couldn't send the verification email right now. Please try again.")

    return "A new verification code has been sent to your email."
