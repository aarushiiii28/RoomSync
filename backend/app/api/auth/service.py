# Service logic for auth is in app/services/auth_service.py
# This file is intentionally thin — it re-exports the service for use in routes.
from app.services import auth_service as _auth_service  # noqa: F401
