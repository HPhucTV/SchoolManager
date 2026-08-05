import json
import logging

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError

from app.api import health
from app.observability import RequestContextMiddleware, logger


def operational_app() -> FastAPI:
    app = FastAPI()
    app.add_middleware(RequestContextMiddleware)
    app.include_router(health.router, prefix="/health")
    return app


def test_liveness_preserves_safe_request_id_and_logs_completion() -> None:
    records: list[logging.LogRecord] = []

    class CaptureHandler(logging.Handler):
        def emit(self, record: logging.LogRecord) -> None:
            records.append(record)

    capture = CaptureHandler()
    logger.addHandler(capture)

    try:
        with TestClient(operational_app()) as client:
            response = client.get(
                "/health/live", headers={"X-Request-ID": "phase5-smoke-01"}
            )
    finally:
        logger.removeHandler(capture)

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "phase5-smoke-01"
    event = json.loads(records[-1].message)
    assert event == {
        "duration_ms": event["duration_ms"],
        "event": "http_request_completed",
        "method": "GET",
        "path": "/health/live",
        "request_id": "phase5-smoke-01",
        "status": 200,
    }


def test_unsafe_request_id_is_replaced() -> None:
    with TestClient(operational_app()) as client:
        response = client.get(
            "/health/live", headers={"X-Request-ID": "unsafe value with spaces"}
        )

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] != "unsafe value with spaces"
    assert len(response.headers["X-Request-ID"]) == 32


def test_readiness_returns_503_without_exposing_database_error(monkeypatch) -> None:
    class UnavailableEngine:
        def connect(self):
            raise SQLAlchemyError("database password must never reach the response")

    monkeypatch.setattr(health, "engine", UnavailableEngine())

    with TestClient(operational_app()) as client:
        response = client.get("/health/ready")

    assert response.status_code == 503
    assert response.json() == {"status": "not_ready", "database": "unavailable"}
    assert "password" not in response.text
