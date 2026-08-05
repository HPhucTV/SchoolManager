from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.database import get_db
from app import models
from app.authorization import get_accessible_class, require_roles
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
    class_code: Optional[str] = None
    online_enabled: bool = False
    created_at: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# --- Endpoints ---

@router.get("", response_model=List[ClassResponse])
async def get_classes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)): 
    query = db.query(models.Class)
    if current_user.role == "teacher":
        query = query.filter(models.Class.teacher_id == current_user.id)
    elif current_user.role == "student":
        query = query.filter(models.Class.id == current_user.class_id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem danh sách lớp")
    
    classes = query.all()
    result = []
    for c in classes:
        teacher_name = None
        if c.teacher_id:
            teacher = db.query(models.User).filter(models.User.id == c.teacher_id).first()
            if teacher: teacher_name = teacher.name
        
        # Calculate stats
        students = [s for s in c.students if s.role == 'student']
        student_count = len(students)
        
        happiness = 0
        engagement = 0
        mental = 0
        
        if student_count > 0:
            happiness = sum([s.happiness_score or 0 for s in students]) / student_count
            engagement = sum([s.engagement_score or 0 for s in students]) / student_count
            mental = sum([s.mental_health_score or 0 for s in students]) / student_count
            
        result.append({
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
            "class_code": c.class_code,
            "online_enabled": c.online_enabled,
            "created_at": c.created_at
        })
    return result

@router.get("/{class_id}", response_model=ClassResponse)
async def get_class_details(class_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    c = get_accessible_class(db, current_user, class_id, allow_student=True)
        
    teacher_name = None
    if c.teacher_id:
        teacher = db.query(models.User).filter(models.User.id == c.teacher_id).first()
        if teacher: teacher_name = teacher.name
        
    students = [s for s in c.students if s.role == 'student']
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
        "class_code": c.class_code,
        "online_enabled": c.online_enabled,
        "created_at": c.created_at
    }


@router.get("/{class_id}/students")
async def get_class_students(class_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_roles(current_user, "admin", "teacher")
    get_accessible_class(db, current_user, class_id)

    students = db.query(models.User).filter(models.User.class_id == class_id, models.User.role == "student").all()
    
    return [
        {
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "avatar": s.avatar_url,
            "status": s.status,
            "happiness_score": s.happiness_score,
            "engagement_score": s.engagement_score,
            "mental_health_score": s.mental_health_score
        }
        for s in students
    ]

@router.get("/{class_id}/timeline")
async def get_class_timeline(class_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    get_accessible_class(db, current_user, class_id, allow_student=True)
    # Placeholder for now
    return []

@router.post("", response_model=ClassResponse)
async def create_class(class_data: ClassCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_roles(current_user, "admin", "teacher")
    try:
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

        # Generate Class Code
        class_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        # Ensure uniqueness (simple check)
        while db.query(models.Class).filter(models.Class.class_code == class_code).first():
            class_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

        teacher_id = class_data.teacher_id if current_user.role == "admin" else current_user.id
        if teacher_id is not None:
            teacher = db.query(models.User).filter(
                models.User.id == teacher_id,
                models.User.role == "teacher",
            ).first()
            if teacher is None:
                raise HTTPException(status_code=422, detail="Giáo viên phụ trách không hợp lệ")

        new_class = models.Class(
            name=class_data.name,
            grade=class_data.grade,
            teacher_id=teacher_id,
            student_count=0,
            meeting_link=meeting_link,
            class_code=class_code,
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
            "class_code": new_class.class_code,
            "online_enabled": new_class.online_enabled,
            "created_at": new_class.created_at
        }
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Không thể tạo lớp học")

@router.put("/{class_id}", response_model=ClassResponse)
async def update_class(class_id: int, class_data: ClassCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_roles(current_user, "admin", "teacher")
    cls = get_accessible_class(db, current_user, class_id)

    teacher_id = class_data.teacher_id if current_user.role == "admin" else cls.teacher_id
    if teacher_id is not None:
        teacher = db.query(models.User).filter(
            models.User.id == teacher_id,
            models.User.role == "teacher",
        ).first()
        if teacher is None:
            raise HTTPException(status_code=422, detail="Giáo viên phụ trách không hợp lệ")
        
    cls.name = class_data.name
    cls.grade = class_data.grade
    cls.teacher_id = teacher_id
    cls.online_enabled = class_data.online_enabled
    
    # Generate meeting link if online enabled and link is missing
    if cls.online_enabled and not cls.meeting_link:
         # Sanitize name for URL
        safe_name = "".join(c for c in unicodedata.normalize('NFD', cls.name) if unicodedata.category(c) != 'Mn')
        safe_name = re.sub(r'[^a-zA-Z0-9]', '', safe_name)
        random_suffix = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
        cls.meeting_link = f"https://meet.jit.si/HappySchools_{safe_name}_{random_suffix}"
    
    # Ensure class_code exists (backfill if missing)
    if not cls.class_code:
        cls.class_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    db.commit()
    db.refresh(cls)
    
    teacher_name = None
    if cls.teacher_id:
        teacher = db.query(models.User).filter(models.User.id == cls.teacher_id).first()
        if teacher: teacher_name = teacher.name
        
    # Calculate scores
    students = [s for s in cls.students if s.role == 'student']
    student_count = len(students)
    happiness = 0
    engagement = 0
    mental = 0
    if student_count > 0:
        happiness = sum([s.happiness_score or 0 for s in students]) / student_count
        engagement = sum([s.engagement_score or 0 for s in students]) / student_count
        mental = sum([s.mental_health_score or 0 for s in students]) / student_count

    return {
        "id": cls.id,
        "name": cls.name,
        "grade": cls.grade,
        "teacher_id": cls.teacher_id,
        "teacher_name": teacher_name,
        "student_count": student_count,
        "happiness_score": round(happiness, 1),
        "engagement_score": round(engagement, 1),
        "mental_health_score": round(mental, 1),
        "meeting_link": cls.meeting_link,
        "class_code": cls.class_code,
        "online_enabled": cls.online_enabled,
        "created_at": cls.created_at
    }
