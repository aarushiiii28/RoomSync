"""
RoomSync Matching Service — Connects FastAPI backend to the ML inference pipeline.
"""

import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID

# Ensure project root is available for src imports
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.lifestyle_profile import LifestyleProfile
from app.schemas.matching import (
    CandidateMatchItem,
    PredictionResponse,
    RecommendationResponse,
    RuleExplainability,
)

from src.matching.ml_adapter import build_ml_student, build_student_from_user
from src.matching.prediction_pipeline import predict
from src.matching.recommendation_engine import rank_roommate_candidates
from src.matching.compatibility_engine import calculate_compatibility


def predict_direct(
    student_1_data: Dict[str, Any],
    student_2_data: Dict[str, Any]
) -> PredictionResponse:
    """
    Evaluate roommate compatibility directly from two attribute dictionaries.
    """
    s1, def1 = build_ml_student(student_1_data)
    s2, def2 = build_ml_student(student_2_data)

    ml_result = predict(s1, s2)

    return PredictionResponse(
        prediction=ml_result["prediction"],
        compatibility_label=ml_result["compatibility_label"],
        confidence=ml_result["confidence"],
        probabilities=ml_result["probabilities"],
        feature_signals=ml_result["feature_signals"],
        defaulted_fields_s1=def1,
        defaulted_fields_s2=def2,
    )


def predict_user_pair(
    db: Session,
    current_user: User,
    candidate_user_id: UUID
) -> PredictionResponse:
    """
    Evaluate roommate compatibility between current authenticated user and another user in the DB.
    """
    if current_user.id == candidate_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot evaluate compatibility with yourself."
        )

    candidate_user = db.query(User).filter(User.id == candidate_user_id).first()
    if not candidate_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate user with ID {candidate_user_id} not found."
        )

    # Ensure both users have lifestyle profiles
    if not current_user.lifestyle_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your profile is incomplete. Please finish lifestyle onboarding before matching."
        )

    if not candidate_user.lifestyle_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate user has not completed lifestyle onboarding."
        )

    s1, def1 = build_student_from_user(current_user)
    s2, def2 = build_student_from_user(candidate_user)

    ml_result = predict(s1, s2)

    return PredictionResponse(
        prediction=ml_result["prediction"],
        compatibility_label=ml_result["compatibility_label"],
        confidence=ml_result["confidence"],
        probabilities=ml_result["probabilities"],
        feature_signals=ml_result["feature_signals"],
        defaulted_fields_s1=def1,
        defaulted_fields_s2=def2,
    )


def get_recommendations(
    db: Session,
    current_user: User,
    top_n: int = 10,
    min_label: Optional[str] = None
) -> RecommendationResponse:
    """
    Find and rank prospective roommate candidates from the database for the current user.
    """
    if not current_user.lifestyle_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your lifestyle profile before requesting roommate matches."
        )

    target_student, _ = build_student_from_user(current_user)

    # Determine current user's gender, roommate gender preference, and accommodation type
    current_prof = current_user.profile
    current_user_gender: Optional[str] = (
        current_prof.gender.value if (current_prof and current_prof.gender) else None
    )

    current_pref = current_user.roommate_preference
    current_preferred_gender: Optional[str] = (
        current_pref.preferred_gender.value
        if (current_pref and current_pref.preferred_gender and current_pref.preferred_gender.value != "any")
        else None
    )

    current_acc = current_user.accommodation_preference
    current_accommodation_type: Optional[str] = (
        current_acc.accommodation_type.value
        if (current_acc and current_acc.accommodation_type)
        else None
    )

    # Query active candidate users who have completed lifestyle onboarding
    candidate_users = (
        db.query(User)
        .join(LifestyleProfile, User.id == LifestyleProfile.user_id)
        .filter(User.id != current_user.id, User.is_active == True)
        .all()
    )

    if not candidate_users:
        return RecommendationResponse(matches=[], total_evaluated=0)

    # Build student dictionary pool with DB metadata attached
    candidate_records: List[Dict[str, Any]] = []
    user_metadata: Dict[str, Dict[str, Any]] = {}

    for user in candidate_users:
        prof = user.profile
        loc = user.location
        cand_pref = user.roommate_preference
        cand_acc = user.accommodation_preference

        # Candidate's gender & accommodation type
        candidate_gender = prof.gender.value if (prof and prof.gender) else None
        candidate_accommodation_type = (
            cand_acc.accommodation_type.value
            if (cand_acc and cand_acc.accommodation_type)
            else None
        )

        # Candidate's preferred gender for roommates
        candidate_preferred_gender = (
            cand_pref.preferred_gender.value
            if (cand_pref and cand_pref.preferred_gender and cand_pref.preferred_gender.value != "any")
            else None
        )

        # ── 1. Bidirectional Accommodation Type Filter ──────────────────────
        # If accommodation type differs, do not show matches on both sides.
        if current_accommodation_type is not None or candidate_accommodation_type is not None:
            if current_accommodation_type != candidate_accommodation_type:
                continue

        # ── 2. Bidirectional Hard Gender Filter ─────────────────────────────
        # If current user has a strict gender preference (female / male / non_binary),
        # candidate's gender must match.
        if current_preferred_gender is not None:
            if candidate_gender != current_preferred_gender:
                continue

        # If candidate has a strict gender preference (female / male / non_binary),
        # current user's gender must match (vice versa).
        if candidate_preferred_gender is not None:
            if current_user_gender != candidate_preferred_gender:
                continue
        # ────────────────────────────────────────────────────────────────────

        s_dict, _ = build_student_from_user(user)
        user_id_str = str(user.id)
        s_dict["student_id"] = user_id_str

        # Capture public display info
        user_metadata[user_id_str] = {
            "first_name": prof.first_name if prof else None,
            "last_name": prof.last_name if prof else None,
            "age": s_dict.get("age"),
            "gender": prof.gender.value if (prof and prof.gender) else None,
            "occupation": prof.occupation if prof else None,
            "bio": prof.bio if prof else None,
            "city": loc.city if loc else None,
            "profile_photo_url": prof.profile_photo_url if prof else None,
        }
        candidate_records.append(s_dict)

    # Execute ML ranking & rule explainability
    ranked_candidates = rank_roommate_candidates(
        target_student=target_student,
        candidate_students=candidate_records,
        top_n=top_n,
        min_label=min_label,
    )

    matches: List[CandidateMatchItem] = []
    for item in ranked_candidates:
        cid = str(item["candidate_id"])
        meta = user_metadata.get(cid, {})

        match_item = CandidateMatchItem(
            candidate_id=cid,
            first_name=meta.get("first_name"),
            last_name=meta.get("last_name"),
            age=meta.get("age"),
            gender=meta.get("gender"),
            occupation=meta.get("occupation"),
            bio=meta.get("bio"),
            city=meta.get("city"),
            profile_photo_url=meta.get("profile_photo_url"),
            prediction=item["prediction"],
            confidence=item["confidence"],
            probabilities=item["probabilities"],
            feature_signals=item["feature_signals"],
            rule_based_explainability=RuleExplainability(
                rule_score=item["rule_based_explainability"]["rule_score"],
                feature_breakdown=item["rule_based_explainability"]["feature_breakdown"],
            ),
        )
        matches.append(match_item)

    return RecommendationResponse(
        matches=matches,
        total_evaluated=len(candidate_records)
    )
