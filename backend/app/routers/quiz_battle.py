from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Literal
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app import models
from app.authorization import require_owner_or_admin, require_roles, require_student_membership
from app.routers.auth import get_current_user
from datetime import datetime
import random
import string
import json

router = APIRouter()

# --- Schemas ---

class BattleCreate(BaseModel):
    quiz_id: int
    time_per_question: int = Field(default=30, ge=5, le=120)

class BattleJoin(BaseModel):
    battle_code: str = Field(min_length=6, max_length=6)

class BattleAnswerSubmit(BaseModel):
    question_index: int = Field(ge=0)
    answer: Literal["A", "B", "C", "D"]
    time_taken: float = Field(ge=0)

# --- Endpoints ---

def generate_battle_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


def _get_battle_participant(
    db: Session,
    battle_id: int,
    user_id: int,
) -> models.BattleParticipant | None:
    return db.query(models.BattleParticipant).filter(
        models.BattleParticipant.battle_id == battle_id,
        models.BattleParticipant.user_id == user_id,
    ).first()


def _require_battle_access(
    db: Session,
    current_user: models.User,
    battle: models.QuizBattle,
) -> None:
    if current_user.role == "admin" or battle.created_by == current_user.id:
        return
    if _get_battle_participant(db, battle.id, current_user.id) is not None:
        return
    raise HTTPException(status_code=403, detail="Bạn không tham gia trận đấu này")


