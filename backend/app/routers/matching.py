"""
FastAPI Router for Roommate Compatibility Matching & Recommendations.
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status, HTTPException
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
    is_authorized_match,
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


# --- New imports for Why This Match ---
from app.schemas.matching import MatchBriefingResponse
from app.services.why_this_match_generation import generate_match_briefing
from app.services.why_this_match_validation import validate_match_briefing, MatchValidationException
import logging

logger = logging.getLogger(__name__)

def _get_fallback_briefing() -> dict:
    """Returns a safe, schema-compliant fallback response."""
    return {
        "headline": "We don't have enough information to explain this match yet.",
        "what_they_value": "More details will be available as you both fill out your profiles.",
        "living_style": "Check their bio and profile tags to learn more.",
        "alignment_points": ["Review their profile directly"],
        "differences_to_discuss": ["Message them to see if you're a good fit"],
        "questions_to_ask": ["What are you looking for in a roommate?"]
    }

@router.get(
    "/why-this-match/{candidate_id}",
    response_model=MatchBriefingResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a private matching explanation briefing for a candidate"
)
def get_why_this_match(
    candidate_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves the generated 'Why This Match' explanation for the current user 
    regarding the specified candidate. Returns a safe fallback if data is insufficient 
    or if any guardrails fail.
    """
    # Authorization Check
    candidate_user = db.query(User).filter(User.id == candidate_id).first()
    if not candidate_user or not is_authorized_match(current_user, candidate_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view a match briefing for this user."
        )

    try:
        # Step 1-5: Generation (orchestrates retrieval, tag extraction, and generation)
        (raw_json_str, raw_exp_a, raw_exp_b, summary_a, summary_b, bio_a, bio_b) = generate_match_briefing(
            db=db, 
            user_a_id=current_user.id, 
            user_b_id=candidate_id
        )
        
        # Step 6: Validation (strict deterministic safety checks)
        briefing = validate_match_briefing(
            raw_json_str=raw_json_str,
            raw_expectations_a=raw_exp_a,
            raw_expectations_b=raw_exp_b,
            tags_a=summary_a,
            tags_b=summary_b,
            bio_a=bio_a,
            bio_b=bio_b
        )
        return briefing
        
    except MatchValidationException as e:
        logger.warning(f"Validation failed for why-this-match (users {current_user.id} -> {candidate_id}): {str(e)}")
        # Conscious V1 choice: Straight to fallback on first failure, no LLM retry loop.
        return _get_fallback_briefing()
        
    except Exception as e:
        logger.error(f"Error generating why-this-match (users {current_user.id} -> {candidate_id}): {str(e)}", exc_info=True)
        return _get_fallback_briefing()
