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
from app.services.logistics_scoring import (
    evaluate_budget,
    score_lease_duration,
    score_move_in_timeframe,
    score_room_preference,
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
        
    if not is_authorized_match(current_user, candidate_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to evaluate compatibility with this user."
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


def is_authorized_match(requesting_user: User, candidate_user: User) -> bool:
    """
    Evaluates whether candidate_user is an authorized and compatible match for requesting_user.
    - Sections 1 & 2 (Accommodation Type, Hard Gender) are bidirectional.
    - Section 3 (Group-A Deal-breakers) is directional (requesting_user's deal-breakers vs candidate_user's lifestyle).
    """
    prof_a = requesting_user.profile
    pref_a = requesting_user.roommate_preference
    acc_a = requesting_user.accommodation_preference
    
    prof_b = candidate_user.profile
    pref_b = candidate_user.roommate_preference
    acc_b = candidate_user.accommodation_preference
    
    # ── 1. Bidirectional Accommodation Type Filter ──────────────────────
    acc_type_a = acc_a.accommodation_type.value if (acc_a and acc_a.accommodation_type) else None
    acc_type_b = acc_b.accommodation_type.value if (acc_b and acc_b.accommodation_type) else None
    
    if acc_type_a is not None or acc_type_b is not None:
        if acc_type_a != acc_type_b:
            return False
            
    # ── 2. Bidirectional Hard Gender Filter ─────────────────────────────
    gender_a = prof_a.gender.value if (prof_a and prof_a.gender) else None
    pref_gender_a = pref_a.preferred_gender.value if (pref_a and pref_a.preferred_gender and pref_a.preferred_gender.value != "any") else None
    
    gender_b = prof_b.gender.value if (prof_b and prof_b.gender) else None
    pref_gender_b = pref_b.preferred_gender.value if (pref_b and pref_b.preferred_gender and pref_b.preferred_gender.value != "any") else None
    
    if pref_gender_a is not None and gender_b != pref_gender_a:
        return False
    if pref_gender_b is not None and gender_a != pref_gender_b:
        return False

    # ── 3. One-directional Group-A Deal-breaker Filter ──────────────────
    # Check requesting_user's deal-breakers against candidate_user's lifestyle profile.
    deal_breakers_a = set(pref_a.deal_breakers) if (pref_a and pref_a.deal_breakers) else set()
    lp_b = candidate_user.lifestyle_profile
    if lp_b:
        _DEAL_BREAKER_CHECKS = {
            "smoking":           lambda lp: lp.smoking is not None and lp.smoking.value in ("occasionally", "regularly"),
            "drinking":          lambda lp: lp.drinking is not None and lp.drinking.value == "regularly",
            "pets":              lambda lp: lp.pets is not None and lp.pets.value == "has_pets",
            "frequent_visitors": lambda lp: lp.guest_frequency is not None and lp.guest_frequency.value in ("often", "always"),
            "untidy_living":     lambda lp: lp.cleanliness is not None and lp.cleanliness.value == "relaxed",
        }
        for db_key, check_fn in _DEAL_BREAKER_CHECKS.items():
            if db_key in deal_breakers_a and check_fn(lp_b):
                return False
        
    return True


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
        if not is_authorized_match(current_user, user):
            continue
            
        acc_a = current_user.accommodation_preference
        acc_b = user.accommodation_preference
        
        # If either is missing their accommodation preference, they get a neutral score
        # and are NOT excluded. (Prevents silent drops of users with partial profiles).
        if not acc_a or not acc_b:
            logistics_score = 0.5
        else:
            # 1. Budget Hard Filter
            min_a = float(acc_a.budget_min)
            max_a = float(acc_a.budget_max)
            min_b = float(acc_b.budget_min)
            max_b = float(acc_b.budget_max)
            is_viable, budget_score = evaluate_budget(min_a, max_a, min_b, max_b)
            if not is_viable:
                continue
                
            # 2. Logistics Scored Signals
            room_a = acc_a.room_type.value if acc_a.room_type else None
            room_b = acc_b.room_type.value if acc_b.room_type else None
            room_score = score_room_preference(room_a, room_b)
            
            move_a = acc_a.move_in_timeframe.value if acc_a.move_in_timeframe else None
            move_b = acc_b.move_in_timeframe.value if acc_b.move_in_timeframe else None
            move_score = score_move_in_timeframe(move_a, move_b)
            
            lease_a = acc_a.lease_duration.value if acc_a.lease_duration else None
            lease_b = acc_b.lease_duration.value if acc_b.lease_duration else None
            lease_score = score_lease_duration(lease_a, lease_b)
            
            logistics_score = (room_score + move_score + lease_score + budget_score) / 4.0

        prof = user.profile
        loc = user.location
        
        s_dict, _ = build_student_from_user(user)
        user_id_str = str(user.id)
        s_dict["student_id"] = user_id_str
        # Deliberately NOT adding logistics_score to s_dict to keep ML payload pure.

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
            "logistics_score": logistics_score,
        }
        candidate_records.append(s_dict)

    # Extract logistics scores to pass to the ranking engine without polluting ML payloads
    logistics_scores_dict = {
        cid: meta.get("logistics_score", 0.0) 
        for cid, meta in user_metadata.items()
    }

    # Execute ML ranking & rule explainability
    ranked_candidates = rank_roommate_candidates(
        target_student=target_student,
        candidate_students=candidate_records,
        top_n=top_n,
        min_label=min_label,
        logistics_scores=logistics_scores_dict,
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
            logistics_score=meta.get("logistics_score", 0.0),
        )
        matches.append(match_item)

    return RecommendationResponse(
        matches=matches,
        total_evaluated=len(candidate_records)
    )
