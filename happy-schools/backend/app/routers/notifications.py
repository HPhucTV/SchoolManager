from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from app.routers.auth import get_current_user
from ..models import Notification, User

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all notifications for the current user, newest first."""
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.id.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "action_url": n.action_url,
            "action_label": n.action_label,
            "created_at": n.created_at,
        }
        for n in notifications
    ]


@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as read."""
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"ok": True}


@router.put("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications as read for the current user."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}


# ── Helper function for other routers to create notifications ──

def create_notification_for_class(
    db: Session,
    class_id: int,
    title: str,
    message: str,
    notif_type: str = "system",
    action_url: str = None,
    action_label: str = None,
    exclude_user_id: int = None,
):
    """Create a notification for all students in a class."""
    students = db.query(User).filter(
        User.class_id == class_id,
        User.role == "student",
    ).all()

    now = datetime.now().isoformat()
    for student in students:
        if exclude_user_id and student.id == exclude_user_id:
            continue
        notif = Notification(
            user_id=student.id,
            title=title,
            message=message,
            type=notif_type,
            action_url=action_url,
            action_label=action_label,
            created_at=now,
        )
        db.add(notif)
    db.commit()
