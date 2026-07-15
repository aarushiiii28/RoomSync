import uuid
from datetime import datetime

from pydantic import BaseModel


class ProfileBase(BaseModel):
    full_name: str | None = None
    bio: str | None = None
    age: int | None = None
    gender: str | None = None
    occupation: str | None = None
    city: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    profile_picture_url: str | None = None


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
