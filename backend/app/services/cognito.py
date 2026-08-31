"""
AWS Cognito Authentication Service & JWT Verification Layer.
Centralizes all boto3 Cognito Identity Provider client operations.
"""

import base64
import hashlib
import hmac
import logging
import time
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError
from jose import JWTError, jwt
import requests

from app.core.config import settings

logger = logging.getLogger("roomsync.cognito")

# Global in-memory cache for Cognito JWKS public keys
_JWKS_CACHE: Dict[str, Any] = {}
_JWKS_LAST_FETCHED: float = 0.0
_JWKS_CACHE_TTL = 3600.0  # 1 hour


def get_cognito_client():
    """Return a boto3 Cognito Identity Provider client configured with AWS_REGION."""
    return boto3.client(
        "cognito-idp",
        region_name=settings.AWS_REGION or "us-east-1",
    )


def calculate_secret_hash(username: str) -> Optional[str]:
    """
    Calculate the HMAC-SHA256 SecretHash required by Cognito App Clients configured with a client secret.
    Returns None if no client secret is configured.
    """
    if not settings.COGNITO_CLIENT_SECRET or not settings.COGNITO_CLIENT_SECRET.strip():
        return None

    secret = settings.COGNITO_CLIENT_SECRET.strip()
    client_id = settings.COGNITO_CLIENT_ID.strip()
    message = (username + client_id).encode("utf-8")
    dig = hmac.new(secret.encode("utf-8"), message, hashlib.sha256).digest()
    return base64.b64encode(dig).decode("utf-8")


def _translate_cognito_error(exc: ClientError) -> ValueError:
    """Translate botocore ClientError from Cognito into clean application ValueErrors."""
    error_code = exc.response.get("Error", {}).get("Code", "Unknown")
    error_message = exc.response.get("Error", {}).get("Message", str(exc))

    logger.warning("Cognito error [%s]: %s", error_code, error_message)

    if error_code == "UsernameExistsException":
        return ValueError("Username or email already exists.")
    elif error_code == "UserNotFoundException":
        return ValueError("User not found.")
    elif error_code == "NotAuthorizedException":
        return ValueError("Invalid username or password.")
    elif error_code == "UserNotConfirmedException":
        return ValueError("Please verify your email before logging in.")
    elif error_code == "CodeMismatchException":
        return ValueError("Invalid verification code.")
    elif error_code == "ExpiredCodeException":
        return ValueError("Verification code has expired. Please request a new code.")
    elif error_code == "InvalidPasswordException":
        return ValueError(f"Password does not meet requirements: {error_message}")
    elif error_code in ("LimitExceededException", "TooManyRequestsException"):
        return ValueError("Too many attempts. Please wait a few moments and try again.")
    elif error_code == "InvalidParameterException":
        return ValueError(f"Invalid parameter: {error_message}")
    else:
        return ValueError(error_message or "Authentication service error. Please try again.")


def is_cognito_configured() -> bool:
    """Check if Cognito App Client ID is provided."""
    return bool(settings.COGNITO_CLIENT_ID and settings.COGNITO_CLIENT_ID.strip())


def cognito_sign_up(username: str, email: str, password: str) -> Dict[str, Any]:
    """
    Register a new user in the Amazon Cognito User Pool.
    Sends verification code to the user's email automatically via Cognito.
    """
    if not is_cognito_configured():
        from uuid import uuid4
        return {
            "user_sub": f"local-{uuid4()}",
            "user_confirmed": False,
            "code_delivery_details": {"Destination": email.strip().lower()},
        }

    client = get_cognito_client()
    secret_hash = calculate_secret_hash(username)

    kwargs: Dict[str, Any] = {
        "ClientId": settings.COGNITO_CLIENT_ID,
        "Username": username.strip(),
        "Password": password,
        "UserAttributes": [
            {"Name": "email", "Value": email.strip().lower()},
        ],
    }
    if secret_hash:
        kwargs["SecretHash"] = secret_hash

    try:
        response = client.sign_up(**kwargs)
        user_sub = response.get("UserSub")
        user_confirmed = response.get("UserConfirmed", False)
        return {
            "user_sub": user_sub,
            "user_confirmed": user_confirmed,
            "code_delivery_details": response.get("CodeDeliveryDetails", {}),
        }
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "Unknown")
        if error_code == "UsernameExistsException":
            # If the user is unconfirmed, resend the verification code so they can complete verification
            try:
                resend_res = cognito_resend_confirmation_code(username)
                return {
                    "user_sub": None,
                    "user_confirmed": False,
                    "code_delivery_details": resend_res or {"Destination": email.strip().lower()},
                }
            except Exception:
                try:
                    resend_res = cognito_resend_confirmation_code(email)
                    return {
                        "user_sub": None,
                        "user_confirmed": False,
                        "code_delivery_details": resend_res or {"Destination": email.strip().lower()},
                    }
                except Exception:
                    pass
        raise _translate_cognito_error(exc) from exc


