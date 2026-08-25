"""
Router-level integration tests for the onboarding API (Phase 2, Step 6B).

GET /onboarding/me
POST /onboarding

Tested scenarios
----------------
1.  Unauthenticated POST /onboarding             → 401
2.  Unauthenticated GET  /onboarding/me          → 401
3.  Authenticated user can create onboarding     → 200 + full response (including accommodation)
4.  Authenticated user can retrieve onboarding   → 200 + full response (including accommodation)
5.  Authenticated user can update onboarding     → 200 + updated fields
6.  One user cannot retrieve another's data      → 404
7.  Request body cannot control ownership (no user_id field) → schema enforces
8.  Invalid onboarding data returns 422
9.  Missing onboarding returns 404
10. Existing auth endpoint still works           → /auth/register 400 (dup user)
11. Existing service tests still pass            → imported and re-run
"""

from __future__ import annotations

import sys
import unittest
import warnings
from uuid import uuid4

# Suppress the httpx/httpx2 deprecation warning from starlette TestClient.
warnings.filterwarnings("ignore", category=DeprecationWarning)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session, sessionmaker

# ---------------------------------------------------------------------------
# Build SQLite in-memory schema
# ---------------------------------------------------------------------------

import app.models  # noqa: F401 — registers ORM models

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.main import app
from app.models.user import User

from sqlalchemy.pool import StaticPool

_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(_ENGINE, "connect")
def _enable_fk(dbapi_conn, _rec):
    cur = dbapi_conn.cursor()
    cur.execute("PRAGMA foreign_keys=ON")
    cur.close()


