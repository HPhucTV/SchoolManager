from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app import models
from app.routers.auth import get_current_user
from datetime import datetime

router = APIRouter()

# --- Schemas ---

class MessageCreate(BaseModel):
    receiver_id: int
    message: str

# --- Endpoints ---

@router.get("/children")
async def get_children(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "parent":
        raise HTTPException(status_code=403, detail="Chỉ phụ huynh mới truy cập được")
    
    links = db.query(models.ParentStudent).filter(
        models.ParentStudent.parent_id == current_user.id
    ).all()
    
    children = []
    for link in links:
        student = db.query(models.User).filter(models.User.id == link.student_id).first()
        if student:
            cls = db.query(models.Class).filter(models.Class.id == student.class_id).first()
            children.append({
                "id": student.id,
                "name": student.name,
                "class_name": cls.name if cls else "N/A",
                "happiness_score": student.happiness_score,
                "engagement_score": student.engagement_score,
                "mental_health_score": student.mental_health_score,
                "status": student.status,
                "avatar_url": student.avatar_url,
                "xp": student.xp_points,
                "level": student.level,
                "streak": student.streak_days
            })
    
    return children

@router.get("/child/{student_id}/report")
async def get_child_report(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "parent":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Verify parent-child relationship
    link = db.query(models.ParentStudent).filter(
        models.ParentStudent.parent_id == current_user.id,
        models.ParentStudent.student_id == student_id
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Không phải con của bạn")
    
    student = db.query(models.User).filter(models.User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Not found")
    
    # Quiz results
    quiz_results = db.query(models.QuizResult).filter(
        models.QuizResult.student_id == student_id
    ).order_by(desc(models.QuizResult.completed_at)).limit(10).all()
    
    # Submissions
    submissions = db.query(models.Submission).filter(
        models.Submission.student_id == student_id
    ).order_by(desc(models.Submission.submitted_at)).limit(10).all()
    
    recent_quizzes = []
    for qr in quiz_results:
        quiz = db.query(models.Quiz).filter(models.Quiz.id == qr.quiz_id).first()
        recent_quizzes.append({
            "title": quiz.title if quiz else "N/A",
            "subject": quiz.subject if quiz else "",
            "score": qr.percentage,
            "completed_at": qr.completed_at
        })
    
    recent_assignments = []
    for sub in submissions:
        assignment = db.query(models.Assignment).filter(models.Assignment.id == sub.assignment_id).first()
        if assignment:
            recent_assignments.append({
                "title": assignment.title,
                "subject": assignment.subject or "",
                "score": sub.total_score,
                "total": assignment.total_points,
                "status": sub.status,
                "submitted_at": sub.submitted_at
            })
    
    cls = db.query(models.Class).filter(models.Class.id == student.class_id).first()
    
    return {
        "student": {
            "name": student.name,
            "class_name": cls.name if cls else "N/A",
            "happiness_score": student.happiness_score,
            "engagement_score": student.engagement_score,
            "mental_health_score": student.mental_health_score,
            "status": student.status,
            "xp": student.xp_points,
            "level": student.level,
            "streak": student.streak_days
        },
        "recent_quizzes": recent_quizzes,
        "recent_assignments": recent_assignments,
        "total_quizzes": len(quiz_results),
        "total_assignments": len(submissions)
    }

@router.get("/child/{student_id}/mood")
async def get_child_mood(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "parent":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    link = db.query(models.ParentStudent).filter(
        models.ParentStudent.parent_id == current_user.id,
        models.ParentStudent.student_id == student_id
    ).first()
    if not link:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    moods = db.query(models.MoodEntry).filter(
        models.MoodEntry.student_id == student_id
    ).order_by(desc(models.MoodEntry.created_at)).limit(30).all()
    
    return [{
        "mood_level": m.mood_level,
        "mood_emoji": m.mood_emoji,
        "created_at": m.created_at
    } for m in moods]

@router.post("/message")
async def send_message(
    msg: MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["parent", "teacher"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    receiver = db.query(models.User).filter(models.User.id == msg.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    message = models.ParentMessage(
        sender_id=current_user.id,
        receiver_id=msg.receiver_id,
        message=msg.message,
        created_at=datetime.now().isoformat()
    )
    db.add(message)
    
    # Create notification
    notif = models.Notification(
        user_id=msg.receiver_id,
        title=f"Tin nhắn từ {current_user.name}",
        message=msg.message[:100],
        type="message",
        created_at=datetime.now().isoformat()
    )
    db.add(notif)
    
    db.commit()
    return {"message": "Đã gửi tin nhắn thành công"}

@router.get("/messages")
async def get_messages(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sent = db.query(models.ParentMessage).filter(
        models.ParentMessage.sender_id == current_user.id
    ).order_by(desc(models.ParentMessage.created_at)).limit(50).all()
    
    received = db.query(models.ParentMessage).filter(
        models.ParentMessage.receiver_id == current_user.id
    ).order_by(desc(models.ParentMessage.created_at)).limit(50).all()
    
    all_msgs = []
    for m in sent:
        receiver = db.query(models.User).filter(models.User.id == m.receiver_id).first()
        all_msgs.append({
            "id": m.id, "direction": "sent",
            "other_name": receiver.name if receiver else "N/A",
            "message": m.message, "is_read": m.is_read,
            "created_at": m.created_at
        })
    for m in received:
        sender = db.query(models.User).filter(models.User.id == m.sender_id).first()
        all_msgs.append({
            "id": m.id, "direction": "received",
            "other_name": sender.name if sender else "N/A",
            "message": m.message, "is_read": m.is_read,
            "created_at": m.created_at
        })
    
    # Mark received as read
    for m in received:
        if not m.is_read:
            m.is_read = True
    db.commit()
    
    return sorted(all_msgs, key=lambda x: x["created_at"], reverse=True)

@router.get("/teachers")
async def get_child_teachers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get list of teachers for parent's children classes."""
    if current_user.role != "parent":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    links = db.query(models.ParentStudent).filter(
        models.ParentStudent.parent_id == current_user.id
    ).all()
    
    teacher_ids = set()
    for link in links:
        student = db.query(models.User).filter(models.User.id == link.student_id).first()
        if student and student.class_id:
            cls = db.query(models.Class).filter(models.Class.id == student.class_id).first()
            if cls and cls.teacher_id:
                teacher_ids.add(cls.teacher_id)
    
    teachers = db.query(models.User).filter(models.User.id.in_(teacher_ids)).all()
    
    return [{
        "id": t.id,
        "name": t.name,
        "email": t.email,
        "phone": t.phone_number,
        "avatar_url": t.avatar_url
    } for t in teachers]
