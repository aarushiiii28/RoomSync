from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserRegister
from app.services.security import hash_password
from app.schemas.user import UserLogin
from app.schemas.token import Token
from app.services.security import (
    create_access_token,
    verify_password,
)


def register_user(db: Session, user_data: UserRegister) -> User:
    """
    Register a new user.
    """

    # Check if username already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise ValueError("Username already exists.")

    # Check if email already exists
    if (
        user_data.email
        and db.query(User)
        .filter(User.email == user_data.email)
        .first()
    ):
        raise ValueError("Email already exists.")

    # Check if phone number already exists
    if (
        user_data.phone_number
        and db.query(User)
        .filter(User.phone_number == user_data.phone_number)
        .first()
    ):
        raise ValueError("Phone number already exists.")

    # Create new user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        phone_number=user_data.phone_number,
        password_hash=hash_password(user_data.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

def login_user(db: Session, credentials: UserLogin) -> Token:
    """
    Authenticate a user and generate a JWT access token.
    """

    user = (
        db.query(User)
        .filter(User.username == credentials.username)
        .first()
    )

    if user is None:
        raise ValueError("Invalid username or password.")

    if not verify_password(
        credentials.password,
        user.password_hash,
    ):
        raise ValueError("Invalid username or password.")

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "username": user.username,
        }
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
    )