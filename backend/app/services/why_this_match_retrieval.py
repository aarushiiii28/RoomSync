from typing import Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.user import User
from app.services.matching import predict_user_pair


def bucket_scale(value: int) -> str:
    """Bucket a 1-5 scale into qualitative tags."""
    if value <= 2:
        return "low"
    elif value == 3:
        return "medium"
    else:
        return "high"


def bucket_gaming_hours(hours: int) -> str:
    """Bucket gaming hours into qualitative tags."""
    if hours == 0:
        return "none"
    elif hours <= 2:
        return "low"
    elif hours <= 5:
        return "medium"
    else:
        return "high"


def get_public_bio(db: Session, user_id: UUID) -> Optional[str]:
    """Retrieve public bio for a given user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.profile:
        return None
    return user.profile.bio


def get_private_expectations(db: Session, user_id: UUID) -> Optional[str]:
    """
    Retrieve private expectations for a given user.
    WARNING: Server-side use only. NEVER send this raw text to the frontend or LLM payload.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.profile:
        return None
    return user.profile.roommate_expectations


def get_shareable_profile_fields(db: Session, user_id: UUID) -> Dict[str, Any]:
    """
    Retrieve only whitelisted shareable profile fields.
    Numeric/scaled lifestyle fields are bucketed into qualitative tags.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {}
    
    fields = {}
    
    # Lifestyle Fields
    if user.lifestyle_profile:
        lp = user.lifestyle_profile
        fields.update({
            "sleep_time": lp.sleep_time.strftime("%H:%M") if lp.sleep_time else None,
            "wake_time": lp.wake_time.strftime("%H:%M") if lp.wake_time else None,
            "schedule_consistency": bucket_scale(lp.schedule_consistency),
            "study_hours": bucket_scale(lp.study_hours),
            "noise_sleep_tolerance": bucket_scale(lp.noise_sleep_tolerance),
            "cleanliness_score": bucket_scale(lp.cleanliness_score),
            "privacy_preference": bucket_scale(lp.privacy_preference),
            "talkativeness": bucket_scale(lp.talkativeness),
            "friendship_expectation": bucket_scale(lp.friendship_expectation),
            "gaming_hours": bucket_gaming_hours(lp.gaming_hours),
            
            "cleanliness": lp.cleanliness.value if lp.cleanliness else None,
            "cleanliness_importance": lp.cleanliness_importance.value if lp.cleanliness_importance else None,
            "smoking": lp.smoking.value if lp.smoking else None,
            "smoking_tolerance": lp.smoking_tolerance.value if lp.smoking_tolerance else None,
            "drinking": lp.drinking.value if lp.drinking else None,
            "drinking_tolerance": lp.drinking_tolerance.value if lp.drinking_tolerance else None,
            "pets": lp.pets.value if lp.pets else None,
            "pet_tolerance": lp.pet_tolerance.value if lp.pet_tolerance else None,
            "guest_frequency": lp.guest_frequency.value if lp.guest_frequency else None,
            "guest_tolerance": lp.guest_tolerance.value if lp.guest_tolerance else None,
            "cooking": lp.cooking.value if lp.cooking else None,
            "cooking_tolerance": lp.cooking_tolerance.value if lp.cooking_tolerance else None,
            "party_frequency": lp.party_frequency.value if lp.party_frequency else None,
            "party_tolerance": lp.party_tolerance.value if lp.party_tolerance else None,
            "fitness": lp.fitness.value if lp.fitness else None,
            "music": "yes" if lp.music else "no",
            "work_from_home": "yes" if lp.work_from_home else "no",
        })
        
    # Accommodation Preferences
    if user.accommodation_preference:
        ap = user.accommodation_preference
        fields.update({
            "move_in_timeframe": ap.move_in_timeframe.value if ap.move_in_timeframe else None,
            "accommodation_type": ap.accommodation_type.value if ap.accommodation_type else None,
            "room_type": ap.room_type.value if ap.room_type else None,
            "lease_duration": ap.lease_duration.value if ap.lease_duration else None,
        })
        
    # Strip any None values to keep the payload clean and minimal
    return {k: v for k, v in fields.items() if v is not None}


def get_xgboost_signal(db: Session, user_a_id: UUID, user_b_id: UUID) -> Dict[str, Any]:
    """Retrieve existing compatibility label and feature signals for a pair of users."""
    user_a = db.query(User).filter(User.id == user_a_id).first()
    if not user_a:
        raise HTTPException(status_code=404, detail="User A not found")
        
    # We reuse the existing prediction logic verbatim
    prediction = predict_user_pair(db, current_user=user_a, candidate_user_id=user_b_id)
    
    return {
        "compatibility_label": prediction.compatibility_label,
        "feature_signals": prediction.feature_signals
    }


def get_user_a_context(db: Session, user_a_id: UUID) -> Dict[str, Any]:
    """Retrieve User A's own context for comparative explanation."""
    bio = get_public_bio(db, user_a_id)
    shareable_tags = get_shareable_profile_fields(db, user_a_id)
    return {
        "bio": bio,
        "shareable_tags": shareable_tags
    }
