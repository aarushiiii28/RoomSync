"""
Onboarding service — Phase 2, Step 6B & Step 7 (Save & Exit).

Responsibility
--------------
Persist (or update) a user's complete or partial onboarding profile across the five
one-to-one tables:

    user_profiles             ← UserProfile
    locations                 ← Location
    accommodation_preferences ← AccommodationPreference
    lifestyle_profiles        ← LifestyleProfile
    roommate_preferences      ← RoommatePreference

Security contract
-----------------
The caller MUST supply the authenticated ``User`` object retrieved by
``get_current_user``. The service stamps every record with
``authenticated_user.id`` and never reads ``user_id`` from the request
payload.

Transaction contract
--------------------
All upserts in a single call happen inside ONE SQLAlchemy transaction.
  ─ All succeed  → commit.
  ─ Any failure  → rollback the entire transaction.

Public API
----------
create_or_update_onboarding(db, *, user, payload) → OnboardingResponse
save_partial_onboarding(db, *, user, payload)     → OnboardingProgressResponse
get_onboarding(db, *, user)                        → OnboardingResponse | None
get_onboarding_progress(db, *, user)               → OnboardingProgressResponse | None
"""

from datetime import date
from typing import TYPE_CHECKING, TypeVar
from uuid import UUID, uuid4

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.accommodation_preference import AccommodationPreference
from app.models.lifestyle_profile import LifestyleProfile
from app.models.location import Location
from app.models.roommate_preference import RoommatePreference
from app.models.user import User
from app.models.user_profile import UserProfile
from app.schemas.accommodation import AccommodationCreate, AccommodationResponse
from app.schemas.lifestyle import LifestyleCreate, LifestyleResponse
from app.schemas.location import LocationCreate, LocationResponse
from app.schemas.onboarding import (
    OnboardingCreate,
    OnboardingPartialUpdate,
    OnboardingProgressResponse,
    OnboardingResponse,
)
from app.schemas.preference import PreferenceCreate, PreferenceResponse
from app.schemas.profile import ProfileCreate, ProfileResponse

if TYPE_CHECKING:
    pass  # kept for future TYPE_CHECKING-gated imports

# ---------------------------------------------------------------------------
# Internal type variable
# ---------------------------------------------------------------------------

_ORM = TypeVar(
    "_ORM",
    UserProfile,
    Location,
    AccommodationPreference,
    LifestyleProfile,
    RoommatePreference,
)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _profile_kwargs(data: ProfileCreate, user_id: UUID) -> dict:
    """Return a dict of column values for UserProfile from a ProfileCreate."""
    photo = data.profile_photo_url
    return {
        "user_id": user_id,
        "first_name": data.first_name,
        "last_name": data.last_name,
        "date_of_birth": data.date_of_birth,
        "gender": data.gender,
        "occupation": data.occupation,
        "bio": data.bio,
        "roommate_expectations": data.roommate_expectations,
        # Pydantic HttpUrl serialises to str; store the string value.
        "profile_photo_url": str(photo) if photo is not None else None,
    }



def _location_kwargs(data: LocationCreate, user_id: UUID) -> dict:
    """Return a dict of column values for Location from a LocationCreate."""
    return {
        "user_id": user_id,
        "country": data.country,
        "state": data.state,
        "city": data.city,
        "locality": data.locality,
        "pincode": data.pincode,
        "latitude": data.latitude,
        "longitude": data.longitude,
    }


def _accommodation_kwargs(data: AccommodationCreate, user_id: UUID) -> dict:
    """Return a dict of column values for AccommodationPreference from an AccommodationCreate."""
    return {
        "user_id": user_id,
        "accommodation_type": data.accommodation_type,
        "room_type": data.room_type,
        "move_in_timeframe": data.move_in_timeframe,
        "lease_duration": data.lease_duration,
        "budget_min": data.budget_min,
        "budget_max": data.budget_max,
    }


