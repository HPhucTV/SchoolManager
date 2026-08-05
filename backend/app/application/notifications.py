"""Database-backed school notification operations shared by use cases."""

from datetime import datetime

from sqlalchemy.orm import Session

from app import models


def add_class_notifications(
    db: Session,
    *,
    class_id: int,
    title: str,
    message: str,
    notification_type: str,
    action_url: str,
) -> int:
    students = db.query(models.User).filter(
        models.User.class_id == class_id,
        models.User.role == "student",
    ).all()
    created_at = datetime.now().isoformat()
    for student in students:
        db.add(models.Notification(
            user_id=student.id,
            title=title,
            message=message,
            type=notification_type,
            action_url=action_url,
            created_at=created_at,
        ))
    return len(students)
