from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.services.security import hash_password

from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import CurrentUserResponse

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    user_dict = {c.name: getattr(current_user, c.name) for c in current_user.__table__.columns}
    user_dict["has_password"] = bool(current_user.password_hash) or not current_user.username.lower().startswith("google_")
    return user_dict


class SetCredentialsRequest(BaseModel):
    username: str
    password: str

@router.post(
    "/me/set-credentials",
    status_code=status.HTTP_200_OK,
)
def set_credentials(
    payload: SetCredentialsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password already set"
        )
    
    # Check if username exists
    existing = db.query(User).filter(User.username == payload.username, User.id != current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken"
        )

    current_user.username = payload.username
    current_user.password_hash = hash_password(payload.password)
    db.commit()
    
    return {"message": "Credentials updated successfully"}