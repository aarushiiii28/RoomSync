"""
Onboarding router — Phase 2, Step 5 & Step 7 (Save & Exit).

Endpoints
---------
POST  /onboarding     — create or update the authenticated user's complete onboarding profile.
PATCH /onboarding     — save partial onboarding progress (Save & Exit).
GET   /onboarding/me  — retrieve the authenticated user's onboarding progress/profile.

Security contract
-----------------
All endpoints require a valid JWT access token. ``get_current_user`` resolves
the token to the live ``User`` ORM object; that object is passed directly to the
service layer. The client can never supply or override ``user_id``.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.onboarding import (
    OnboardingCreate,
    OnboardingPartialUpdate,
    OnboardingProgressResponse,
    OnboardingResponse,
)
from app.services.onboarding import (
    create_or_update_onboarding,
    get_onboarding_progress,
    save_partial_onboarding,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/onboarding",
    tags=["Onboarding"],
)


# ---------------------------------------------------------------------------
# POST /onboarding (Complete Submission)
# ---------------------------------------------------------------------------


@router.post(
    "",
    response_model=OnboardingResponse,
    status_code=status.HTTP_200_OK,
    summary="Create or update complete onboarding profile",
    description=(
        "Submit the complete onboarding profile for the authenticated user. "
        "If onboarding data already exists it is updated; otherwise it is created. "
        "The authenticated user's identity is derived exclusively from the JWT token."
    ),
)
def submit_onboarding(
    payload: OnboardingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OnboardingResponse:
    """
    Create or update the complete onboarding profile for the authenticated user.
    Requires all five sections.
    """
    try:
        return create_or_update_onboarding(db, user=current_user, payload=payload)
    except RuntimeError:
        logger.exception(
            "Onboarding save failed for user_id=%s", current_user.id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later.",
        )


# ---------------------------------------------------------------------------
# PATCH /onboarding (Partial Save / Save & Exit)
# ---------------------------------------------------------------------------


@router.patch(
    "",
    response_model=OnboardingProgressResponse,
    status_code=status.HTTP_200_OK,
    summary="Save partial onboarding progress",
    description=(
        "Save or update whichever onboarding sections are supplied in the request body. "
        "Used by 'Save and Exit' on any step of profile completion."
    ),
)
def save_partial_progress(
    payload: OnboardingPartialUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OnboardingProgressResponse:
    """
    Save partial onboarding progress for the authenticated user.
    Only provided sections are validated and persisted.
    """
    try:
        return save_partial_onboarding(db, user=current_user, payload=payload)
    except RuntimeError:
        logger.exception(
            "Partial onboarding save failed for user_id=%s", current_user.id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later.",
        )


# ---------------------------------------------------------------------------
# GET /onboarding/me (Retrieve Progress or Profile)
# ---------------------------------------------------------------------------


@router.get(
    "/me",
    response_model=OnboardingProgressResponse,
    status_code=status.HTTP_200_OK,
    summary="Get onboarding profile progress",
    description=(
        "Retrieve the onboarding progress for the authenticated user. "
        "Returns 404 if no onboarding data has been started yet. "
        "Returns 200 with saved sections and is_complete boolean flag."
    ),
)
def get_my_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OnboardingProgressResponse:
    """
    Retrieve the authenticated user's onboarding progress.
    Returns HTTP 404 when no profile records exist at all.
    """
    try:
        result = get_onboarding_progress(db, user=current_user)
    except RuntimeError:
        logger.exception(
            "Onboarding fetch failed for user_id=%s", current_user.id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later.",
        )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding profile not found. Please complete onboarding first.",
        )

    return result
