"""In-app notifications only; email delivery and file attachments are retired."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app import models
from app.authorization import get_accessible_class, require_roles
from app.database import get_db
from app.routers.auth import get_current_user


router = APIRouter()


class NotificationCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=2000)
    class_id: int


@router.post("", status_code=201)
def create_notification(
    request: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "teacher", "admin")
    get_accessible_class(db, current_user, request.class_id)
    students = db.query(models.User).filter(
        models.User.class_id == request.class_id,
        models.User.role == "student",
    ).all()
    now = datetime.now().isoformat()
    for student in students:
        db.add(models.Notification(
            user_id=student.id,
            title=request.title.strip(),
            message=request.message.strip(),
            type="system",
            created_at=now,
            is_read=False,
        ))
    db.commit()
    return {"message": "Notifications sent", "count": len(students)}


@router.get("")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    notifications = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
    ).order_by(models.Notification.id.desc()).limit(50).all()
    return [
        {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "is_read": notification.is_read,
            "action_url": notification.action_url,
            "action_label": notification.action_label,
            "created_at": notification.created_at,
        }
        for notification in notifications
    ]


@router.put("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}


@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id,
    ).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"ok": True}
