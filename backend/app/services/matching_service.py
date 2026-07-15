import uuid
from typing import List

from sqlalchemy.orm import Session

from app.models.match import Match
from app.models.questionnaire import QuestionnaireResponse as QuestionnaireModel
from app.schemas.match import MatchResponse
from app.utils.exceptions import UserNotFoundException
from app.utils.helpers import clamp
from app.core.constants import DEFAULT_MATCH_LIMIT


def _compute_compatibility(a: QuestionnaireModel, b: QuestionnaireModel) -> float:
    """Compute a simple weighted compatibility score in [0.0, 1.0].

    Each attribute that matches contributes equally to the score.
    """
    comparable_fields = [
        "sleep_schedule",
        "cleanliness_level",
        "noise_tolerance",
        "social_preference",
        "work_from_home",
        "pets_allowed",
        "smoking_allowed",
        "alcohol_allowed",
        "guests_frequency",
    ]

    matches = 0
    total = 0

    for field in comparable_fields:
        val_a = getattr(a, field, None)
        val_b = getattr(b, field, None)
        if val_a is not None and val_b is not None:
            total += 1
            if val_a == val_b:
                matches += 1

    if total == 0:
        return 0.0

    score = matches / total
    return clamp(score, 0.0, 1.0)


def find_matches(
    db: Session,
    user_id: uuid.UUID,
    limit: int = DEFAULT_MATCH_LIMIT,
) -> List[MatchResponse]:
    """Find and persist the best matches for *user_id*.

    Computes compatibility against all other users who have completed the
    questionnaire, persists them to the ``matches`` table (upsert), and
    returns the top *limit* results ordered by score descending.
    """
    user_q = (
        db.query(QuestionnaireModel)
        .filter(QuestionnaireModel.user_id == user_id)
        .first()
    )
    if not user_q:
        raise UserNotFoundException(detail="Complete the questionnaire before finding matches.")

    all_responses = (
        db.query(QuestionnaireModel)
        .filter(QuestionnaireModel.user_id != user_id)
        .all()
    )

    scored: list[tuple[uuid.UUID, float]] = []
    for resp in all_responses:
        score = _compute_compatibility(user_q, resp)
        scored.append((resp.user_id, score))

    # Sort by score descending, take top *limit*
    scored.sort(key=lambda x: x[1], reverse=True)
    scored = scored[:limit]

    # Upsert matches
    results: list[MatchResponse] = []
    for matched_user_id, score in scored:
        existing = (
            db.query(Match)
            .filter(Match.user_id == user_id, Match.matched_user_id == matched_user_id)
            .first()
        )
        if existing:
            existing.compatibility_score = score  # type: ignore[assignment]
            db.commit()
            db.refresh(existing)
            results.append(MatchResponse.model_validate(existing))
        else:
            match = Match(
                user_id=user_id,
                matched_user_id=matched_user_id,
                compatibility_score=score,
                status="pending",
            )
            db.add(match)
            db.commit()
            db.refresh(match)
            results.append(MatchResponse.model_validate(match))

    return results


def get_matches(db: Session, user_id: uuid.UUID) -> List[MatchResponse]:
    """Return all existing matches for *user_id* ordered by score descending."""
    matches = (
        db.query(Match)
        .filter(Match.user_id == user_id)
        .order_by(Match.compatibility_score.desc())
        .all()
    )
    return [MatchResponse.model_validate(m) for m in matches]


def update_match_status(
    db: Session, match_id: uuid.UUID, user_id: uuid.UUID, new_status: str
) -> MatchResponse:
    """Accept or reject a match."""
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == user_id).first()
    if not match:
        raise UserNotFoundException(detail="Match not found.")
    match.status = new_status  # type: ignore[assignment]
    db.commit()
    db.refresh(match)
    return MatchResponse.model_validate(match)
