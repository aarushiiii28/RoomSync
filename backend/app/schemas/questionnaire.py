import uuid
from datetime import datetime

from pydantic import BaseModel


class QuestionnaireBase(BaseModel):
    sleep_schedule: str | None = None
    cleanliness_level: int | None = None
    noise_tolerance: int | None = None
    social_preference: str | None = None
    work_from_home: bool | None = None
    pets_allowed: bool | None = None
    smoking_allowed: bool | None = None
    alcohol_allowed: bool | None = None
    guests_frequency: str | None = None
    additional_notes: str | None = None


class QuestionnaireCreate(QuestionnaireBase):
    pass


class QuestionnaireUpdate(QuestionnaireBase):
    pass


class QuestionnaireResponse(QuestionnaireBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
