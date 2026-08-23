"""
Pydantic schemas for the AccommodationPreference domain.

Separation:
  - AccommodationCreate   → full required payload on first submission.
  - AccommodationUpdate   → all fields optional for partial PATCH updates.
  - AccommodationResponse → safe read-only view built from an ORM object.

Security: user_id, id, created_at, and updated_at are server-only and are
never accepted from the client.

Cross-field validation:
  - budget_min ≤ budget_max
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import (
    AccommodationType,
    LeaseDuration,
    MoveInTimeframe,
    RoomType,
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_MIN_BUDGET = Decimal("0.00")
_MAX_BUDGET = Decimal("9_999_999.99")  # Numeric(10, 2) upper bound


# ---------------------------------------------------------------------------
# Request schemas (client → server)
# ---------------------------------------------------------------------------


class AccommodationCreate(BaseModel):
    """Full accommodation-preference payload required on first submission."""

    accommodation_type: AccommodationType = Field(
        description="Type of accommodation preferred (pg, flat, apartment, etc.)."
    )
    room_type: RoomType = Field(
        description="Room occupancy preference (private or shared)."
    )
    move_in_timeframe: MoveInTimeframe = Field(
        description="Expected move-in timeframe (within_1_month, one_to_three_months, etc.)."
    )
    lease_duration: LeaseDuration = Field(
        description="Preferred lease duration."
    )

    budget_min: Decimal = Field(
        ge=_MIN_BUDGET,
        le=_MAX_BUDGET,
        description="Minimum monthly accommodation budget.",
    )
    budget_max: Decimal = Field(
        ge=_MIN_BUDGET,
        le=_MAX_BUDGET,
        description="Maximum monthly accommodation budget.",
    )

    @model_validator(mode="after")
    def cross_validate_budget(self) -> "AccommodationCreate":
        """Enforce budget_min ≤ budget_max."""
        if self.budget_min > self.budget_max:
            raise ValueError(
                f"budget_min ({self.budget_min}) must be ≤ "
                f"budget_max ({self.budget_max})."
            )
        return self


class AccommodationUpdate(BaseModel):
    """Partial update — every field is optional."""

    accommodation_type: AccommodationType | None = Field(default=None)
    room_type: RoomType | None = Field(default=None)
    move_in_timeframe: MoveInTimeframe | None = Field(default=None)
    lease_duration: LeaseDuration | None = Field(default=None)
    budget_min: Decimal | None = Field(
        default=None, ge=_MIN_BUDGET, le=_MAX_BUDGET
    )
    budget_max: Decimal | None = Field(
        default=None, ge=_MIN_BUDGET, le=_MAX_BUDGET
    )

    @model_validator(mode="after")
    def cross_validate_budget(self) -> "AccommodationUpdate":
        """
        Only validate when both budget values are present in the same
        request to avoid false negatives during partial updates.
        """
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


class AccommodationResponse(BaseModel):
    """Read-only representation of a persisted AccommodationPreference record."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    accommodation_type: AccommodationType
    room_type: RoomType
    move_in_timeframe: MoveInTimeframe
    lease_duration: LeaseDuration
    budget_min: Decimal
    budget_max: Decimal
    created_at: datetime
    updated_at: datetime