_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    password_hash TEXT NOT NULL,
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
    profile_photo_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
);
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    country TEXT NOT NULL,
    state TEXT NOT NULL,
    city TEXT NOT NULL,
    locality TEXT NOT NULL,
    pincode TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
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
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
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
    guest_frequency TEXT NOT NULL,
    guest_tolerance TEXT NOT NULL DEFAULT 'comfortable',
    cooking TEXT NOT NULL DEFAULT 'sometimes',
    cooking_tolerance TEXT NOT NULL DEFAULT 'comfortable',
    party_frequency TEXT NOT NULL DEFAULT 'sometimes',
    party_tolerance TEXT NOT NULL DEFAULT 'comfortable',
    fitness TEXT NOT NULL,
    music INTEGER NOT NULL DEFAULT 0,
    work_from_home INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
);
CREATE TABLE IF NOT EXISTS roommate_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_gender TEXT NOT NULL,
    min_age INTEGER NOT NULL,
    max_age INTEGER NOT NULL,
    budget_min REAL NOT NULL,
    budget_max REAL NOT NULL,
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
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
);
"""

with _ENGINE.connect() as _conn:
    for _s in _SCHEMA_SQL.strip().split(";"):
        _s = _s.strip()
        if _s:
            _conn.execute(text(_s))
    _conn.commit()

_SessionFactory = sessionmaker(bind=_ENGINE, autocommit=False, autoflush=False)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_VALID_PAYLOAD = {
    "profile": {
        "first_name": "Aarushi",
        "last_name": "Gupta",
        "date_of_birth": "2000-05-15",
        "gender": "female",
        "occupation": "Software Engineer",
        "bio": "Loves hiking.",
        "profile_photo_url": None,
    },
    "location": {
        "country": "India",
        "state": "Karnataka",
        "city": "Bengaluru",
        "locality": "Koramangala",
        "pincode": "560034",
        "latitude": "12.934594",
        "longitude": "77.610473",
    },
    "accommodation": {
        "accommodation_type": "apartment",
        "room_type": "private",
        "move_in_timeframe": "within_1_month",
        "lease_duration": "6_months",
        "budget_min": "8000.00",
        "budget_max": "16000.00",
    },
    "lifestyle": {
        "sleep_time": "23:00",
        "wake_time": "07:00",
        "cleanliness": "clean",
        "smoking": "never",
        "drinking": "occasionally",
        "pets": "no_pets",
        "guest_frequency": "sometimes",
        "cooking": "often",
        "party_frequency": "rarely",
        "fitness": "sometimes",
        "music": False,
        "work_from_home": True,
    },
    "preferences": {
        "preferred_gender": "any",
        "min_age": 20,
        "max_age": 30,
        "budget_min": "5000.00",
        "budget_max": "15000.00",
        "social_style": "balanced",
        "personal_space": "moderate",
        "communication_style": "open_communication",
        "issue_handling_importance": "important",
        "household_responsibilities": "shared_equally",
        "financial_responsibility": "very_important",
        "deal_breakers": ["loud_noise", "unreliable_payments"],
        "deal_breaker_other": None,
        "smoking_tolerance": "not_comfortable",
        "drinking_tolerance": "comfortable",
        "pet_tolerance": "comfortable",
        "cleanliness_requirement": "clean",
        "preferred_sleep_schedule": "night_owl",
    },
}


def _make_db_user(db: Session) -> User:
    """Insert a minimal User and return the ORM object."""
    u = User(
        id=uuid4(),
        username=f"apitest_{uuid4().hex[:8]}",
        email=None,
        password_hash="fakehash",
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


# ---------------------------------------------------------------------------
# Per-test dependency override management
# ---------------------------------------------------------------------------

class _TestBase(unittest.TestCase):
    """
    Base class that wires up per-test dependency overrides on the FastAPI app.
    """

    def setUp(self):
        self.db: Session = _SessionFactory()
        self.user: User = _make_db_user(self.db)

        def _override_get_db():
            try:
                yield self.db
            finally:
                pass

        def _override_get_current_user():
            return self.user

        app.dependency_overrides[get_db] = _override_get_db
        app.dependency_overrides[get_current_user] = _override_get_current_user

        self.client = TestClient(app, raise_server_exceptions=False)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.db.rollback()
        self.db.close()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestOnboardingRouter(unittest.TestCase):
    """Tests that do NOT need an authenticated user (checking 401 behaviour)."""

    def setUp(self):
        app.dependency_overrides.clear()
        self.client = TestClient(app, raise_server_exceptions=False)

    def tearDown(self):
        app.dependency_overrides.clear()

    # ------------------------------------------------------------------
    # 1. Unauthenticated POST /onboarding → 401
    # ------------------------------------------------------------------
    def test_01_unauthenticated_post_returns_401(self):
        r = self.client.post("/onboarding", json=_VALID_PAYLOAD)
        self.assertEqual(r.status_code, 401)

    # ------------------------------------------------------------------
    # 2. Unauthenticated GET /onboarding/me → 401
    # ------------------------------------------------------------------
    def test_02_unauthenticated_get_returns_401(self):
        r = self.client.get("/onboarding/me")
        self.assertEqual(r.status_code, 401)

    # ------------------------------------------------------------------
    # 3. Unauthenticated PATCH /onboarding → 401
    # ------------------------------------------------------------------
    def test_03_unauthenticated_patch_returns_401(self):
        r = self.client.patch("/onboarding", json={"profile": {"first_name": "Test"}})
        self.assertEqual(r.status_code, 401)


class TestOnboardingRouterAuth(_TestBase):
    """Tests that require an authenticated (overridden) user."""

    # ------------------------------------------------------------------
    # 3. Authenticated user can create onboarding → 200
    # ------------------------------------------------------------------
    def test_03_authenticated_post_creates_onboarding(self):
        r = self.client.post("/onboarding", json=_VALID_PAYLOAD)
        self.assertEqual(r.status_code, 200, r.text)
        body = r.json()
        self.assertIn("profile", body)
        self.assertIn("location", body)
        self.assertIn("accommodation", body)
        self.assertIn("lifestyle", body)
        self.assertIn("preferences", body)
        self.assertEqual(body["profile"]["first_name"], "Aarushi")
        self.assertEqual(body["location"]["city"], "Bengaluru")
        self.assertEqual(body["accommodation"]["accommodation_type"], "apartment")

    # ------------------------------------------------------------------
    # 4. Authenticated user can retrieve onboarding → 200
    # ------------------------------------------------------------------
    def test_04_authenticated_get_retrieves_onboarding(self):
        # Create first
        self.client.post("/onboarding", json=_VALID_PAYLOAD)
        # Then retrieve
        r = self.client.get("/onboarding/me")
        self.assertEqual(r.status_code, 200, r.text)
        body = r.json()
        self.assertEqual(body["profile"]["first_name"], "Aarushi")
        self.assertEqual(body["location"]["city"], "Bengaluru")
        self.assertEqual(body["accommodation"]["room_type"], "private")
        self.assertTrue(body["lifestyle"]["work_from_home"])

    # ------------------------------------------------------------------
    # 5. Authenticated user can update onboarding → 200 + changed field
    # ------------------------------------------------------------------
    def test_05_authenticated_post_updates_onboarding(self):
        import copy
        self.client.post("/onboarding", json=_VALID_PAYLOAD)

        payload_v2 = copy.deepcopy(_VALID_PAYLOAD)
        payload_v2["profile"]["occupation"] = "Data Scientist"
        payload_v2["accommodation"]["accommodation_type"] = "flat"
        r = self.client.post("/onboarding", json=payload_v2)
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()["profile"]["occupation"], "Data Scientist")
        self.assertEqual(r.json()["accommodation"]["accommodation_type"], "flat")

    # ------------------------------------------------------------------
    # 6. User A cannot retrieve User B's onboarding → 404
    # ------------------------------------------------------------------
    def test_06_different_user_cannot_access_other_onboarding(self):
        self.client.post("/onboarding", json=_VALID_PAYLOAD)

        user_b = _make_db_user(self.db)

        def _get_user_b():
            return user_b

        app.dependency_overrides[get_current_user] = _get_user_b
        r = self.client.get("/onboarding/me")
        self.assertEqual(r.status_code, 404, r.text)

    # ------------------------------------------------------------------
    # 7. Request body has no user_id field — schema enforces this
    # ------------------------------------------------------------------
    def test_07_payload_has_no_user_id_field(self):
        import copy
        payload_with_extra = copy.deepcopy(_VALID_PAYLOAD)
        payload_with_extra["user_id"] = str(uuid4())
        payload_with_extra["profile"]["user_id"] = str(uuid4())
        payload_with_extra["accommodation"]["user_id"] = str(uuid4())

        r = self.client.post("/onboarding", json=payload_with_extra)
        self.assertEqual(r.status_code, 200, r.text)
        body = r.json()
        self.assertEqual(
            body["profile"]["user_id"],
            str(self.user.id),
        )
        self.assertEqual(
            body["accommodation"]["user_id"],
            str(self.user.id),
        )

    # ------------------------------------------------------------------
    # 8. Invalid onboarding data → 422
    # ------------------------------------------------------------------
    def test_08_invalid_data_returns_422(self):
        import copy
        # Violate accommodation budget constraint: budget_min > budget_max
        bad = copy.deepcopy(_VALID_PAYLOAD)
        bad["accommodation"]["budget_min"] = "20000.00"
        bad["accommodation"]["budget_max"] = "10000.00"
        r = self.client.post("/onboarding", json=bad)
        self.assertEqual(r.status_code, 422, r.text)

    # ------------------------------------------------------------------
    # 9. Missing onboarding → 404
    # ------------------------------------------------------------------
    def test_09_missing_onboarding_returns_404(self):
        r = self.client.get("/onboarding/me")
        self.assertEqual(r.status_code, 404, r.text)
        self.assertIn("not found", r.json()["detail"].lower())

    # ------------------------------------------------------------------
    # 10. Existing auth endpoint still works
    # ------------------------------------------------------------------
    def test_10_existing_auth_endpoint_unaffected(self):
        payload = {
            "username": self.user.username,
            "password": "Password123",
        }
        r = self.client.post("/auth/register", json=payload)
        self.assertIn(r.status_code, (400, 422), r.text)

    # ------------------------------------------------------------------
    # 11. Existing service tests still pass
    # ------------------------------------------------------------------
    def test_11_service_tests_still_pass(self):
        import importlib
        try:
            import test_onboarding_service as svc_tests
        except ImportError:
            import tests.test_onboarding_service as svc_tests
        importlib.reload(svc_tests)

        loader = unittest.TestLoader()
        suite = loader.loadTestsFromTestCase(svc_tests.TestOnboardingService)
        result = unittest.TestResult()
        suite.run(result)

        errors = result.errors + result.failures
        if errors:
            messages = "\n".join(f"{test}: {trace}" for test, trace in errors)
            self.fail(f"Service tests failed:\n{messages}")

    # ------------------------------------------------------------------
    # 12. Authenticated PATCH /onboarding saves Step 1
    # ------------------------------------------------------------------
    def test_12_authenticated_patch_saves_step_1(self):
        payload = {
            "profile": {
                "first_name": "Riya",
                "last_name": "Sen",
                "date_of_birth": "2001-05-12",
                "gender": "female",
                "occupation": "Product Designer",
            }
        }
        r = self.client.patch("/onboarding", json=payload)
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertFalse(data["is_complete"])
        self.assertEqual(data["profile"]["first_name"], "Riya")
        self.assertIsNone(data["location"])

    # ------------------------------------------------------------------
    # 13. Authenticated PATCH /onboarding saves Step 1 + 2
    # ------------------------------------------------------------------
    def test_13_authenticated_patch_saves_step_1_and_2(self):
        payload = {
            "profile": {
                "first_name": "Kavya",
                "last_name": "Iyer",
                "date_of_birth": "2000-09-18",
                "gender": "female",
                "occupation": "Engineer",
            },
            "location": {
                "country": "India",
                "state": "Karnataka",
                "city": "Bengaluru",
                "locality": "Koramangala",
                "pincode": "560034",
                "latitude": "12.9345",
                "longitude": "77.6104",
            },
        }
        r = self.client.patch("/onboarding", json=payload)
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertFalse(data["is_complete"])
        self.assertEqual(data["location"]["city"], "Bengaluru")

    # ------------------------------------------------------------------
    # 14. Authenticated GET /onboarding/me retrieves partial onboarding
    # ------------------------------------------------------------------
    def test_14_authenticated_get_retrieves_partial_onboarding(self):
        # Save step 1 first
        self.client.patch(
            "/onboarding",
            json={
                "profile": {
                    "first_name": "Sneha",
                    "last_name": "Reddy",
                    "date_of_birth": "2002-04-10",
                    "gender": "female",
                    "occupation": "Architect",
                }
            },
        )
        r = self.client.get("/onboarding/me")
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertFalse(data["is_complete"])
        self.assertEqual(data["profile"]["first_name"], "Sneha")
        self.assertIsNone(data["accommodation"])


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    suite.addTests(loader.loadTestsFromTestCase(TestOnboardingRouter))
    suite.addTests(loader.loadTestsFromTestCase(TestOnboardingRouterAuth))

    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
