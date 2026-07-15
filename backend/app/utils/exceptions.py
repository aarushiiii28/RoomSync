from fastapi import HTTPException, status

from app.core.constants import (
    MSG_INVALID_CREDENTIALS,
    MSG_USER_ALREADY_EXISTS,
    MSG_USER_NOT_FOUND,
    MSG_NOT_AUTHENTICATED,
    MSG_FORBIDDEN,
    MSG_INACTIVE_USER,
)


class CredentialsException(HTTPException):
    def __init__(self, detail: str = MSG_INVALID_CREDENTIALS):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class UserAlreadyExistsException(HTTPException):
    def __init__(self, detail: str = MSG_USER_ALREADY_EXISTS):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )


class UserNotFoundException(HTTPException):
    def __init__(self, detail: str = MSG_USER_NOT_FOUND):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )


class NotAuthenticatedException(HTTPException):
    def __init__(self, detail: str = MSG_NOT_AUTHENTICATED):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(HTTPException):
    def __init__(self, detail: str = MSG_FORBIDDEN):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


class InactiveUserException(HTTPException):
    def __init__(self, detail: str = MSG_INACTIVE_USER):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )
