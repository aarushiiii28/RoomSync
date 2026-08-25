"""
Unit & Integration Tests for Email Verification / 6-Digit OTP System.
"""

import sys
import unittest
from unittest.mock import patch
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

# Ensure project root and backend are in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]
for p in [str(PROJECT_ROOT), str(BACKEND_ROOT)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.database import get_db
from app.main import app
from app.models.email_verification import EmailVerification
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.user import UserLogin, UserRegister
from app.services.auth import login_user, register_user
from app.services.email_verification import (
    create_and_send_verification_otp,
    generate_otp,
    hash_otp,
    resend_verification_otp,
    verify_email_otp,
    verify_otp_hash,
)
from app.services.security import hash_password

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

CREATE TABLE IF NOT EXISTS email_verifications (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash    TEXT NOT NULL,
    expires_at  TEXT NOT NULL,
    attempts    INTEGER NOT NULL DEFAULT 0,
    used_at     TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    last_sent_at TEXT NOT NULL DEFAULT (datetime('now'))
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
"""


class TestEmailVerificationSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

        @event.listens_for(cls.engine, "connect")
        def _enable_fk(dbapi_conn, _rec):
            cur = dbapi_conn.cursor()
            cur.execute("PRAGMA foreign_keys=ON")
            cur.close()

        with cls.engine.connect() as conn:
            for statement in _SCHEMA_SQL.strip().split(";"):
                stmt = statement.strip()
                if stmt:
                    conn.exec_driver_sql(stmt)
            conn.commit()

        cls.TestingSessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=cls.engine,
        )

        def override_get_db():
            db = cls.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

    def setUp(self):
        self.db = self.TestingSessionLocal()
        self.patcher = patch(
            "app.services.email_verification.send_verification_email",
            return_value=True,
        )
        self.mock_send = self.patcher.start()

    def tearDown(self):
        self.patcher.stop()
        self.db.query(EmailVerification).delete()
        self.db.query(RefreshToken).delete()
        self.db.query(User).delete()
        self.db.commit()
        self.db.close()

    # 1. New user starts with email_verified=False
    def test_01_new_user_starts_unverified(self):
        user_data = UserRegister(
            username="alice_unverified",
            email="alice@example.com",
            password="SecurePassword123!",
        )
        user = register_user(self.db, user_data)
        self.assertFalse(user.email_verified)

    # 2. Registration generates verification record
    def test_02_registration_generates_verification_record(self):
        user_data = UserRegister(
            username="bob_verify",
            email="bob@example.com",
            password="SecurePassword123!",
        )
        user = register_user(self.db, user_data)

        records = self.db.query(EmailVerification).filter(EmailVerification.user_id == user.id).all()
        self.assertEqual(len(records), 1)
        self.assertIsNone(records[0].used_at)
        self.assertEqual(records[0].attempts, 0)

    # 3. OTP is hashed, not stored plaintext
    def test_03_otp_is_hashed_never_plaintext(self):
        plain_otp = generate_otp()
        self.assertEqual(len(plain_otp), 6)
        self.assertTrue(plain_otp.isdigit())

        h = hash_otp(plain_otp)
        self.assertNotEqual(plain_otp, h)
        self.assertEqual(len(h), 64)  # SHA-256 hex string
        self.assertTrue(verify_otp_hash(plain_otp, h))
        self.assertFalse(verify_otp_hash("000000" if plain_otp != "000000" else "111111", h))

    # 4. Correct OTP verifies successfully
    def test_04_correct_otp_verifies_successfully(self):
        user = User(
            id=uuid4(),
            username="charlie_test",
            email="charlie@example.com",
            password_hash=hash_password("Password123!"),
            email_verified=False,
        )
        self.db.add(user)
        self.db.commit()

        # Seed verification with known OTP
        known_otp = "849201"
        now = datetime.now(timezone.utc)
        record = EmailVerification(
            user_id=user.id,
            otp_hash=hash_otp(known_otp),
            expires_at=now + timedelta(minutes=10),
            attempts=0,
            used_at=None,
            created_at=now,
            last_sent_at=now,
        )
        self.db.add(record)
        self.db.commit()

        # Verify via service
        result = verify_email_otp(self.db, "charlie@example.com", known_otp)
        self.assertEqual(result, "Email verified successfully.")

        self.db.refresh(user)
        self.db.refresh(record)
        self.assertTrue(user.email_verified)
        self.assertIsNotNone(record.used_at)

    # 5. Wrong OTP fails
    def test_05_wrong_otp_fails(self):
        user = User(
            id=uuid4(),
            username="david_test",
            email="david@example.com",
            password_hash=hash_password("Password123!"),
            email_verified=False,
        )
        self.db.add(user)
        self.db.commit()

        create_and_send_verification_otp(self.db, user)

        with self.assertRaises(ValueError) as ctx:
            verify_email_otp(self.db, "david@example.com", "999999")
        self.assertIn("Invalid verification code", str(ctx.exception))

    # 6. Wrong OTP increments attempts
    def test_06_wrong_otp_increments_attempts(self):
        user = User(
            id=uuid4(),
            username="eva_test",
            email="eva@example.com",
            password_hash=hash_password("Password123!"),
            email_verified=False,
        )
        self.db.add(user)
        self.db.commit()

        create_and_send_verification_otp(self.db, user)

        # Attempt 1
        with self.assertRaises(ValueError):
            verify_email_otp(self.db, "eva@example.com", "000000")

        record = self.db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
        self.assertEqual(record.attempts, 1)

        # Attempt 2
        with self.assertRaises(ValueError):
            verify_email_otp(self.db, "eva@example.com", "111111")

        self.db.refresh(record)
        self.assertEqual(record.attempts, 2)

    # 7. OTP is invalid after 5 failed attempts
    def test_07_five_failed_attempts_invalidates_otp(self):
        user = User(
            id=uuid4(),
            username="frank_test",
            email="frank@example.com",
            password_hash=hash_password("Password123!"),
            email_verified=False,
        )
        self.db.add(user)
        self.db.commit()

        known_otp = "123456"
        now = datetime.now(timezone.utc)
        record = EmailVerification(
            user_id=user.id,
            otp_hash=hash_otp(known_otp),
            expires_at=now + timedelta(minutes=10),
            attempts=0,
            used_at=None,
            created_at=now,
            last_sent_at=now,
        )
        self.db.add(record)
        self.db.commit()

        # 5 wrong attempts
        for i in range(5):
            with self.assertRaises(ValueError) as ctx:
                verify_email_otp(self.db, "frank@example.com", "000000")

        self.assertIn("Too many failed attempts", str(ctx.exception))

        # Even correct OTP is now rejected because record was invalidated
        with self.assertRaises(ValueError) as ctx2:
            verify_email_otp(self.db, "frank@example.com", known_otp)
        self.assertIn("already been used", str(ctx2.exception))

    # 8. Expired OTP fails
    def test_08_expired_otp_fails(self):
        user = User(
            id=uuid4(),
            username="grace_test",
            email="grace@example.com",
            password_hash=hash_password("Password123!"),
            email_verified=False,
        )
        self.db.add(user)
        self.db.commit()

        known_otp = "555555"
        past = datetime.now(timezone.utc) - timedelta(minutes=15)
        record = EmailVerification(
            user_id=user.id,
            otp_hash=hash_otp(known_otp),
            expires_at=past,
            attempts=0,
            used_at=None,
            created_at=past,
            last_sent_at=past,
        )
        self.db.add(record)
        self.db.commit()

        with self.assertRaises(ValueError) as ctx:
            verify_email_otp(self.db, "grace@example.com", known_otp)
        self.assertIn("expired", str(ctx.exception).lower())

    # 9. Used OTP cannot be reused
    def test_09_used_otp_cannot_be_reused(self):
        user = User(
            id=uuid4(),
            username="helen_test",
            email="helen@example.com",
            password_hash=hash_password("Password123!"),
            email_verified=False,
        )
        self.db.add(user)
        self.db.commit()

        known_otp = "654321"
        now = datetime.now(timezone.utc)
        record = EmailVerification(
            user_id=user.id,
            otp_hash=hash_otp(known_otp),
            expires_at=now + timedelta(minutes=10),
            attempts=0,
            used_at=now,  # Already used
            created_at=now,
            last_sent_at=now,
        )
        self.db.add(record)
        self.db.commit()

        with self.assertRaises(ValueError) as ctx:
            verify_email_otp(self.db, "helen@example.com", known_otp)
        self.assertIn("already been used", str(ctx.exception))

    # 10 & 11. Resend creates new OTP and invalidates previous OTP
    def test_10_and_11_resend_creates_new_otp_and_invalidates_old(self):
        user = User(
            id=uuid4(),
            username="ian_test",
            email="ian@example.com",
            password_hash=hash_password("Password123!"),
            email_verified=False,
        )
        self.db.add(user)
        self.db.commit()

        old_otp = "111222"
        now = datetime.now(timezone.utc) - timedelta(seconds=70)
        old_record = EmailVerification(
            user_id=user.id,
            otp_hash=hash_otp(old_otp),
            expires_at=now + timedelta(minutes=10),
            attempts=0,
            used_at=None,
            created_at=now,
            last_sent_at=now,
        )
        self.db.add(old_record)
        self.db.commit()

        # Resend OTP
        msg = resend_verification_otp(self.db, "ian@example.com")
        self.assertIn("verification code has been sent", msg)

        # Old record must now be invalidated
        self.db.refresh(old_record)
        self.assertIsNotNone(old_record.used_at)

        # Trying old OTP fails
        with self.assertRaises(ValueError):
            verify_email_otp(self.db, "ian@example.com", old_otp)

    # 12. Resend cooldown is enforced
    def test_12_resend_cooldown_enforced(self):
        user = User(
            id=uuid4(),
            username="julia_test",
            email="julia@example.com",
            password_hash=hash_password("Password123!"),
            email_verified=False,
        )
        self.db.add(user)
        self.db.commit()

        create_and_send_verification_otp(self.db, user)

        # Immediate resend should trigger cooldown error
        with self.assertRaises(ValueError) as ctx:
            resend_verification_otp(self.db, "julia@example.com")
        self.assertIn("Please wait", str(ctx.exception))
        self.assertIn("second(s)", str(ctx.exception))

    # 13. Unverified user cannot log in
    def test_13_unverified_user_cannot_login(self):
        user = User(
            id=uuid4(),
            username="kevin_unverified",
            email="kevin@example.com",
            password_hash=hash_password("MyPassword123!"),
            email_verified=False,
        )
        self.db.add(user)
        self.db.commit()

        with self.assertRaises(ValueError) as ctx:
            login_user(
                self.db,
                UserLogin(username="kevin_unverified", password="MyPassword123!"),
            )
        self.assertIn("verify your email before logging in", str(ctx.exception))

    # 14. Verified user can log in normally
    def test_14_verified_user_logs_in_normally(self):
        user = User(
            id=uuid4(),
            username="laura_verified",
            email="laura@example.com",
            password_hash=hash_password("MyPassword123!"),
            email_verified=True,
        )
        self.db.add(user)
        self.db.commit()

        token_pair = login_user(
            self.db,
            UserLogin(username="laura_verified", password="MyPassword123!"),
        )
        self.assertIsNotNone(token_pair.access_token)
        self.assertIsNotNone(token_pair.refresh_token)

    # 15. API Endpoints for /auth/verify-email and /auth/resend-verification
    def test_15_api_endpoints_integration(self):
        user = User(
            id=uuid4(),
            username="mike_api",
            email="mike@example.com",
            password_hash=hash_password("Password123!"),
            email_verified=False,
        )
        self.db.add(user)
        self.db.commit()

        known_otp = "789123"
        now = datetime.now(timezone.utc)
        record = EmailVerification(
            user_id=user.id,
            otp_hash=hash_otp(known_otp),
            expires_at=now + timedelta(minutes=10),
            attempts=0,
            used_at=None,
            created_at=now,
            last_sent_at=now,
        )
        self.db.add(record)
        self.db.commit()

        # Test POST /auth/verify-email with wrong OTP
        bad_res = self.client.post(
            "/auth/verify-email",
            json={"email": "mike@example.com", "otp": "000000"},
        )
        self.assertEqual(bad_res.status_code, 400)
        self.assertIn("Invalid verification code", bad_res.json()["detail"])

        # Test POST /auth/verify-email with correct OTP
        good_res = self.client.post(
            "/auth/verify-email",
            json={"email": "mike@example.com", "otp": known_otp},
        )
        self.assertEqual(good_res.status_code, 200)
        self.assertEqual(good_res.json()["message"], "Email verified successfully.")

        # User is now verified in DB
        self.db.refresh(user)
        self.assertTrue(user.email_verified)

    # 16. Failed Resend delivery raises clean application error
    def test_16_failed_resend_delivery_raises_application_error(self):
        user = User(
            id=uuid4(),
            username="nina_test",
            email="nina@example.com",
            password_hash=hash_password("Password123!"),
            email_verified=False,
        )
        self.db.add(user)
        self.db.commit()

        # Temporarily configure send_verification_email to simulate a failed Resend delivery
        with patch("app.services.email_verification.send_verification_email", return_value=False):
            with self.assertRaises(ValueError) as ctx:
                resend_verification_otp(self.db, "nina@example.com")
            self.assertIn("couldn't send the verification email", str(ctx.exception).lower())


if __name__ == "__main__":
    unittest.main()
