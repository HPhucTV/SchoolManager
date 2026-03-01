
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/metrics")
async def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Base query for students
    student_query = db.query(models.User).filter(models.User.role == "student")
    activity_query = db.query(models.Activity)
    
    if current_user.role == "teacher":
        teacher_classes = db.query(models.Class).filter(models.Class.teacher_id == current_user.id).all()
        class_ids = [c.id for c in teacher_classes]
        if not class_ids:
            # No classes, return empty stats
            return {
                "happiness": {"value": "0%", "change": "0%", "change_type": "neutral"},
                "engagement": {"value": "0%", "change": "0%", "change_type": "neutral"},
                "mental_health": {"value": "0%", "change": "0%", "change_type": "neutral"},
                "activities": {"value": "0/0", "subtitle": "✓ Hoàn thành 0%"}
            }
        student_query = student_query.filter(models.User.class_id.in_(class_ids))
    
    # Calculate averages from students
    student_list = student_query.all()
    student_ids = [s.id for s in student_list]
    
    if not student_ids:
            return {
            "happiness": {"value": "0%", "change": "0%", "change_type": "neutral"},
            "engagement": {"value": "0%", "change": "0%", "change_type": "neutral"},
            "mental_health": {"value": "0%", "change": "0%", "change_type": "neutral"},
            "activities": {"value": "0/0", "subtitle": "✓ Hoàn thành 0%"}
        }

    stats = db.query(
        func.avg(models.User.happiness_score).label('happiness'),
        func.avg(models.User.engagement_score).label('engagement'),
        func.avg(models.User.mental_health_score).label('mental_health')
    ).filter(models.User.id.in_(student_ids)).first()
    
    if not stats:
        happiness = 0
        engagement = 0
        mental_health = 0
    else:
        happiness = int(stats.happiness or 0)
        engagement = int(stats.engagement or 0)
        mental_health = int(stats.mental_health or 0)
    
    # Count activities
    total_activities = activity_query.count()
    completed_activities = activity_query.filter(models.Activity.status == 'completed').count()
    
    return {
        "happiness": { 
            "value": f"{happiness}%", 
            "change": "↑ 5% so với tuần trước", 
            "change_type": "positive" 
        },
        "engagement": { 
            "value": f"{engagement}%", 
            "change": "↑ 8% so với tuần trước", 
            "change_type": "positive" 
        },
        "mental_health": { 
            "value": f"{mental_health}%", 
            "change": "↓ 2% so với tuần trước", 
            "change_type": "negative" 
        },
        "activities": { 
            "value": f"{completed_activities}/{total_activities}", 
            "subtitle": f"✓ Hoàn thành {int(completed_activities/total_activities*100) if total_activities else 0}%" 
        }
    }
