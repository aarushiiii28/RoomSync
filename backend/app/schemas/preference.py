"""
Pydantic schemas for the RoommatePreference domain.

Separation:
  - PreferenceCreate   → full required payload on first submission.
  - PreferenceUpdate   → all fields optional for partial PATCH updates.
  - PreferenceResponse → safe read-only view built from an ORM object.

Security: user_id, id, created_at, and updated_at are server-only and are
never accepted from the client.

Cross-field validation:
  - min_age  ≤ max_age
  - budget_min ≤ budget_max
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

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

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_MIN_REALISTIC_AGE = 13
_MAX_REALISTIC_AGE = 100

_MIN_BUDGET = Decimal("0.00")
_MAX_BUDGET = Decimal("9_999_999.99")  # Numeric(10, 2) upper bound


# ---------------------------------------------------------------------------
# Request schemas (client → server)
# ---------------------------------------------------------------------------


class PreferenceCreate(BaseModel):
    """Full roommate-preference payload required on first submission."""

    preferred_gender: GenderPreference = Field(
        description="Preferred gender of a prospective roommate."
    )

    min_age: int = Field(
        ge=_MIN_REALISTIC_AGE,
        le=_MAX_REALISTIC_AGE,
        description="Minimum acceptable age of a roommate.",
    )
    max_age: int = Field(
        ge=_MIN_REALISTIC_AGE,
        le=_MAX_REALISTIC_AGE,
        description="Maximum acceptable age of a roommate.",
    )

    budget_min: Decimal = Field(
        ge=_MIN_BUDGET,
        le=_MAX_BUDGET,
        description="Minimum monthly budget (currency: local).",
    )
    budget_max: Decimal = Field(
        ge=_MIN_BUDGET,
        le=_MAX_BUDGET,
        description="Maximum monthly budget (currency: local).",
    )

    # Social & Personal Compatibility
    social_style: SocialStyle = Field(
        default=SocialStyle.balanced,
        description="Preferred social dynamic with a roommate.",
    )
    personal_space: PersonalSpacePreference = Field(
        default=PersonalSpacePreference.moderate,
        description="Preferred amount of personal space at home.",
    )

    # Communication & Conflict Handling
    communication_style: CommunicationStyle = Field(
        default=CommunicationStyle.open_communication,
        description="Preferred communication style with a roommate.",
    )
    issue_handling_importance: ImportanceLevel = Field(
        default=ImportanceLevel.important,
        description="Importance of roommate discussing problems openly.",
    )

    # Household & Financial Responsibilities
    household_responsibilities: HouseholdResponsibilityPreference = Field(
        default=HouseholdResponsibilityPreference.shared_equally,
        description="Preference for managing shared household chores and responsibilities.",
    )
    financial_responsibility: ImportanceLevel = Field(
        default=ImportanceLevel.very_important,
        description="Importance of roommate being reliable with shared expenses.",
    )

    # Deal-Breakers
    deal_breakers: list[str] = Field(
        default_factory=list,
        description="List of deal-breaker situations (e.g. loud noise, unreliable payments).",
    )
    deal_breaker_other: str | None = Field(
        default=None,
        description="Custom deal-breaker specified if 'other' is selected.",
    )

    # Legacy fields with defaults for backward-compatibility
    smoking_tolerance: ToleranceLevel = Field(
        default=ToleranceLevel.not_comfortable,
        description="How comfortable the user is with a smoking roommate.",
    )
    drinking_tolerance: ToleranceLevel = Field(
        default=ToleranceLevel.comfortable,
        description="How comfortable the user is with a drinking roommate.",
    )
    pet_tolerance: ToleranceLevel = Field(
        default=ToleranceLevel.comfortable,
        description="How comfortable the user is with a roommate with pets.",
    )
    cleanliness_requirement: CleanlinessLevel = Field(
        default=CleanlinessLevel.clean,
        description="Minimum cleanliness standard expected from a roommate.",
    )
    preferred_sleep_schedule: SleepSchedule = Field(
        default=SleepSchedule.flexible,
        description="Preferred sleep / wake pattern of a prospective roommate.",
    )

    @model_validator(mode="after")
    def cross_validate_ranges(self) -> "PreferenceCreate":
        """Enforce min ≤ max for age and budget."""
        if self.min_age > self.max_age:
            raise ValueError(
                f"min_age ({self.min_age}) must be ≤ max_age ({self.max_age})."
            )
        if self.budget_min > self.budget_max:
            raise ValueError(
                f"budget_min ({self.budget_min}) must be ≤ "
                f"budget_max ({self.budget_max})."
            )
        return self


class PreferenceUpdate(BaseModel):
    """Partial update — every field is optional."""

    preferred_gender: GenderPreference | None = Field(default=None)
    min_age: int | None = Field(
        default=None, ge=_MIN_REALISTIC_AGE, le=_MAX_REALISTIC_AGE
    )
    max_age: int | None = Field(
        default=None, ge=_MIN_REALISTIC_AGE, le=_MAX_REALISTIC_AGE
    )
    budget_min: Decimal | None = Field(
        default=None, ge=_MIN_BUDGET, le=_MAX_BUDGET
    )
    budget_max: Decimal | None = Field(
        default=None, ge=_MIN_BUDGET, le=_MAX_BUDGET
    )
    social_style: SocialStyle | None = Field(default=None)
    personal_space: PersonalSpacePreference | None = Field(default=None)
    communication_style: CommunicationStyle | None = Field(default=None)
    issue_handling_importance: ImportanceLevel | None = Field(default=None)
    household_responsibilities: HouseholdResponsibilityPreference | None = Field(
        default=None
    )
    financial_responsibility: ImportanceLevel | None = Field(default=None)
    deal_breakers: list[str] | None = Field(default=None)
    deal_breaker_other: str | None = Field(default=None)

    smoking_tolerance: ToleranceLevel | None = Field(default=None)
    drinking_tolerance: ToleranceLevel | None = Field(default=None)
    pet_tolerance: ToleranceLevel | None = Field(default=None)
    cleanliness_requirement: CleanlinessLevel | None = Field(default=None)
    preferred_sleep_schedule: SleepSchedule | None = Field(default=None)

    @model_validator(mode="after")
    def cross_validate_ranges(self) -> "PreferenceUpdate":
        """
        Only validate when both sides of a pair are present in the same
        request — avoids false negatives during partial updates.
        """
        if self.min_age is not None and self.max_age is not None:
            if self.min_age > self.max_age:
                raise ValueError(
                    f"min_age ({self.min_age}) must be ≤ "
                    f"max_age ({self.max_age})."
                )
        if self.budget_min is not None and self.budget_max is not None:
            if self.budget_min > self.budget_max:
                raise ValueError(
                    f"budget_min ({self.budget_min}) must be ≤ "
                    f"budget_max ({self.budget_max})."
                )
        return self


# ---------------------------------------------------------------------------
# Response schema (server → client)
# ---------------------------------------------------------------------------


class PreferenceResponse(BaseModel):
    """Read-only representation of a persisted RoommatePreference record."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    preferred_gender: GenderPreference
    min_age: int
    max_age: int
    budget_min: Decimal
    budget_max: Decimal
    social_style: SocialStyle = SocialStyle.balanced
    personal_space: PersonalSpacePreference = PersonalSpacePreference.moderate
    communication_style: CommunicationStyle = CommunicationStyle.open_communication
    issue_handling_importance: ImportanceLevel = ImportanceLevel.important
    household_responsibilities: HouseholdResponsibilityPreference = (
        HouseholdResponsibilityPreference.shared_equally
    )
    financial_responsibility: ImportanceLevel = ImportanceLevel.very_important
    deal_breakers: list[str] = Field(default_factory=list)
    deal_breaker_other: str | None = None

    smoking_tolerance: ToleranceLevel = ToleranceLevel.not_comfortable
    drinking_tolerance: ToleranceLevel = ToleranceLevel.comfortable
    pet_tolerance: ToleranceLevel = ToleranceLevel.comfortable
    cleanliness_requirement: CleanlinessLevel = CleanlinessLevel.clean
    preferred_sleep_schedule: SleepSchedule = SleepSchedule.flexible
    created_at: datetime
    updated_at: datetime
