import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database.base import Base


class QuestionnaireResponse(Base):
    """Stores a user's answers to the roommate-compatibility questionnaire."""

    __tablename__ = "questionnaire_responses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Lifestyle
    sleep_schedule: Mapped[str | None] = mapped_column(String(50), nullable=True)   # e.g. "early_bird" | "night_owl"
    cleanliness_level: Mapped[int | None] = mapped_column(Integer, nullable=True)    # 1-5
    noise_tolerance: Mapped[int | None] = mapped_column(Integer, nullable=True)      # 1-5
    social_preference: Mapped[str | None] = mapped_column(String(50), nullable=True) # "introvert" | "extrovert" | "ambivert"
    work_from_home: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    pets_allowed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    smoking_allowed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    alcohol_allowed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    guests_frequency: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "never" | "occasionally" | "often"

    # Additional notes
    additional_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="questionnaire_response")  # type: ignore[name-defined]
