from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app import models
from app.routers.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

# --- Pydantic Schemas ---

class MoodCreate(BaseModel):
    mood_level: int  # 1-5
    mood_emoji: str  # emoji
    note: Optional[str] = None

class MoodResponse(BaseModel):
    id: int
    mood_level: int
    mood_emoji: str
    note: Optional[str] = None
    created_at: str
    
    class Config:
        from_attributes = True

class SOSCreate(BaseModel):
    message: str
    is_anonymous: bool = True

class SOSResponse(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    message: str
    is_anonymous: bool
    status: str
    reviewer_note: Optional[str] = None
    created_at: str
    resolved_at: Optional[str] = None

class SOSUpdate(BaseModel):
    status: str  # reviewing, resolved
    reviewer_note: Optional[str] = None

# --- Mood Endpoints ---

@router.post("/mood", response_model=MoodResponse)
async def create_mood_entry(
    mood: MoodCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if mood.mood_level < 1 or mood.mood_level > 5:
        raise HTTPException(status_code=400, detail="Mood level must be 1-5")
    
    entry = models.MoodEntry(
        student_id=current_user.id,
        mood_level=mood.mood_level,
        mood_emoji=mood.mood_emoji,
        note=mood.note,
        created_at=datetime.now().isoformat()
    )
    db.add(entry)
    
    # Update mental health score based on mood trend
    if mood.mood_level <= 2:
        current_user.mental_health_score = max(0, current_user.mental_health_score - 2)
    elif mood.mood_level >= 4:
        current_user.mental_health_score = min(100, current_user.mental_health_score + 1)
    
    # Update status based on scores
    avg_score = (current_user.happiness_score + current_user.engagement_score + current_user.mental_health_score) / 3
    if avg_score >= 80:
        current_user.status = "excellent"
    elif avg_score >= 60:
        current_user.status = "good"
    elif avg_score >= 40:
        current_user.status = "attention"
    else:
        current_user.status = "warning"
    
    db.commit()
    db.refresh(entry)
    return entry

@router.get("/mood/history", response_model=List[MoodResponse])
async def get_mood_history(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cutoff = (datetime.now() - timedelta(days=days)).isoformat()
    entries = db.query(models.MoodEntry).filter(
        models.MoodEntry.student_id == current_user.id,
        models.MoodEntry.created_at >= cutoff
    ).order_by(desc(models.MoodEntry.created_at)).all()
    return entries

@router.get("/mood/analytics")
async def get_mood_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Last 7 days mood data
    cutoff_7 = (datetime.now() - timedelta(days=7)).isoformat()
    cutoff_30 = (datetime.now() - timedelta(days=30)).isoformat()
    
    recent = db.query(models.MoodEntry).filter(
        models.MoodEntry.student_id == current_user.id,
        models.MoodEntry.created_at >= cutoff_7
    ).all()
    
    month = db.query(models.MoodEntry).filter(
        models.MoodEntry.student_id == current_user.id,
        models.MoodEntry.created_at >= cutoff_30
    ).all()
    
    avg_7 = sum(e.mood_level for e in recent) / len(recent) if recent else 0
    avg_30 = sum(e.mood_level for e in month) / len(month) if month else 0
    
    # Mood distribution
    dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for e in month:
        dist[e.mood_level] = dist.get(e.mood_level, 0) + 1
    
    trend = "stable"
    if avg_7 > avg_30 + 0.5:
        trend = "improving"
    elif avg_7 < avg_30 - 0.5:
        trend = "declining"
    
    return {
        "avg_week": round(avg_7, 1),
        "avg_month": round(avg_30, 1),
        "trend": trend,
        "total_entries": len(month),
        "distribution": dist,
        "recent_entries": [{"mood_level": e.mood_level, "mood_emoji": e.mood_emoji, "created_at": e.created_at} for e in recent]
    }

# --- SOS Endpoints ---

@router.post("/sos")
async def create_sos_alert(
    sos: SOSCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    alert = models.SOSAlert(
        student_id=current_user.id,
        message=sos.message,
        is_anonymous=sos.is_anonymous,
        created_at=datetime.now().isoformat()
    )
    db.add(alert)
    
    # Lower mental health score
    current_user.mental_health_score = max(0, current_user.mental_health_score - 5)
    if current_user.mental_health_score < 40:
        current_user.status = "warning"
    
    db.commit()
    db.refresh(alert)
    
    # Notify class teacher
    try:
        from app.routers.notifications import create_notification_for_class
        if current_user.class_id:
            cls = db.query(models.Class).filter(models.Class.id == current_user.class_id).first()
            if cls and cls.teacher_id:
                notif = models.Notification(
                    user_id=cls.teacher_id,
                    title="🆘 Tín hiệu SOS từ học sinh",
                    message=f"Một học sinh {'(ẩn danh)' if sos.is_anonymous else current_user.name} cần được hỗ trợ.",
                    type="sos",
                    action_url="/teacher/suc-khoe",
                    created_at=datetime.now().isoformat()
                )
                db.add(notif)
                db.commit()
    except Exception as e:
        print(f"SOS notification error: {e}")
    
    return {"message": "Tín hiệu SOS đã được gửi. Giáo viên sẽ liên hệ hỗ trợ bạn.", "id": alert.id}

@router.get("/sos/alerts")
async def get_sos_alerts(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới xem được SOS")
    
    query = db.query(models.SOSAlert)
    
    # Teacher only sees their class students
    if current_user.role == "teacher":
        classes = db.query(models.Class).filter(models.Class.teacher_id == current_user.id).all()
        class_ids = [c.id for c in classes]
        student_ids = [s.id for s in db.query(models.User).filter(models.User.class_id.in_(class_ids)).all()]
        query = query.filter(models.SOSAlert.student_id.in_(student_ids))
    
    if status:
        query = query.filter(models.SOSAlert.status == status)
    
    alerts = query.order_by(desc(models.SOSAlert.created_at)).all()
    
    results = []
    for a in alerts:
        student = db.query(models.User).filter(models.User.id == a.student_id).first()
        results.append({
            "id": a.id,
            "student_id": a.student_id,
            "student_name": student.name if student and not a.is_anonymous else "Ẩn danh",
            "message": a.message,
            "is_anonymous": a.is_anonymous,
            "status": a.status,
            "reviewer_note": a.reviewer_note,
            "created_at": a.created_at,
            "resolved_at": a.resolved_at
        })
    
    return results

@router.patch("/sos/{alert_id}")
async def update_sos_alert(
    alert_id: int,
    update: SOSUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới cập nhật được SOS")
    
    alert = db.query(models.SOSAlert).filter(models.SOSAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Không tìm thấy SOS")
    
    alert.status = update.status
    alert.reviewed_by = current_user.id
    if update.reviewer_note:
        alert.reviewer_note = update.reviewer_note
    if update.status == "resolved":
        alert.resolved_at = datetime.now().isoformat()
    
    db.commit()
    return {"message": "Cập nhật SOS thành công"}

# --- Class Wellness ---

@router.get("/class/{class_id}")
async def get_class_wellness(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    students = db.query(models.User).filter(
        models.User.class_id == class_id,
        models.User.role == "student"
    ).all()
    
    cutoff = (datetime.now() - timedelta(days=7)).isoformat()
    
    wellness_data = []
    total_mood = 0
    mood_count = 0
    status_counts = {"excellent": 0, "good": 0, "attention": 0, "warning": 0}
    
    for s in students:
        recent_moods = db.query(models.MoodEntry).filter(
            models.MoodEntry.student_id == s.id,
            models.MoodEntry.created_at >= cutoff
        ).order_by(desc(models.MoodEntry.created_at)).limit(5).all()
        
        avg_mood = sum(m.mood_level for m in recent_moods) / len(recent_moods) if recent_moods else 0
        total_mood += avg_mood
        if recent_moods:
            mood_count += 1
        
        status_counts[s.status] = status_counts.get(s.status, 0) + 1
        
        wellness_data.append({
            "id": s.id,
            "name": s.name,
            "happiness_score": s.happiness_score,
            "engagement_score": s.engagement_score,
            "mental_health_score": s.mental_health_score,
            "status": s.status,
            "avg_mood": round(avg_mood, 1),
            "last_mood": recent_moods[0].mood_emoji if recent_moods else None
        })
    
    # Active SOS
    student_ids = [s.id for s in students]
    active_sos = db.query(models.SOSAlert).filter(
        models.SOSAlert.student_id.in_(student_ids),
        models.SOSAlert.status.in_(["pending", "reviewing"])
    ).count()
    
    return {
        "total_students": len(students),
        "avg_mood": round(total_mood / mood_count, 1) if mood_count else 0,
        "status_counts": status_counts,
        "active_sos_count": active_sos,
        "students": wellness_data
    }
