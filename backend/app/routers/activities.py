
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.authorization import get_accessible_class, require_roles
from app.routers.auth import get_current_user
from datetime import datetime
import json
from sqlalchemy import or_
from app.services.cache_service import redis_service

router = APIRouter()

# --- Pydantic Schemas ---

class Activity(BaseModel):
    id: int
    title: str
    type: str
    description: Optional[str] = None
    scheduled_date: str
    status: str
    participants_count: int
    progress: int
    
    model_config = ConfigDict(from_attributes=True)

class ActivityCreate(BaseModel):
    title: str
    type: str
    description: Optional[str] = None
    scheduled_date: str
    class_id: Optional[int] = None

class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    scheduled_date: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    class_id: Optional[int] = None

# --- Endpoints ---

def _require_activity_access(
    db: Session,
    current_user: models.User,
    activity: models.Activity,
    *,
    write: bool,
) -> None:
    if current_user.role == "admin":
        return
    if activity.class_id is None:
        if not write:
            return
        raise HTTPException(status_code=403, detail="Chỉ admin mới quản lý hoạt động toàn trường")
    if current_user.role == "teacher":
        get_accessible_class(db, current_user, activity.class_id)
        return
    if not write and current_user.role == "student" and current_user.class_id == activity.class_id:
        return
    raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập hoạt động này")


@router.get("", response_model=List[Activity])
async def get_activities(
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Try Cache
    cache_key = f"activities:user:{current_user.id}:limit:{limit}"
    cached = redis_service.get(cache_key)
    if cached:
        try:
            return [Activity(**item) for item in json.loads(cached)]
        except:
            pass

    query = db.query(models.Activity)
    if current_user.role == "teacher":
        owned_class_ids = db.query(models.Class.id).filter(models.Class.teacher_id == current_user.id)
        query = query.filter(or_(models.Activity.class_id.in_(owned_class_ids), models.Activity.class_id.is_(None)))
    elif current_user.role == "student":
        query = query.filter(or_(models.Activity.class_id == current_user.class_id, models.Activity.class_id.is_(None)))
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem hoạt động")

    activities = query.limit(limit).all()
    
    # Set Cache
    try:
        to_cache = [item.__dict__ for item in activities] # SQLAlchemy models to dict
        # Clean up SQLAlchemy internal state before json dump if needed, or use Pydantic
        # Better: Convert to Pydantic first
        pydantic_list = [Activity.model_validate(a).model_dump() for a in activities]
        redis_service.set(cache_key, json.dumps(pydantic_list), expire=120) # 2 mins
    except Exception as e:
        print(f"Cache Error: {e}")
        
    return activities

@router.post("", response_model=Activity)
async def create_activity(
    activity: ActivityCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "admin", "teacher")
    if current_user.role == "teacher" and activity.class_id is None:
        raise HTTPException(status_code=422, detail="Giáo viên phải chọn lớp cho hoạt động")
    if activity.class_id is not None:
        get_accessible_class(db, current_user, activity.class_id)

    new_activity = models.Activity(
        title=activity.title,
        type=activity.type,
        description=activity.description,
        scheduled_date=activity.scheduled_date,
        class_id=activity.class_id,
        created_at=datetime.now().isoformat()
    )
    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)
    
    # --- Create Notification for Students ---
    try:
        from app.routers.notifications import create_notification_for_class
        if new_activity.class_id:
            create_notification_for_class(
                db=db,
                class_id=new_activity.class_id,
                title=f"Hoạt động mới: {new_activity.title}",
                message=f"Một hoạt động mới '{new_activity.type}' đã được tạo. Thời gian: {new_activity.scheduled_date}.",
                notif_type="activity",
                action_url="/student/dashboard"
            )
        else:
            # School-wide notification? Not implemented yet
            pass
    except Exception as e:
        print(f"Failed to create notification: {e}")

    # --- Send Email Notification (Background Task) ---
    try:
        from app.services.email_service import send_bulk_notification_email
        
        # If class_id is set, only notify that class
        if new_activity.class_id:
            students = db.query(models.User).filter(
                models.User.role == "student",
                models.User.class_id == new_activity.class_id
            ).all()
        else:
            # Otherwise notify all students (School-wide)
            students = db.query(models.User).filter(models.User.role == "student").all()
            
        recipients = []
        for student in students:
             if student.email_enabled and student.notify_activities and student.email:
                recipients.append({"email": student.email, "name": student.name})
                
        if recipients:
             background_tasks.add_task(
                send_bulk_notification_email,
                recipients=recipients,
                title=f"Hoạt động mới: {new_activity.title}",
                message=f"Một hoạt động mới '{new_activity.type}' đã được tạo. Thời gian: {new_activity.scheduled_date}.",
                action_url="https://schoolmanager.id.vn/student/dashboard" 
            )

    except Exception as e:
        print(f"Failed to queue activity emails: {e}")

    # Invalidate Cache
    redis_service.invalidate_pattern("activities:*")

    return new_activity

@router.put("/{activity_id}", response_model=Activity)
@router.patch("/{activity_id}", response_model=Activity)
async def update_activity(
    activity_id: int,
    activity_update: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "admin", "teacher")
    activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Không tìm thấy hoạt động")
    _require_activity_access(db, current_user, activity, write=True)

    if activity_update.class_id is not None:
        get_accessible_class(db, current_user, activity_update.class_id)
        activity.class_id = activity_update.class_id
    
    if activity_update.title: activity.title = activity_update.title
    if activity_update.type: activity.type = activity_update.type
    if activity_update.description: activity.description = activity_update.description
    if activity_update.scheduled_date: activity.scheduled_date = activity_update.scheduled_date
    if activity_update.status: activity.status = activity_update.status
    if activity_update.progress is not None: activity.progress = activity_update.progress
    
    db.commit()
    db.refresh(activity)
    
    redis_service.invalidate_pattern("activities:*")
    
    return activity

@router.delete("/{activity_id}")
async def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "admin", "teacher")
    activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Không tìm thấy hoạt động")
    _require_activity_access(db, current_user, activity, write=True)
    
    db.delete(activity)
    db.commit()
    
    redis_service.invalidate_pattern("activities:*")
    
    return {"message": "Đã xóa hoạt động thành công"}

@router.get("/{activity_id}/results")
async def get_activity_results(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Không tìm thấy hoạt động")
    _require_activity_access(db, current_user, activity, write=False)
    # Dummy implementation for now to avoid 404
    return {"results": []}
