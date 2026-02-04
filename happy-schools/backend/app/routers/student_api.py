
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models
from app.routers.auth import get_current_user
from datetime import datetime
import shutil
import os
from pydantic import BaseModel

router = APIRouter()

@router.get("/upcoming-quizzes")
async def get_upcoming_quizzes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "student":
        return []
    
    # User requested to separate Quizzes from Assignments.
    # Since we don't have a specific 'Quiz' type yet, we should not show Assignments here to avoid duplication.
    # verified: "check lại bên bài kiểm tra bị lỗi hiện lên bài tập"
    return []

    # Original logic (disabled):
    # assignments = db.query(models.Assignment).filter(
    #     models.Assignment.class_id == current_user.class_id,
    #     models.Assignment.status == "active"
    # ).all()
    # ...

@router.get("/dashboard")
async def get_student_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this dashboard")
    
    # Recent activities
    activities = db.query(models.Activity).limit(5).all()
    
    # Assignments summary
    total_assignments = db.query(models.Assignment).filter(models.Assignment.class_id == current_user.class_id).count()
    completed_assignments = db.query(models.Submission).filter(models.Submission.student_id == current_user.id).count()
    
    # Fetch surveys
    # Assuming 'Khảo sát' or 'survey' type for surveys based on user feedback and screenshots
    surveys = db.query(models.Activity).filter(
        models.Activity.type.in_(["Khảo sát", "khao sat", "survey", "Survey"])
    ).all()
    
    pending_surveys_data = []
    for s in surveys:
        pending_surveys_data.append({
            "id": s.id,
            "title": s.title,
            "completed": False
        })

    # Check for online session
    online_session = {
        "active": False,
        "room_url": None
    }
    
    if current_user.class_id:
        student_class = db.query(models.Class).filter(models.Class.id == current_user.class_id).first()
        if student_class and student_class.online_enabled and student_class.meeting_link:
             # Extract room name from full URL
             # URL format: https://meet.jit.si/HappySchools_...
             room_url = student_class.meeting_link.split("/")[-1]
             online_session = {
                "active": True,
                "room_url": room_url
            }

    return {
        "online_session": online_session,
        "student": {
            "name": current_user.name,
            "happiness_score": current_user.happiness_score,
            "engagement_score": current_user.engagement_score,
            "mental_health_score": current_user.mental_health_score,
            "status": current_user.status
        },
        "recent_activities": activities,
        "assignments_status": {
            "total": total_assignments,
            "completed": completed_assignments,
            "pending": total_assignments - completed_assignments
        },
        "pending_surveys": pending_surveys_data
    }

@router.get("/assignments")
async def get_student_assignments(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "student":
        return []
        
    assignments = db.query(models.Assignment).filter(
        models.Assignment.class_id == current_user.class_id
    ).all()
    
    submissions = db.query(models.Submission).filter(models.Submission.student_id == current_user.id).all()
    sub_map = {s.assignment_id: s for s in submissions}
    
    results = []
    now = datetime.now()
    for a in assignments:
        sub = sub_map.get(a.id)
        
        deadline_passed = False
        if a.deadline:
            try:
                deadline_dt = datetime.fromisoformat(a.deadline)
                if now > deadline_dt:
                    deadline_passed = True
            except ValueError:
                pass # Invalid date format
        
        results.append({
            "id": a.id,
            "title": a.title,
            "deadline": a.deadline,
            "submitted": sub is not None,
            "graded": sub.status == "graded" if sub else False,
            "score": sub.total_score if sub else 0,
            "deadline_passed": deadline_passed
        })
    return results

class ProfileUpdate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None

# Profile & Upload
@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not os.path.exists("static/avatars"):
        os.makedirs("static/avatars")
    
    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"avatar_{current_user.id}{file_ext}"
    file_path = os.path.join("static/avatars", file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    avatar_url = f"/static/avatars/{file_name}"
    current_user.avatar_url = avatar_url
    db.commit()
    
    return {"avatar_url": avatar_url}

@router.get("/profile")
async def get_profile(current_user: models.User = Depends(get_current_user)):
    return {
        "name": current_user.name,
        "email": current_user.email or current_user.username,
        "phone": current_user.phone_number,
        "avatar_url": current_user.avatar_url or "/static/avatars/default.png"
    }

@router.put("/profile")
async def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    current_user.name = data.name
    current_user.email = data.email
    current_user.phone_number = data.phone
    db.commit()
    return {"message": "Profile updated successfully"}
