from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, UniqueConstraint, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import CleanlinessLevel, GenderPreference, SleepSchedule

if TYPE_CHECKING:
    from app.models.user import User


class RoommatePreference(Base):
    """
    Stores what the user is looking for in a prospective roommate.

    budget_min / budget_max use Numeric(10, 2) to accurately represent
    currency values (e.g. ₹12,000.00) without floating-point drift.

    cleanliness_requirement references the same PostgreSQL type
    (cleanlinesslevel) as LifestyleProfile.cleanliness — the type is NOT
    re-created here (create_type=False in the migration).
    """

    __tablename__ = "roommate_preferences"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_roommate_preferences_user_id"),
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

    preferred_gender: Mapped[GenderPreference] = mapped_column(
        SAEnum(GenderPreference, name="genderpreference", create_type=True),
        nullable=False,
    )

    min_age: Mapped[int] = mapped_column(Integer, nullable=False)
    max_age: Mapped[int] = mapped_column(Integer, nullable=False)

    # Currency-safe budget range
    budget_min: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    budget_max: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Tolerance flags
    smoking_allowed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    drinking_allowed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    pet_friendly: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    # Shared enum types (PostgreSQL type already exists — create_type=False)
    cleanliness_requirement: Mapped[CleanlinessLevel] = mapped_column(
        SAEnum(CleanlinessLevel, name="cleanlinesslevel", create_type=False),
        nullable=False,
    )

    preferred_sleep_schedule: Mapped[SleepSchedule] = mapped_column(
        SAEnum(SleepSchedule, name="sleepschedule", create_type=True),
        nullable=False,
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
        back_populates="roommate_preference",
    )
