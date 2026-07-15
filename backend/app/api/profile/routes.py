import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from app.services import profile_service

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("/", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve the current user's profile."""
    return profile_service.get_profile(db, current_user.id)


@router.post("/", response_model=ProfileResponse, status_code=201)
def create_profile(
    payload: ProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create or update the current user's profile."""
    return profile_service.create_or_update_profile(db, current_user.id, payload)


@router.put("/", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update the current user's profile."""
    return profile_service.create_or_update_profile(db, current_user.id, payload)
