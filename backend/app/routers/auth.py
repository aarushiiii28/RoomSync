from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import (
    RefreshTokenRequest,
    ResendVerificationRequest,
    VerifyEmailRequest,
    VerifyEmailResponse,
)
from app.schemas.token import Token
from app.schemas.user import UserLogin, UserRegister, UserResponse
from app.services.auth import (
    login_user,
    logout_all_sessions,
    logout_session,
    refresh_access_token,
    register_user,
)
from app.services.email_verification import (
    resend_verification_otp,
    verify_email_otp,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/verify-email",
    response_model=VerifyEmailResponse,
    status_code=status.HTTP_200_OK,
)
def verify_email(
    request_data: VerifyEmailRequest,
    db: Session = Depends(get_db),
):
    try:
        msg = verify_email_otp(
            db=db,
            email_or_username=request_data.email,
            plain_otp=request_data.otp,
        )
        return VerifyEmailResponse(message=msg)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/resend-verification",
    response_model=VerifyEmailResponse,
    status_code=status.HTTP_200_OK,
)
def resend_verification(
    request_data: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    try:
        msg = resend_verification_otp(
            db=db,
            email_or_username=request_data.email,
        )
        return VerifyEmailResponse(message=msg)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db),
):
    try:
        return register_user(db, user_data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/login",
    response_model=Token,
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    try:
        credentials = UserLogin(
            username=form_data.username,
            password=form_data.password,
        )
        return login_user(db, credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

@router.post(
    "/login/json",
    response_model=Token,
)
def login_json(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    try:
        return login_user(db, credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

@router.post(
    "/refresh",
    response_model=Token,
)
def refresh(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    try:
        return refresh_access_token(db, token_data.refresh_token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not refresh access token.",
        ) from exc


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
def logout(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db),
) -> Response:
    try:
        logout_session(db, token_data.refresh_token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not log out session.",
        ) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/logout-all",
    status_code=status.HTTP_204_NO_CONTENT,
)
def logout_all(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    try:
        logout_all_sessions(db, current_user.id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not log out all sessions.",
        ) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)
