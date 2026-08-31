"""
Unit tests specifically validating Deal-Breakers filtering logic,
directionality, None-safety, and retrieval formatting for "Why This Match".
"""

from __future__ import annotations

from datetime import date, time
import unittest
from uuid import uuid4
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.accommodation_preference import AccommodationPreference
from app.models.lifestyle_profile import LifestyleProfile
from app.models.roommate_preference import RoommatePreference
from app.models.enums import (
    GenderEnum,
    GenderPreference,
    AccommodationType,
    RoomType,
    MoveInTimeframe,
    LeaseDuration,
    SmokingHabit,
    DrinkingHabit,
    PetOwnership,
    FrequencyLevel,
    CleanlinessLevel,
    FitnessLevel,
    ImportanceLevel,
    ToleranceLevel,
    SocialStyle,
    PersonalSpacePreference,
    CommunicationStyle,
    HouseholdResponsibilityPreference,
)
from app.services.matching import is_authorized_match
from app.services.why_this_match_retrieval import get_deal_breakers_a

_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
)

@event.listens_for(_engine, "connect")
def _enable_fk(dbapi_connection, _record):
    cur = dbapi_connection.cursor()
    cur.execute("PRAGMA foreign_keys=ON")
    cur.close()

_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    cognito_sub TEXT UNIQUE,
    password_hash TEXT,
    email_verified INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    gender TEXT NOT NULL,
    occupation TEXT NOT NULL,
    bio TEXT,
    roommate_expectations TEXT,
    profile_photo_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accommodation_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accommodation_type TEXT NOT NULL,
    room_type TEXT NOT NULL,
    move_in_timeframe TEXT NOT NULL,
    lease_duration TEXT NOT NULL,
    budget_min REAL NOT NULL,
    budget_max REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lifestyle_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sleep_time TEXT NOT NULL,
    wake_time TEXT NOT NULL,
    schedule_consistency INTEGER NOT NULL DEFAULT 3,
    study_hours INTEGER NOT NULL DEFAULT 3,
    noise_sleep_tolerance INTEGER NOT NULL DEFAULT 3,
    cleanliness TEXT NOT NULL,
    cleanliness_score INTEGER NOT NULL DEFAULT 3,
    cleanliness_importance TEXT NOT NULL DEFAULT 'important',
    privacy_preference INTEGER NOT NULL DEFAULT 3,
    talkativeness INTEGER NOT NULL DEFAULT 3,
    friendship_expectation INTEGER NOT NULL DEFAULT 3,
    gaming_hours INTEGER NOT NULL DEFAULT 0,
    smoking TEXT NOT NULL,
    smoking_tolerance TEXT NOT NULL DEFAULT 'not_comfortable',
    drinking TEXT NOT NULL,
    drinking_tolerance TEXT NOT NULL DEFAULT 'comfortable',
    pets TEXT NOT NULL,
    pet_tolerance TEXT NOT NULL DEFAULT 'comfortable',
    guest_frequency TEXT NOT NULL DEFAULT 'sometimes',
    guest_tolerance TEXT NOT NULL DEFAULT 'comfortable',
    cooking TEXT NOT NULL DEFAULT 'sometimes',
    cooking_tolerance TEXT NOT NULL DEFAULT 'comfortable',
    party_frequency TEXT NOT NULL DEFAULT 'rarely',
    party_tolerance TEXT NOT NULL DEFAULT 'comfortable',
    fitness TEXT NOT NULL DEFAULT 'sometimes',
    music INTEGER NOT NULL DEFAULT 0,
    work_from_home INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS roommate_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_gender TEXT NOT NULL,
    min_age INTEGER NOT NULL,
    max_age INTEGER NOT NULL,
    social_style TEXT NOT NULL DEFAULT 'balanced',
    personal_space TEXT NOT NULL DEFAULT 'moderate',
    communication_style TEXT NOT NULL DEFAULT 'open_communication',
    issue_handling_importance TEXT NOT NULL DEFAULT 'important',
    household_responsibilities TEXT NOT NULL DEFAULT 'shared_equally',
    financial_responsibility TEXT NOT NULL DEFAULT 'very_important',
    deal_breakers TEXT NOT NULL DEFAULT '[]',
    deal_breaker_other TEXT,
    smoking_tolerance TEXT NOT NULL DEFAULT 'not_comfortable',
    drinking_tolerance TEXT NOT NULL DEFAULT 'comfortable',
    pet_tolerance TEXT NOT NULL DEFAULT 'comfortable',
    cleanliness_requirement TEXT NOT NULL DEFAULT 'clean',
    preferred_sleep_schedule TEXT NOT NULL DEFAULT 'flexible',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"""

_SessionFactory = sessionmaker(bind=_engine, autocommit=False, autoflush=False)


def _init_db():
    with _engine.begin() as conn:
        for stmt in _SCHEMA_SQL.strip().split(";"):
            stmt = stmt.strip()
            if stmt:
                conn.execute(text(stmt))


_init_db()


class TestDealBreakersAndMatching(unittest.TestCase):
    def setUp(self):
        self.db = _SessionFactory()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def _create_user(
        self,
        gender="female",
        preferred_gender="any",
        deal_breakers=None,
        deal_breaker_other=None,
        smoking=SmokingHabit.never,
        drinking=DrinkingHabit.never,
        pets=PetOwnership.no_pets,
        guest_frequency=FrequencyLevel.sometimes,
        cleanliness=CleanlinessLevel.clean,
    ) -> User:
        uid = uuid4()
        user = User(
            id=uid,
            username=f"user_{uid.hex[:8]}",
            email=f"{uid.hex[:8]}@example.com",
            is_active=True,
        )
        self.db.add(user)
        self.db.flush()

        profile = UserProfile(
            id=uuid4(),
            user_id=uid,
            first_name="Test",
            last_name="User",
            date_of_birth=date(2000, 1, 1),
            gender=GenderEnum(gender),
            occupation="Student",
        )
        self.db.add(profile)

        pref = RoommatePreference(
            id=uuid4(),
            user_id=uid,
            preferred_gender=GenderPreference(preferred_gender),
            min_age=18,
            max_age=30,
            deal_breakers=deal_breakers or [],
            deal_breaker_other=deal_breaker_other,
        )
        self.db.add(pref)

        lifestyle = LifestyleProfile(
            id=uuid4(),
            user_id=uid,
            sleep_time=time(23, 0),
            wake_time=time(7, 0),
            smoking=smoking,
            drinking=drinking,
            pets=pets,
            guest_frequency=guest_frequency,
            cleanliness=cleanliness,
            cooking=FrequencyLevel.sometimes,
            party_frequency=FrequencyLevel.rarely,
            fitness=FitnessLevel.sometimes,
        )
        self.db.add(lifestyle)

        acc = AccommodationPreference(
            id=uuid4(),
            user_id=uid,
            accommodation_type=AccommodationType.flat,
            room_type=RoomType.private,
            move_in_timeframe=MoveInTimeframe.within_1_month,
            lease_duration=LeaseDuration.six_months,
            budget_min=5000,
            budget_max=15000,
        )
        self.db.add(acc)
        self.db.commit()
        self.db.refresh(user)
        return user

    def test_smoking_deal_breaker_filtering(self):
        user_a = self._create_user(deal_breakers=["smoking"])
        candidate_reg = self._create_user(smoking=SmokingHabit.regularly)
        candidate_occ = self._create_user(smoking=SmokingHabit.occasionally)
        candidate_never = self._create_user(smoking=SmokingHabit.never)

        self.assertFalse(is_authorized_match(user_a, candidate_reg))
        self.assertFalse(is_authorized_match(user_a, candidate_occ))
        self.assertTrue(is_authorized_match(user_a, candidate_never))

    def test_drinking_deal_breaker_filtering(self):
        user_a = self._create_user(deal_breakers=["drinking"])
        candidate_reg = self._create_user(drinking=DrinkingHabit.regularly)
        candidate_occ = self._create_user(drinking=DrinkingHabit.occasionally)
        candidate_never = self._create_user(drinking=DrinkingHabit.never)

        self.assertFalse(is_authorized_match(user_a, candidate_reg))
        self.assertTrue(is_authorized_match(user_a, candidate_occ))
        self.assertTrue(is_authorized_match(user_a, candidate_never))

    def test_pets_deal_breaker_filtering(self):
        user_a = self._create_user(deal_breakers=["pets"])
        candidate_pets = self._create_user(pets=PetOwnership.has_pets)
        candidate_no_pets = self._create_user(pets=PetOwnership.no_pets)

        self.assertFalse(is_authorized_match(user_a, candidate_pets))
        self.assertTrue(is_authorized_match(user_a, candidate_no_pets))

    def test_frequent_visitors_deal_breaker_filtering(self):
        user_a = self._create_user(deal_breakers=["frequent_visitors"])
        candidate_often = self._create_user(guest_frequency=FrequencyLevel.often)
        candidate_always = self._create_user(guest_frequency=FrequencyLevel.always)
        candidate_sometimes = self._create_user(guest_frequency=FrequencyLevel.sometimes)

        self.assertFalse(is_authorized_match(user_a, candidate_often))
        self.assertFalse(is_authorized_match(user_a, candidate_always))
        self.assertTrue(is_authorized_match(user_a, candidate_sometimes))

    def test_untidy_living_deal_breaker_filtering(self):
        user_a = self._create_user(deal_breakers=["untidy_living"])
        candidate_relaxed = self._create_user(cleanliness=CleanlinessLevel.relaxed)
        candidate_moderate = self._create_user(cleanliness=CleanlinessLevel.moderate)
        candidate_clean = self._create_user(cleanliness=CleanlinessLevel.clean)

        self.assertFalse(is_authorized_match(user_a, candidate_relaxed))
        self.assertTrue(is_authorized_match(user_a, candidate_moderate))
        self.assertTrue(is_authorized_match(user_a, candidate_clean))

    def test_deal_breaker_directionality(self):
        """
        User A has 'smoking' deal-breaker and is a non-smoker.
        User B is a regular smoker with NO deal-breakers.
        is_authorized_match(User A, User B) must be False (B violates A's deal-breaker).
        is_authorized_match(User B, User A) must be True (A does not violate any of B's preferences).
        """
        user_a = self._create_user(deal_breakers=["smoking"], smoking=SmokingHabit.never)
        user_b = self._create_user(deal_breakers=[], smoking=SmokingHabit.regularly)

        self.assertFalse(is_authorized_match(user_a, user_b))
        self.assertTrue(is_authorized_match(user_b, user_a))

    def test_none_safety_and_partial_profiles(self):
        """Ensure missing lifestyle or preference fields do not crash is_authorized_match."""
        user_a = self._create_user(deal_breakers=["smoking"])

        # User B with matching accommodation but NO lifestyle profile
        uid = uuid4()
        user_b = User(id=uid, username=f"user_{uid.hex[:8]}", email=f"{uid.hex[:8]}@example.com")
        self.db.add(user_b)
        self.db.flush()

        prof_b = UserProfile(
            id=uuid4(),
            user_id=uid,
            first_name="Partial",
            last_name="User",
            date_of_birth=date(2000, 1, 1),
            gender=GenderEnum.female,
            occupation="Student",
        )
        self.db.add(prof_b)

        acc_b = AccommodationPreference(
            id=uuid4(),
            user_id=uid,
            accommodation_type=AccommodationType.flat,
            room_type=RoomType.private,
            move_in_timeframe=MoveInTimeframe.within_1_month,
            lease_duration=LeaseDuration.six_months,
            budget_min=5000,
            budget_max=15000,
        )
        self.db.add(acc_b)
        self.db.commit()
        self.db.refresh(user_b)

        # Should not crash, returns True since accommodation and gender match and dealbreakers don't trigger
        self.assertTrue(is_authorized_match(user_a, user_b))

    def test_get_deal_breakers_a_retrieval(self):
        """Verify retrieval translates slugs to human-readable strings and appends 'other' text."""
        user = self._create_user(
            deal_breakers=["smoking", "pets", "other"],
            deal_breaker_other="No loud instruments after 10pm",
        )
        labels = get_deal_breakers_a(self.db, user.id)
        
        self.assertEqual(
            labels,
            [
                "Smoking inside the room or shared spaces",
                "Pets in shared living spaces",
                "Other: No loud instruments after 10pm",
            ],
        )

    def test_get_deal_breakers_a_empty_when_no_preferences(self):
        uid = uuid4()
        user = User(id=uid, username="test_empty", is_active=True)
        self.db.add(user)
        self.db.commit()

        self.assertEqual(get_deal_breakers_a(self.db, uid), [])
        self.assertEqual(get_deal_breakers_a(self.db, uuid4()), [])


if __name__ == "__main__":
    unittest.main()
