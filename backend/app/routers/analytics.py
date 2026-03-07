from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app import models
from app.routers.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/trends/{student_id}")
async def get_student_trends(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get score trends for a student over time."""
    # Verify access 
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    quiz_results = db.query(models.QuizResult).filter(
        models.QuizResult.student_id == student_id
    ).order_by(models.QuizResult.completed_at).all()
    
    submissions = db.query(models.Submission).filter(
        models.Submission.student_id == student_id
    ).order_by(models.Submission.submitted_at).all()
    
    # Build timeline
    timeline = []
    for qr in quiz_results:
        quiz = db.query(models.Quiz).filter(models.Quiz.id == qr.quiz_id).first()
        timeline.append({
            "date": qr.completed_at,
            "type": "quiz",
            "subject": quiz.subject if quiz else "Unknown",
            "topic": quiz.topic if quiz else "",
            "score": qr.percentage,
            "label": quiz.title if quiz else ""
        })
    
    for sub in submissions:
        assignment = db.query(models.Assignment).filter(models.Assignment.id == sub.assignment_id).first()
        if assignment:
            pct = (sub.total_score / assignment.total_points * 100) if assignment.total_points > 0 else 0
            timeline.append({
                "date": sub.submitted_at,
                "type": "assignment",
                "subject": assignment.subject or "General",
                "topic": "",
                "score": round(pct, 1),
                "label": assignment.title
            })
    
    # Group by subject
    by_subject = {}
    for item in sorted(timeline, key=lambda x: x["date"] or ""):
        subj = item["subject"]
        if subj not in by_subject:
            by_subject[subj] = []
        by_subject[subj].append(item)
    
    return {
        "timeline": sorted(timeline, key=lambda x: x["date"] or ""),
        "by_subject": by_subject,
        "total_assessments": len(timeline)
    }

@router.get("/early-warning")
async def get_early_warnings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Detect students at risk based on declining scores and mental health."""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Get teacher's classes
    if current_user.role == "teacher":
        classes = db.query(models.Class).filter(models.Class.teacher_id == current_user.id).all()
        class_ids = [c.id for c in classes]
        students = db.query(models.User).filter(
            models.User.class_id.in_(class_ids),
            models.User.role == "student"
        ).all()
    else:
        students = db.query(models.User).filter(models.User.role == "student").all()
    
    warnings = []
    
    for student in students:
        risk_factors = []
        risk_level = "low"  # low, medium, high, critical
        risk_score = 0
        
        # 1. Mental health score check
        if student.mental_health_score < 40:
            risk_factors.append("Sức khỏe tinh thần thấp")
            risk_score += 3
        elif student.mental_health_score < 60:
            risk_factors.append("Sức khỏe tinh thần trung bình thấp")
            risk_score += 1
        
        # 2. Happiness score check
        if student.happiness_score < 40:
            risk_factors.append("Chỉ số hạnh phúc thấp")
            risk_score += 2
        
        # 3. Engagement score check
        if student.engagement_score < 40:
            risk_factors.append("Mức độ gắn kết thấp")
            risk_score += 2
        
        # 4. Active SOS
        sos_count = db.query(models.SOSAlert).filter(
            models.SOSAlert.student_id == student.id,
            models.SOSAlert.status.in_(["pending", "reviewing"])
        ).count()
        if sos_count > 0:
            risk_factors.append(f"Có {sos_count} SOS chưa giải quyết")
            risk_score += 4
        
        # 5. Recent quiz performance decline
        recent_quizzes = db.query(models.QuizResult).filter(
            models.QuizResult.student_id == student.id
        ).order_by(desc(models.QuizResult.completed_at)).limit(6).all()
        
        if len(recent_quizzes) >= 4:
            first_half = sum(q.percentage for q in recent_quizzes[len(recent_quizzes)//2:]) / (len(recent_quizzes) - len(recent_quizzes)//2)
            second_half = sum(q.percentage for q in recent_quizzes[:len(recent_quizzes)//2]) / (len(recent_quizzes)//2)
            if second_half < first_half - 15:
                risk_factors.append("Điểm kiểm tra giảm mạnh")
                risk_score += 3
            elif second_half < first_half - 5:
                risk_factors.append("Điểm kiểm tra có xu hướng giảm")
                risk_score += 1
        
        # 6. Mood trend check
        recent_moods = db.query(models.MoodEntry).filter(
            models.MoodEntry.student_id == student.id
        ).order_by(desc(models.MoodEntry.created_at)).limit(7).all()
        
        if recent_moods:
            avg_mood = sum(m.mood_level for m in recent_moods) / len(recent_moods)
            if avg_mood <= 2:
                risk_factors.append("Tâm trạng tiêu cực kéo dài")
                risk_score += 3
            elif avg_mood <= 3:
                risk_factors.append("Tâm trạng chưa tích cực")
                risk_score += 1
        
        # Calculate risk level
        if risk_score >= 7:
            risk_level = "critical"
        elif risk_score >= 4:
            risk_level = "high"
        elif risk_score >= 2:
            risk_level = "medium"
        
        if risk_score >= 2:  # Only include students with some risk
            cls = db.query(models.Class).filter(models.Class.id == student.class_id).first()
            warnings.append({
                "student_id": student.id,
                "student_name": student.name,
                "class_name": cls.name if cls else "N/A",
                "risk_level": risk_level,
                "risk_score": risk_score,
                "risk_factors": risk_factors,
                "happiness_score": student.happiness_score,
                "engagement_score": student.engagement_score,
                "mental_health_score": student.mental_health_score,
                "status": student.status
            })
    
    return {
        "total_warnings": len(warnings),
        "critical": len([w for w in warnings if w["risk_level"] == "critical"]),
        "high": len([w for w in warnings if w["risk_level"] == "high"]),
        "medium": len([w for w in warnings if w["risk_level"] == "medium"]),
        "warnings": sorted(warnings, key=lambda x: x["risk_score"], reverse=True)
    }

@router.get("/class-report/{class_id}")
async def get_class_report(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Comprehensive class report with analytics."""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    students = db.query(models.User).filter(
        models.User.class_id == class_id,
        models.User.role == "student"
    ).all()
    
    # Aggregate stats
    avg_happiness = sum(s.happiness_score for s in students) / len(students) if students else 0
    avg_engagement = sum(s.engagement_score for s in students) / len(students) if students else 0
    avg_mental = sum(s.mental_health_score for s in students) / len(students) if students else 0
    
    # Status distribution
    status_dist = {"excellent": 0, "good": 0, "attention": 0, "warning": 0}
    for s in students:
        status_dist[s.status] = status_dist.get(s.status, 0) + 1
    
    # Quiz performance
    student_ids = [s.id for s in students]
    quiz_results = db.query(models.QuizResult).filter(
        models.QuizResult.student_id.in_(student_ids)
    ).all()
    avg_quiz = sum(qr.percentage for qr in quiz_results) / len(quiz_results) if quiz_results else 0
    
    # Top performers
    top_students = sorted(students, key=lambda s: s.xp_points, reverse=True)[:5]
    
    return {
        "class_name": cls.name,
        "total_students": len(students),
        "avg_happiness": round(avg_happiness, 1),
        "avg_engagement": round(avg_engagement, 1),
        "avg_mental_health": round(avg_mental, 1),
        "avg_quiz_score": round(avg_quiz, 1),
        "total_quizzes": len(quiz_results),
        "status_distribution": status_dist,
        "top_students": [{
            "name": s.name, "xp": s.xp_points, "level": s.level
        } for s in top_students]
    }

@router.get("/missing-work")
async def get_missing_work(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Find students who haven't submitted active assignments or quizzes."""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    missing_list = []
    
    # Get teacher's classes
    classes = db.query(models.Class).filter(models.Class.teacher_id == current_user.id).all()
    class_ids = [c.id for c in classes]
    
    if not class_ids:
        return []
        
    students = db.query(models.User).filter(
        models.User.class_id.in_(class_ids),
        models.User.role == "student"
    ).all()
    
    student_dict = {s.id: s for s in students}

    # 1. Missing Assignments
    active_assignments = db.query(models.Assignment).filter(
        models.Assignment.class_id.in_(class_ids),
        models.Assignment.status == "active"
    ).all()
    
    for assignment in active_assignments:
        # Get all submission student IDs for this assignment
        submitted_student_ids = [
            sub.student_id for sub in 
            db.query(models.Submission).filter(models.Submission.assignment_id == assignment.id).all()
        ]
        
        # Students in the class who haven't submitted
        class_students = [s for s in students if s.class_id == assignment.class_id]
        for student in class_students:
            if student.id not in submitted_student_ids:
                cls = db.query(models.Class).filter(models.Class.id == assignment.class_id).first()
                missing_list.append({
                    "student_name": student.name,
                    "student_id": student.id,
                    "class_name": cls.name if cls else "N/A",
                    "item_title": assignment.title,
                    "type": "assignment"
                })

    # 2. Missing Quizzes
    active_quizzes = db.query(models.Quiz).filter(
        models.Quiz.class_id.in_(class_ids),
        models.Quiz.status == "active"
    ).all()
    
    for quiz in active_quizzes:
        # Get all completed quiz student IDs
        completed_student_ids = [
            qr.student_id for qr in 
            db.query(models.QuizResult).filter(models.QuizResult.quiz_id == quiz.id).all()
        ]
        
        # Students in the class who haven't completed the quiz
        class_students = [s for s in students if s.class_id == quiz.class_id]
        for student in class_students:
            if student.id not in completed_student_ids:
                cls = db.query(models.Class).filter(models.Class.id == quiz.class_id).first()
                missing_list.append({
                    "student_name": student.name,
                    "student_id": student.id,
                    "class_name": cls.name if cls else "N/A",
                    "item_title": quiz.title,
                    "type": "quiz"
                })
                
    return missing_list
