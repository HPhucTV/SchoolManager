
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from datetime import datetime
import json
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
    
    class Config:
        from_attributes = True

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

@router.get("", response_model=List[Activity])
async def get_activities(limit: int = 100, db: Session = Depends(get_db)):
    # Try Cache
    cache_key = f"activities:limit:{limit}"
    cached = redis_service.get(cache_key)
    if cached:
        try:
            return [Activity(**item) for item in json.loads(cached)]
        except:
            pass

    activities = db.query(models.Activity).limit(limit).all()
    
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
async def create_activity(activity: ActivityCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
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
async def update_activity(activity_id: int, activity_update: ActivityUpdate, db: Session = Depends(get_db)):
    activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Không tìm thấy hoạt động")
    
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
async def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Không tìm thấy hoạt động")
    
    db.delete(activity)
    db.commit()
    
    redis_service.invalidate_pattern("activities:*")
    
    return {"message": "Đã xóa hoạt động thành công"}

@router.get("/{activity_id}/results")
async def get_activity_results(activity_id: int, db: Session = Depends(get_db)):
    # Dummy implementation for now to avoid 404
    return {"results": []}
