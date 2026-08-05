
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models
from app.authorization import require_roles
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("")
async def get_statistics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "admin", "teacher")
    # Reuse student stats logic or extend
    total = db.query(models.User).filter(models.User.role == "student").count()
    # Mock extensive stats for now based on aggregation
    return {
        "total_students": total,
        "growth_rate": "+12%",
        "total_activities": db.query(models.Activity).count(),
        # Add more complex stats as needed
        "weekly_trend": [
            {"week": "T1", "score": 82},
            {"week": "T2", "score": 85},
            {"week": "T3", "score": 84},
            {"week": "T4", "score": 88}
        ],
        "total_surveys": 156, # Mock value
        "class_comparison": [
            {"name": "Lớp 10A", "score": 92, "color": "#14b8a6"},
            {"name": "Lớp 11B", "score": 85, "color": "#3b82f6"},
            {"name": "Lớp 12A", "score": 89, "color": "#8b5cf6"},
            {"name": "Lớp 12D", "score": 78, "color": "#f59e0b"}
        ],
        "detailed_stats": [
            {"name": "Mức độ Sôi nổi", "prev": 75, "curr": 82},
            {"name": "Mức độ Gắn kết", "prev": 68, "curr": 74},
            {"name": "Sức khỏe Tinh thần", "prev": 80, "curr": 78},
            {"name": "Tham gia Hoạt động", "prev": 60, "curr": 72},
            {"name": "Hài lòng với Giáo viên", "prev": 85, "curr": 88}
        ]
    }

@router.get("/classes")
async def get_classes_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    require_roles(current_user, "admin", "teacher")
    query = db.query(models.Class)
    if current_user.role == "teacher":
        query = query.filter(models.Class.teacher_id == current_user.id)
    classes = query.all()
    results = []
    
    for cls in classes:
        # Calculate average happiness for each class
        # This could be optimized into a single group_by query
        avg_score = db.query(func.avg(models.User.happiness_score))\
            .filter(models.User.class_id == cls.id)\
            .scalar()
            
        results.append({
            "id": cls.id,
            "name": cls.name,
            "happiness_score": int(avg_score) if avg_score else 0,
            "color": "#3b82f6" # Dynamic or static color
        })
        
    return results
