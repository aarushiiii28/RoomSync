import uuid
from datetime import datetime

from pydantic import BaseModel


class MatchResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    matched_user_id: uuid.UUID
    compatibility_score: float
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MatchStatusUpdate(BaseModel):
    status: str  # "accepted" | "rejected"
