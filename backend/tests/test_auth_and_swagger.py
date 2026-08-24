"""
Unit & Integration Tests for Swagger OAuth2 Form Login, JSON Login, and ML Matching Endpoints.
"""

import sys
import unittest
from datetime import date, time
from pathlib import Path
from uuid import UUID, uuid4

# Ensure project root and backend are in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]
for p in [str(PROJECT_ROOT), str(BACKEND_ROOT)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker

from app.db.database import get_db
from app.main import app
from app.models.lifestyle_profile import LifestyleProfile
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.models.user_profile import UserProfile
from app.services.security import hash_password

_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    username    TEXT NOT NULL UNIQUE,
    email       TEXT,
    password_hash TEXT NOT NULL,
    is_email_verified INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id  TEXT NOT NULL,
    token_hash  TEXT NOT NULL,
    is_revoked  INTEGER NOT NULL DEFAULT 0,
    revoked_at  TEXT,
    expires_at  TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
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
    cooking                 TEXT NOT NULL DEFAULT 'sometimes',
    cooking_tolerance       TEXT NOT NULL DEFAULT 'comfortable',
    party_frequency         TEXT NOT NULL DEFAULT 'sometimes',
    party_tolerance         TEXT NOT NULL DEFAULT 'comfortable',
    fitness                 TEXT NOT NULL,
    music                   INTEGER NOT NULL DEFAULT 0,
    work_from_home          INTEGER NOT NULL DEFAULT 0,
    created_at              TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at              TEXT NOT NULL DEFAULT (datetime('now')),
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

CREATE TABLE IF NOT EXISTS roommate_preferences (
    id                          TEXT PRIMARY KEY,
    user_id                     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_gender            TEXT NOT NULL,
    min_age                     INTEGER NOT NULL,
    max_age                     INTEGER NOT NULL,
    budget_min                  REAL NOT NULL,
    budget_max                  REAL NOT NULL,
    social_style                TEXT NOT NULL,
    personal_space              TEXT NOT NULL,
    communication_style         TEXT NOT NULL,
    issue_handling_importance   TEXT NOT NULL,
    household_responsibilities  TEXT NOT NULL,
    financial_responsibility    TEXT NOT NULL,
    deal_breakers               TEXT NOT NULL DEFAULT '[]',
    deal_breaker_other          TEXT,
    smoking_tolerance           TEXT NOT NULL,
    drinking_tolerance          TEXT NOT NULL,
    pet_tolerance               TEXT NOT NULL,
    cleanliness_requirement     TEXT NOT NULL,
    preferred_sleep_schedule    TEXT NOT NULL,
    created_at                  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at                  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id)
);
"""


from sqlalchemy.pool import StaticPool

class TestAuthAndSwaggerIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Create an in-memory SQLite database with StaticPool so all connections share the DB
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        
        with cls.engine.connect() as conn:
            for statement in _SCHEMA_SQL.strip().split(";"):
                stmt = statement.strip()
                if stmt:
                    conn.execute(text(stmt))
            conn.commit()

        cls.TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

        def override_get_db():
            db = cls.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

        # Seed test users
        db = cls.TestingSessionLocal()

        # User 1 (target)
        u1_id = uuid4()
        cls.u1 = User(
            id=u1_id,
            username="testuser1",
            email="testuser1@example.com",
            password_hash=hash_password("Password123!"),
            is_active=True,
        )
        cls.p1 = UserProfile(
            id=uuid4(),
            user_id=u1_id,
            first_name="Priya",
            last_name="Sharma",
            gender="female",
            date_of_birth=date(2002, 5, 15),
            occupation="Student",
        )
        cls.l1 = LifestyleProfile(
            id=uuid4(),
            user_id=u1_id,
            sleep_time=time(23, 0),
            wake_time=time(7, 0),
            schedule_consistency=4,
            study_hours=5,
            noise_sleep_tolerance=4,
            cleanliness="clean",
            cleanliness_score=4,
            privacy_preference=4,
            talkativeness=3,
            friendship_expectation=3,
            gaming_hours=0,
            smoking="never",
            drinking="occasionally",
            pets="no_pets",
            guest_frequency="sometimes",
            fitness="often",
            cooking="sometimes",
            party_frequency="rarely",
            music=True,
            work_from_home=False,
        )

        # User 2 (candidate)
        u2_id = uuid4()
        cls.u2 = User(
            id=u2_id,
            username="testuser2",
            email="testuser2@example.com",
            password_hash=hash_password("Password123!"),
            is_active=True,
        )
        cls.p2 = UserProfile(
            id=uuid4(),
            user_id=u2_id,
            first_name="Ananya",
            last_name="Verma",
            gender="female",
            date_of_birth=date(2001, 8, 20),
            occupation="Student",
        )
        cls.l2 = LifestyleProfile(
            id=uuid4(),
            user_id=u2_id,
            sleep_time=time(23, 30),
            wake_time=time(7, 30),
            schedule_consistency=4,
            study_hours=4,
            noise_sleep_tolerance=3,
            cleanliness="clean",
            cleanliness_score=4,
            privacy_preference=4,
            talkativeness=3,
            friendship_expectation=4,
            gaming_hours=0,
            smoking="never",
            drinking="never",
            pets="no_pets",
            guest_frequency="rarely",
            fitness="sometimes",
            cooking="sometimes",
            party_frequency="rarely",
            music=False,
            work_from_home=False,
        )

        cls.u1_id = u1_id
        cls.u2_id = u2_id

        db.add_all([cls.u1, cls.p1, cls.l1, cls.u2, cls.p2, cls.l2])
        db.commit()
        db.close()

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def test_01_openapi_schema_token_url(self):
        """Verify OpenAPI security scheme points to /auth/login for Swagger UI."""
        res = self.client.get("/openapi.json")
        self.assertEqual(res.status_code, 200)
        schema = res.json()
        
        security_schemes = schema["components"]["securitySchemes"]
        self.assertIn("OAuth2PasswordBearer", security_schemes)
        oauth2 = security_schemes["OAuth2PasswordBearer"]
        token_url = oauth2["flows"]["password"]["tokenUrl"]
        self.assertEqual(token_url, "/auth/login", f"Expected /auth/login, got {token_url}")

    def test_02_json_login_works(self):
        """Verify existing POST /auth/login/json endpoint works."""
        payload = {"username": "testuser1", "password": "Password123!"}
        res = self.client.post("/auth/login/json", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        self.assertEqual(data["token_type"].lower(), "bearer")

    def test_03_oauth2_form_login_works(self):
        """Verify POST /auth/login with form-urlencoded data works (for Swagger)."""
        form_data = {"username": "testuser1", "password": "Password123!"}
        res = self.client.post("/auth/login", data=form_data)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        self.assertEqual(data["token_type"].lower(), "bearer")

    def test_04_invalid_credentials_returns_401(self):
        """Verify invalid credentials return 401 for both endpoints."""
        res_json = self.client.post("/auth/login/json", json={"username": "testuser1", "password": "WrongPassword"})
        self.assertEqual(res_json.status_code, 401)

        res_form = self.client.post("/auth/login", data={"username": "testuser1", "password": "WrongPassword"})
        self.assertEqual(res_form.status_code, 401)

    def test_05_authenticated_predict_user_endpoint(self):
        """Verify POST /matching/predict/user with bearer token executes ML pipeline."""
        # 1. Login via OAuth2 form (Swagger flow)
        login_res = self.client.post("/auth/login", data={"username": "testuser1", "password": "Password123!"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Call protected predict endpoint
        payload = {"candidate_user_id": str(self.u2_id)}
        res = self.client.post("/matching/predict/user", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertIn("prediction", data)
        self.assertIn(data["prediction"], ["High", "Medium", "Low"])
        self.assertIn("confidence", data)
        self.assertIn("probabilities", data)
        self.assertIn("feature_signals", data)

    def test_06_authenticated_recommendations_endpoint(self):
        """Verify GET /matching/recommendations with bearer token returns ranked matches."""
        # 1. Login via OAuth2 form (Swagger flow)
        login_res = self.client.post("/auth/login", data={"username": "testuser1", "password": "Password123!"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Call recommendations endpoint
        res = self.client.get("/matching/recommendations?top_n=5", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertIn("matches", data)
        self.assertIn("total_evaluated", data)
        self.assertGreaterEqual(len(data["matches"]), 1)
        
        match = data["matches"][0]
        self.assertIn("prediction", match)
        self.assertIn("confidence", match)
        self.assertIn("probabilities", match)
        self.assertIn("feature_signals", match)
        self.assertIn("rule_based_explainability", match)


if __name__ == "__main__":
    unittest.main()
