"""
Top-level onboarding schemas that aggregate all five sub-schemas.

OnboardingCreate — single request the frontend sends to complete onboarding.
  Combines ProfileCreate + LocationCreate + AccommodationCreate + LifestyleCreate + PreferenceCreate.

OnboardingPartialUpdate — partial update request for "Save and Exit" progress.
  All five sub-schemas are optional; individual fields within sections are also optional.

OnboardingResponse — full onboarding state returned when all five sections are complete.

OnboardingProgressResponse — onboarding state that supports both partial progress
  and complete profiles with an explicit `is_complete` boolean flag.

Security: No user_id, id, created_at, or updated_at fields are accepted from
the client. All identity and timestamp fields are controlled exclusively by the backend.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.schemas.profile import ProfileCreate, ProfileResponse, ProfileUpdate
from app.schemas.location import LocationCreate, LocationResponse, LocationUpdate
from app.schemas.accommodation import (
    AccommodationCreate,
    AccommodationResponse,
    AccommodationUpdate,
)
from app.schemas.lifestyle import LifestyleCreate, LifestyleResponse, LifestyleUpdate
from app.schemas.preference import (
    PreferenceCreate,
    PreferenceResponse,
    PreferenceUpdate,
)


# ---------------------------------------------------------------------------
# Request schemas (client → server)
# ---------------------------------------------------------------------------


class OnboardingCreate(BaseModel):
    """
    Single onboarding request that bundles all five sub-forms.
    Required for final complete profile submission.
    """

    profile: ProfileCreate
    location: LocationCreate
    accommodation: AccommodationCreate
    lifestyle: LifestyleCreate
    preferences: PreferenceCreate


class OnboardingPartialUpdate(BaseModel):
    """
    Partial onboarding update for 'Save and Exit' or step-by-step saves.
    Uses relaxed Update schemas (all-optional fields) so partial saves never
    fail strict full-record validation.
    """

    profile: ProfileCreate | ProfileUpdate | None = None
    location: LocationCreate | LocationUpdate | None = None
    accommodation: AccommodationCreate | AccommodationUpdate | None = None
    lifestyle: LifestyleCreate | LifestyleUpdate | None = None
    preferences: PreferenceCreate | PreferenceUpdate | None = None


# ---------------------------------------------------------------------------
# Response schemas (server → client)
# ---------------------------------------------------------------------------


class OnboardingResponse(BaseModel):
    """
    Complete onboarding state returned to the client after successful
    creation. All five sub-records are present.
    """

    model_config = ConfigDict(from_attributes=True)

    profile: ProfileResponse
    location: LocationResponse
    accommodation: AccommodationResponse
    lifestyle: LifestyleResponse
    preferences: PreferenceResponse


class OnboardingProgressResponse(BaseModel):
    """
    Progressive onboarding state supporting both partial and complete progress.
    """

    model_config = ConfigDict(from_attributes=True)

    profile: ProfileResponse | None = None
    location: LocationResponse | None = None
    accommodation: AccommodationResponse | None = None
    lifestyle: LifestyleResponse | None = None
    preferences: PreferenceResponse | None = None
    is_complete: bool = False
