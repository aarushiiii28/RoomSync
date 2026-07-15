from fastapi import HTTPException, status


def validate_password_strength(password: str) -> None:
    """Raise an HTTP 422 if *password* does not meet minimum requirements.

    Rules:
    - At least 8 characters
    - At least one uppercase letter
    - At least one digit
    """
    errors: list[str] = []

    if len(password) < 8:
        errors.append("Password must be at least 8 characters long.")
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter.")
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one digit.")

    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=errors,
        )


def validate_username(username: str) -> None:
    """Raise HTTP 422 if *username* is invalid.

    Rules:
    - 3-30 characters
    - Only alphanumeric characters and underscores
    """
    import re

    if not (3 <= len(username) <= 30):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username must be between 3 and 30 characters.",
        )
    if not re.match(r"^[a-zA-Z0-9_]+$", username):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username may only contain letters, numbers, and underscores.",
        )


def validate_budget_range(budget_min: float | None, budget_max: float | None) -> None:
    """Raise HTTP 422 if budget range is invalid."""
    if budget_min is not None and budget_max is not None:
        if budget_min > budget_max:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="budget_min must be less than or equal to budget_max.",
            )
        if budget_min < 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Budget values must be non-negative.",
            )
