"""
Pydantic schemas for the LifestyleProfile domain.

All enum fields reuse the existing domain enums from app.models.enums —
no duplicate enum definitions.

Separation:
  - LifestyleCreate   → full required payload on first submission.
  - LifestyleUpdate   → all fields optional for partial PATCH updates.
  - LifestyleResponse → safe read-only view built from an ORM object.

Security: user_id, id, created_at, and updated_at are server-only and are
never accepted from the client.

sleep_time / wake_time are accepted as plain HH:MM strings and parsed into
datetime.time objects by Pydantic, matching the Time column in the model.
"""

from __future__ import annotations

from datetime import datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

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


# ---------------------------------------------------------------------------
# Request schemas (client → server)
# ---------------------------------------------------------------------------


class LifestyleCreate(BaseModel):
    """Full lifestyle payload required on first submission."""

    sleep_time: time = Field(
        description=(
            "Usual time the user goes to sleep (local time, no timezone). "
            "ISO 8601 time string, e.g. '23:00'."
        )
    )
    wake_time: time = Field(
        description=(
            "Usual time the user wakes up (local time, no timezone). "
            "ISO 8601 time string, e.g. '07:00'."
        )
    )

    schedule_consistency: int = Field(
        default=3,
        ge=1,
        le=5,
        description="Daily schedule consistency (1: unpredictable .. 5: very consistent).",
    )

    study_hours: int = Field(
        default=3,
        ge=1,
        le=7,
        description="Approximate daily study/work hours (1: <1h .. 7: 6+h).",
    )

    noise_sleep_tolerance: int = Field(
        default=3,
        ge=1,
        le=5,
        description="Noise sensitivity (1: can sleep through noise .. 5: need quiet).",
    )

    cleanliness: CleanlinessLevel = Field(
        default=CleanlinessLevel.clean,
        description="How tidy the user keeps shared living spaces.",
    )
    cleanliness_score: int = Field(
        default=3,
        ge=1,
        le=5,
        description="Cleanliness score (1: very relaxed .. 5: extremely tidy).",
    )
    cleanliness_importance: ImportanceLevel = Field(
        default=ImportanceLevel.important,
        description="Importance of roommate having similar cleanliness standards.",
    )

    privacy_preference: int = Field(
        default=3,
        ge=1,
        le=5,
        description="Personal privacy preference (1: highly social .. 5: lots of personal space).",
    )

    talkativeness: int = Field(
        default=3,
        ge=1,
        le=5,
        description="Social & talkativeness at home (1: quiet .. 5: very social/talkative).",
    )

    friendship_expectation: int = Field(
        default=3,
        ge=1,
        le=5,
        description="Roommate friendship expectation (1: independent .. 5: close friends).",
    )

    gaming_hours: int = Field(
        default=0,
        ge=0,
        le=8,
        description="Daily gaming hours (0: none .. 8: 8+ hours).",
    )

    smoking: SmokingHabit = Field(description="User's smoking behaviour.")
    smoking_tolerance: ToleranceLevel = Field(
        default=ToleranceLevel.not_comfortable,
        description="Comfort level with a roommate who smokes.",
    )

    drinking: DrinkingHabit = Field(
        description="User's alcohol consumption behaviour."
    )
    drinking_tolerance: ToleranceLevel = Field(
        default=ToleranceLevel.comfortable,
        description="Comfort level with a roommate who drinks.",
    )

    pets: PetOwnership = Field(
        description="Whether the user currently keeps pets."
    )
    pet_tolerance: ToleranceLevel = Field(
        default=ToleranceLevel.comfortable,
        description="Comfort level with a roommate having pets.",
    )

    guest_frequency: FrequencyLevel = Field(
        description="How often the user has guests over."
    )
    guest_tolerance: ToleranceLevel = Field(
        default=ToleranceLevel.comfortable,
        description="Comfort level with a roommate having guests over.",
    )

    cooking: FrequencyLevel = Field(
        description="How often the user cooks at home."
    )
    cooking_tolerance: ToleranceLevel = Field(
        default=ToleranceLevel.comfortable,
        description="Comfort level with a roommate cooking frequently.",
    )

    party_frequency: FrequencyLevel = Field(
        description="How often the user hosts social gatherings at home."
    )
    party_tolerance: ToleranceLevel = Field(
        default=ToleranceLevel.comfortable,
        description="Comfort level with a roommate hosting social gatherings.",
    )

    fitness: FitnessLevel = Field(
        description="How regularly the user exercises."
    )

    music: bool = Field(
        description=(
            "True if the user regularly plays or listens to loud music at home."
        )
    )
    work_from_home: bool = Field(
        description=(
            "True if the user works remotely (affects daytime home occupancy)."
        )
    )


