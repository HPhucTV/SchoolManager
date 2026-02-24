from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app import models
from app.routers.auth import get_current_user
from datetime import datetime

router = APIRouter()

class TeacherReportCreate(BaseModel):
    class_id: int
    report_type: str
    content: str

@router.post("/")
async def create_report(
    data: TeacherReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # only teachers may create reports
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Unauthorized")

    # ensure the class belongs to this teacher
    cls = db.query(models.Class).filter(
        models.Class.id == data.class_id,
        models.Class.teacher_id == current_user.id
    ).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found or not owned by you")

    report = models.TeacherReport(
        teacher_id=current_user.id,
        class_id=data.class_id,
        report_type=data.report_type,
        content=data.content,
        created_at=datetime.utcnow().isoformat()
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {"report": {
        "id": report.id,
        "class_id": report.class_id,
        "report_type": report.report_type,
        "content": report.content,
        "created_at": report.created_at
    }}

@router.get("/")
async def list_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Unauthorized")

    reports = db.query(models.TeacherReport).filter(
        models.TeacherReport.teacher_id == current_user.id
    ).all()
    return {"reports": [
        {
            "id": r.id,
            "class_id": r.class_id,
            "report_type": r.report_type,
            "content": r.content,
            "created_at": r.created_at
        } for r in reports
    ]}