def cognito_confirm_sign_up(username: str, confirmation_code: str) -> bool:
    """Confirm a user's registration using the confirmation code received via email."""
    if not is_cognito_configured():
        return True

    client = get_cognito_client()
    secret_hash = calculate_secret_hash(username)

    kwargs: Dict[str, Any] = {
        "ClientId": settings.COGNITO_CLIENT_ID,
        "Username": username.strip(),
        "ConfirmationCode": confirmation_code.strip(),
    }
    if secret_hash:
        kwargs["SecretHash"] = secret_hash

    try:
        client.confirm_sign_up(**kwargs)
        return True
    except ClientError as exc:
        raise _translate_cognito_error(exc) from exc


def cognito_resend_confirmation_code(username: str) -> Dict[str, Any]:
    """Request a new confirmation code for an unconfirmed Cognito user."""
    if not is_cognito_configured():
        return {"Destination": username.strip()}

    client = get_cognito_client()
    secret_hash = calculate_secret_hash(username)

    kwargs: Dict[str, Any] = {
        "ClientId": settings.COGNITO_CLIENT_ID,
        "Username": username.strip(),
    }
    if secret_hash:
        kwargs["SecretHash"] = secret_hash

    try:
        response = client.resend_confirmation_code(**kwargs)
        return response.get("CodeDeliveryDetails", {})
    except ClientError as exc:
        raise _translate_cognito_error(exc) from exc


def cognito_initiate_auth(username: str, password: str) -> Dict[str, Any]:
    """
    Authenticate user credentials with Cognito using USER_PASSWORD_AUTH flow.
    Returns access_token, id_token, refresh_token, and token_type.
    """
    if not is_cognito_configured():
        from app.services.security import create_access_token, create_refresh_token
        access_token = create_access_token({"sub": username.strip(), "username": username.strip()})
        refresh_token = create_refresh_token({"sub": username.strip()})
        return {
            "access_token": access_token,
            "id_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 3600,
        }

    client = get_cognito_client()
    secret_hash = calculate_secret_hash(username)

    auth_params: Dict[str, str] = {
        "USERNAME": username.strip(),
        "PASSWORD": password,
    }
    if secret_hash:
        auth_params["SECRET_HASH"] = secret_hash

    try:
        response = client.initiate_auth(
            ClientId=settings.COGNITO_CLIENT_ID,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters=auth_params,
        )
        auth_result = response.get("AuthenticationResult", {})
        return {
            "access_token": auth_result.get("AccessToken"),
            "id_token": auth_result.get("IdToken"),
            "refresh_token": auth_result.get("RefreshToken"),
            "token_type": auth_result.get("TokenType", "bearer"),
            "expires_in": auth_result.get("ExpiresIn", 3600),
        }
    except ClientError as exc:
        raise _translate_cognito_error(exc) from exc

