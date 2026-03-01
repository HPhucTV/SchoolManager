from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app import models
from app.routers.auth import get_current_user
from typing import Optional
import json
import os
import logging

# configure module logger
logger = logging.getLogger(__name__)

# path to advice dataset
ADVICE_DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data",
    "ai_tutor_advice.json"
)

tutor_advice = {"weak": [], "strong": [], "mixed": []}

def load_tutor_advice():
    global tutor_advice
    try:
        with open(ADVICE_DATA_PATH, "r", encoding="utf-8") as f:
            tutor_advice = json.load(f)
        logger.info("Loaded AI tutor advice dataset")
    except Exception as e:
        logger.warning("Could not load AI tutor advice dataset: %s", e)

router = APIRouter()

# initial load
load_tutor_advice()

@router.post("/advice/reload")
def reload_advice(current_user: models.User = Depends(get_current_user)):
    """Reload AI tutor advice dataset from disk."""
    load_tutor_advice()
    return {"status": "ok"}

@router.get("/analysis")
async def get_student_analysis(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Analyze student strengths and weaknesses based on quiz/assignment results."""
    student_id = current_user.id
    
    # Get quiz results
    quiz_results = db.query(models.QuizResult).filter(
        models.QuizResult.student_id == student_id
    ).all()
    
    # Get assignment submissions
    submissions = db.query(models.Submission).filter(
        models.Submission.student_id == student_id
    ).all()
    
    # Analyze by subject
    subject_stats = {}
    
    for qr in quiz_results:
        quiz = db.query(models.Quiz).filter(models.Quiz.id == qr.quiz_id).first()
        if quiz:
            subj = quiz.subject
            if subj not in subject_stats:
                subject_stats[subj] = {"total_score": 0, "count": 0, "scores": [], "topics": {}}
            subject_stats[subj]["total_score"] += qr.percentage
            subject_stats[subj]["count"] += 1
            subject_stats[subj]["scores"].append(qr.percentage)
            
            topic = quiz.topic
            if topic not in subject_stats[subj]["topics"]:
                subject_stats[subj]["topics"][topic] = {"total": 0, "count": 0}
            subject_stats[subj]["topics"][topic]["total"] += qr.percentage
            subject_stats[subj]["topics"][topic]["count"] += 1
    
    for sub in submissions:
        assignment = db.query(models.Assignment).filter(models.Assignment.id == sub.assignment_id).first()
        if assignment and assignment.subject:
            subj = assignment.subject
            if subj not in subject_stats:
                subject_stats[subj] = {"total_score": 0, "count": 0, "scores": [], "topics": {}}
            pct = (sub.total_score / assignment.total_points * 100) if assignment.total_points > 0 else 0
            subject_stats[subj]["total_score"] += pct
            subject_stats[subj]["count"] += 1
            subject_stats[subj]["scores"].append(pct)
    
    # Build analysis
    strengths = []
    weaknesses = []
    subject_summary = []
    
    for subj, data in subject_stats.items():
        avg = data["total_score"] / data["count"] if data["count"] > 0 else 0
        
        # Topic analysis
        topic_analysis = []
        for topic, tdata in data["topics"].items():
            tavg = tdata["total"] / tdata["count"] if tdata["count"] > 0 else 0
            topic_analysis.append({"topic": topic, "avg_score": round(tavg, 1), "count": tdata["count"]})
            
            if tavg >= 80:
                strengths.append(f"{subj} - {topic}")
            elif tavg < 50:
                weaknesses.append(f"{subj} - {topic}")
        
        # Score trend
        trend = "stable"
        if len(data["scores"]) >= 3:
            first_half = sum(data["scores"][:len(data["scores"])//2]) / (len(data["scores"])//2)
            second_half = sum(data["scores"][len(data["scores"])//2:]) / (len(data["scores"]) - len(data["scores"])//2)
            if second_half > first_half + 5:
                trend = "improving"
            elif second_half < first_half - 5:
                trend = "declining"
        
        subject_summary.append({
            "subject": subj,
            "avg_score": round(avg, 1),
            "total_tests": data["count"],
            "trend": trend,
            "topics": sorted(topic_analysis, key=lambda x: x["avg_score"])
        })
    
    # Overall stats
    total_quizzes = len(quiz_results)
    total_assignments = len(submissions)
    overall_avg = 0
    if total_quizzes + total_assignments > 0:
        all_scores = [qr.percentage for qr in quiz_results]
        for sub in submissions:
            assignment = db.query(models.Assignment).filter(models.Assignment.id == sub.assignment_id).first()
            if assignment and assignment.total_points > 0:
                all_scores.append(sub.total_score / assignment.total_points * 100)
        overall_avg = sum(all_scores) / len(all_scores) if all_scores else 0
    
    return {
        "overall_avg": round(overall_avg, 1),
        "total_quizzes": total_quizzes,
        "total_assignments": total_assignments,
        "strengths": strengths[:5],
        "weaknesses": weaknesses[:5],
        "subjects": sorted(subject_summary, key=lambda x: x["avg_score"]),
        "level": current_user.level,
        "xp": current_user.xp_points
    }

@router.get("/recommendations")
async def get_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Generate AI-powered study recommendations."""
    
    # Get analysis data
    quiz_results = db.query(models.QuizResult).filter(
        models.QuizResult.student_id == current_user.id
    ).order_by(desc(models.QuizResult.completed_at)).limit(20).all()
    
    submissions = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id
    ).order_by(desc(models.Submission.submitted_at)).limit(20).all()
    
    # Identify weak areas
    weak_subjects = {}
    for qr in quiz_results:
        quiz = db.query(models.Quiz).filter(models.Quiz.id == qr.quiz_id).first()
        if quiz and qr.percentage < 70:
            key = f"{quiz.subject} - {quiz.topic}"
            if key not in weak_subjects:
                weak_subjects[key] = {"subject": quiz.subject, "topic": quiz.topic, "avg_score": 0, "count": 0}
            weak_subjects[key]["avg_score"] += qr.percentage
            weak_subjects[key]["count"] += 1
    
    recommendations = []
    for key, data in weak_subjects.items():
        avg = data["avg_score"] / data["count"]
        priority = "high" if avg < 40 else "medium" if avg < 60 else "low"
        recommendations.append({
            "subject": data["subject"],
            "topic": data["topic"],
            "current_level": round(avg, 1),
            "priority": priority,
            "suggestion": f"Bạn cần ôn tập thêm về {data['topic']} ({data['subject']}). Điểm trung bình hiện tại: {round(avg,1)}%.",
            "recommended_action": "review_material"
        })
    
    # If no weak areas, suggest advancement
    if not recommendations:
        recommendations.append({
            "subject": "Tổng hợp",
            "topic": "Nâng cao",
            "current_level": 85,
            "priority": "low",
            "suggestion": "Bạn đang học rất tốt! Hãy thử thách bản thân với các bài tập nâng cao.",
            "recommended_action": "advance"
        })
    
    # choose advice list: prefer loaded dataset, fallback to hardcoded
    if any(tutor_advice.values()):
        data = tutor_advice
    else:
        # old built-in suggestions if file load failed
        data = {
            "weak": [
                "Bạn nên dành thêm thời gian ôn tập các chủ đề còn yếu. Hãy bắt đầu từ kiến thức cơ bản và làm bài tập từ dễ đến khó nhé! 📚",
                "Mẹo học tốt: Chia nhỏ nội dung, mỗi ngày học 30 phút. Đừng cố nhồi nhét, hãy để não có thời gian tiêu hóa kiến thức 🧠",
                "Hãy thử phương pháp Pomodoro: học 25 phút, nghỉ 5 phút. Sau 4 vòng, nghỉ dài 15 phút. Rất hiệu quả! ⏰",
                "Đừng ngại hỏi bạn bè hoặc thầy cô khi không hiểu. Học nhóm cũng là cách rất tốt để cải thiện! 👥",
                "Ghi chú bằng sơ đồ tư duy sẽ giúp bạn hệ thống hóa kiến thức tốt hơn. Thử áp dụng nhé! 🗺️",
                "Hãy tập trung vào việc hiểu bản chất thay vì học thuộc lòng. Khi hiểu rồi, mọi thứ sẽ dễ nhớ hơn! 💡",
            ],
            "strong": [
                "Bạn đang học rất tốt! Hãy thử thách bản thân với các bài tập nâng cao để tiếp tục phát triển 🚀",
                "Xuất sắc! Bạn có thể giúp đỡ các bạn khác - dạy lại kiến thức là cách tốt nhất để ghi nhớ lâu dài 🌟",
                "Kết quả tuyệt vời! Hãy duy trì thói quen học tập đều đặn và thử khám phá thêm kiến thức mở rộng 📈",
                "Bạn đang trên đà phát triển rất tốt! Thử tham gia các cuộc thi học thuật để thử sức nhé 🏆",
            ],
            "mixed": [
                "Bạn có điểm mạnh rõ ràng! Hãy dành thêm thời gian cho các môn yếu hơn, cân bằng giữa các môn sẽ giúp kết quả tốt hơn 📊",
                "Chiến lược đề xuất: dành 60% thời gian cho môn yếu, 40% cho môn mạnh. Đặt mục tiêu cụ thể cho từng tuần nhé! 🎯",
                "Bạn nên lập một thời khóa biểu học tập cá nhân, ưu tiên ôn tập các chủ đề chưa vững trước kỳ thi 📅",
            ]
        }
    import random
    if not weak_subjects:
        ai_advice = random.choice(data["strong"])
    elif len(weak_subjects) >= 3:
        ai_advice = random.choice(data["weak"])
    else:
        ai_advice = random.choice(data["mixed"])
    
    return {
        "recommendations": sorted(recommendations, key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["priority"]]),
        "ai_advice": ai_advice,
        "study_streak": current_user.streak_days,
        "total_analyzed": len(quiz_results) + len(submissions)
    }

