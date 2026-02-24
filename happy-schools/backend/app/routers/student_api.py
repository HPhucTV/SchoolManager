
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
    
    # Fetch active quizzes for the student's class
    quizzes = db.query(models.Quiz).filter(
        models.Quiz.class_id == current_user.class_id,
        models.Quiz.status == "active"
    ).all()
    
    # Check attempts
    results = []
    for q in quizzes:
        attempt = db.query(models.QuizResult).filter(
            models.QuizResult.quiz_id == q.id,
            models.QuizResult.student_id == current_user.id
        ).first()
        
        results.append({
            "id": q.id,
            "title": q.title,
            "subject": q.subject,
            "total_questions": q.total_questions,
            "has_attempted": attempt is not None,
            "deadline": q.deadline if q.deadline else None,
            "created_at": q.created_at
        })

    return results

    # Original logic (disabled):
    # assignments = db.query(models.Assignment).filter(
    #     models.Assignment.class_id == current_user.class_id,
    #     models.Assignment.status == "active"
    # ).all()
    # ...

from sqlalchemy import or_

# ... (existing imports)

@router.get("/dashboard")
async def get_student_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this dashboard")
    
    # Recent activities (Class specific or School-wide)
    activities = db.query(models.Activity).filter(
        or_(
            models.Activity.class_id == current_user.class_id,
            models.Activity.class_id == None
        )
    ).order_by(models.Activity.created_at.desc()).limit(5).all()
    
    # Assignments summary
    total_assignments = db.query(models.Assignment).filter(models.Assignment.class_id == current_user.class_id).count()
    completed_assignments = db.query(models.Submission).filter(models.Submission.student_id == current_user.id).count()
    
    # Fetch surveys (Class specific or School-wide)
    surveys = db.query(models.Activity).filter(
        models.Activity.type.in_(["Khảo sát", "khao sat", "survey", "Survey"]),
        or_(
            models.Activity.class_id == current_user.class_id,
            models.Activity.class_id == None
        )
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
            "status": current_user.status,
            "class_name": student_class.name if current_user.class_id and str(student_class) != "None" else (db.query(models.Class).filter(models.Class.id == current_user.class_id).first().name if current_user.class_id else None)
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
            except (ValueError, TypeError):
                pass # Invalid date format or timezone mismatch
        
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

class JoinClassRequest(BaseModel):
    class_code: str

@router.post("/join-class")
async def join_class(
    request: JoinClassRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can join classes")

    # Find class by code
    # precise match, maybe case-insensitive? converting to upper just in case if codes are uppercase
    cls = db.query(models.Class).filter(models.Class.class_code == request.class_code.upper()).first()
    
    if not cls:
         raise HTTPException(status_code=404, detail="Mã lớp không hợp lệ hoặc lớp không tồn tại")

    # Check if already in this class
    if current_user.class_id == cls.id:
        return {"message": "Bạn đã tham gia lớp học này rồi", "class_name": cls.name}

    # If in another class, maybe warn? For now, allow switching (overwrite)
    # Decrement count of old class if exists
    if current_user.class_id:
        old_class = db.query(models.Class).filter(models.Class.id == current_user.class_id).first()
        if old_class:
            old_class.student_count = max(0, old_class.student_count - 1)

    # Add to new class
    current_user.class_id = cls.id
    cls.student_count += 1
    
    db.commit()
    
    return {
        "message": f"Tham gia lớp {cls.name} thành công!",
        "class_id": cls.id,
        "class_name": cls.name
    }

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

@router.get("/subjects")
async def get_student_subjects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student":
        return []

    # Get subjects from Assignments
    assignment_subjects = db.query(models.Assignment.subject).filter(
        models.Assignment.class_id == current_user.class_id,
        models.Assignment.subject != None
    ).distinct().all()

    # Get subjects from Quizzes
    quiz_subjects = db.query(models.Quiz.subject).filter(
        models.Quiz.class_id == current_user.class_id,
        models.Quiz.subject != None
    ).distinct().all()

    # Merge unique subjects
    subjects_set = set()
    for s in assignment_subjects:
        if s[0]: subjects_set.add(s[0])
    for s in quiz_subjects:
        if s[0]: subjects_set.add(s[0])

    # Default subjects if empty (Mock data for better UX if nothing exists)
    # Default subjects if empty (Mock data for better UX if nothing exists)
    if not subjects_set:
        subjects_set = set() # No mock data


    # Format result
    results = []
    # Get teacher name for the class (homeroom teacher)
    homeroom_teacher_name = "Giáo viên"
    if current_user.class_id:
        cls = db.query(models.Class).filter(models.Class.id == current_user.class_id).first()
        if cls and cls.teacher:
            homeroom_teacher_name = cls.teacher.name

    for subject in subjects_set:
        # Try to find a specific teacher for this subject from assignments
        # This is a heuristic since we don't have a Subject-Teacher mapping table
        teacher_name = homeroom_teacher_name
        
        # Simple heuristic: Find the most frequent teacher for this subject's assignments
        # For now, just keep it simple or use the homeroom teacher
        
        results.append({
            "id": subject, # Use name as ID for now
            "name": subject,
            "teacher": teacher_name,
            "image_url": f"/images/subjects/{subject.lower()}.jpg" if False else None, # Placeholder
            "task_count": 0 # Can calculation this if needed or load async
        })

    return results

@router.get("/subjects/{subject_name}")
async def get_subject_details(
    subject_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Forbidden")

    # 1. Get Class Info (for online link)
    class_info = None
    if current_user.class_id:
        cls = db.query(models.Class).filter(models.Class.id == current_user.class_id).first()
        if cls:
            class_info = {
                "meeting_link": cls.meeting_link,
                "online_enabled": cls.online_enabled,
                "teacher_name": cls.teacher.name if cls.teacher else "Giáo viên",
                "teacher_email": cls.teacher.email if cls.teacher else None,
                "teacher_phone": cls.teacher.phone_number if cls.teacher else None,
                "teacher_avatar": cls.teacher.avatar_url if cls.teacher else None
            }

    # 2. Get Assignments for this subject
    assignments = db.query(models.Assignment).filter(
        models.Assignment.class_id == current_user.class_id,
        models.Assignment.subject == subject_name
    ).all()

    # Formatted assignments
    assignments_data = []
    for a in assignments:
        # Check submission
        sub = db.query(models.Submission).filter(
            models.Submission.assignment_id == a.id,
            models.Submission.student_id == current_user.id
        ).first()
        
        assignments_data.append({
            "id": a.id,
            "title": a.title,
            "deadline": a.deadline,
            "status": "submitted" if sub else ("active" if a.status == "active" else "closed"),
            "score": sub.total_score if sub and sub.status == "graded" else None
        })

    # 3. Get Quizzes for this subject
    quizzes = db.query(models.Quiz).filter(
        models.Quiz.class_id == current_user.class_id,
        models.Quiz.subject == subject_name
    ).all()
    
    quizzes_data = []
    for q in quizzes:
        # Check result
        res = db.query(models.QuizResult).filter(
            models.QuizResult.quiz_id == q.id,
            models.QuizResult.student_id == current_user.id
        ).first()

        quizzes_data.append({
            "id": q.id,
            "title": q.title,
            "total_questions": q.total_questions,
            "has_attempted": res is not None,
            "score": res.percentage if res else None
        })

    return {
        "subject": subject_name,
        "class_info": class_info,
        "assignments": assignments_data,
        "quizzes": quizzes_data,
        # Mock some notifications/surveys for now as they are not subject-linked strictly yet
        "notifications": [],
        "surveys": [] 
    }
