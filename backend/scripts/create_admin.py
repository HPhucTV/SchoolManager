"""Create the first administrator without a default or shared password."""

from __future__ import annotations

import getpass
import os

from sqlalchemy.orm import Session

from app import models, security
from app.database import SessionLocal


def create_admin(
    db: Session, *, email: str, name: str, password: str
) -> tuple[models.User, bool]:
    email = email.strip().lower()
    name = name.strip()
    if "@" not in email or len(email) > 320:
        raise ValueError("A valid administrator email is required")
    if not name:
        raise ValueError("Administrator name is required")
    if len(password) < 12 or len(password.encode("utf-8")) > 72:
        raise ValueError(
            "Administrator password must have at least 12 characters and at most 72 UTF-8 bytes"
        )

    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        if existing.role != "admin":
            raise ValueError("That email already belongs to a non-admin user")
        return existing, False

    admin = models.User(
        email=email,
        name=name,
        role="admin",
        hashed_password=security.get_password_hash(password),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin, True


def main() -> None:
    email = os.environ.get("SCHOOLMANAGER_ADMIN_EMAIL") or input(
        "Administrator email: "
    )
    name = os.environ.get("SCHOOLMANAGER_ADMIN_NAME") or input(
        "Administrator name: "
    )
    password = os.environ.get("SCHOOLMANAGER_ADMIN_PASSWORD") or getpass.getpass(
        "Administrator password (12+ characters, max 72 UTF-8 bytes): "
    )

    db = SessionLocal()
    try:
        admin, created = create_admin(db, email=email, name=name, password=password)
    finally:
        db.close()

    action = "Created" if created else "Kept existing"
    print(f"{action} administrator {admin.email}. Password was not printed or stored.")


if __name__ == "__main__":
    main()