@router.get("/active")
async def get_active_battles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List only active battles visible to the current role and class."""

    query = db.query(models.QuizBattle).filter(
        models.QuizBattle.status.in_(["waiting", "active"])
    )
    if current_user.role == "teacher":
        query = query.filter(models.QuizBattle.created_by == current_user.id)
    elif current_user.role == "student":
        query = query.join(models.Quiz, models.Quiz.id == models.QuizBattle.quiz_id).filter(
            models.Quiz.class_id == current_user.class_id
        )
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem Quiz Battle")

    battles = query.order_by(desc(models.QuizBattle.created_at)).limit(20).all()
    results = []
    for battle in battles:
        quiz = db.query(models.Quiz).filter(models.Quiz.id == battle.quiz_id).first()
        participants_count = db.query(models.BattleParticipant).filter(
            models.BattleParticipant.battle_id == battle.id
        ).count()
        joined = _get_battle_participant(db, battle.id, current_user.id) is not None
        creator = db.query(models.User).filter(models.User.id == battle.created_by).first()
        results.append({
            "id": battle.id,
            "battle_code": battle.battle_code,
            "quiz_title": quiz.title if quiz else "",
            "quiz_subject": quiz.subject if quiz else "",
            "status": battle.status,
            "participants_count": participants_count,
            "time_per_question": battle.time_per_question,
            "created_by": creator.name if creator else "N/A",
            "created_at": battle.created_at,
            "joined": joined,
        })
    return results

@router.post("/create")
async def create_battle(
    data: BattleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới tạo được Quiz Battle")
    
    quiz = db.query(models.Quiz).filter(models.Quiz.id == data.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz không tồn tại")
    require_owner_or_admin(current_user, quiz.teacher_id)
    
    # Make sure quiz has questions
    questions = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.quiz_id == data.quiz_id
    ).count()
    if questions == 0:
        raise HTTPException(status_code=400, detail="Quiz chưa có câu hỏi")
    
    battle = models.QuizBattle(
        quiz_id=data.quiz_id,
        created_by=current_user.id,
        time_per_question=data.time_per_question,
        battle_code=generate_battle_code(),
        created_at=datetime.now().isoformat()
    )
    db.add(battle)
    db.commit()
    db.refresh(battle)
    
    return {
        "id": battle.id,
        "battle_code": battle.battle_code,
        "quiz_title": quiz.title,
        "total_questions": questions,
        "status": battle.status,
        "time_per_question": battle.time_per_question
    }

@router.post("/join")
async def join_battle(
    data: BattleJoin,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    require_roles(current_user, "student")
    battle = db.query(models.QuizBattle).filter(
        models.QuizBattle.battle_code == data.battle_code.upper()
    ).first()
    if not battle:
        raise HTTPException(status_code=404, detail="Không tìm thấy trận đấu với mã này")
    
    if battle.status == "finished":
        raise HTTPException(status_code=400, detail="Trận đấu đã kết thúc")

    quiz = db.query(models.Quiz).filter(models.Quiz.id == battle.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz không tồn tại")
    require_student_membership(current_user, quiz.class_id)
    
    # Check if already joined
    existing = db.query(models.BattleParticipant).filter(
        models.BattleParticipant.battle_id == battle.id,
        models.BattleParticipant.user_id == current_user.id
    ).first()
    if existing:
        return {"message": "Bạn đã tham gia trận đấu này", "battle_id": battle.id, "participant_id": existing.id}
    
    participant = models.BattleParticipant(
        battle_id=battle.id,
        user_id=current_user.id,
        joined_at=datetime.now().isoformat()
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    
    return {
        "message": "Tham gia thành công!",
        "battle_id": battle.id,
        "participant_id": participant.id,
        "quiz_title": quiz.title if quiz else "",
        "status": battle.status
    }

@router.post("/{battle_id}/start")
async def start_battle(
    battle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    battle = db.query(models.QuizBattle).filter(models.QuizBattle.id == battle_id).first()
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    require_owner_or_admin(current_user, battle.created_by)
    
    battle.status = "active"
    battle.started_at = datetime.now().isoformat()
    db.commit()
    
    participants = db.query(models.BattleParticipant).filter(
        models.BattleParticipant.battle_id == battle_id
    ).count()
    
    return {"message": "Trận đấu bắt đầu!", "participants": participants}

@router.get("/{battle_id}")
async def get_battle_status(
    battle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    battle = db.query(models.QuizBattle).filter(models.QuizBattle.id == battle_id).first()
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    _require_battle_access(db, current_user, battle)
    
    quiz = db.query(models.Quiz).filter(models.Quiz.id == battle.quiz_id).first()
    
    participants = db.query(models.BattleParticipant).filter(
        models.BattleParticipant.battle_id == battle_id
    ).all()
    
    total_questions = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.quiz_id == battle.quiz_id
    ).count()
    
    return {
        "id": battle.id,
        "battle_code": battle.battle_code,
        "quiz_title": quiz.title if quiz else "",
        "quiz_subject": quiz.subject if quiz else "",
        "status": battle.status,
        "current_question": battle.current_question,
        "total_questions": total_questions,
        "time_per_question": battle.time_per_question,
        "started_at": battle.started_at,
        "participants": [{
            "id": p.id,
            "user_id": p.user_id,
            "name": db.query(models.User).filter(models.User.id == p.user_id).first().name if db.query(models.User).filter(models.User.id == p.user_id).first() else "N/A",
            "score": p.score,
            "answers_correct": p.answers_correct,
            "answers_total": p.answers_total,
            "is_me": p.user_id == current_user.id
        } for p in participants]
    }

@router.get("/{battle_id}/question")
async def get_current_question(
    battle_id: int,
    question_index: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    battle = db.query(models.QuizBattle).filter(models.QuizBattle.id == battle_id).first()
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    
    if battle.status != "active":
        raise HTTPException(status_code=400, detail="Trận đấu chưa bắt đầu hoặc đã kết thúc")

    participant = _get_battle_participant(db, battle_id, current_user.id)
    if participant is None and battle.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn chưa tham gia trận đấu")
    
    questions = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.quiz_id == battle.quiz_id
    ).order_by(models.QuizQuestion.order_num).all()
    
    if question_index >= len(questions):
        return {"finished": True, "message": "Đã hết câu hỏi!"}
    
    q = questions[question_index]
    
    # Check if already answered
    already_answered = False
    if participant:
        existing_answer = db.query(models.BattleAnswer).filter(
            models.BattleAnswer.participant_id == participant.id,
            models.BattleAnswer.question_index == question_index
        ).first()
        already_answered = existing_answer is not None
    
    return {
        "finished": False,
        "question_index": question_index,
        "total_questions": len(questions),
        "question_text": q.question_text,
        "option_a": q.option_a,
        "option_b": q.option_b,
        "option_c": q.option_c,
        "option_d": q.option_d,
        "already_answered": already_answered,
        "time_limit": battle.time_per_question
    }

@router.post("/{battle_id}/answer")
async def submit_battle_answer(
    battle_id: int,
    data: BattleAnswerSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    battle = db.query(models.QuizBattle).filter(models.QuizBattle.id == battle_id).first()
    if not battle or battle.status != "active":
        raise HTTPException(status_code=400, detail="Trận đấu không hoạt động")
    
    participant = _get_battle_participant(db, battle_id, current_user.id)
    if not participant:
        raise HTTPException(status_code=403, detail="Bạn chưa tham gia trận đấu")
    
    # Check if already answered this question
    existing = db.query(models.BattleAnswer).filter(
        models.BattleAnswer.participant_id == participant.id,
        models.BattleAnswer.question_index == data.question_index
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bạn đã trả lời câu này rồi")
    
    # Get question
    questions = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.quiz_id == battle.quiz_id
    ).order_by(models.QuizQuestion.order_num).all()
    
    if data.question_index >= len(questions):
        raise HTTPException(status_code=400, detail="Câu hỏi không hợp lệ")
    
    q = questions[data.question_index]
    is_correct = data.answer.upper() == q.correct_answer.upper()
    
    # Client timing is informational only. It must never influence the score.
    # A server-timed question lifecycle can reintroduce a trusted speed bonus later.
    points = 100 if is_correct else 0
    recorded_time = min(data.time_taken, float(battle.time_per_question))
    
    answer = models.BattleAnswer(
        battle_id=battle_id,
        participant_id=participant.id,
        question_index=data.question_index,
        answer=data.answer,
        is_correct=is_correct,
        time_taken=recorded_time,
        points_earned=points,
        answered_at=datetime.now().isoformat()
    )
    db.add(answer)
    
    participant.score += points
    participant.answers_total += 1
    if is_correct:
        participant.answers_correct += 1
    
    # Check if all participants answered all questions → auto finish
    total_questions = len(questions)
    all_participants = db.query(models.BattleParticipant).filter(
        models.BattleParticipant.battle_id == battle_id
    ).all()
    
    all_done = True
    for p in all_participants:
        answered = db.query(models.BattleAnswer).filter(
            models.BattleAnswer.participant_id == p.id
        ).count()
        if answered < total_questions:
            all_done = False
            break
    
    if all_done:
        battle.status = "finished"
        battle.finished_at = datetime.now().isoformat()
        
        # Award XP and coins to participants
        sorted_participants = sorted(all_participants, key=lambda p: p.score, reverse=True)
        for rank, p in enumerate(sorted_participants, 1):
            user = db.query(models.User).filter(models.User.id == p.user_id).first()
            if user:
                if rank == 1:
                    user.xp_points += 50
                    user.coins += 20
                elif rank == 2:
                    user.xp_points += 30
                    user.coins += 10
                elif rank == 3:
                    user.xp_points += 20
                    user.coins += 5
                else:
                    user.xp_points += 10
                    user.coins += 2
    
    db.commit()
    
    return {
        "correct": is_correct,
        "points_earned": points,
        "total_score": participant.score,
        "battle_finished": all_done
    }

@router.get("/{battle_id}/leaderboard")
async def get_battle_leaderboard(
    battle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    battle = db.query(models.QuizBattle).filter(models.QuizBattle.id == battle_id).first()
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    _require_battle_access(db, current_user, battle)

    participants = db.query(models.BattleParticipant).filter(
        models.BattleParticipant.battle_id == battle_id
    ).order_by(desc(models.BattleParticipant.score)).all()
    
    return [{
        "rank": i + 1,
        "name": db.query(models.User).filter(models.User.id == p.user_id).first().name if db.query(models.User).filter(models.User.id == p.user_id).first() else "N/A",
        "score": p.score,
        "correct": p.answers_correct,
        "total": p.answers_total,
        "is_me": p.user_id == current_user.id
    } for i, p in enumerate(participants)]