@router.get("/learning-path")
async def get_learning_path(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Generate a personalized learning path."""
    
    quiz_results = db.query(models.QuizResult).filter(
        models.QuizResult.student_id == current_user.id
    ).all()
    
    submissions = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id
    ).all()
    
    # Build subject mastery map
    mastery = {}
    for qr in quiz_results:
        quiz = db.query(models.Quiz).filter(models.Quiz.id == qr.quiz_id).first()
        if quiz:
            subj = quiz.subject
            if subj not in mastery:
                mastery[subj] = {"scores": [], "topics_completed": set()}
            mastery[subj]["scores"].append(qr.percentage)
            mastery[subj]["topics_completed"].add(quiz.topic)
    
    # Generate path
    path = []
    for subj, data in mastery.items():
        avg = sum(data["scores"]) / len(data["scores"]) if data["scores"] else 0
        
        if avg >= 80:
            stage = "Nâng cao"
            stage_icon = "🚀"
            next_step = "Thử sức với bài tập khó hơn"
        elif avg >= 60:
            stage = "Trung bình"
            stage_icon = "📚"
            next_step = "Ôn tập các chủ đề chưa vững"
        else:
            stage = "Cần cải thiện"
            stage_icon = "🎯"
            next_step = "Quay lại ôn kiến thức cơ bản"
        
        path.append({
            "subject": subj,
            "mastery_level": round(avg, 1),
            "stage": stage,
            "stage_icon": stage_icon,
            "topics_completed": len(data["topics_completed"]),
            "total_tests": len(data["scores"]),
            "next_step": next_step,
            "progress": min(100, int(avg))
        })
    
    # Overall metrics
    total_score = sum(m["mastery_level"] * m["total_tests"] for m in path)
    total_tests = sum(m["total_tests"] for m in path)
    
    return {
        "overall_mastery": round(total_score / total_tests, 1) if total_tests else 0,
        "total_subjects": len(path),
        "total_assessments": total_tests,
        "path": sorted(path, key=lambda x: x["mastery_level"]),
        "current_level": current_user.level,
        "xp_to_next": (current_user.level * 100) - current_user.xp_points
    }
