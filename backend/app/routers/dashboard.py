"""Small, factual dashboard aggregates for teachers and administrators."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.application.insights import SchoolInsights
from app.authorization import require_roles
from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas.insights import TodayDashboardResponse


router = APIRouter()


@router.get("/today", response_model=TodayDashboardResponse)
def get_today_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "teacher", "student")
    return SchoolInsights(db).today(current_user)


@router.get("/metrics")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "teacher", "admin")

    class_query = db.query(models.Class)
    if current_user.role == "teacher":
        class_query = class_query.filter(models.Class.teacher_id == current_user.id)
    class_ids = [school_class.id for school_class in class_query.all()]

    if not class_ids:
        return {
            "classes": 0,
            "students": 0,
            "open_assignments": 0,
            "active_quizzes": 0,
        }

    return {
        "classes": len(class_ids),
        "students": db.query(models.User).filter(
            models.User.role == "student",
            models.User.class_id.in_(class_ids),
        ).count(),
        "open_assignments": db.query(models.Assignment).filter(
            models.Assignment.class_id.in_(class_ids),
            models.Assignment.status == "active",
        ).count(),
        "active_quizzes": db.query(models.Quiz).filter(
            models.Quiz.class_id.in_(class_ids),
            models.Quiz.status == "active",
        ).count(),
    }