def _lifestyle_kwargs(data: LifestyleCreate, user_id: UUID) -> dict:
    """Return a dict of column values for LifestyleProfile from a LifestyleCreate."""
    return {
        "user_id": user_id,
        "sleep_time": data.sleep_time,
        "wake_time": data.wake_time,
        "schedule_consistency": data.schedule_consistency,
        "study_hours": data.study_hours,
        "noise_sleep_tolerance": data.noise_sleep_tolerance,
        "cleanliness": data.cleanliness,
        "cleanliness_score": data.cleanliness_score,
        "cleanliness_importance": data.cleanliness_importance,
        "privacy_preference": data.privacy_preference,
        "talkativeness": data.talkativeness,
        "friendship_expectation": data.friendship_expectation,
        "gaming_hours": data.gaming_hours,
        "smoking": data.smoking,
        "smoking_tolerance": data.smoking_tolerance,
        "drinking": data.drinking,
        "drinking_tolerance": data.drinking_tolerance,
        "pets": data.pets,
        "pet_tolerance": data.pet_tolerance,
        "guest_frequency": data.guest_frequency,
        "guest_tolerance": data.guest_tolerance,
        "cooking": data.cooking,
        "cooking_tolerance": data.cooking_tolerance,
        "party_frequency": data.party_frequency,
        "party_tolerance": data.party_tolerance,
        "fitness": data.fitness,
        "music": data.music,
        "work_from_home": data.work_from_home,
    }


def _preference_kwargs(data: PreferenceCreate, user_id: UUID) -> dict:
    """Return a dict of column values for RoommatePreference from a PreferenceCreate."""
    return {
        "user_id": user_id,
        "preferred_gender": data.preferred_gender,
        "min_age": data.min_age,
        "max_age": data.max_age,
        "social_style": data.social_style,
        "personal_space": data.personal_space,
        "communication_style": data.communication_style,
        "issue_handling_importance": data.issue_handling_importance,
        "household_responsibilities": data.household_responsibilities,
        "financial_responsibility": data.financial_responsibility,
        "deal_breakers": data.deal_breakers,
        "deal_breaker_other": data.deal_breaker_other,
        "smoking_tolerance": data.smoking_tolerance,
        "drinking_tolerance": data.drinking_tolerance,
        "pet_tolerance": data.pet_tolerance,
        "cleanliness_requirement": data.cleanliness_requirement,
        "preferred_sleep_schedule": data.preferred_sleep_schedule,
    }


def _upsert(
    db: Session,
    model_cls: type[_ORM],
    *,
    user_id: UUID,
    kwargs: dict,
) -> _ORM:
    """
    Generic upsert for any of the five one-to-one onboarding tables.

    Queries the table for an existing row owned by ``user_id``. If found,
    updates every field from ``kwargs`` (excluding ``user_id`` itself to
    preserve the FK). If not found, creates a fresh row.

    The caller is responsible for ``db.commit()`` / ``db.rollback()``.
    """
    record: _ORM | None = (
        db.query(model_cls)
        .filter(model_cls.user_id == user_id)  # type: ignore[attr-defined]
        .first()
    )

    if record is None:
        record = model_cls(id=uuid4(), **kwargs)
        db.add(record)
    else:
        mutable_fields = {k: v for k, v in kwargs.items() if k != "user_id"}
        for field, value in mutable_fields.items():
            setattr(record, field, value)

    return record


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------


def create_or_update_onboarding(
    db: Session,
    *,
    user: User,
    payload: OnboardingCreate,
) -> OnboardingResponse:
    """
    Atomically create or update all five onboarding records for ``user``.
    Requires all five sections.
    """
    uid: UUID = user.id

    try:
        profile_record = _upsert(
            db,
            UserProfile,
            user_id=uid,
            kwargs=_profile_kwargs(payload.profile, uid),
        )
        location_record = _upsert(
            db,
            Location,
            user_id=uid,
            kwargs=_location_kwargs(payload.location, uid),
        )
        accommodation_record = _upsert(
            db,
            AccommodationPreference,
            user_id=uid,
            kwargs=_accommodation_kwargs(payload.accommodation, uid),
        )
        lifestyle_record = _upsert(
            db,
            LifestyleProfile,
            user_id=uid,
            kwargs=_lifestyle_kwargs(payload.lifestyle, uid),
        )
        preference_record = _upsert(
            db,
            RoommatePreference,
            user_id=uid,
            kwargs=_preference_kwargs(payload.preferences, uid),
        )

        db.commit()

        db.refresh(profile_record)
        db.refresh(location_record)
        db.refresh(accommodation_record)
        db.refresh(lifestyle_record)
        db.refresh(preference_record)

    except SQLAlchemyError as exc:
        db.rollback()
        raise RuntimeError(
            "An error occurred while saving onboarding data."
        ) from exc

    return OnboardingResponse(
        profile=ProfileResponse.model_validate(profile_record),
        location=LocationResponse.model_validate(location_record),
        accommodation=AccommodationResponse.model_validate(accommodation_record),
        lifestyle=LifestyleResponse.model_validate(lifestyle_record),
        preferences=PreferenceResponse.model_validate(preference_record),
    )


def save_partial_onboarding(
    db: Session,
    *,
    user: User,
    payload: OnboardingPartialUpdate,
) -> OnboardingProgressResponse:
    """
    Atomically save/update whichever onboarding sections are supplied.
    Used by 'Save and Exit' on any step of profile completion.
    """
    uid: UUID = user.id

    try:
        if payload.profile is not None:
            data = payload.profile.model_dump(exclude_unset=True)
            if data:
                data["user_id"] = uid
                if "profile_photo_url" in data and data["profile_photo_url"] is not None:
                    data["profile_photo_url"] = str(data["profile_photo_url"])
                if "date_of_birth" in data and isinstance(data["date_of_birth"], str):
                    try:
                        data["date_of_birth"] = date.fromisoformat(data["date_of_birth"])
                    except (ValueError, TypeError):
                        pass
                existing = (
                    db.query(UserProfile).filter(UserProfile.user_id == uid).first()
                )
                if existing is None:
                    defaults = {
                        "user_id": uid,
                        "first_name": "",
                        "last_name": "",
                        "date_of_birth": date(2000, 1, 1),
                        "gender": "female",
                        "occupation": "",
                        "bio": None,
                        "roommate_expectations": None,
                        "profile_photo_url": None,
                    }

                    defaults.update(data)
                    data = defaults
                _upsert(db, UserProfile, user_id=uid, kwargs=data)

        if payload.location is not None:
            data = payload.location.model_dump(exclude_unset=True)
            if data:
                data["user_id"] = uid
                existing = (
                    db.query(Location).filter(Location.user_id == uid).first()
                )
                if existing is None:
                    defaults = {
                        "user_id": uid,
                        "country": "India",
                        "state": "",
                        "city": "",
                        "locality": "",
                        "pincode": "",
                        "latitude": 12.9716,
                        "longitude": 77.5946,
                    }
                    defaults.update(data)
                    data = defaults
                _upsert(db, Location, user_id=uid, kwargs=data)

        if payload.accommodation is not None:
            data = payload.accommodation.model_dump(exclude_unset=True)
            if data:
                data["user_id"] = uid
                existing = (
                    db.query(AccommodationPreference)
                    .filter(AccommodationPreference.user_id == uid)
                    .first()
                )
                if existing is None:
                    defaults = {
                        "user_id": uid,
                        "accommodation_type": "flat",
                        "room_type": "private",
                        "move_in_timeframe": "within_1_month",
                        "lease_duration": "6_months",
                        "budget_min": 5000.0,
                        "budget_max": 15000.0,
                    }
                    defaults.update(data)
                    data = defaults
                _upsert(db, AccommodationPreference, user_id=uid, kwargs=data)

        if payload.lifestyle is not None:
            data = payload.lifestyle.model_dump(exclude_unset=True)
            if data:
                data["user_id"] = uid
                existing = (
                    db.query(LifestyleProfile)
                    .filter(LifestyleProfile.user_id == uid)
                    .first()
                )
                if existing is None:
                    defaults = {
                        "user_id": uid,
                        "sleep_time": "23:00",
                        "wake_time": "07:00",
                        "schedule_consistency": 3,
                        "study_hours": 3,
                        "noise_sleep_tolerance": 3,
                        "cleanliness": "clean",
                        "cleanliness_score": 3,
                        "cleanliness_importance": "important",
                        "privacy_preference": 3,
                        "talkativeness": 3,
                        "friendship_expectation": 3,
                        "gaming_hours": 0,
                        "smoking": "never",
                        "smoking_tolerance": "not_comfortable",
                        "drinking": "never",
                        "drinking_tolerance": "comfortable",
                        "pets": "no_pets",
                        "pet_tolerance": "comfortable",
                        "guest_frequency": "sometimes",
                        "guest_tolerance": "comfortable",
                        "cooking": "sometimes",
                        "cooking_tolerance": "comfortable",
                        "party_frequency": "rarely",
                        "party_tolerance": "comfortable",
                        "fitness": "sometimes",
                        "music": False,
                        "work_from_home": False,
                    }
                    defaults.update(data)
                    data = defaults
                _upsert(db, LifestyleProfile, user_id=uid, kwargs=data)

        if payload.preferences is not None:
            data = payload.preferences.model_dump(exclude_unset=True)
            if data:
                data["user_id"] = uid
                existing = (
                    db.query(RoommatePreference)
                    .filter(RoommatePreference.user_id == uid)
                    .first()
                )
                if existing is None:
                    defaults = {
                        "user_id": uid,
                        "preferred_gender": "any",
                        "min_age": 18,
                        "max_age": 35,
                        "social_style": "balanced",
                        "personal_space": "moderate",
                        "communication_style": "open_communication",
                        "issue_handling_importance": "important",
                        "household_responsibilities": "shared_equally",
                        "financial_responsibility": "very_important",
                        "deal_breakers": [],
                        "deal_breaker_other": None,
                        "smoking_tolerance": "not_comfortable",
                        "drinking_tolerance": "comfortable",
                        "pet_tolerance": "comfortable",
                        "cleanliness_requirement": "clean",
                        "preferred_sleep_schedule": "flexible",
                    }
                    defaults.update(data)
                    data = defaults
                _upsert(db, RoommatePreference, user_id=uid, kwargs=data)

        db.commit()

    except SQLAlchemyError as exc:
        db.rollback()
        raise RuntimeError(
            "An error occurred while saving partial onboarding progress."
        ) from exc

    progress = get_onboarding_progress(db, user=user)
    if progress is None:
        return OnboardingProgressResponse(is_complete=False)
    return progress


