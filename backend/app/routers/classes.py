"""Canonical class and roster API."""

import random
import string
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app import models
from app.application.insights import SchoolInsights
from app.authorization import get_accessible_class, require_roles
from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas.insights import ClassGradebookResponse


router = APIRouter()


class ClassWrite(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    grade: str = Field(default="", max_length=30)
    teacher_id: int | None = None


class ClassResponse(BaseModel):
    id: int
    name: str
    grade: str
    teacher_id: int | None = None
    teacher_name: str | None = None
    student_count: int = 0
    class_code: str | None = None
    created_at: str | None = None

    model_config = ConfigDict(from_attributes=True)


def _teacher_name(school_class: models.Class) -> str | None:
    return school_class.teacher.name if school_class.teacher else None


def _class_response(school_class: models.Class) -> ClassResponse:
    return ClassResponse(
        id=school_class.id,
        name=school_class.name,
        grade=school_class.grade or "",
        teacher_id=school_class.teacher_id,
        teacher_name=_teacher_name(school_class),
        student_count=len([student for student in school_class.students if student.role == "student"]),
        class_code=school_class.class_code,
        created_at=school_class.created_at,
    )


def _new_class_code(db: Session) -> str:
    while True:
        value = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if db.query(models.Class.id).filter(models.Class.class_code == value).first() is None:
            return value


def _validated_teacher(db: Session, teacher_id: int | None) -> int | None:
    if teacher_id is None:
        return None
    exists = db.query(models.User.id).filter(
        models.User.id == teacher_id,
        models.User.role == "teacher",
    ).first()
    if exists is None:
        raise HTTPException(status_code=422, detail="Giáo viên phụ trách không hợp lệ")
    return teacher_id


@router.get("", response_model=list[ClassResponse])
def get_classes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Class)
    if current_user.role == "teacher":
        query = query.filter(models.Class.teacher_id == current_user.id)
    elif current_user.role == "student":
        query = query.filter(models.Class.id == current_user.class_id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem danh sách lớp")
    return [_class_response(school_class) for school_class in query.order_by(models.Class.name).all()]


@router.get("/{class_id}", response_model=ClassResponse)
def get_class_details(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return _class_response(get_accessible_class(db, current_user, class_id, allow_student=True))


@router.get("/{class_id}/students")
def get_class_students(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "admin", "teacher")
    get_accessible_class(db, current_user, class_id)
    students = db.query(models.User).filter(
        models.User.class_id == class_id,
        models.User.role == "student",
    ).order_by(models.User.name).all()
    return [
        {"id": student.id, "name": student.name, "email": student.email, "avatar": student.avatar_url}
        for student in students
    ]


@router.get("/{class_id}/gradebook", response_model=ClassGradebookResponse)
def get_class_gradebook(
    class_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "admin", "teacher")
    school_class = get_accessible_class(db, current_user, class_id)
    return SchoolInsights(db).class_gradebook(
        school_class,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=ClassResponse)
def create_class(
    class_data: ClassWrite,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "admin", "teacher")
    name = class_data.name.strip()
    if db.query(models.Class.id).filter(models.Class.name == name).first():
        raise HTTPException(status_code=400, detail="Tên lớp đã tồn tại")

    teacher_id = current_user.id if current_user.role == "teacher" else _validated_teacher(db, class_data.teacher_id)
    school_class = models.Class(
        name=name,
        grade=class_data.grade.strip(),
        teacher_id=teacher_id,
        student_count=0,
        class_code=_new_class_code(db),
        created_at=datetime.now().isoformat(),
    )
    db.add(school_class)
    db.commit()
    db.refresh(school_class)
    return _class_response(school_class)


@router.put("/{class_id}", response_model=ClassResponse)
def update_class(
    class_id: int,
    class_data: ClassWrite,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "admin", "teacher")
    school_class = get_accessible_class(db, current_user, class_id)
    name = class_data.name.strip()
    duplicate = db.query(models.Class.id).filter(
        models.Class.name == name,
        models.Class.id != class_id,
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Tên lớp đã tồn tại")

    school_class.name = name
    school_class.grade = class_data.grade.strip()
    if current_user.role == "admin":
        school_class.teacher_id = _validated_teacher(db, class_data.teacher_id)
    if not school_class.class_code:
        school_class.class_code = _new_class_code(db)
    db.commit()
    db.refresh(school_class)
    return _class_response(school_class)
