import os
from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool


os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-key-with-at-least-thirty-two-characters")
os.environ.setdefault("REDIS_HOST", "127.0.0.1")

from app import models, security  # noqa: E402
from app.database import get_db  # noqa: E402
from app.routers import (  # noqa: E402
    activities,
    analytics,
    assignments,
    auth,
    classes,
    dashboard,
    quiz_battle,
    quizzes,
    schedule_api,
    search,
    students,
)


@pytest.fixture()
def db_session() -> Iterator[Session]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    models.Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session: Session) -> Iterator[TestClient]:
    app = FastAPI()
    app.include_router(auth.router, prefix="/api/auth")
    app.include_router(classes.router, prefix="/api/classes")
    app.include_router(activities.router, prefix="/api/activities")
    app.include_router(assignments.router, prefix="/api/assignments")
    app.include_router(quizzes.router, prefix="/api/quizzes")
    app.include_router(quiz_battle.router, prefix="/api/battle")
    app.include_router(analytics.router, prefix="/api/analytics")
    app.include_router(dashboard.router, prefix="/api/dashboard")
    app.include_router(schedule_api.router, prefix="/api/schedules")
    app.include_router(search.router, prefix="/api/search")
    app.include_router(students.router, prefix="/api/students")

    def override_get_db() -> Iterator[Session]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def make_user(db_session: Session):
    def factory(
        *,
        email: str,
        role: str,
        name: str | None = None,
        class_id: int | None = None,
    ) -> models.User:
        user = models.User(
            email=email,
            hashed_password=security.get_password_hash("password123"),
            name=name or email.split("@", 1)[0],
            role=role,
            class_id=class_id,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    return factory


@pytest.fixture()
def auth_headers():
    def factory(user: models.User) -> dict[str, str]:
        token = security.create_access_token(
            {"sub": user.email, "id": user.id, "role": user.role}
        )
        return {"Authorization": f"Bearer {token}"}

    return factory