def cognito_exchange_code_for_token(code: str) -> Dict[str, Any]:
    """Exchange OAuth authorization code for tokens via Cognito Hosted UI."""
    if not is_cognito_configured() or not getattr(settings, "COGNITO_DOMAIN", None):
        raise ValueError("Cognito domain not configured for OAuth.")

    domain = settings.COGNITO_DOMAIN.strip()
    client_id = settings.COGNITO_CLIENT_ID.strip()
    client_secret = settings.COGNITO_CLIENT_SECRET.strip()
    redirect_uri = getattr(settings, "COGNITO_CALLBACK_URL", "http://localhost:3000/auth/callback").strip()

    url = f"https://{domain}/oauth2/token"
    
    auth_header = base64.b64encode(f"{client_id}:{client_secret}".encode("utf-8")).decode("utf-8")
    
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": f"Basic {auth_header}",
    }
    
    data = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "code": code.strip(),
        "redirect_uri": redirect_uri,
    }
    
    try:
        resp = requests.post(url, headers=headers, data=data, timeout=10)
        resp.raise_for_status()
        auth_result = resp.json()
        return {
            "access_token": auth_result.get("access_token"),
            "id_token": auth_result.get("id_token"),
            "refresh_token": auth_result.get("refresh_token"),
            "token_type": auth_result.get("token_type", "bearer"),
            "expires_in": auth_result.get("expires_in", 3600),
        }
    except requests.exceptions.RequestException as exc:
        logger.error("Cognito oauth2/token error: %s", exc)
        if hasattr(exc, "response") and exc.response is not None:
            logger.error("Response: %s", exc.response.text)
        raise ValueError("Failed to authenticate with Google.")

def cognito_get_user(access_token: str) -> Dict[str, Any]:
    """Retrieve user attributes using Cognito AccessToken via GetUser API."""
    if not is_cognito_configured() or not access_token:
        return {}
    client = get_cognito_client()
    try:
        resp = client.get_user(AccessToken=access_token.strip())
        attrs = {a["Name"]: a["Value"] for a in resp.get("UserAttributes", [])}
        return {
            "username": resp.get("Username"),
            "sub": attrs.get("sub"),
            "email": attrs.get("email"),
            "email_verified": attrs.get("email_verified") == "true",
        }
    except Exception as exc:
        logger.debug("Cognito get_user error: %s", exc)
        return {}


def cognito_refresh_auth(refresh_token: str, username: Optional[str] = None) -> Dict[str, Any]:
    """
    Obtain a new access token and id token using a Cognito refresh token.
    """
    if not is_cognito_configured():
        from app.services.security import create_access_token
        access_token = create_access_token({"sub": username or "user", "username": username or "user"})
        return {
            "access_token": access_token,
            "id_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 3600,
        }

    client = get_cognito_client()
    auth_params: Dict[str, str] = {
        "REFRESH_TOKEN": refresh_token.strip(),
    }
    if username and settings.COGNITO_CLIENT_SECRET:
        secret_hash = calculate_secret_hash(username)
        if secret_hash:
            auth_params["SECRET_HASH"] = secret_hash

    try:
        response = client.initiate_auth(
            ClientId=settings.COGNITO_CLIENT_ID,
            AuthFlow="REFRESH_TOKEN_AUTH",
            AuthParameters=auth_params,
        )
        auth_result = response.get("AuthenticationResult", {})
        return {
            "access_token": auth_result.get("AccessToken"),
            "id_token": auth_result.get("IdToken"),
            "refresh_token": auth_result.get("RefreshToken", refresh_token),
            "token_type": auth_result.get("TokenType", "bearer"),
            "expires_in": auth_result.get("ExpiresIn", 3600),
        }
    except ClientError as exc:
        raise _translate_cognito_error(exc) from exc


def cognito_forgot_password(username: str) -> Dict[str, Any]:
    """Initiate the password recovery flow in Cognito."""
    if not is_cognito_configured():
        return {"Destination": username.strip()}

    client = get_cognito_client()
    secret_hash = calculate_secret_hash(username)

    kwargs: Dict[str, Any] = {
        "ClientId": settings.COGNITO_CLIENT_ID,
        "Username": username.strip(),
    }
    if secret_hash:
        kwargs["SecretHash"] = secret_hash

    try:
        response = client.forgot_password(**kwargs)
        return response.get("CodeDeliveryDetails", {})
    except ClientError as exc:
        raise _translate_cognito_error(exc) from exc


def cognito_confirm_forgot_password(
    username: str, confirmation_code: str, new_password: str
) -> bool:
    """Complete password recovery using the confirmation code and new password."""
    if not is_cognito_configured():
        return True

    client = get_cognito_client()
    secret_hash = calculate_secret_hash(username)

    kwargs: Dict[str, Any] = {
        "ClientId": settings.COGNITO_CLIENT_ID,
        "Username": username.strip(),
        "ConfirmationCode": confirmation_code.strip(),
        "Password": new_password,
    }
    if secret_hash:
        kwargs["SecretHash"] = secret_hash

    try:
        client.confirm_forgot_password(**kwargs)
        return True
    except ClientError as exc:
        raise _translate_cognito_error(exc) from exc


