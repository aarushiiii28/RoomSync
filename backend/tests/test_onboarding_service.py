"""
Service-level tests for app.services.onboarding (Phase 2, Step 6B).

Test strategy
-------------
The project's ORM models use PostgreSQL-specific types (CITEXT, native ENUM)
that SQLite does not support. Rather than fighting SQLAlchemy's DDL layer,
we create the five onboarding tables and the users table by executing raw
SQLite-compatible CREATE TABLE statements.

Tested scenarios
----------------
1.  New user → all FIVE records are created.
2.  All FIVE records carry the authenticated user's id.
3.  Re-calling create_or_update_onboarding → updates, never creates duplicates.
4.  Updating changes accommodation and profile field values.
5.  Pydantic cross-field validation (min_age > max_age, budget_min > budget_max) fires.
6.  SQLAlchemyError → rollback of all 5 records + RuntimeError.
7.  Client cannot control another user's data via payload manipulation.
8.  Response contains all FIVE expected sections with UUID ids.
9.  get_onboarding returns None when any record is absent.
10. get_onboarding returns full OnboardingResponse with accommodation when records exist.
"""

from __future__ import annotations

import sys
import unittest
from uuid import UUID, uuid4

from sqlalchemy import create_engine, event, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

# ---------------------------------------------------------------------------
# Import ORM models to register them on Base.metadata.
# ---------------------------------------------------------------------------
import app.models  # noqa: F401

from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.location import Location
from app.models.accommodation_preference import AccommodationPreference
from app.models.lifestyle_profile import LifestyleProfile
from app.models.roommate_preference import RoommatePreference

from app.schemas.profile import ProfileCreate
from app.schemas.location import LocationCreate
from app.schemas.onboarding import (
    OnboardingCreate,
    OnboardingPartialUpdate,
    OnboardingProgressResponse,
    OnboardingResponse,
)
from app.services.onboarding import (
    create_or_update_onboarding,
    get_onboarding,
    get_onboarding_progress,
    save_partial_onboarding,
)

# ---------------------------------------------------------------------------
# SQLite in-memory engine
# ---------------------------------------------------------------------------

_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
)


@event.listens_for(_engine, "connect")
def _enable_fk(dbapi_connection, _record):
    cur = dbapi_connection.cursor()
    cur.execute("PRAGMA foreign_keys=ON")
    cur.close()


# ---------------------------------------------------------------------------
# Create the schema with SQLite-compatible DDL
# ---------------------------------------------------------------------------

