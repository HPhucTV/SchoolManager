import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool


os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-key-with-at-least-thirty-two-characters")

from app import models, security  # noqa: E402
from app.database import get_db  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402


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
    app = fastapi_app

    def override_get_db() -> Iterator[Session]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


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
