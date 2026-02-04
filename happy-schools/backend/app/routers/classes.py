from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app import models
from app.routers.auth import get_current_user
from datetime import datetime
import random
import string
import unicodedata
import re

router = APIRouter()

# --- Schemas ---

class ClassCreate(BaseModel):
    name: str
    grade: str
    teacher_id: Optional[int] = None
    online_enabled: bool = False

class ClassResponse(BaseModel):
    id: int
    name: str
    grade: str
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None
    student_count: int = 0
    happiness_score: float = 0
    engagement_score: float = 0
    mental_health_score: float = 0
    meeting_link: Optional[str] = None
    online_enabled: bool = False
    created_at: Optional[str] = None
    
    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/", response_model=List[ClassResponse])
async def get_classes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)): 
    print(f"DEBUG: get_classes called for user {current_user.email} (id={current_user.id}, role={current_user.role})")
    query = db.query(models.Class)
    if current_user.role == "teacher":
        print(f"DEBUG: Filtering classes for teacher_id={current_user.id}")
        query = query.filter(models.Class.teacher_id == current_user.id)
    
    classes = query.all()
    print(f"DEBUG: Found {len(classes)} classes")
    result = []
    for c in classes:
        teacher_name = None
        if c.teacher_id:
            teacher = db.query(models.User).filter(models.User.id == c.teacher_id).first()
            if teacher: teacher_name = teacher.name
        
        # Calculate stats
        # Need to ensure students are loaded or queried
        # Since we defined relationship in models without lazy='dynamic', accessing c.students loads them
        students = c.students
        student_count = len(students)
        
        happiness = 0
        engagement = 0
        mental = 0
        
        if student_count > 0:
            # Handle potential None values if scores are not initialized
            happiness = sum([s.happiness_score or 0 for s in students]) / student_count
            engagement = sum([s.engagement_score or 0 for s in students]) / student_count
            mental = sum([s.mental_health_score or 0 for s in students]) / student_count
            
        result.append({
            "id": c.id,
            "name": c.name,
            "grade": c.grade,
            "teacher_id": c.teacher_id,
            "teacher_name": teacher_name,
            "student_count": student_count, # Use actual count from relationship
            "happiness_score": round(happiness, 1),
            "engagement_score": round(engagement, 1),
            "mental_health_score": round(mental, 1),
            "meeting_link": c.meeting_link,
            "online_enabled": c.online_enabled,
            "created_at": c.created_at
        })
    return result

@router.get("/{class_id}", response_model=ClassResponse)
async def get_class_details(class_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if teacher owns the class or is admin (implement stricter checks if needed)
    query = db.query(models.Class).filter(models.Class.id == class_id)
    if current_user.role == "teacher":
        query = query.filter(models.Class.teacher_id == current_user.id)
    
    c = query.first()
    if not c:
        raise HTTPException(status_code=404, detail="Class not found or access denied")
        
    teacher_name = None
    if c.teacher_id:
        teacher = db.query(models.User).filter(models.User.id == c.teacher_id).first()
        if teacher: teacher_name = teacher.name
        
    # Calculate stats
    students = c.students
    student_count = len(students)
    
    happiness = 0
    engagement = 0
    mental = 0
    
    if student_count > 0:
        happiness = sum([s.happiness_score or 0 for s in students]) / student_count
        engagement = sum([s.engagement_score or 0 for s in students]) / student_count
        mental = sum([s.mental_health_score or 0 for s in students]) / student_count
        
    return {
        "id": c.id,
        "name": c.name,
        "grade": c.grade,
        "teacher_id": c.teacher_id,
        "teacher_name": teacher_name,
        "student_count": student_count,
        "happiness_score": round(happiness, 1),
        "engagement_score": round(engagement, 1),
        "mental_health_score": round(mental, 1),
        "meeting_link": c.meeting_link,
        "online_enabled": c.online_enabled,
        "created_at": c.created_at
    }

@router.post("/", response_model=ClassResponse)
async def create_class(class_data: ClassCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Optional: Check if user is teacher/admin?
    # if current_user.role not in ["teacher", "admin"]: ...

    db_class = db.query(models.Class).filter(models.Class.name == class_data.name).first()
    if db_class:
         raise HTTPException(status_code=400, detail="Class name already exists")

    # Generate meeting link if online enabled
    meeting_link = None
    if class_data.online_enabled:
        # Sanitize name for URL
        safe_name = "".join(c for c in unicodedata.normalize('NFD', class_data.name) if unicodedata.category(c) != 'Mn')
        safe_name = re.sub(r'[^a-zA-Z0-9]', '', safe_name)
        random_suffix = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
        meeting_link = f"https://meet.jit.si/HappySchools_{safe_name}_{random_suffix}"

    new_class = models.Class(
        name=class_data.name,
        grade=class_data.grade,
        teacher_id=class_data.teacher_id or current_user.id, # Default to current user if teacher
        student_count=0,
        meeting_link=meeting_link,
        online_enabled=class_data.online_enabled,
        created_at=datetime.now().isoformat()
    )
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    
    teacher_name = None
    if new_class.teacher_id:
        teacher = db.query(models.User).filter(models.User.id == new_class.teacher_id).first()
        if teacher: teacher_name = teacher.name

    return {
        "id": new_class.id,
        "name": new_class.name,
        "grade": new_class.grade,
        "teacher_id": new_class.teacher_id,
        "teacher_name": teacher_name,
        "student_count": 0,
        "happiness_score": 0,
        "engagement_score": 0,
        "mental_health_score": 0,
        "meeting_link": new_class.meeting_link,
        "online_enabled": new_class.online_enabled,
        "created_at": new_class.created_at
    }

@router.put("/{class_id}", response_model=ClassResponse)
async def update_class(class_id: int, class_data: ClassCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
        
    cls.name = class_data.name
    cls.grade = class_data.grade
    cls.teacher_id = class_data.teacher_id
    cls.online_enabled = class_data.online_enabled
    
    # Generate meeting link if online enabled and link is missing
    if cls.online_enabled and not cls.meeting_link:
         # Sanitize name for URL
        safe_name = "".join(c for c in unicodedata.normalize('NFD', cls.name) if unicodedata.category(c) != 'Mn')
        safe_name = re.sub(r'[^a-zA-Z0-9]', '', safe_name)
        random_suffix = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
        cls.meeting_link = f"https://meet.jit.si/HappySchools_{safe_name}_{random_suffix}"
    
    # Optional: Clear link if disabled? 
    # if not cls.online_enabled: cls.meeting_link = None
    
    db.commit()
    db.refresh(cls)
    
    teacher_name = None
    if cls.teacher_id:
        teacher = db.query(models.User).filter(models.User.id == cls.teacher_id).first()
        if teacher: teacher_name = teacher.name
        
    return {
        "id": cls.id,
        "name": cls.name,
        "grade": cls.grade,
        "teacher_id": cls.teacher_id,
        "teacher_name": teacher_name,
        "student_count": cls.student_count,
        "meeting_link": cls.meeting_link,
        "online_enabled": cls.online_enabled,
        "created_at": cls.created_at
    }
