import uuid

from sqlalchemy.orm import Session

from app.models.questionnaire import QuestionnaireResponse as QuestionnaireModel
from app.schemas.questionnaire import (
    QuestionnaireCreate,
    QuestionnaireUpdate,
    QuestionnaireResponse,
)
from app.utils.exceptions import UserNotFoundException


def get_questionnaire(db: Session, user_id: uuid.UUID) -> QuestionnaireResponse:
    response = (
        db.query(QuestionnaireModel)
        .filter(QuestionnaireModel.user_id == user_id)
        .first()
    )
    if not response:
        raise UserNotFoundException(detail="Questionnaire response not found.")
    return QuestionnaireResponse.model_validate(response)


def submit_questionnaire(
    db: Session,
    user_id: uuid.UUID,
    payload: QuestionnaireCreate | QuestionnaireUpdate,
) -> QuestionnaireResponse:
    """Create or update the questionnaire response for *user_id*."""
    response = (
        db.query(QuestionnaireModel)
        .filter(QuestionnaireModel.user_id == user_id)
        .first()
    )

    if response:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(response, field, value)
    else:
        response = QuestionnaireModel(
            user_id=user_id, **payload.model_dump(exclude_unset=True)
        )
        db.add(response)

    db.commit()
    db.refresh(response)
    return QuestionnaireResponse.model_validate(response)
