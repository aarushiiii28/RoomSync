from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import (
    ConfirmForgotPasswordRequest,
    ForgotPasswordRequest,
    RefreshTokenRequest,
    ResendVerificationRequest,
    VerifyEmailRequest,
    VerifyEmailResponse,
)
from app.schemas.token import Token
from app.schemas.user import UserLogin, UserRegister, UserResponse
from app.services.auth import (
    confirm_forgot_password_user,
    forgot_password_user,
    google_login_callback,
    login_user,
    logout_all_sessions,
    logout_session,
    refresh_access_token,
    register_user,
    resend_verification_otp,
    verify_email_otp,
)
from pydantic import BaseModel

class GoogleLoginRequest(BaseModel):
    code: str

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.get(
    "/check-username",
    status_code=status.HTTP_200_OK,
)
def check_username(
    username: str,
    db: Session = Depends(get_db),
):
    clean = username.strip()
    if not clean:
        return {"available": False, "message": "Username is required."}
    exists = (
        db.query(User)
        .filter(func.lower(User.username) == clean.lower())
        .first()
        is not None
    )
    if exists:
        return {"available": False, "message": "Username unavailable."}
    return {"available": True, "message": "Username is available."}


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
            username=request_data.username,
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
            username=request_data.username,
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
        err_msg = str(exc)
        status_code = (
            status.HTTP_400_BAD_REQUEST
            if "verify your email" in err_msg.lower()
            else status.HTTP_401_UNAUTHORIZED
        )
        raise HTTPException(
            status_code=status_code,
            detail=err_msg,
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
        err_msg = str(exc)
        status_code = (
            status.HTTP_400_BAD_REQUEST
            if "verify your email" in err_msg.lower()
            else status.HTTP_401_UNAUTHORIZED
        )
        raise HTTPException(
            status_code=status_code,
            detail=err_msg,
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


@router.post(
    "/forgot-password",
    response_model=VerifyEmailResponse,
    status_code=status.HTTP_200_OK,
)
def forgot_password(
    request_data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    try:
        msg = forgot_password_user(db, request_data.email)
        return VerifyEmailResponse(message=msg)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/confirm-forgot-password",
    response_model=VerifyEmailResponse,
    status_code=status.HTTP_200_OK,
)
def confirm_forgot_password(
    request_data: ConfirmForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    try:
        msg = confirm_forgot_password_user(
            db=db,
            email_or_username=request_data.email,
            confirmation_code=request_data.confirmation_code,
            new_password=request_data.new_password,
        )
        return VerifyEmailResponse(message=msg)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/google-callback",
    response_model=Token,
    status_code=status.HTTP_200_OK,
)
def google_callback(
    request_data: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    try:
        return google_login_callback(db=db, code=request_data.code)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentication error: {str(exc)}",
        ) from exc
