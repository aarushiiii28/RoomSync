from typing import Optional
from pydantic import BaseModel, Field


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=4096)


class VerifyEmailRequest(BaseModel):
    email: str = Field(
        min_length=3,
        max_length=255,
        description="Email address or username to verify",
    )
    username: Optional[str] = Field(
        default=None,
        max_length=128,
        description="Optional username associated with the account",
    )
    otp: str = Field(
        min_length=6,
        max_length=6,
        description="6-digit verification code",
    )


class ResendVerificationRequest(BaseModel):
    email: str = Field(
        min_length=3,
        max_length=255,
        description="Email address or username to resend verification code to",
    )
    username: Optional[str] = Field(
        default=None,
        max_length=128,
        description="Optional username associated with the account",
    )


class VerifyEmailResponse(BaseModel):
    message: str


class ForgotPasswordRequest(BaseModel):
    email: str = Field(
        min_length=3,
        max_length=255,
        description="Email address or username for password recovery",
    )


class ConfirmForgotPasswordRequest(BaseModel):
    email: str = Field(
        min_length=3,
        max_length=255,
        description="Email address or username",
    )
    confirmation_code: str = Field(
        min_length=1,
        max_length=32,
        description="Password recovery code received via email",
    )
    new_password: str = Field(
        min_length=8,
        max_length=128,
        description="New account password",
    )
