import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database.base import Base


class Preference(Base):
    """Stores what a user is looking for in a roommate."""

    __tablename__ = "preferences"

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

    preferred_gender: Mapped[str | None] = mapped_column(String(30), nullable=True)  # "any" | "male" | "female" | "non-binary"
    preferred_age_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    preferred_age_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    preferred_sleep_schedule: Mapped[str | None] = mapped_column(String(50), nullable=True)
    preferred_cleanliness_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pets_ok: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    smoking_ok: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    alcohol_ok: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    max_budget: Mapped[float | None] = mapped_column(Float, nullable=True)

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
    user: Mapped["User"] = relationship("User", back_populates="preference")  # type: ignore[name-defined]
