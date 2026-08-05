"""Unauthenticated liveness and readiness probes for deployment platforms."""

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine


router = APIRouter()


@router.get("/live", summary="Process liveness probe")
def liveness() -> dict[str, str]:
    """Return success while the API process can accept requests."""

    return {"status": "ok"}


def _readiness_response() -> dict[str, str] | JSONResponse:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not_ready", "database": "unavailable"},
        )
    return {"status": "ready", "database": "ok"}


@router.get("/ready", summary="Database readiness probe", response_model=None)
def readiness() -> dict[str, str] | JSONResponse:
    """Return 503 until the configured database accepts a trivial query."""

    return _readiness_response()


@router.get("", include_in_schema=False, response_model=None)
def health_alias() -> dict[str, str] | JSONResponse:
    """Keep the conventional ``/health`` probe as an alias for readiness."""

    return _readiness_response()
