from fastapi import APIRouter, Depends

from app.api.auth.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
def get_dashboard(current_user: User = Depends(get_current_active_user)):
    """Return a summary dashboard for the current user."""
    return {
        "user_id": str(current_user.id),
        "username": current_user.username,
        "profile_completed": current_user.profile_completed,
        "is_verified": current_user.is_verified,
        "message": "Welcome to RoomSync AI!",
    }
