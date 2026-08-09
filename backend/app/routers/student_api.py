"""Student workspace endpoints that do not duplicate resource APIs."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app import models
from app.application.insights import SchoolInsights
from app.authorization import require_roles
from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas.insights import StudentGradebookResponse


router = APIRouter()


class JoinClassRequest(BaseModel):
    class_code: str = Field(min_length=1, max_length=20)


def _student_class(db: Session, current_user: models.User) -> models.Class | None:
    if current_user.class_id is None:
        return None
    return db.query(models.Class).filter(models.Class.id == current_user.class_id).first()


@router.get("/dashboard")
def get_student_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "student")
    school_class = _student_class(db, current_user)
    total_assignments = db.query(models.Assignment).filter(
        models.Assignment.class_id == current_user.class_id,
    ).count() if current_user.class_id else 0
    completed_assignments = db.query(models.Submission.assignment_id).filter(
        models.Submission.student_id == current_user.id,
    ).distinct().count()

    return {
        "student": {
            "name": current_user.name,
            "class_name": school_class.name if school_class else None,
        },
        "assignments_status": {
            "total": total_assignments,
            "completed": completed_assignments,
            "pending": max(0, total_assignments - completed_assignments),
        },
    }


@router.get("/gradebook", response_model=StudentGradebookResponse)
def get_student_gradebook(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "student")
    return SchoolInsights(db).student_gradebook(current_user)


@router.post("/join-class")
def join_class(
    request: JoinClassRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "student")
    school_class = db.query(models.Class).filter(
        models.Class.class_code == request.class_code.strip().upper(),
    ).first()
    if school_class is None:
        raise HTTPException(status_code=404, detail="Mã lớp không hợp lệ hoặc lớp không tồn tại")
    if current_user.class_id == school_class.id:
        return {
            "message": "Bạn đã tham gia lớp học này rồi",
            "class_id": school_class.id,
            "class_name": school_class.name,
        }

    current_user.class_id = school_class.id
    db.commit()
    return {
        "message": f"Tham gia lớp {school_class.name} thành công!",
        "class_id": school_class.id,
        "class_name": school_class.name,
    }


@router.get("/subjects")
def get_student_subjects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "student")
    if current_user.class_id is None:
        return []

    assignment_subjects = {
        subject
        for subject, in db.query(models.Assignment.subject).filter(
            models.Assignment.class_id == current_user.class_id,
            models.Assignment.subject.isnot(None),
        ).distinct().all()
        if subject
    }
    quiz_subjects = {
        subject
        for subject, in db.query(models.Quiz.subject).filter(
            models.Quiz.class_id == current_user.class_id,
            models.Quiz.subject.isnot(None),
            models.Quiz.status != "draft",
        ).distinct().all()
        if subject
    }
    school_class = _student_class(db, current_user)
    teacher_name = school_class.teacher.name if school_class and school_class.teacher else "Chưa phân công"

    results = []
    for subject in sorted(assignment_subjects | quiz_subjects):
        assignment_count = db.query(models.Assignment).filter(
            models.Assignment.class_id == current_user.class_id,
            models.Assignment.subject == subject,
            models.Assignment.status == "active",
        ).count()
        quiz_count = db.query(models.Quiz).filter(
            models.Quiz.class_id == current_user.class_id,
            models.Quiz.subject == subject,
            models.Quiz.status == "active",
        ).count()
        results.append({
            "id": subject,
            "name": subject,
            "teacher": teacher_name,
            "task_count": assignment_count + quiz_count,
        })
    return results


@router.get("/subjects/{subject_name}")
def get_subject_details(
    subject_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "student")
    school_class = _student_class(db, current_user)
    if school_class is None:
        raise HTTPException(status_code=404, detail="Bạn chưa tham gia lớp học")

    assignments = db.query(models.Assignment).filter(
        models.Assignment.class_id == school_class.id,
        models.Assignment.subject == subject_name,
    ).all()
    assignment_rows = []
    for assignment in assignments:
        submission = db.query(models.Submission).filter(
            models.Submission.assignment_id == assignment.id,
            models.Submission.student_id == current_user.id,
        ).first()
        assignment_rows.append({
            "id": assignment.id,
            "title": assignment.title,
            "deadline": assignment.deadline,
            "status": "submitted" if submission else assignment.status,
            "score": submission.total_score if submission and submission.status == "graded" else None,
        })

    quizzes = db.query(models.Quiz).filter(
        models.Quiz.class_id == school_class.id,
        models.Quiz.subject == subject_name,
        models.Quiz.status != "draft",
    ).all()
    quiz_rows = []
    for quiz in quizzes:
        result = db.query(models.QuizResult).filter(
            models.QuizResult.quiz_id == quiz.id,
            models.QuizResult.student_id == current_user.id,
        ).first()
        quiz_rows.append({
            "id": quiz.id,
            "title": quiz.title,
            "total_questions": quiz.total_questions,
            "has_attempted": result is not None,
            "score": result.percentage if result else None,
        })

    return {
        "subject": subject_name,
        "class_info": {
            "teacher_name": school_class.teacher.name if school_class.teacher else "Chưa phân công",
            "teacher_email": school_class.teacher.email if school_class.teacher else None,
            "teacher_phone": school_class.teacher.phone_number if school_class.teacher else None,
        },
        "assignments": assignment_rows,
        "quizzes": quiz_rows,
        "notifications": [],
        "surveys": [],
    }
