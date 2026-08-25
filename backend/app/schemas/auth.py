from pydantic import BaseModel, Field


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=4096)


class VerifyEmailRequest(BaseModel):
    email: str = Field(
        min_length=3,
        max_length=255,
        description="Email address or username to verify",
    )
    otp: str = Field(
        min_length=6,
        max_length=6,
        description="6-digit verification OTP code",
    )


class ResendVerificationRequest(BaseModel):
    email: str = Field(
        min_length=3,
        max_length=255,
        description="Email address or username to resend verification OTP to",
    )


class VerifyEmailResponse(BaseModel):
    message: str