class LifestyleUpdate(BaseModel):
    """Partial update — every field is optional."""

    sleep_time: time | None = Field(default=None)
    wake_time: time | None = Field(default=None)
    schedule_consistency: int | None = Field(default=None, ge=1, le=5)
    study_hours: int | None = Field(default=None, ge=1, le=7)
    noise_sleep_tolerance: int | None = Field(default=None, ge=1, le=5)
    cleanliness: CleanlinessLevel | None = Field(default=None)
    cleanliness_score: int | None = Field(default=None, ge=1, le=5)
    cleanliness_importance: ImportanceLevel | None = Field(default=None)
    privacy_preference: int | None = Field(default=None, ge=1, le=5)
    talkativeness: int | None = Field(default=None, ge=1, le=5)
    friendship_expectation: int | None = Field(default=None, ge=1, le=5)
    gaming_hours: int | None = Field(default=None, ge=0, le=8)
    smoking: SmokingHabit | None = Field(default=None)
    smoking_tolerance: ToleranceLevel | None = Field(default=None)
    drinking: DrinkingHabit | None = Field(default=None)
    drinking_tolerance: ToleranceLevel | None = Field(default=None)
    pets: PetOwnership | None = Field(default=None)
    pet_tolerance: ToleranceLevel | None = Field(default=None)
    guest_frequency: FrequencyLevel | None = Field(default=None)
    guest_tolerance: ToleranceLevel | None = Field(default=None)
    cooking: FrequencyLevel | None = Field(default=None)
    cooking_tolerance: ToleranceLevel | None = Field(default=None)
    party_frequency: FrequencyLevel | None = Field(default=None)
    party_tolerance: ToleranceLevel | None = Field(default=None)
    fitness: FitnessLevel | None = Field(default=None)
    music: bool | None = Field(default=None)
    work_from_home: bool | None = Field(default=None)


# ---------------------------------------------------------------------------
# Response schema (server → client)
# ---------------------------------------------------------------------------


class LifestyleResponse(BaseModel):
    """Read-only representation of a persisted LifestyleProfile record."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    sleep_time: time
    wake_time: time
    schedule_consistency: int = 3
    study_hours: int = 3
    noise_sleep_tolerance: int = 3
    cleanliness: CleanlinessLevel
    cleanliness_score: int = 3
    cleanliness_importance: ImportanceLevel = ImportanceLevel.important
    privacy_preference: int = 3
    talkativeness: int = 3
    friendship_expectation: int = 3
    gaming_hours: int = 0
    smoking: SmokingHabit
    smoking_tolerance: ToleranceLevel = ToleranceLevel.not_comfortable
    drinking: DrinkingHabit
    drinking_tolerance: ToleranceLevel = ToleranceLevel.comfortable
    pets: PetOwnership
    pet_tolerance: ToleranceLevel = ToleranceLevel.comfortable
    guest_frequency: FrequencyLevel
    guest_tolerance: ToleranceLevel = ToleranceLevel.comfortable
    cooking: FrequencyLevel
    cooking_tolerance: ToleranceLevel = ToleranceLevel.comfortable
    party_frequency: FrequencyLevel
    party_tolerance: ToleranceLevel = ToleranceLevel.comfortable
    fitness: FitnessLevel
    music: bool
    work_from_home: bool
    created_at: datetime
    updated_at: datetime
