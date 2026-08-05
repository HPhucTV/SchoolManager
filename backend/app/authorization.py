"""Authorization policies shared by the HTTP routers.

The functions in this module are the test surface for role, class-scope and
resource-ownership checks. Routers should load the resource, call one of these
policies, and only then perform or return the requested operation.
"""

from collections.abc import Iterable

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app import models


VALID_ROLES = frozenset({"admin", "teacher", "student"})


def require_roles(current_user: models.User, *allowed_roles: str) -> None:
    """Require the current user to have one of the explicitly allowed roles."""

    allowed = frozenset(allowed_roles)
    if not allowed or current_user.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền thực hiện thao tác này",
        )


def validate_role(role: str) -> str:
    """Validate a role received at an HTTP boundary."""

    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Vai trò không hợp lệ",
        )
    return role


def get_accessible_class(
    db: Session,
    current_user: models.User,
    class_id: int,
    *,
    allow_student: bool = False,
) -> models.Class:
    """Load a class and enforce admin, teacher-owner or student membership access."""

    school_class = db.query(models.Class).filter(models.Class.id == class_id).first()
    if school_class is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy lớp học")

    if current_user.role == "admin":
        return school_class
    if current_user.role == "teacher" and school_class.teacher_id == current_user.id:
        return school_class
    if allow_student and current_user.role == "student" and current_user.class_id == class_id:
        return school_class

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Bạn không có quyền truy cập lớp học này",
    )


def require_teacher_class(
    db: Session,
    current_user: models.User,
    class_id: int,
) -> models.Class:
    """Require a teacher to own the target class."""

    require_roles(current_user, "teacher")
    return get_accessible_class(db, current_user, class_id)


def require_owner_or_admin(
    current_user: models.User,
    owner_id: int,
    *,
    owner_roles: Iterable[str] = ("teacher",),
) -> None:
    """Require resource ownership for the configured roles, while allowing admins."""

    if current_user.role == "admin":
        return
    if current_user.role in frozenset(owner_roles) and current_user.id == owner_id:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Bạn không có quyền truy cập tài nguyên này",
    )


def require_student_membership(current_user: models.User, class_id: int) -> None:
    """Require a student to belong to the target class."""

    require_roles(current_user, "student")
    if current_user.class_id != class_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nội dung này không thuộc lớp của bạn",
        )
