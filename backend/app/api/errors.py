"""Translate application errors into the existing HTTP error contract."""

from contextlib import contextmanager
from collections.abc import Iterator

from fastapi import HTTPException, status

from app.application.errors import ApplicationError, ErrorCode


HTTP_STATUS_BY_ERROR = {
    ErrorCode.INVALID_REQUEST: status.HTTP_400_BAD_REQUEST,
    ErrorCode.FORBIDDEN: status.HTTP_403_FORBIDDEN,
    ErrorCode.NOT_FOUND: status.HTTP_404_NOT_FOUND,
    ErrorCode.CONFLICT: status.HTTP_409_CONFLICT,
    ErrorCode.UNPROCESSABLE: status.HTTP_422_UNPROCESSABLE_CONTENT,
    ErrorCode.PAYLOAD_TOO_LARGE: status.HTTP_413_CONTENT_TOO_LARGE,
    ErrorCode.UNSUPPORTED_MEDIA_TYPE: status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
    ErrorCode.INTERNAL: status.HTTP_500_INTERNAL_SERVER_ERROR,
}


@contextmanager
def map_application_errors() -> Iterator[None]:
    """Keep transport error mapping consistent across all route adapters."""

    try:
        yield
    except ApplicationError as exc:
        raise HTTPException(
            status_code=HTTP_STATUS_BY_ERROR[exc.code],
            detail=exc.message,
        ) from exc