def get_onboarding(
    db: Session,
    *,
    user: User,
) -> OnboardingResponse | None:
    """
    Retrieve the complete onboarding state for the authenticated ``user``.
    Returns ``None`` if any of the five records is missing.
    """
    uid: UUID = user.id

    profile_record: UserProfile | None = (
        db.query(UserProfile).filter(UserProfile.user_id == uid).first()
    )
    location_record: Location | None = (
        db.query(Location).filter(Location.user_id == uid).first()
    )
    accommodation_record: AccommodationPreference | None = (
        db.query(AccommodationPreference)
        .filter(AccommodationPreference.user_id == uid)
        .first()
    )
    lifestyle_record: LifestyleProfile | None = (
        db.query(LifestyleProfile).filter(LifestyleProfile.user_id == uid).first()
    )
    preference_record: RoommatePreference | None = (
        db.query(RoommatePreference)
        .filter(RoommatePreference.user_id == uid)
        .first()
    )

    if any(
        r is None
        for r in (
            profile_record,
            location_record,
            accommodation_record,
            lifestyle_record,
            preference_record,
        )
    ):
        return None

    return OnboardingResponse(
        profile=ProfileResponse.model_validate(profile_record),
        location=LocationResponse.model_validate(location_record),
        accommodation=AccommodationResponse.model_validate(accommodation_record),
        lifestyle=LifestyleResponse.model_validate(lifestyle_record),
        preferences=PreferenceResponse.model_validate(preference_record),
    )


def get_onboarding_progress(
    db: Session,
    *,
    user: User,
) -> OnboardingProgressResponse | None:
    """
    Retrieve progressive onboarding state for the authenticated ``user``.
    Returns None if no records exist in any table.
    Otherwise returns OnboardingProgressResponse with whichever sections exist,
    and is_complete=True only if all five sections exist with required non-empty data.
    """
    uid: UUID = user.id

    profile_record: UserProfile | None = (
        db.query(UserProfile).filter(UserProfile.user_id == uid).first()
    )
    location_record: Location | None = (
        db.query(Location).filter(Location.user_id == uid).first()
    )
    accommodation_record: AccommodationPreference | None = (
        db.query(AccommodationPreference)
        .filter(AccommodationPreference.user_id == uid)
        .first()
    )
    lifestyle_record: LifestyleProfile | None = (
        db.query(LifestyleProfile).filter(LifestyleProfile.user_id == uid).first()
    )
    preference_record: RoommatePreference | None = (
        db.query(RoommatePreference)
        .filter(RoommatePreference.user_id == uid)
        .first()
    )

    if all(
        r is None
        for r in (
            profile_record,
            location_record,
            accommodation_record,
            lifestyle_record,
            preference_record,
        )
    ):
        return None

    is_complete = (
        profile_record is not None
        and bool(profile_record.first_name and profile_record.last_name and profile_record.occupation)
        and location_record is not None
        and bool(location_record.city and location_record.state)
        and accommodation_record is not None
        and bool(accommodation_record.move_in_timeframe)
        and lifestyle_record is not None
        and bool(lifestyle_record.sleep_time and lifestyle_record.wake_time)
        and bool(preference_record.min_age is not None)
    )

    return OnboardingProgressResponse(
        profile=ProfileResponse.model_validate(profile_record) if profile_record else None,
        location=LocationResponse.model_validate(location_record) if location_record else None,
        accommodation=AccommodationResponse.model_validate(accommodation_record) if accommodation_record else None,
        lifestyle=LifestyleResponse.model_validate(lifestyle_record) if lifestyle_record else None,
        preferences=PreferenceResponse.model_validate(preference_record) if preference_record else None,
        is_complete=is_complete,
    )
