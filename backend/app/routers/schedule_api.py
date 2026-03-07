from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, database
from . import auth
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class ScheduleBase(BaseModel):
    subject: str
    day_of_week: str
    start_time: str
    end_time: str
    room: Optional[str] = None
    teacher_id: Optional[int] = None
    semester: str = "HK1"
    year: str = "2025-2026"

class ScheduleCreate(ScheduleBase):
    class_id: int

class ScheduleUpdate(ScheduleBase):
    pass

class ScheduleResponse(ScheduleBase):
    id: int
    class_id: int
    
    class Config:
        from_attributes = True

@router.get("/my-schedule", response_model=List[ScheduleResponse])
async def get_my_schedule(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role == "student":
        # Get schedule for student's class
        if not current_user.class_id:
            return []
        
        schedules = db.query(models.Schedule).filter(
            models.Schedule.class_id == current_user.class_id
        ).all()
        return schedules
    
    elif current_user.role == "teacher":
        # Get schedule where user is the teacher
        # Logic: 
        # 1. Schedules where teacher_id matches current_user.id
        # 2. Schedules for the class where current_user is the homeroom teacher? (Usually teachers want to see what they teach)
        # We'll focus on what they TEACH first.
        
        schedules = db.query(models.Schedule).filter(
            models.Schedule.teacher_id == current_user.id
        ).all()
        return schedules
        
    return []

@router.get("/class/{class_id}", response_model=List[ScheduleResponse])
async def get_class_schedule(
    class_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Allow teachers and admins to view any class schedule
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    schedules = db.query(models.Schedule).filter(
        models.Schedule.class_id == class_id
    ).all()
    return schedules

def check_schedule_conflict(db: Session, class_id: int, day_of_week: str, start_time: str, end_time: str, exclude_id: int = None):
    schedules = db.query(models.Schedule).filter(
        models.Schedule.class_id == class_id,
        models.Schedule.day_of_week == day_of_week
    ).all()
    
    for sch in schedules:
        if exclude_id and sch.id == exclude_id:
            continue
        if start_time < sch.end_time and sch.start_time < end_time:
            teacher = db.query(models.User).filter(models.User.id == sch.teacher_id).first()
            teacher_name = teacher.full_name if teacher else "Giáo viên khác"
            return f"Bị trùng lịch với môn {sch.subject} do {teacher_name} dạy ({sch.start_time} - {sch.end_time})"
    return None

@router.post("/", response_model=ScheduleResponse)
async def create_schedule_item(
    schedule: ScheduleCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    conflict = check_schedule_conflict(db, schedule.class_id, schedule.day_of_week, schedule.start_time, schedule.end_time)
    if conflict:
        raise HTTPException(status_code=409, detail=conflict)
        
    db_schedule = models.Schedule(**schedule.model_dump())
    
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: int,
    schedule_update: ScheduleUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    # Check for conflicts
    new_day = schedule_update.day_of_week
    new_start = schedule_update.start_time
    new_end = schedule_update.end_time
    conflict = check_schedule_conflict(db, db_schedule.class_id, new_day, new_start, new_end, exclude_id=schedule_id)
    if conflict:
        raise HTTPException(status_code=409, detail=conflict)
        
    for key, value in schedule_update.model_dump().items():
        setattr(db_schedule, key, value)
        
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    db.delete(db_schedule)
    db.commit()
    return {"message": "Deleted successfully"}
