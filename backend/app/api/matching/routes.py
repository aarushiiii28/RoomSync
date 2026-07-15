import uuid
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.auth.dependencies import get_db, get_current_active_user
from app.core.constants import DEFAULT_MATCH_LIMIT
from app.models.user import User
from app.schemas.match import MatchResponse, MatchStatusUpdate
from app.services import matching_service

router = APIRouter(prefix="/matches", tags=["Matching"])


@router.post("/find", response_model=List[MatchResponse])
def find_matches(
    limit: int = Query(DEFAULT_MATCH_LIMIT, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Compute and return the best roommate matches for the current user."""
    return matching_service.find_matches(db, current_user.id, limit=limit)


@router.get("/", response_model=List[MatchResponse])
def get_matches(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Return all existing matches for the current user."""
    return matching_service.get_matches(db, current_user.id)


@router.patch("/{match_id}", response_model=MatchResponse)
def update_match_status(
    match_id: uuid.UUID,
    payload: MatchStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Accept or reject a match."""
    return matching_service.update_match_status(db, match_id, current_user.id, payload.status)
