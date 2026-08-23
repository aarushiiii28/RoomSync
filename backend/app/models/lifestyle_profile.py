from __future__ import annotations

from datetime import datetime, time
from uuid import UUID
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Time, UniqueConstraint, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import (
    CleanlinessLevel,
    DrinkingHabit,
    FitnessLevel,
    FrequencyLevel,
    ImportanceLevel,
    PetOwnership,
    SmokingHabit,
    ToleranceLevel,
)

if TYPE_CHECKING:
    from app.models.user import User


# Module-level type objects prevent SQLAlchemy from attempting to CREATE the
# PostgreSQL enum type more than once per metadata when the same enum is
# referenced by multiple columns in this table.
_frequency_enum = SAEnum(FrequencyLevel, name="frequencylevel", create_type=True)
_tolerance_enum = SAEnum(ToleranceLevel, name="tolerancelevel", create_type=True)


class LifestyleProfile(Base):
    """
    Captures the day-to-day living habits of a user along with their comfort/tolerance
    toward potential roommate behaviors.

    sleep_time / wake_time store local time-of-day (no timezone) because they
    represent a daily schedule, not a specific instant.

    FrequencyLevel is shared by guest_frequency, cooking, and party_frequency.
    ToleranceLevel is shared by cooking_tolerance, guest_tolerance, party_tolerance,
    smoking_tolerance, drinking_tolerance, and pet_tolerance.

    music and work_from_home are simple booleans:
      music         → does the user regularly play or listen to loud music at home?
      work_from_home → does the user work remotely (affects daytime home occupancy)?
    """

    __tablename__ = "lifestyle_profiles"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_lifestyle_profiles_user_id"),
    )

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Schedule
    sleep_time: Mapped[time] = mapped_column(Time, nullable=False)
    wake_time: Mapped[time] = mapped_column(Time, nullable=False)

    schedule_consistency: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3,
        server_default="3",
    )

    # Study / Work & Noise Tolerance
    study_hours: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3,
        server_default="3",
    )

    noise_sleep_tolerance: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3,
        server_default="3",
    )

    # Cleanliness
    cleanliness_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3,
        server_default="3",
    )

    # Social & Personality Features
    privacy_preference: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3,
        server_default="3",
    )

    talkativeness: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3,
        server_default="3",
    )

    friendship_expectation: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3,
        server_default="3",
    )

    # Entertainment
    gaming_hours: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    # Habits & tolerance — enum columns
    cleanliness: Mapped[CleanlinessLevel] = mapped_column(
        SAEnum(CleanlinessLevel, name="cleanlinesslevel", create_type=True),
        nullable=False,
    )

    cleanliness_importance: Mapped[ImportanceLevel] = mapped_column(
        SAEnum(ImportanceLevel, name="importancelevel", create_type=True),
        nullable=False,
        default=ImportanceLevel.important,
        server_default="important",
    )

    smoking: Mapped[SmokingHabit] = mapped_column(
        SAEnum(SmokingHabit, name="smokinghabit", create_type=True),
        nullable=False,
    )

    smoking_tolerance: Mapped[ToleranceLevel] = mapped_column(
        _tolerance_enum,
        nullable=False,
        default=ToleranceLevel.not_comfortable,
        server_default="not_comfortable",
    )

    drinking: Mapped[DrinkingHabit] = mapped_column(
        SAEnum(DrinkingHabit, name="drinkinghabit", create_type=True),
        nullable=False,
    )

    drinking_tolerance: Mapped[ToleranceLevel] = mapped_column(
        _tolerance_enum,
        nullable=False,
        default=ToleranceLevel.comfortable,
        server_default="comfortable",
    )

    pets: Mapped[PetOwnership] = mapped_column(
        SAEnum(PetOwnership, name="petownership", create_type=True),
        nullable=False,
    )

    pet_tolerance: Mapped[ToleranceLevel] = mapped_column(
        _tolerance_enum,
        nullable=False,
        default=ToleranceLevel.comfortable,
        server_default="comfortable",
    )

    # FrequencyLevel reused for three semantically similar columns
    guest_frequency: Mapped[FrequencyLevel] = mapped_column(
        _frequency_enum,
        nullable=False,
    )

    guest_tolerance: Mapped[ToleranceLevel] = mapped_column(
        _tolerance_enum,
        nullable=False,
        default=ToleranceLevel.comfortable,
        server_default="comfortable",
    )

    cooking: Mapped[FrequencyLevel] = mapped_column(
        _frequency_enum,
        nullable=False,
    )

    cooking_tolerance: Mapped[ToleranceLevel] = mapped_column(
        _tolerance_enum,
        nullable=False,
        default=ToleranceLevel.comfortable,
        server_default="comfortable",
    )

    party_frequency: Mapped[FrequencyLevel] = mapped_column(
        _frequency_enum,
        nullable=False,
    )

    party_tolerance: Mapped[ToleranceLevel] = mapped_column(
        _tolerance_enum,
        nullable=False,
        default=ToleranceLevel.comfortable,
        server_default="comfortable",
    )

    fitness: Mapped[FitnessLevel] = mapped_column(
        SAEnum(FitnessLevel, name="fitnesslevel", create_type=True),
        nullable=False,
    )

    # Boolean flags
    music: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    work_from_home: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="lifestyle_profile",
    )
