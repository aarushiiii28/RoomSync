import uuid

from sqlalchemy.orm import Session

from app.models.profile import Profile
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from app.utils.exceptions import UserNotFoundException
from app.utils.validators import validate_budget_range


def get_profile(db: Session, user_id: uuid.UUID) -> ProfileResponse:
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise UserNotFoundException(detail="Profile not found.")
    return ProfileResponse.model_validate(profile)


def create_or_update_profile(
    db: Session, user_id: uuid.UUID, payload: ProfileCreate | ProfileUpdate
) -> ProfileResponse:
    validate_budget_range(payload.budget_min, payload.budget_max)

    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if profile:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)
    else:
        profile = Profile(user_id=user_id, **payload.model_dump(exclude_unset=True))
        db.add(profile)

    db.commit()
    db.refresh(profile)
    return ProfileResponse.model_validate(profile)
