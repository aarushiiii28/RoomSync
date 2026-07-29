from pydantic import BaseModel, EmailStr, Field
from uuid import UUID

class UserRegister(BaseModel):
    username: str = Field(
        min_length=5,
        max_length=30,
    )

    email: EmailStr | None = None

    phone_number: str | None = None

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str | None
    phone_number: str | None

    model_config = {
        "from_attributes": True
    }

class UserLogin(BaseModel):
    username: str
    password: str