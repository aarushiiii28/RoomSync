from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime




class UserRegister(BaseModel):
    username: str = Field(
        min_length=5,
        max_length=30,
    )

    email: EmailStr | None = None


    password: str = Field(
        min_length=8,
        max_length=128,
    )


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str | None

    model_config = {
        "from_attributes": True
    }

class UserLogin(BaseModel):
    username: str
    password: str

class CurrentUserResponse(BaseModel):
    id: UUID
    username: str
    email: str | None
    is_email_verified: bool
    is_active: bool

    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None

    model_config = {
        "from_attributes": True
    }