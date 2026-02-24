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
        orm_mode = True

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

@router.post("/", response_model=ScheduleResponse)
async def create_schedule_item(
    schedule: ScheduleCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_schedule = models.Schedule(**schedule.dict())
    
    # If no teacher_id provided, assume current user is the teacher if they are a teacher?
    # Or just leave it null? Let's leave it null unless specified.
    # Actually, for a class schedule, usually we want to know who teaches. 
    # If not provided, maybe default to class homeroom teacher? 
    # For now, let's keep it simple.
    
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
        
    for key, value in schedule_update.dict().items():
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