_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    username    TEXT NOT NULL UNIQUE,
    email       TEXT,
    password_hash TEXT NOT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    date_of_birth   TEXT NOT NULL,
    gender          TEXT NOT NULL,
    occupation      TEXT NOT NULL,
    bio             TEXT,
    profile_photo_url TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS locations (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    country         TEXT NOT NULL,
    state           TEXT NOT NULL,
    city            TEXT NOT NULL,
    locality        TEXT NOT NULL,
    pincode         TEXT NOT NULL,
    latitude        REAL NOT NULL,
    longitude       REAL NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS accommodation_preferences (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accommodation_type  TEXT NOT NULL,
    room_type           TEXT NOT NULL,
    move_in_timeframe   TEXT NOT NULL,
    lease_duration      TEXT NOT NULL,
    budget_min          REAL NOT NULL,
    budget_max          REAL NOT NULL,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS lifestyle_profiles (
    id                      TEXT PRIMARY KEY,
    user_id                 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sleep_time              TEXT NOT NULL,
    wake_time               TEXT NOT NULL,
    schedule_consistency   INTEGER NOT NULL DEFAULT 3,
    study_hours             INTEGER NOT NULL DEFAULT 3,
    noise_sleep_tolerance   INTEGER NOT NULL DEFAULT 3,
    cleanliness             TEXT NOT NULL,
    cleanliness_score       INTEGER NOT NULL DEFAULT 3,
    cleanliness_importance  TEXT NOT NULL DEFAULT 'important',
    privacy_preference      INTEGER NOT NULL DEFAULT 3,
    talkativeness           INTEGER NOT NULL DEFAULT 3,
    friendship_expectation  INTEGER NOT NULL DEFAULT 3,
    gaming_hours            INTEGER NOT NULL DEFAULT 0,
    smoking                 TEXT NOT NULL,
    smoking_tolerance       TEXT NOT NULL DEFAULT 'not_comfortable',
    drinking                TEXT NOT NULL,
    drinking_tolerance      TEXT NOT NULL DEFAULT 'comfortable',
    pets                    TEXT NOT NULL,
    pet_tolerance           TEXT NOT NULL DEFAULT 'comfortable',
    guest_frequency         TEXT NOT NULL,
    guest_tolerance         TEXT NOT NULL DEFAULT 'comfortable',
    cooking                 TEXT NOT NULL,
    cooking_tolerance       TEXT NOT NULL DEFAULT 'comfortable',
    party_frequency         TEXT NOT NULL,
    party_tolerance         TEXT NOT NULL DEFAULT 'comfortable',
    fitness                 TEXT NOT NULL,
    music                   INTEGER NOT NULL DEFAULT 0,
    work_from_home          INTEGER NOT NULL DEFAULT 0,
    created_at              TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at              TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS roommate_preferences (
    id                          TEXT PRIMARY KEY,
    user_id                     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_gender            TEXT NOT NULL,
    min_age                     INTEGER NOT NULL,
    max_age                     INTEGER NOT NULL,
    budget_min                  REAL NOT NULL,
    budget_max                  REAL NOT NULL,
    social_style                TEXT NOT NULL DEFAULT 'balanced',
    personal_space              TEXT NOT NULL DEFAULT 'moderate',
    communication_style         TEXT NOT NULL DEFAULT 'open_communication',
    issue_handling_importance   TEXT NOT NULL DEFAULT 'important',
    household_responsibilities  TEXT NOT NULL DEFAULT 'shared_equally',
    financial_responsibility    TEXT NOT NULL DEFAULT 'very_important',
    deal_breakers               TEXT NOT NULL DEFAULT '[]',
    deal_breaker_other          TEXT,
    smoking_tolerance           TEXT NOT NULL DEFAULT 'not_comfortable',
    drinking_tolerance          TEXT NOT NULL DEFAULT 'comfortable',
    pet_tolerance               TEXT NOT NULL DEFAULT 'comfortable',
    cleanliness_requirement     TEXT NOT NULL DEFAULT 'clean',
    preferred_sleep_schedule    TEXT NOT NULL DEFAULT 'flexible',
    created_at                  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at                  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
);
"""

with _engine.connect() as _conn:
    for _stmt in _SCHEMA_SQL.strip().split(";"):
        _stmt = _stmt.strip()
        if _stmt:
            _conn.execute(text(_stmt))
    _conn.commit()

_SessionFactory = sessionmaker(bind=_engine, autocommit=False, autoflush=False)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_ONBOARDING_PAYLOAD = dict(
    profile=dict(
        first_name="Aarushi",
        last_name="Gupta",
        date_of_birth="2000-05-15",
        gender="female",
        occupation="Software Engineer",
        bio="Loves hiking.",
        profile_photo_url=None,
    ),
    location=dict(
        country="India",
        state="Karnataka",
        city="Bengaluru",
        locality="Koramangala",
        pincode="560034",
        latitude="12.934594",
        longitude="77.610473",
    ),
    accommodation=dict(
        accommodation_type="apartment",
        room_type="private",
        move_in_timeframe="within_1_month",
        lease_duration="6_months",
        budget_min="8000.00",
        budget_max="16000.00",
    ),
    lifestyle=dict(
        sleep_time="23:00",
        wake_time="07:00",
        cleanliness="clean",
        smoking="never",
        drinking="occasionally",
        pets="no_pets",
        guest_frequency="sometimes",
        cooking="often",
        party_frequency="rarely",
        fitness="sometimes",
        music=False,
        work_from_home=True,
    ),
    preferences=dict(
        preferred_gender="any",
        min_age=20,
        max_age=30,
        budget_min="5000.00",
        budget_max="15000.00",
        social_style="balanced",
        personal_space="moderate",
        communication_style="open_communication",
        issue_handling_importance="important",
        household_responsibilities="shared_equally",
        financial_responsibility="very_important",
        deal_breakers=["loud_noise", "unreliable_payments"],
        deal_breaker_other=None,
        smoking_tolerance="not_comfortable",
        drinking_tolerance="comfortable",
        pet_tolerance="comfortable",
        cleanliness_requirement="clean",
        preferred_sleep_schedule="night_owl",
    ),
)


def _make_user(db: Session) -> User:
    """Insert a minimal User row directly via ORM and return it."""
    u = User(
        id=uuid4(),
        username=f"testuser_{uuid4().hex[:8]}",
        email=None,
        password_hash="fakehash",
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _build_payload(**overrides) -> OnboardingCreate:
    """Return an OnboardingCreate built from the base payload with optional overrides."""
    import copy
    data = copy.deepcopy(_ONBOARDING_PAYLOAD)
    for section, fields in overrides.items():
        data[section].update(fields)
    return OnboardingCreate(**data)


# ---------------------------------------------------------------------------
# Test case
# ---------------------------------------------------------------------------

class TestOnboardingService(unittest.TestCase):
    """Integration tests for create_or_update_onboarding and get_onboarding."""

    def setUp(self):
        self.db: Session = _SessionFactory()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    # ------------------------------------------------------------------
    # 1. New user → all five records created
    # ------------------------------------------------------------------
    def test_01_create_all_five_records(self):
        user = _make_user(self.db)
        payload = _build_payload()

        response = create_or_update_onboarding(self.db, user=user, payload=payload)

        self.assertIsInstance(response, OnboardingResponse)
        self.assertEqual(response.profile.first_name, "Aarushi")
        self.assertEqual(response.location.city, "Bengaluru")
        self.assertEqual(response.accommodation.accommodation_type.value, "apartment")
        self.assertEqual(response.accommodation.room_type.value, "private")
        self.assertEqual(response.lifestyle.cleanliness.value, "clean")
        self.assertEqual(response.preferences.preferred_gender.value, "any")

    # ------------------------------------------------------------------
    # 2. All five records carry the authenticated user's id
    # ------------------------------------------------------------------
    def test_02_records_belong_to_authenticated_user(self):
        user = _make_user(self.db)
        payload = _build_payload()

        response = create_or_update_onboarding(self.db, user=user, payload=payload)

        self.assertEqual(response.profile.user_id, user.id)
        self.assertEqual(response.location.user_id, user.id)
        self.assertEqual(response.accommodation.user_id, user.id)
        self.assertEqual(response.lifestyle.user_id, user.id)
        self.assertEqual(response.preferences.user_id, user.id)

    # ------------------------------------------------------------------
    # 3. Idempotency — re-calling updates, never creates duplicates
    # ------------------------------------------------------------------
    def test_03_idempotent_no_duplicate_records(self):
        user = _make_user(self.db)
        payload = _build_payload()

        create_or_update_onboarding(self.db, user=user, payload=payload)
        create_or_update_onboarding(self.db, user=user, payload=payload)

        for model_cls in (
            UserProfile,
            Location,
            AccommodationPreference,
            LifestyleProfile,
            RoommatePreference,
        ):
            count = (
                self.db.query(model_cls)
                .filter(model_cls.user_id == user.id)
                .count()
            )
            self.assertEqual(count, 1, f"Expected 1 {model_cls.__name__}, got {count}")

    # ------------------------------------------------------------------
    # 4. Update changes the field values
    # ------------------------------------------------------------------
    def test_04_update_changes_field_value(self):
        user = _make_user(self.db)
        create_or_update_onboarding(self.db, user=user, payload=_build_payload())

        payload_v2 = _build_payload(
            profile={"occupation": "Data Scientist"},
            accommodation={"accommodation_type": "flat", "budget_max": "20000.00"},
        )
        response2 = create_or_update_onboarding(self.db, user=user, payload=payload_v2)

        self.assertEqual(response2.profile.occupation, "Data Scientist")
        self.assertEqual(response2.accommodation.accommodation_type.value, "flat")

    # ------------------------------------------------------------------
    # 5. Pydantic cross-field validation fires before the service
    # ------------------------------------------------------------------
    def test_05_pydantic_cross_field_validations(self):
        from pydantic import ValidationError

        # min_age > max_age
        with self.assertRaises(ValidationError):
            _build_payload(preferences={"min_age": 40, "max_age": 25})

        # accommodation budget_min > budget_max
        with self.assertRaises(ValidationError):
            _build_payload(accommodation={"budget_min": "15000.00", "budget_max": "10000.00"})

    # ------------------------------------------------------------------
    # 6. SQLAlchemyError → rollback of all 5 records + RuntimeError
    # ------------------------------------------------------------------
    def test_06_sqlalchemy_error_triggers_rollback_and_runtime_error(self):
        user = _make_user(self.db)
        payload = _build_payload()

        original_commit = self.db.commit

        def _bad_commit():
            raise SQLAlchemyError("simulated DB failure")

        self.db.commit = _bad_commit

        with self.assertRaises(RuntimeError) as ctx:
            create_or_update_onboarding(self.db, user=user, payload=payload)

        self.assertIn("onboarding", str(ctx.exception).lower())

        self.db.commit = original_commit

        # After rollback, no records should persist
        for model_cls in (
            UserProfile,
            Location,
            AccommodationPreference,
            LifestyleProfile,
            RoommatePreference,
        ):
            count = (
                self.db.query(model_cls)
                .filter(model_cls.user_id == user.id)
                .count()
            )
            self.assertEqual(count, 0)

    # ------------------------------------------------------------------
    # 7. Client cannot hijack another user's data via payload
    # ------------------------------------------------------------------
    def test_07_payload_cannot_override_user_id(self):
        user_a = _make_user(self.db)
        user_b = _make_user(self.db)

        payload = _build_payload()
        create_or_update_onboarding(self.db, user=user_a, payload=payload)

        # user_b should still have no profile or accommodation
        profile_b = (
            self.db.query(UserProfile)
            .filter(UserProfile.user_id == user_b.id)
            .first()
        )
        self.assertIsNone(profile_b)
        accom_b = (
            self.db.query(AccommodationPreference)
            .filter(AccommodationPreference.user_id == user_b.id)
            .first()
        )
        self.assertIsNone(accom_b)

        # user_a should have exactly one
        profile_a = (
            self.db.query(UserProfile)
            .filter(UserProfile.user_id == user_a.id)
            .first()
        )
        self.assertIsNotNone(profile_a)

    # ------------------------------------------------------------------
    # 8. Response contains all FIVE sections with valid UUIDs
    # ------------------------------------------------------------------
    def test_08_response_contains_all_five_sections(self):
        user = _make_user(self.db)
        response = create_or_update_onboarding(
            self.db, user=user, payload=_build_payload()
        )

        for attr in ("profile", "location", "accommodation", "lifestyle", "preferences"):
            section = getattr(response, attr)
            self.assertIsNotNone(section, f"'{attr}' section is None")
            self.assertIsInstance(
                section.id, UUID, f"'{attr}.id' is not a UUID"
            )

    # ------------------------------------------------------------------
    # 9. get_onboarding returns None when records are absent
    # ------------------------------------------------------------------
    def test_09_get_onboarding_returns_none_when_incomplete(self):
        user = _make_user(self.db)
        result = get_onboarding(self.db, user=user)
        self.assertIsNone(result)

    # ------------------------------------------------------------------
    # 10. get_onboarding returns full response after creation
    # ------------------------------------------------------------------
    def test_10_get_onboarding_returns_full_response(self):
        user = _make_user(self.db)
        create_or_update_onboarding(self.db, user=user, payload=_build_payload())

        result = get_onboarding(self.db, user=user)

        self.assertIsNotNone(result)
        self.assertIsInstance(result, OnboardingResponse)
        self.assertEqual(result.profile.user_id, user.id)
        self.assertEqual(result.location.city, "Bengaluru")
        self.assertEqual(result.accommodation.accommodation_type.value, "apartment")
        self.assertEqual(result.lifestyle.work_from_home, True)

    # ------------------------------------------------------------------
    # 11. save_partial_onboarding with Step 1 (Profile only)
    # ------------------------------------------------------------------
    def test_11_save_partial_step_1_profile_only(self):
        user = _make_user(self.db)
        profile_data = ProfileCreate(
            first_name="Aarushi",
            last_name="Sharma",
            date_of_birth="2002-01-15",
            gender="female",
            occupation="Designer",
            bio="Love art.",
        )
        patch_payload = OnboardingPartialUpdate(profile=profile_data)
        progress = save_partial_onboarding(self.db, user=user, payload=patch_payload)

        self.assertIsInstance(progress, OnboardingProgressResponse)
        self.assertFalse(progress.is_complete)
        self.assertIsNotNone(progress.profile)
        self.assertEqual(progress.profile.first_name, "Aarushi")
        self.assertIsNone(progress.location)
        self.assertIsNone(progress.accommodation)

        # Confirm in DB
        db_profile = self.db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        self.assertIsNotNone(db_profile)
        self.assertEqual(db_profile.occupation, "Designer")

    # ------------------------------------------------------------------
    # 12. save_partial_onboarding with Steps 1 + 2 (Profile + Location)
    # ------------------------------------------------------------------
    def test_12_save_partial_step_1_and_2(self):
        user = _make_user(self.db)
        patch_payload = OnboardingPartialUpdate(
            profile=ProfileCreate(
                first_name="Rohan",
                last_name="Verma",
                date_of_birth="1999-08-20",
                gender="male",
                occupation="Developer",
            ),
            location=LocationCreate(
                country="India",
                state="Karnataka",
                city="Bengaluru",
                locality="Indiranagar",
                pincode="560038",
                latitude="12.9784",
                longitude="77.6408",
            ),
        )
        progress = save_partial_onboarding(self.db, user=user, payload=patch_payload)

        self.assertFalse(progress.is_complete)
        self.assertIsNotNone(progress.profile)
        self.assertIsNotNone(progress.location)
        self.assertEqual(progress.location.locality, "Indiranagar")
        self.assertIsNone(progress.accommodation)

    # ------------------------------------------------------------------
    # 13. save_partial_onboarding updates existing records without duplication
    # ------------------------------------------------------------------
    def test_13_save_partial_updates_existing_records_without_duplicates(self):
        user = _make_user(self.db)
        # First save Step 1
        save_partial_onboarding(
            self.db,
            user=user,
            payload=OnboardingPartialUpdate(
                profile=ProfileCreate(
                    first_name="Priya",
                    last_name="Nair",
                    date_of_birth="2001-03-10",
                    gender="female",
                    occupation="Intern",
                )
            ),
        )
        # Now update Step 1 occupation
        save_partial_onboarding(
            self.db,
            user=user,
            payload=OnboardingPartialUpdate(
                profile=ProfileCreate(
                    first_name="Priya",
                    last_name="Nair",
                    date_of_birth="2001-03-10",
                    gender="female",
                    occupation="Product Manager",
                )
            ),
        )

        count = self.db.query(UserProfile).filter(UserProfile.user_id == user.id).count()
        self.assertEqual(count, 1)

        db_profile = self.db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        self.assertEqual(db_profile.occupation, "Product Manager")

    # ------------------------------------------------------------------
    # 14. get_onboarding_progress retrieves partial progress
    # ------------------------------------------------------------------
    def test_14_get_onboarding_progress_retrieves_partial_state(self):
        user = _make_user(self.db)
        save_partial_onboarding(
            self.db,
            user=user,
            payload=OnboardingPartialUpdate(
                profile=ProfileCreate(
                    first_name="Amit",
                    last_name="Patel",
                    date_of_birth="1998-11-25",
                    gender="male",
                    occupation="Doctor",
                )
            ),
        )
        progress = get_onboarding_progress(self.db, user=user)
        self.assertIsNotNone(progress)
        self.assertFalse(progress.is_complete)
        self.assertEqual(progress.profile.first_name, "Amit")

    # ------------------------------------------------------------------
    # 15. get_onboarding_progress returns None if no records exist
    # ------------------------------------------------------------------
    def test_15_get_onboarding_progress_returns_none_when_empty(self):
        user = _make_user(self.db)
        progress = get_onboarding_progress(self.db, user=user)
        self.assertIsNone(progress)

    # ------------------------------------------------------------------
    # 16. partial save rollback on DB failure
    # ------------------------------------------------------------------
    def test_16_partial_save_rollback_on_error(self):
        user = _make_user(self.db)

        def bad_commit():
            raise SQLAlchemyError("Simulated write error")

        original_commit = self.db.commit
        self.db.commit = bad_commit
        try:
            with self.assertRaises(RuntimeError):
                save_partial_onboarding(
                    self.db,
                    user=user,
                    payload=OnboardingPartialUpdate(
                        profile=ProfileCreate(
                            first_name="Fail",
                            last_name="User",
                            date_of_birth="2000-01-01",
                            gender="female",
                            occupation="Tester",
                        )
                    ),
                )
        finally:
            self.db.commit = original_commit

    def test_17_lifestyle_tolerance_fields_persisted(self):
        """Tolerance and importance fields in LifestyleProfile are saved and retrieved correctly."""
        from app.models.enums import ImportanceLevel, ToleranceLevel
        user = _make_user(self.db)
        payload = _build_payload()
        payload.lifestyle.cleanliness_importance = ImportanceLevel.very_important
        payload.lifestyle.smoking_tolerance = ToleranceLevel.very_comfortable
        payload.lifestyle.cooking_tolerance = ToleranceLevel.slightly_comfortable

        result = create_or_update_onboarding(self.db, user=user, payload=payload)
        self.assertEqual(result.lifestyle.cleanliness_importance, ImportanceLevel.very_important)
        self.assertEqual(result.lifestyle.smoking_tolerance, ToleranceLevel.very_comfortable)
        self.assertEqual(result.lifestyle.cooking_tolerance, ToleranceLevel.slightly_comfortable)

    def test_18_invalid_tolerance_value_rejected(self):
        """Invalid tolerance string raises validation error in Pydantic."""
        from pydantic import ValidationError
        from app.schemas.lifestyle import LifestyleCreate
        with self.assertRaises(ValidationError):
            LifestyleCreate(
                sleep_time="23:00",
                wake_time="07:00",
                cleanliness="clean",
                cleanliness_importance="invalid_importance",
                smoking="never",
                smoking_tolerance="invalid_tolerance",
                drinking="never",
                drinking_tolerance="comfortable",
                pets="no_pets",
                pet_tolerance="comfortable",
                guest_frequency="sometimes",
                guest_tolerance="comfortable",
                cooking="sometimes",
                cooking_tolerance="comfortable",
                party_frequency="rarely",
                music=False,
                work_from_home=True,
            )

    def test_19_roommate_preference_tolerances_persisted(self):
        """Tolerance fields in RoommatePreference are saved and retrieved correctly."""
        from app.models.enums import ToleranceLevel
        user = _make_user(self.db)
        payload = _build_payload()
        payload.preferences.smoking_tolerance = ToleranceLevel.very_comfortable
        payload.preferences.drinking_tolerance = ToleranceLevel.not_comfortable
        payload.preferences.pet_tolerance = ToleranceLevel.slightly_comfortable

        result = create_or_update_onboarding(self.db, user=user, payload=payload)
        self.assertEqual(result.preferences.smoking_tolerance, ToleranceLevel.very_comfortable)
        self.assertEqual(result.preferences.drinking_tolerance, ToleranceLevel.not_comfortable)
        self.assertEqual(result.preferences.pet_tolerance, ToleranceLevel.slightly_comfortable)

    def test_20_roommate_compatibility_and_dealbreakers_persisted(self):
        """Social style, boundaries, communication, responsibilities, and deal-breakers are saved."""
        from app.models.enums import (
            CommunicationStyle,
            HouseholdResponsibilityPreference,
            ImportanceLevel,
            PersonalSpacePreference,
            SocialStyle,
        )
        user = _make_user(self.db)
        payload = _build_payload()
        payload.preferences.social_style = SocialStyle.very_social
        payload.preferences.personal_space = PersonalSpacePreference.a_lot
        payload.preferences.communication_style = CommunicationStyle.very_communicative
        payload.preferences.issue_handling_importance = ImportanceLevel.very_important
        payload.preferences.household_responsibilities = HouseholdResponsibilityPreference.clearly_divided
        payload.preferences.financial_responsibility = ImportanceLevel.very_important
        payload.preferences.deal_breakers = ["loud_noise", "lack_of_privacy", "other"]
        payload.preferences.deal_breaker_other = "Smoking indoors"

        result = create_or_update_onboarding(self.db, user=user, payload=payload)
        self.assertEqual(result.preferences.social_style, SocialStyle.very_social)
        self.assertEqual(result.preferences.personal_space, PersonalSpacePreference.a_lot)
        self.assertEqual(result.preferences.communication_style, CommunicationStyle.very_communicative)
        self.assertEqual(result.preferences.issue_handling_importance, ImportanceLevel.very_important)
        self.assertEqual(result.preferences.household_responsibilities, HouseholdResponsibilityPreference.clearly_divided)
        self.assertEqual(result.preferences.financial_responsibility, ImportanceLevel.very_important)
        self.assertEqual(result.preferences.deal_breakers, ["loud_noise", "lack_of_privacy", "other"])
        self.assertEqual(result.preferences.deal_breaker_other, "Smoking indoors")

    # ------------------------------------------------------------------
    # 18. Location validation rejects inconsistent city/state
    # ------------------------------------------------------------------
    def test_18_location_validation_rejects_inconsistent_city_state(self):
        from pydantic import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            LocationCreate(
                country="India",
                state="Bihar",
                city="Mumbai",
                locality="Kankarbagh",
                pincode="800020",
                latitude="25.5941",
                longitude="85.1376",
            )
        self.assertIn("Mumbai is not a city in Bihar", str(ctx.exception))

    # ------------------------------------------------------------------
    # 19. Location validation rejects invalid PIN code prefix for state
    # ------------------------------------------------------------------
    def test_19_location_validation_rejects_invalid_pincode_prefix(self):
        from pydantic import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            LocationCreate(
                country="India",
                state="Bihar",
                city="Patna",
                locality="Kankarbagh",
                pincode="400053",  # 4 is Maharashtra, Bihar requires 8
                latitude="25.5941",
                longitude="85.1376",
            )
        self.assertIn("PIN code for Bihar must begin with 8", str(ctx.exception))

    # ------------------------------------------------------------------
    # 20. Location validation accepts valid hierarchy
    # ------------------------------------------------------------------
    def test_20_location_validation_accepts_valid_hierarchy(self):
        loc = LocationCreate(
            country="India",
            state="Maharashtra",
            city="Mumbai",
            locality="Andheri West",
            pincode="400053",
            latitude="19.0760",
            longitude="72.8777",
        )
        self.assertEqual(loc.city, "Mumbai")
        self.assertEqual(loc.state, "Maharashtra")


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestOnboardingService)
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
