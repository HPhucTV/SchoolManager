from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from app.routers.auth import get_current_user
from ..models import Notification, User
from typing import List, Optional
from fastapi import Form, UploadFile, File, BackgroundTasks
import uuid
from pathlib import Path
from app.services.email_service import send_bulk_notification_email
from app.authorization import get_accessible_class, require_roles

router = APIRouter()


@router.post("", status_code=201)
async def create_notification(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    message: str = Form(...),
    type: str = Form("system"),
    class_id: int = Form(...),
    recipient_type: str = Form("class"), # "class" or "specific"
    student_ids: Optional[str] = Form(None), # Comma separated IDs if specific
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_roles(current_user, "teacher", "admin")
    get_accessible_class(db, current_user, class_id)
    if recipient_type not in {"class", "specific"}:
        raise HTTPException(status_code=422, detail="Loại người nhận không hợp lệ")

    # Handle file upload
    file_url = None
    file_name = None
    if file:
        allowed_types = {
            "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg", "image/png", "image/webp",
        }
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=415, detail="Định dạng tệp không được hỗ trợ")
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Tệp đính kèm không được vượt quá 10 MB")
        file_name = Path(file.filename or "attachment").name
        upload_dir = Path("static/notifications")
        upload_dir.mkdir(parents=True, exist_ok=True)
        unique_filename = f"{uuid.uuid4().hex}{Path(file_name).suffix.lower()}"
        (upload_dir / unique_filename).write_bytes(contents)
        file_url = f"/static/notifications/{unique_filename}"

    # Determine recipients
    recipient_list = []
    if recipient_type == "class":
        students = db.query(User).filter(User.class_id == class_id, User.role == "student").all()
        recipient_list = students
    elif recipient_type == "specific" and student_ids:
        try:
            ids = [int(id.strip()) for id in student_ids.split(",") if id.strip()]
            students = db.query(User).filter(
                User.id.in_(ids),
                User.role == "student",
                User.class_id == class_id,
            ).all()
            recipient_list = students
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid student_ids format")
    
    if not recipient_list:
        return {"message": "No recipients found", "count": 0}

    # Create notifications and prepare emails
    new_notifications = []
    email_recipients = []
    now = datetime.now().isoformat()
    
    for student in recipient_list:
        notif = Notification(
            user_id=student.id,
            title=title,
            message=message,
            type=type,
            created_at=now,
            file_url=file_url,
            file_name=file_name,
            is_read=False
        )
        db.add(notif)
        new_notifications.append(notif)
        
        if student.email and student.email_enabled:
            email_recipients.append({"email": student.email, "name": student.name})

    db.commit()

    # Send emails in background
    if email_recipients:
        action_url = "/student/notifications" # Relative URL works better for both dev/prod
        background_tasks.add_task(
            send_bulk_notification_email,
            recipients=email_recipients,
            title=f"Thông báo mới: {title}",
            message=message,
            action_url=action_url
        )

    return {"message": "Notifications sent", "count": len(new_notifications)}


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
