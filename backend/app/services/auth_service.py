from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import UserRegisterRequest, TokenResponse, UserPublicResponse
from app.utils.exceptions import (
    CredentialsException,
    UserAlreadyExistsException,
    InactiveUserException,
)
from app.utils.helpers import normalize_email, normalize_username
from app.utils.validators import validate_password_strength, validate_username


def register_user(db: Session, payload: UserRegisterRequest) -> UserPublicResponse:
    """Create a new user account.

    Raises:
        UserAlreadyExistsException: If email or username is already taken.
    """
    validate_password_strength(payload.password)
    validate_username(payload.username)

    email = normalize_email(payload.email)
    username = normalize_username(payload.username)

    existing = (
        db.query(User)
        .filter((User.email == email) | (User.username == username))
        .first()
    )
    if existing:
        raise UserAlreadyExistsException()

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserPublicResponse.model_validate(user)


def login_user(db: Session, email: str, password: str) -> TokenResponse:
    """Authenticate a user and return a JWT access token.

    Raises:
        CredentialsException: If credentials are invalid.
        InactiveUserException: If the account is disabled.
    """
    email = normalize_email(email)
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.password_hash):
        raise CredentialsException()
    if not user.is_active:
        raise InactiveUserException()

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=token)
