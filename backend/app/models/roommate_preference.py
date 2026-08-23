from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import TYPE_CHECKING

from sqlalchemy import (
    ARRAY,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import (
    CleanlinessLevel,
    CommunicationStyle,
    GenderPreference,
    HouseholdResponsibilityPreference,
    ImportanceLevel,
    PersonalSpacePreference,
    SleepSchedule,
    SocialStyle,
    ToleranceLevel,
)

if TYPE_CHECKING:
    from app.models.user import User


class RoommatePreference(Base):
    """
    Stores what the user is looking for in a prospective roommate:
    budget, age, gender, social dynamic, personal boundaries, communication,
    household/financial responsibilities, and deal-breakers.
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

    # 1. Preferred Gender & Age & Budget
    preferred_gender: Mapped[GenderPreference] = mapped_column(
        SAEnum(GenderPreference, name="genderpreference", create_type=True),
        nullable=False,
    )

    min_age: Mapped[int] = mapped_column(Integer, nullable=False)
    max_age: Mapped[int] = mapped_column(Integer, nullable=False)

    budget_min: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    budget_max: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # 2. Social & Personal Compatibility
    social_style: Mapped[SocialStyle] = mapped_column(
        SAEnum(SocialStyle, name="socialstyle", create_type=True),
        nullable=False,
        default=SocialStyle.balanced,
        server_default="balanced",
    )

    personal_space: Mapped[PersonalSpacePreference] = mapped_column(
        SAEnum(PersonalSpacePreference, name="personalspacepreference", create_type=True),
        nullable=False,
        default=PersonalSpacePreference.moderate,
        server_default="moderate",
    )

    # 3. Communication & Conflict Handling
    communication_style: Mapped[CommunicationStyle] = mapped_column(
        SAEnum(CommunicationStyle, name="communicationstyle", create_type=True),
        nullable=False,
        default=CommunicationStyle.open_communication,
        server_default="open_communication",
    )

    issue_handling_importance: Mapped[ImportanceLevel] = mapped_column(
        SAEnum(ImportanceLevel, name="importancelevel", create_type=False),
        nullable=False,
        default=ImportanceLevel.important,
        server_default="important",
    )

    # 4. Household & Financial Responsibilities
    household_responsibilities: Mapped[HouseholdResponsibilityPreference] = mapped_column(
        SAEnum(HouseholdResponsibilityPreference, name="householdresponsibilitypreference", create_type=True),
        nullable=False,
        default=HouseholdResponsibilityPreference.shared_equally,
        server_default="shared_equally",
    )

    financial_responsibility: Mapped[ImportanceLevel] = mapped_column(
        SAEnum(ImportanceLevel, name="importancelevel", create_type=False),
        nullable=False,
        default=ImportanceLevel.very_important,
        server_default="very_important",
    )

    # 5. Deal-Breakers (Multi-select)
    deal_breakers: Mapped[list[str]] = mapped_column(
        ARRAY(String).with_variant(JSON, "sqlite"),
        nullable=False,
        default=list,
        server_default="{}",
    )

    deal_breaker_other: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # Legacy fields preserved in database with defaults
    smoking_tolerance: Mapped[ToleranceLevel] = mapped_column(
        SAEnum(ToleranceLevel, name="tolerancelevel", create_type=False),
        nullable=False,
        default=ToleranceLevel.not_comfortable,
        server_default="not_comfortable",
    )

    drinking_tolerance: Mapped[ToleranceLevel] = mapped_column(
        SAEnum(ToleranceLevel, name="tolerancelevel", create_type=False),
        nullable=False,
        default=ToleranceLevel.comfortable,
        server_default="comfortable",
    )

    pet_tolerance: Mapped[ToleranceLevel] = mapped_column(
        SAEnum(ToleranceLevel, name="tolerancelevel", create_type=False),
        nullable=False,
        default=ToleranceLevel.comfortable,
        server_default="comfortable",
    )

    cleanliness_requirement: Mapped[CleanlinessLevel] = mapped_column(
        SAEnum(CleanlinessLevel, name="cleanlinesslevel", create_type=False),
        nullable=False,
        default=CleanlinessLevel.clean,
        server_default="clean",
    )

    preferred_sleep_schedule: Mapped[SleepSchedule] = mapped_column(
        SAEnum(SleepSchedule, name="sleepschedule", create_type=False),
        nullable=False,
        default=SleepSchedule.flexible,
        server_default="flexible",
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
