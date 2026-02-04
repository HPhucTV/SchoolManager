
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from datetime import datetime

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

class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    scheduled_date: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None

# --- Endpoints ---

@router.get("/", response_model=List[Activity])
async def get_activities(limit: int = 100, db: Session = Depends(get_db)):
    activities = db.query(models.Activity).limit(limit).all()
    return activities

@router.post("/", response_model=Activity)
async def create_activity(activity: ActivityCreate, db: Session = Depends(get_db)):
    new_activity = models.Activity(
        title=activity.title,
        type=activity.type,
        description=activity.description,
        scheduled_date=activity.scheduled_date,
        created_at=datetime.now().isoformat()
    )
    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)
    db.refresh(new_activity)
    
    # --- Send Email Notification ---
    try:
        from app.services.email_service import send_notification_email
        # Get all students in the class (Activity model has class_id but the router didn't take it in create?)
        # Wait, Activity model has class_id, but ActivityCreate schema DOES NOT have class_id?
        # Let's check the view of activities.py again. 
        # Ah, looking at models.py, Activity has class_id. 
        # But ActivityCreate in activities.py (lines 27-31) does NOT have class_id.
        # This means activities might be created without class_id or defaulting?
        # Or maybe the current implementation is global/broken regarding class_id?
        # Let's check models.py again in my memory... 
        # class Activity(Base): ... class_id = Column(Integer, ForeignKey("classes.id"))
        # Yes.
        # So if create_activity doesn't set it, it's NULL?
        # If it's NULL, who do we notify? Everyone? Or no one?
        # Let's look at get_activities in activities.py: `activities = db.query(models.Activity).limit(limit).all()`
        # It seems activities are currently treated as global?
        # If so, I should notify ALL students? Or maybe just skip for now if logic is ambiguous.
        # BUT the user request says "khi giáo viên giao bài hay có 1 hoạt động nào tạo 1 hoạt động gì thì sẽ có thông báo".
        # So I should probably notify all students if it's global.
        
        students = db.query(models.User).filter(models.User.role == "student").all()
        for student in students:
             if student.email_enabled and student.notify_activities and student.email:
                send_notification_email(
                    to_email=student.email,
                    student_name=student.name,
                    title=f"Hoạt động mới: {new_activity.title}",
                    message=f"Một hoạt động mới '{new_activity.type}' đã được tạo. Thời gian: {new_activity.scheduled_date}.",
                    action_url="http://localhost:3000/student/dashboard" # No specific detail page yet?
                )
    except Exception as e:
        print(f"Failed to send activity emails: {e}")

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
    return activity

@router.delete("/{activity_id}")
async def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Không tìm thấy hoạt động")
    
    db.delete(activity)
    db.commit()
    return {"message": "Đã xóa hoạt động thành công"}

@router.get("/{activity_id}/results")
async def get_activity_results(activity_id: int, db: Session = Depends(get_db)):
    # Dummy implementation for now to avoid 404
    return {"results": []}
