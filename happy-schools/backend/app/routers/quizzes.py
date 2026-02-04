from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app import models
from app.routers.auth import get_current_user
from datetime import datetime
import random

router = APIRouter()

# --- Schemas ---

class QuizBase(BaseModel):
    title: str
    subject: str
    topic: str
    class_id: int
    easy_count: int = 3
    medium_count: int = 4
    hard_count: int = 3
    deadline: Optional[str] = None
    allow_retake: bool = False

class QuizCreate(QuizBase):
    pass

class QuizUpdate(BaseModel):
    status: Optional[str] = None

class QuizQuestionResponse(BaseModel):
    id: int
    question_text: str
    difficulty: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    class Config:
        from_attributes = True

class QuizResponse(QuizBase):
    id: int
    status: str
    total_questions: int
    created_at: str
    questions: List[QuizQuestionResponse] = []
    class Config:
        from_attributes = True

# --- Helper to mock AI generation ---
def generate_mock_questions(topic: str, difficulty: str, count: int, start_index: int) -> List[dict]:
    questions = []
    diff_vn = {"easy": "Dễ", "medium": "Trung bình", "hard": "Khó"}.get(difficulty, difficulty)
    
    for i in range(count):
        questions.append({
            "question_text": f"Câu hỏi {diff_vn} {i+1} về chủ đề: {topic}?",
            "difficulty": difficulty,
            "option_a": f"Đáp án A cho {topic}",
            "option_b": f"Đáp án B sai",
            "option_c": f"Đáp án C sai",
            "option_d": f"Đáp án D sai",
            "correct_answer": "A", # Simplified for mock
            "order_num": start_index + i
        })
    return questions

# --- Endpoints ---

@router.get("/", response_model=List[QuizResponse])
async def get_quizzes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    quizzes = db.query(models.Quiz).filter(models.Quiz.teacher_id == current_user.id).all()
    return quizzes

@router.post("/", response_model=QuizResponse)
async def create_quiz(quiz_data: QuizCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create quizzes")
    
    total_q = quiz_data.easy_count + quiz_data.medium_count + quiz_data.hard_count
    
    new_quiz = models.Quiz(
        title=quiz_data.title,
        subject=quiz_data.subject,
        topic=quiz_data.topic,
        class_id=quiz_data.class_id,
        teacher_id=current_user.id,
        easy_count=quiz_data.easy_count,
        medium_count=quiz_data.medium_count,
        hard_count=quiz_data.hard_count,
        total_questions=total_q,
        deadline=quiz_data.deadline,
        allow_retake=quiz_data.allow_retake,
        created_at=datetime.now().isoformat(),
        status="draft"
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)
    
    # Generate Questions (Mock AI)
    generated_questions = []
    idx = 0
    
    # Easy
    generated_questions.extend(generate_mock_questions(quiz_data.topic, "easy", quiz_data.easy_count, idx))
    idx += quiz_data.easy_count
    
    # Medium
    generated_questions.extend(generate_mock_questions(quiz_data.topic, "medium", quiz_data.medium_count, idx))
    idx += quiz_data.medium_count
    
    # Hard
    generated_questions.extend(generate_mock_questions(quiz_data.topic, "hard", quiz_data.hard_count, idx))
    
    for q in generated_questions:
        db_q = models.QuizQuestion(
            quiz_id=new_quiz.id,
            question_text=q["question_text"],
            difficulty=q["difficulty"],
            option_a=q["option_a"],
            option_b=q["option_b"],
            option_c=q["option_c"],
            option_d=q["option_d"],
            correct_answer=q["correct_answer"],
            order_num=q["order_num"]
        )
        db.add(db_q)
        
    db.commit()
    db.refresh(new_quiz)
    return new_quiz

@router.put("/{quiz_id}", response_model=QuizResponse)
async def update_quiz(quiz_id: int, quiz_data: QuizUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if quiz.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if quiz_data.status:
        quiz.status = quiz_data.status
        
    db.commit()
    db.refresh(quiz)
    return quiz

@router.delete("/{quiz_id}")
async def delete_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if quiz.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(quiz)
    db.commit()
    return {"message": "Deleted successfully"}