def cognito_global_sign_out(access_token: str) -> bool:
    """Invalidate all active sessions for the user across devices."""
    client = get_cognito_client()
    try:
        client.global_sign_out(AccessToken=access_token.strip())
        return True
    except Exception as exc:
        logger.debug("Cognito global signout exception: %s", exc)
        return False


def get_cognito_jwks() -> Dict[str, Any]:
    """
    Fetch and cache the JSON Web Key Set (JWKS) for the configured Cognito User Pool.
    """
    global _JWKS_CACHE, _JWKS_LAST_FETCHED

    now = time.time()
    if _JWKS_CACHE and (now - _JWKS_LAST_FETCHED < _JWKS_CACHE_TTL):
        return _JWKS_CACHE

    region = settings.AWS_REGION or "us-east-1"
    user_pool_id = settings.COGNITO_USER_POOL_ID.strip() if settings.COGNITO_USER_POOL_ID else ""

    if not user_pool_id:
        return {}

    jwks_url = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"

    try:
        resp = requests.get(jwks_url, timeout=10)
        resp.raise_for_status()
        jwks = resp.json()
        _JWKS_CACHE = jwks
        _JWKS_LAST_FETCHED = now
        return _JWKS_CACHE
    except Exception as exc:
        logger.error("Failed to fetch Cognito JWKS from %s: %s", jwks_url, exc)
        if _JWKS_CACHE:
            return _JWKS_CACHE
        return {}


def verify_cognito_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode a Cognito JWT (AccessToken or IdToken).
    Validates:
    - Signature using Cognito's RS256 public keys (JWKS)
    - Expiration (exp)
    - Issuer (iss)
    - Token use ('access' or 'id')
    - Subject (sub)
    """
    if not token or not token.strip():
        raise ValueError("Token is required.")

    clean_token = token.strip()
    region = settings.AWS_REGION or "us-east-1"
    user_pool_id = settings.COGNITO_USER_POOL_ID.strip() if settings.COGNITO_USER_POOL_ID else ""
    expected_issuer = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}" if user_pool_id else None

    # 1. Unverified header to find key ID (kid)
    try:
        unverified_header = jwt.get_unverified_header(clean_token)
        kid = unverified_header.get("kid")
    except JWTError as exc:
        raise ValueError("Malformed token header.") from exc

    jwks = get_cognito_jwks()
    keys = jwks.get("keys", [])
    key_dict = next((k for k in keys if k.get("kid") == kid), None)

    if not key_dict:
        # If JWKS is not available or kid is missing (e.g. offline dev/testing), check for test mode decode
        if not user_pool_id:
            try:
                # In mock/offline mode, decode unverified claims safely for test environments
                claims = jwt.get_unverified_claims(clean_token)
                if not claims.get("sub"):
                    raise ValueError("Token missing 'sub' claim.")
                return claims
            except Exception as e:
                raise ValueError("Could not validate credentials.") from e
        raise ValueError("Invalid token key identifier (kid).")

    # 2. Decode and verify signature with RS256 public key
    try:
        decode_kwargs: Dict[str, Any] = {
            "algorithms": ["RS256"],
            "options": {
                "require_exp": True,
                "require_sub": True,
                "verify_aud": False,  # Access tokens use client_id claim instead of aud
            },
        }
        if expected_issuer:
            decode_kwargs["issuer"] = expected_issuer

        payload = jwt.decode(clean_token, key_dict, **decode_kwargs)

        # Validate token_use
        token_use = payload.get("token_use")
        if token_use not in ("access", "id"):
            raise ValueError(f"Invalid token_use: {token_use}")

        # If access token, verify client_id match
        if token_use == "access" and settings.COGNITO_CLIENT_ID:
            token_client_id = payload.get("client_id")
            if token_client_id and token_client_id != settings.COGNITO_CLIENT_ID.strip():
                raise ValueError("Token client_id mismatch.")

        return payload

    except JWTError as exc:
        raise ValueError("Token validation failed.") from exc
