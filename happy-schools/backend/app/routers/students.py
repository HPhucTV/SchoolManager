
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from app.database import get_db
from app import models
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_students(
    page: int = 1, 
    page_size: int = 10, 
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    skip = (page - 1) * page_size
    query = db.query(models.User).filter(models.User.role == "student")
    
    if current_user.role == "teacher":
        # Get all classes taught by this teacher
        teacher_classes = db.query(models.Class).filter(models.Class.teacher_id == current_user.id).all()
        class_ids = [c.id for c in teacher_classes]
        query = query.filter(models.User.class_id.in_(class_ids))
    elif current_user.role == "student":
        # Students can only see themselves or classmates? 
        # For now let's just allow them to see their own class if needed, or restrict to self.
        query = query.filter(models.User.class_id == current_user.class_id)
        
    if search:
        query = query.filter(models.User.name.contains(search))
        
    total = query.count()
    users = query.offset(skip).limit(page_size).all()
    
    results = []
    for user in users:
        results.append({
            "id": user.id,
            "name": user.name,
            "status": user.status,
            "happiness_score": int(user.happiness_score),
            "engagement_score": int(user.engagement_score),
            "mental_health_score": int(user.mental_health_score),
            "class_id": user.class_id
        })
        
    return {
        "students": results,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/stats")
async def get_student_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.User).filter(models.User.role == "student")
    
    if current_user.role == "teacher":
        teacher_classes = db.query(models.Class).filter(models.Class.teacher_id == current_user.id).all()
        class_ids = [c.id for c in teacher_classes]
        query = query.filter(models.User.class_id.in_(class_ids))
    
    total = query.count()
    excellent = query.filter(models.User.status == "excellent").count()
    good = query.filter(models.User.status == "good").count()
    attention = query.filter(models.User.status == "attention").count()
    warning = query.filter(models.User.status == "warning").count()
    
    return {
        "total": total,
        "excellent": excellent,
        "good": good,
        "attention": attention,
        "warning": warning
    }
