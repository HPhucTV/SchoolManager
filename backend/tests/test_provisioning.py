import pytest

from app import models, security
from scripts.create_admin import create_admin


def test_create_admin_has_no_default_password_and_is_idempotent(db_session) -> None:
    admin, created = create_admin(
        db_session,
        email="Owner@School.Example",
        name="School Owner",
        password="unique-admin-password",
    )

    assert created is True
    assert admin.email == "owner@school.example"
    assert admin.role == "admin"
    assert admin.hashed_password != "unique-admin-password"
    assert security.verify_password("unique-admin-password", admin.hashed_password)

    existing, created_again = create_admin(
        db_session,
        email="owner@school.example",
        name="Ignored Name",
        password="another-unique-password",
    )
    assert created_again is False
    assert existing.id == admin.id


def test_create_admin_rejects_weak_password(db_session) -> None:
    with pytest.raises(ValueError, match="at least 12"):
        create_admin(
            db_session,
            email="owner@school.example",
            name="School Owner",
            password="too-short",
        )


def test_create_admin_does_not_promote_existing_user(db_session) -> None:
    user = models.User(
        email="teacher@school.example",
        name="Teacher",
        role="teacher",
        hashed_password=security.get_password_hash("teacher-password"),
    )
    db_session.add(user)
    db_session.commit()

    with pytest.raises(ValueError, match="non-admin"):
        create_admin(
            db_session,
            email=user.email,
            name="School Owner",
            password="unique-admin-password",
        )
