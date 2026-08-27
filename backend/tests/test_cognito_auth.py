"""
Unit & Integration Tests for Amazon Cognito Authentication Migration.
Mocks all boto3 Cognito client network calls and RS256 JWKS validation.
"""

import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch
from uuid import uuid4

# Ensure project root and backend are in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]
for p in [str(PROJECT_ROOT), str(BACKEND_ROOT)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from botocore.exceptions import ClientError
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.database import get_db
from app.main import app
from app.models.user import User
from app.schemas.user import UserLogin, UserRegister
from app.services.auth import (
    confirm_forgot_password_user,
    forgot_password_user,
    login_user,
    refresh_access_token,
    register_user,
    resend_verification_otp,
    verify_email_otp,
)
from app.services.cognito import (
    calculate_secret_hash,
    cognito_confirm_forgot_password,
    cognito_confirm_sign_up,
    cognito_forgot_password,
    cognito_initiate_auth,
    cognito_refresh_auth,
    cognito_resend_confirmation_code,
    cognito_sign_up,
    verify_cognito_token,
)

_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    username    TEXT NOT NULL UNIQUE,
    email       TEXT UNIQUE,
    cognito_sub TEXT UNIQUE,
    password_hash TEXT,
    email_verified INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT
);
"""


class TestCognitoAuthentication(unittest.TestCase):
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
        self.orig_region = settings.AWS_REGION
        self.orig_pool_id = settings.COGNITO_USER_POOL_ID
        self.orig_client_id = settings.COGNITO_CLIENT_ID
        self.orig_client_secret = settings.COGNITO_CLIENT_SECRET

        settings.AWS_REGION = "us-east-1"
        settings.COGNITO_USER_POOL_ID = "us-east-1_TestPool123"
        settings.COGNITO_CLIENT_ID = "test_client_id_12345"
        settings.COGNITO_CLIENT_SECRET = "test_secret_67890"

    def tearDown(self):
        settings.AWS_REGION = self.orig_region
        settings.COGNITO_USER_POOL_ID = self.orig_pool_id
        settings.COGNITO_CLIENT_ID = self.orig_client_id
        settings.COGNITO_CLIENT_SECRET = self.orig_client_secret

        self.db.query(User).delete()
        self.db.commit()
        self.db.close()

    # 1. SecretHash calculation
    def test_01_secret_hash_calculation(self):
        sh = calculate_secret_hash("testuser")
        self.assertIsNotNone(sh)
        self.assertIsInstance(sh, str)

        settings.COGNITO_CLIENT_SECRET = ""
        self.assertIsNone(calculate_secret_hash("testuser"))

    # 2. Registration Flow
    @patch("app.services.cognito.get_cognito_client")
    def test_02_registration_success(self, mock_client_getter):
        mock_client = MagicMock()
        mock_client_getter.return_value = mock_client
        mock_client.sign_up.return_value = {
            "UserSub": "cognito-sub-uuid-111",
            "UserConfirmed": False,
            "CodeDeliveryDetails": {"Destination": "a***@example.com"},
        }

        user_data = UserRegister(
            username="alice_test",
            email="alice@example.com",
            password="SecurePassword123!",
        )
        user = register_user(self.db, user_data)

        self.assertEqual(user.username, "alice_test")
        self.assertEqual(user.email, "alice@example.com")
        self.assertEqual(user.cognito_sub, "cognito-sub-uuid-111")
        self.assertFalse(user.email_verified)
        mock_client.sign_up.assert_called_once()

    # 3. Registration duplicate handling
    @patch("app.services.cognito.get_cognito_client")
    def test_03_registration_duplicate_username_fails(self, mock_client_getter):
        existing = User(
            id=uuid4(),
            username="bob_existing",
            email="bob@example.com",
            cognito_sub="sub-bob",
            email_verified=True,
        )
        self.db.add(existing)
        self.db.commit()

        with self.assertRaises(ValueError) as ctx:
            register_user(
                self.db,
                UserRegister(
                    username="bob_existing",
                    email="other@example.com",
                    password="Password123!",
                ),
            )
        self.assertIn("Username unavailable", str(ctx.exception))

    # 4. Email verification / Confirm SignUp
    @patch("app.services.cognito.get_cognito_client")
    def test_04_confirm_sign_up_success(self, mock_client_getter):
        mock_client = MagicMock()
        mock_client_getter.return_value = mock_client
        mock_client.confirm_sign_up.return_value = {}

        user = User(
            id=uuid4(),
            username="charlie_verify",
            email="charlie@example.com",
            cognito_sub="sub-charlie",
            email_verified=False,
        )
        self.db.add(user)
        self.db.commit()

        res = verify_email_otp(self.db, "charlie@example.com", "654321")
        self.assertEqual(res, "Email verified successfully.")

        self.db.refresh(user)
        self.assertTrue(user.email_verified)
        mock_client.confirm_sign_up.assert_called_once()

    # 5. Email verification invalid code
    @patch("app.services.cognito.get_cognito_client")
    def test_05_confirm_sign_up_invalid_code(self, mock_client_getter):
        mock_client = MagicMock()
        mock_client_getter.return_value = mock_client
        mock_client.confirm_sign_up.side_effect = ClientError(
            {"Error": {"Code": "CodeMismatchException", "Message": "Invalid code"}},
            "ConfirmSignUp",
        )

        with self.assertRaises(ValueError) as ctx:
            verify_email_otp(self.db, "user@example.com", "000000")
        self.assertIn("Invalid verification code", str(ctx.exception))

    # 6. Resend confirmation code
    @patch("app.services.cognito.get_cognito_client")
    def test_06_resend_confirmation_code(self, mock_client_getter):
        mock_client = MagicMock()
        mock_client_getter.return_value = mock_client
        mock_client.resend_confirmation_code.return_value = {
            "CodeDeliveryDetails": {"Destination": "d***@example.com"}
        }

        res = resend_verification_otp(self.db, "david@example.com")
        self.assertIn("verification code has been sent", res)
        mock_client.resend_confirmation_code.assert_called_once()

    # 7. Login success
    @patch("app.services.cognito.get_cognito_client")
    def test_07_login_success(self, mock_client_getter):
        mock_client = MagicMock()
        mock_client_getter.return_value = mock_client
        mock_client.initiate_auth.return_value = {
            "AuthenticationResult": {
                "AccessToken": "mock-access-token-xyz",
                "IdToken": "mock-id-token-abc",
                "RefreshToken": "mock-refresh-token-123",
                "TokenType": "bearer",
                "ExpiresIn": 3600,
            }
        }

        user = User(
            id=uuid4(),
            username="eva_login",
            email="eva@example.com",
            cognito_sub="sub-eva",
            email_verified=True,
        )
        self.db.add(user)
        self.db.commit()

        token = login_user(
            self.db,
            UserLogin(username="eva_login", password="ValidPassword123!"),
        )
        self.assertEqual(token.access_token, "mock-access-token-xyz")
        self.assertEqual(token.refresh_token, "mock-refresh-token-123")
        self.assertEqual(token.token_type, "bearer")

        self.db.refresh(user)
        self.assertIsNotNone(user.last_login_at)

    # 8. Login with unconfirmed account
    @patch("app.services.cognito.get_cognito_client")
    def test_08_login_unconfirmed_account_raises_clean_error(self, mock_client_getter):
        mock_client = MagicMock()
        mock_client_getter.return_value = mock_client
        mock_client.initiate_auth.side_effect = ClientError(
            {"Error": {"Code": "UserNotConfirmedException", "Message": "User is not confirmed"}},
            "InitiateAuth",
        )

        with self.assertRaises(ValueError) as ctx:
            login_user(
                self.db,
                UserLogin(username="frank_unconfirmed", password="Password123!"),
            )
        self.assertIn("verify your email before logging in", str(ctx.exception).lower())

    # 9. Login with invalid password
    @patch("app.services.cognito.get_cognito_client")
    def test_09_login_invalid_password(self, mock_client_getter):
        mock_client = MagicMock()
        mock_client_getter.return_value = mock_client
        mock_client.initiate_auth.side_effect = ClientError(
            {"Error": {"Code": "NotAuthorizedException", "Message": "Incorrect username or password"}},
            "InitiateAuth",
        )

        with self.assertRaises(ValueError) as ctx:
            login_user(
                self.db,
                UserLogin(username="grace_test", password="WrongPassword!"),
            )
        self.assertIn("Invalid username or password", str(ctx.exception))

    # 10. Refresh token flow
    @patch("app.services.cognito.get_cognito_client")
    def test_10_refresh_token_success(self, mock_client_getter):
        mock_client = MagicMock()
        mock_client_getter.return_value = mock_client
        mock_client.initiate_auth.return_value = {
            "AuthenticationResult": {
                "AccessToken": "new-access-token-789",
                "IdToken": "new-id-token-456",
                "RefreshToken": "same-or-new-refresh-token",
                "TokenType": "bearer",
            }
        }

        tokens = refresh_access_token(self.db, "old-refresh-token")
        self.assertEqual(tokens.access_token, "new-access-token-789")

    # 11. Forgot password & confirm forgot password
    @patch("app.services.cognito.get_cognito_client")
    def test_11_forgot_password_flow(self, mock_client_getter):
        mock_client = MagicMock()
        mock_client_getter.return_value = mock_client
        mock_client.forgot_password.return_value = {
            "CodeDeliveryDetails": {"Destination": "h***@example.com"}
        }
        mock_client.confirm_forgot_password.return_value = {}

        msg1 = forgot_password_user(self.db, "helen@example.com")
        self.assertIn("recovery code has been sent", msg1)

        msg2 = confirm_forgot_password_user(
            self.db, "helen@example.com", "123456", "NewSuperPassword123!"
        )
        self.assertIn("Password updated successfully", msg2)

    # 12. Token verification via get_current_user
    @patch("app.dependencies.auth.verify_cognito_token")
    def test_12_authenticated_users_me_success(self, mock_verify):
        user = User(
            id=uuid4(),
            username="ian_auth",
            email="ian@example.com",
            cognito_sub="cognito-sub-ian-999",
            email_verified=True,
            is_active=True,
        )
        self.db.add(user)
        self.db.commit()

        mock_verify.return_value = {
            "sub": "cognito-sub-ian-999",
            "username": "ian_auth",
            "email": "ian@example.com",
            "token_use": "access",
        }

        response = self.client.get(
            "/users/me",
            headers={"Authorization": "Bearer valid-mock-cognito-token"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["username"], "ian_auth")
        self.assertEqual(data["email"], "ian@example.com")

    # 13. Unauthorized /users/me without token
    def test_13_unauthorized_users_me_returns_401(self):
        response = self.client.get("/users/me")
        self.assertEqual(response.status_code, 401)

    # 14. API endpoints integration
    @patch("app.routers.auth.verify_email_otp", return_value="Email verified successfully.")
    @patch("app.routers.auth.resend_verification_otp", return_value="A new verification code has been sent to your email.")
    @patch("app.routers.auth.forgot_password_user", return_value="A password recovery code has been sent to your email.")
    def test_14_auth_router_endpoints(self, mock_forgot, mock_resend, mock_verify):
        # /auth/verify-email
        res_v = self.client.post(
            "/auth/verify-email",
            json={"email": "test@example.com", "otp": "123456"},
        )
        self.assertEqual(res_v.status_code, 200)
        self.assertEqual(res_v.json()["message"], "Email verified successfully.")

        # /auth/resend-verification
        res_r = self.client.post(
            "/auth/resend-verification",
            json={"email": "test@example.com"},
        )
        self.assertEqual(res_r.status_code, 200)
        self.assertIn("verification code has been sent", res_r.json()["message"])

        # /auth/forgot-password
        res_f = self.client.post(
            "/auth/forgot-password",
            json={"email": "test@example.com"},
        )
        self.assertEqual(res_f.status_code, 200)
        self.assertIn("recovery code has been sent", res_f.json()["message"])


if __name__ == "__main__":
    unittest.main()
