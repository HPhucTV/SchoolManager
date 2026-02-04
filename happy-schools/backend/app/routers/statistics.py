
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models

router = APIRouter()

@router.get("/")
async def get_statistics(db: Session = Depends(get_db)):
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
        ]
    }

@router.get("/classes")
async def get_classes_stats(db: Session = Depends(get_db)):
    classes = db.query(models.Class).all()
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
