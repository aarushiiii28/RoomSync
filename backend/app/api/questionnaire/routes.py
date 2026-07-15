from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.questionnaire import QuestionnaireCreate, QuestionnaireUpdate, QuestionnaireResponse
from app.services import questionnaire_service

router = APIRouter(prefix="/questionnaire", tags=["Questionnaire"])


@router.get("/", response_model=QuestionnaireResponse)
def get_questionnaire(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve the current user's questionnaire responses."""
    return questionnaire_service.get_questionnaire(db, current_user.id)


@router.post("/", response_model=QuestionnaireResponse, status_code=201)
def submit_questionnaire(
    payload: QuestionnaireCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Submit or update questionnaire answers."""
    return questionnaire_service.submit_questionnaire(db, current_user.id, payload)


@router.put("/", response_model=QuestionnaireResponse)
def update_questionnaire(
    payload: QuestionnaireUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update existing questionnaire answers."""
    return questionnaire_service.submit_questionnaire(db, current_user.id, payload)
