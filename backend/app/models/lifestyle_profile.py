from __future__ import annotations

from datetime import datetime, time
from uuid import UUID
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Time, UniqueConstraint, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import (
    CleanlinessLevel,
    DrinkingHabit,
    FitnessLevel,
    FrequencyLevel,
    PetOwnership,
    SmokingHabit,
)

if TYPE_CHECKING:
    from app.models.user import User


# Module-level type objects prevent SQLAlchemy from attempting to CREATE the
# PostgreSQL enum type more than once per metadata when the same enum is
# referenced by multiple columns in this table.
_frequency_enum = SAEnum(FrequencyLevel, name="frequencylevel", create_type=True)


class LifestyleProfile(Base):
    """
    Captures the day-to-day living habits of a user.

    sleep_time / wake_time store local time-of-day (no timezone) because they
    represent a daily schedule, not a specific instant.

    FrequencyLevel is shared by guest_frequency, cooking, and party_frequency —
    all three measure the same "how often" scale.

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

    # Habits — enum columns
    cleanliness: Mapped[CleanlinessLevel] = mapped_column(
        SAEnum(CleanlinessLevel, name="cleanlinesslevel", create_type=True),
        nullable=False,
    )

    smoking: Mapped[SmokingHabit] = mapped_column(
        SAEnum(SmokingHabit, name="smokinghabit", create_type=True),
        nullable=False,
    )

    drinking: Mapped[DrinkingHabit] = mapped_column(
        SAEnum(DrinkingHabit, name="drinkinghabit", create_type=True),
        nullable=False,
    )

    pets: Mapped[PetOwnership] = mapped_column(
        SAEnum(PetOwnership, name="petownership", create_type=True),
        nullable=False,
    )

    # FrequencyLevel reused for three semantically similar columns
    guest_frequency: Mapped[FrequencyLevel] = mapped_column(
        _frequency_enum,
        nullable=False,
    )

    cooking: Mapped[FrequencyLevel] = mapped_column(
        _frequency_enum,
        nullable=False,
    )

    party_frequency: Mapped[FrequencyLevel] = mapped_column(
        _frequency_enum,
        nullable=False,
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
