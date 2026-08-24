"""
FastAPI Router for Roommate Compatibility Matching & Recommendations.
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.matching import (
    DirectPredictionRequest,
    PredictionResponse,
    RecommendationResponse,
    UserPairPredictionRequest,
)
from app.services.matching import (
    get_recommendations,
    predict_direct,
    predict_user_pair,
)

router = APIRouter(
    prefix="/matching",
    tags=["Matching & Recommendations"],
)


@router.post(
    "/predict/direct",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict compatibility directly from two student attribute dictionaries",
)
def predict_profiles_direct(payload: DirectPredictionRequest):
    """
    Direct prediction endpoint: evaluates ML compatibility and sub-dimensional
    signals for two student dictionaries without requiring database records.
    """
    return predict_direct(
        student_1_data=payload.student_1,
        student_2_data=payload.student_2,
    )


@router.post(
    "/predict/user",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict compatibility between the authenticated user and a prospective roommate",
)
def predict_user_compatibility(
    payload: UserPairPredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Evaluate ML compatibility between the current authenticated user and a specific
    registered candidate user from the database.
    """
    return predict_user_pair(
        db=db,
        current_user=current_user,
        candidate_user_id=payload.candidate_user_id,
    )


@router.get(
    "/recommendations",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve ranked roommate recommendations for the authenticated user",
)
def get_user_recommendations(
    top_n: int = Query(default=10, ge=1, le=50, description="Max candidates to return"),
    min_label: Optional[str] = Query(default=None, pattern="^(High|Medium|Low)$", description="Filter minimum label"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Query candidate roommates from the database, evaluate ML compatibility for each pair,
    and return ranked matches along with sub-dimensional signals and rule explainability.
    """
    return get_recommendations(
        db=db,
        current_user=current_user,
        top_n=top_n,
        min_label=min_label,
    )
