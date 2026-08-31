"""
Pydantic schemas for the UserProfile domain.

Separation:
  - ProfileCreate  → validated input accepted from the client (POST / initial creation).
  - ProfileUpdate  → all fields optional for partial PATCH updates.
  - ProfileResponse → safe read-only view returned to the client; built from
                      a UserProfile ORM object via model_config from_attributes.

Security: user_id, id, created_at, and updated_at are never accepted from the
client. They are set exclusively by the authenticated session and the database.
"""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

from app.models.enums import GenderEnum

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_MIN_FIRST_NAME_LEN = 1
_MAX_FIRST_NAME_LEN = 100

_MIN_LAST_NAME_LEN = 1
_MAX_LAST_NAME_LEN = 100

_MAX_OCCUPATION_LEN = 150
_MIN_BIO_WORDS = 4
_MAX_BIO_WORDS = 20
_MIN_EXPECTATIONS_WORDS = 20
_MAX_EXPECTATIONS_WORDS = 250

# Oldest plausible user: 100 years old; youngest: 18 (platform minimum).
_MIN_AGE_YEARS = 18
_MAX_AGE_YEARS = 100


# ---------------------------------------------------------------------------
# Request schemas (client → server)
# ---------------------------------------------------------------------------


import re

def _count_words(text: str) -> int:
    """Count words that contain at least one alphanumeric character."""
    if not text:
        return 0
    return len([w for w in text.split() if re.search(r'[a-zA-Z0-9]', w)])


class ProfileCreate(BaseModel):
    """All fields required when creating a user profile for the first time."""

    first_name: str = Field(
        min_length=_MIN_FIRST_NAME_LEN,
        max_length=_MAX_FIRST_NAME_LEN,
        description="User's first name.",
    )
    last_name: str = Field(
        min_length=_MIN_LAST_NAME_LEN,
        max_length=_MAX_LAST_NAME_LEN,
        description="User's last name.",
    )
    date_of_birth: date = Field(description="Date of birth (YYYY-MM-DD).")
    gender: GenderEnum = Field(description="Self-identified gender.")
    occupation: str = Field(
        min_length=1,
        max_length=_MAX_OCCUPATION_LEN,
        description="Current occupation or job title.",
    )
    bio: str = Field(
        description="Personal bio visible to everyone (4–20 words required).",
    )
    roommate_expectations: str = Field(
        description="Private expectations from roommate (20–250 words required).",
    )
    profile_photo_url: str | None = Field(
        default=None,
        description="Absolute URL or data URI of the profile photo (optional).",
    )

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        """Trim leading/trailing whitespace from name fields."""
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("bio")
    @classmethod
    def validate_bio_word_count(cls, v: str) -> str:
        text = v.strip() if isinstance(v, str) else ""
        count = _count_words(text)
        if count < _MIN_BIO_WORDS:
            raise ValueError(f"Bio must be at least {_MIN_BIO_WORDS} words (currently {count} words).")
        if count > _MAX_BIO_WORDS:
            raise ValueError(f"Bio cannot exceed {_MAX_BIO_WORDS} words (currently {count} words).")
        return text

    @field_validator("roommate_expectations")
    @classmethod
    def validate_expectations_word_count(cls, v: str) -> str:
        text = v.strip() if isinstance(v, str) else ""
        count = _count_words(text)
        if count < _MIN_EXPECTATIONS_WORDS:
            raise ValueError(
                f"Roommate expectations must be at least {_MIN_EXPECTATIONS_WORDS} words (currently {count} words)."
            )
        if count > _MAX_EXPECTATIONS_WORDS:
            raise ValueError(
                f"Roommate expectations cannot exceed {_MAX_EXPECTATIONS_WORDS} words (currently {count} words)."
            )
        return text

    @field_validator("date_of_birth")
    @classmethod
    def validate_age(cls, v: date) -> date:
        """Reject dates that produce an unrealistic age."""
        today = date.today()
        age = (
            today.year
            - v.year
            - ((today.month, today.day) < (v.month, v.day))
        )
        if age < _MIN_AGE_YEARS:
            raise ValueError(
                "You must be at least 18 years old to create a roommate profile."
            )
        if age > _MAX_AGE_YEARS:
            raise ValueError(
                f"Date of birth implies an age greater than {_MAX_AGE_YEARS}."
            )
        return v


