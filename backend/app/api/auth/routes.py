from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.auth.dependencies import get_db
from app.schemas.auth import TokenResponse, UserPublicResponse, UserRegisterRequest
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserPublicResponse, status_code=201)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    return auth_service.register_user(db, payload)


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Authenticate with email + password and receive a JWT token.

    Note: OAuth2PasswordRequestForm sends ``username`` field — we treat it
    as the email address for compatibility with standard OAuth2 clients.
    """
    return auth_service.login_user(db, email=form_data.username, password=form_data.password)
