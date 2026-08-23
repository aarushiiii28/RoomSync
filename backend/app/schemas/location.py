"""
Pydantic schemas for the Location domain.

Separation:
  - LocationCreate  → validated input for initial submission.
  - LocationUpdate  → all fields optional for partial PATCH updates.
  - LocationResponse → safe read-only view returned to the client.

Security: user_id, id, created_at, and updated_at are never accepted from the
client.

Coordinate validation:
  - latitude  ∈ [-90, 90]
  - longitude ∈ [-180, 180]

pincode is validated as a non-empty alphanumeric string (max 20 chars) to
remain compatible with formats used in India (6-digit), US (5+4-digit),
UK (alphanumeric), etc.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.constants.locations import (
    is_valid_country,
    is_valid_state,
    is_valid_city,
    find_state_for_city,
    is_valid_pincode_for_state,
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_MAX_TEXT_LEN = 200   # locality is 200 in the model
_MAX_CITY_LEN = 100
_MAX_PINCODE_LEN = 20


# ---------------------------------------------------------------------------
# Request schemas (client → server)
# ---------------------------------------------------------------------------


class LocationCreate(BaseModel):
    """Full location payload required on first submission."""

    country: str = Field(
        min_length=1,
        max_length=_MAX_CITY_LEN,
        description="Country name.",
    )
    state: str = Field(
        min_length=1,
        max_length=_MAX_CITY_LEN,
        description="State or province.",
    )
    city: str = Field(
        min_length=1,
        max_length=_MAX_CITY_LEN,
        description="City name.",
    )
    locality: str = Field(
        min_length=1,
        max_length=_MAX_TEXT_LEN,
        description="Neighbourhood or locality within the city.",
    )
    pincode: str = Field(
        min_length=3,
        max_length=_MAX_PINCODE_LEN,
        pattern=r"^[A-Za-z0-9 \-]+$",
        description="Postal / PIN code (alphanumeric, country-agnostic).",
    )
    latitude: Decimal = Field(
        ge=Decimal("-90"),
        le=Decimal("90"),
        description="GPS latitude in decimal degrees.",
    )
    longitude: Decimal = Field(
        ge=Decimal("-180"),
        le=Decimal("180"),
        description="GPS longitude in decimal degrees.",
    )

    @field_validator("country", "state", "city", "locality", mode="before")
    @classmethod
    def strip_and_check(cls, v: str) -> str:
        """Strip whitespace; reject strings that are whitespace-only."""
        if isinstance(v, str):
            stripped = v.strip()
            if not stripped:
                raise ValueError("Field must not be blank.")
            return stripped
        return v

    @model_validator(mode="after")
    def cross_validate_location(self) -> "LocationCreate":
        """Enforce strict geographic hierarchy: Country -> State -> City -> PIN Code."""
        # 1. Validate Country
        if not is_valid_country(self.country):
            raise ValueError(f"'{self.country}' is not a supported country. Currently supported: India.")

        # 2. Validate State belongs to Country
        if not is_valid_state(self.country, self.state):
            raise ValueError(
                f"'{self.state}' is not a valid state or union territory in {self.country}."
            )

        # 3. Validate City belongs to State
        if not is_valid_city(self.country, self.state, self.city):
            actual_states = find_state_for_city(self.country, self.city)
            if actual_states:
                states_str = ", ".join(actual_states)
                raise ValueError(
                    f"{self.city} is not a city in {self.state}. {self.city} is located in {states_str}."
                )
            raise ValueError(
                f"'{self.city}' is not a recognized city in {self.state}. Please select a valid city within {self.state}."
            )

        # 4. Validate Locality is non-empty
        if len(self.locality.strip()) < 2:
            raise ValueError("Locality / Neighborhood must be at least 2 characters long.")

        # 5. Validate PIN code format and geographic region
        valid_pin, pin_err = is_valid_pincode_for_state(self.state, self.pincode)
        if not valid_pin:
            raise ValueError(pin_err)

        return self


class LocationUpdate(BaseModel):
    """Partial update — every field is optional."""

    country: str | None = Field(
        default=None, min_length=1, max_length=_MAX_CITY_LEN
    )
    state: str | None = Field(
        default=None, min_length=1, max_length=_MAX_CITY_LEN
    )
    city: str | None = Field(
        default=None, min_length=1, max_length=_MAX_CITY_LEN
    )
    locality: str | None = Field(
        default=None, min_length=1, max_length=_MAX_TEXT_LEN
    )
    pincode: str | None = Field(
        default=None,
        min_length=3,
        max_length=_MAX_PINCODE_LEN,
        pattern=r"^[A-Za-z0-9 \-]+$",
    )
    latitude: Decimal | None = Field(
        default=None, ge=Decimal("-90"), le=Decimal("90")
    )
    longitude: Decimal | None = Field(
        default=None, ge=Decimal("-180"), le=Decimal("180")
    )

    @field_validator("country", "state", "city", "locality", mode="before")
    @classmethod
    def strip_and_check(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            stripped = v.strip()
            if not stripped:
                raise ValueError("Field must not be blank.")
            return stripped
        return v

    @model_validator(mode="after")
    def cross_validate_location(self) -> "LocationUpdate":
        """Validate geographic hierarchy if all relevant fields are present in update."""
        country = self.country or "India"
        if self.country is not None and not is_valid_country(country):
            raise ValueError(f"'{country}' is not a supported country.")

        if self.state is not None and not is_valid_state(country, self.state):
            raise ValueError(
                f"'{self.state}' is not a valid state or union territory in {country}."
            )

        if self.state is not None and self.city is not None:
            if not is_valid_city(country, self.state, self.city):
                actual_states = find_state_for_city(country, self.city)
                if actual_states:
                    states_str = ", ".join(actual_states)
                    raise ValueError(
                        f"{self.city} is not a city in {self.state}. {self.city} is located in {states_str}."
                    )
                raise ValueError(
                    f"'{self.city}' is not a recognized city in {self.state}."
                )

        if self.state is not None and self.pincode is not None:
            valid_pin, pin_err = is_valid_pincode_for_state(self.state, self.pincode)
            if not valid_pin:
                raise ValueError(pin_err)

        return self


# ---------------------------------------------------------------------------
# Response schema (server → client)
# ---------------------------------------------------------------------------


class LocationResponse(BaseModel):
    """Read-only representation of a persisted Location record."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    country: str
    state: str
    city: str
    locality: str
    pincode: str
    latitude: Decimal
    longitude: Decimal
    created_at: datetime
    updated_at: datetime