class ProfileUpdate(BaseModel):
    """
    Partial update schema — every field is optional.
    Only the fields present in the payload are changed.
    """

    first_name: str | None = Field(
        default=None,
        min_length=_MIN_FIRST_NAME_LEN,
        max_length=_MAX_FIRST_NAME_LEN,
    )
    last_name: str | None = Field(
        default=None,
        min_length=_MIN_LAST_NAME_LEN,
        max_length=_MAX_LAST_NAME_LEN,
    )
    date_of_birth: date | None = Field(default=None)
    gender: GenderEnum | None = Field(default=None)
    occupation: str | None = Field(
        default=None, min_length=1, max_length=_MAX_OCCUPATION_LEN
    )
    bio: str | None = Field(default=None)
    roommate_expectations: str | None = Field(default=None)
    profile_photo_url: str | None = Field(default=None)

    @field_validator(
        "first_name",
        "last_name",
        "date_of_birth",
        "occupation",
        "bio",
        "roommate_expectations",
        "profile_photo_url",
        mode="before",
    )
    @classmethod
    def empty_str_to_none(cls, v: Any) -> Any:
        if isinstance(v, str):
            stripped = v.strip()
            return stripped if stripped else None
        return v

    @field_validator("bio")
    @classmethod
    def validate_bio_word_count(cls, v: str | None) -> str | None:
        if v is None:
            return v
        text = v.strip()
        if not text:
            return None
        count = _count_words(text)
        if count < _MIN_BIO_WORDS:
            raise ValueError(f"Bio must be at least {_MIN_BIO_WORDS} words (currently {count} words).")
        if count > _MAX_BIO_WORDS:
            raise ValueError(f"Bio cannot exceed {_MAX_BIO_WORDS} words (currently {count} words).")
        return text

    @field_validator("roommate_expectations")
    @classmethod
    def validate_expectations_word_count(cls, v: str | None) -> str | None:
        if v is None:
            return v
        text = v.strip()
        if not text:
            return None
        count = _count_words(text)
        if count < _MIN_EXPECTATIONS_WORDS:
            raise ValueError(
                f"Roommate expectations must be at least {_MIN_EXPECTATIONS_WORDS} words (currently {count} words)."
            )
        if count > _MAX_EXPECTATIONS_WORDS:
            raise ValueError(
                f"Roommate expectations cannot exceed {_MAX_EXPECTATIONS_WORDS} words (currently {count} words)."
            )
        return text

    @field_validator("date_of_birth")
    @classmethod
    def validate_age(cls, v: date | None) -> date | None:
        if v is None:
            return v
        today = date.today()
        age = (
            today.year
            - v.year
            - ((today.month, today.day) < (v.month, v.day))
        )
        if age < _MIN_AGE_YEARS:
            raise ValueError(
                f"User must be at least {_MIN_AGE_YEARS} years old."
            )
        if age > _MAX_AGE_YEARS:
            raise ValueError(
                f"Date of birth implies an age greater than {_MAX_AGE_YEARS}."
            )
        return v


# ---------------------------------------------------------------------------
# Response schema (server → client)
# ---------------------------------------------------------------------------


class ProfileResponse(BaseModel):
    """Read-only representation of a persisted UserProfile record."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    first_name: str
    last_name: str
    date_of_birth: date
    gender: GenderEnum
    occupation: str
    bio: str | None = None
    roommate_expectations: str | None = None
    profile_photo_url: str | None = None
    created_at: datetime
    updated_at: datetime

