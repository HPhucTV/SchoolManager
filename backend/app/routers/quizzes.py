from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app import models
from app.routers.auth import get_current_user
from datetime import datetime

import random
import json
import os

router = APIRouter()

# --- Load Quiz Bank Dataset ---
QUIZ_BANK_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "quiz_bank.json")
quiz_bank = {}
try:
    with open(QUIZ_BANK_PATH, "r", encoding="utf-8") as f:
        quiz_bank = json.load(f)
    total_qs = sum(len(v) for s in quiz_bank.values() for v in s.values())
    print(f"[SUCCESS] Loaded quiz bank: {total_qs} questions across {len(quiz_bank)} subjects")
except Exception as e:
    print(f"[WARNING] Could not load quiz bank: {e}")

def _match_subject(topic: str) -> str:
    """Fuzzy match topic/subject to a quiz bank subject."""
    topic_lower = topic.lower().strip()
    
    # Direct match
    for subject in quiz_bank:
        if subject.lower() in topic_lower or topic_lower in subject.lower():
            return subject
    
    # Keyword matching
    keyword_map = {
        "Toán": ["toán","math","phương trình","hình học","đại số","số học","tích phân","đạo hàm","xác suất","thống kê","lượng giác","vectơ","hàm số"],
        "Lý": ["vật lý","lý","physics","điện","quang","cơ học","nhiệt","sóng","từ trường","newton","năng lượng"],
        "Hóa": ["hóa","chemistry","nguyên tử","phản ứng","axit","bazơ","muối","hữu cơ","vô cơ","oxi","hidro"],
        "Sinh": ["sinh","biology","tế bào","ADN","gen","di truyền","quang hợp","tiến hóa","hệ sinh thái","enzyme"],
        "Sử": ["sử","history","lịch sử","chiến tranh","cách mạng","triều đại","phong kiến"],
        "Văn": ["văn","literature","thơ","truyện","tác phẩm","nhà văn","văn học","nghị luận"],
        "Địa": ["địa","geography","địa lý","khí hậu","dân số","sông","biển","châu lục"],
        "Anh văn": ["anh","english","tiếng anh","grammar","vocabulary","toeic","ielts"],
        "Tin học": ["tin","informatics","computer","lập trình","python","html","thuật toán","máy tính"],
        "GDCD": ["gdcd","công dân","pháp luật","hiến pháp","đạo đức","quyền","nghĩa vụ"],
    }
    
    best_match = None
    best_score = 0
    for subject, keywords in keyword_map.items():
        score = sum(1 for kw in keywords if kw in topic_lower)
        if score > best_score:
            best_score = score
            best_match = subject
    
    return best_match

def generate_bank_questions(topic: str, difficulty: str, count: int, start_index: int) -> List[dict]:
    """Select real questions from quiz bank."""
    matched_subject = _match_subject(topic)
    
    if not matched_subject or matched_subject not in quiz_bank:
        if quiz_bank:
            matched_subject = random.choice(list(quiz_bank.keys()))
        else:
            return _generate_generic_fallback(topic, difficulty, count, start_index)
    
    available = quiz_bank[matched_subject].get(difficulty, [])
    if not available:
        for d in ["easy", "medium", "hard"]:
            if quiz_bank[matched_subject].get(d):
                available = quiz_bank[matched_subject][d]
                break
    
    if not available:
        return _generate_generic_fallback(topic, difficulty, count, start_index)
    
    selected = random.sample(available, min(count, len(available)))
    
    if len(selected) < count:
        extra_pool = []
        for d in ["easy", "medium", "hard"]:
            if d != difficulty:
                extra_pool.extend(quiz_bank[matched_subject].get(d, []))
        if extra_pool:
            needed = count - len(selected)
            selected.extend(random.sample(extra_pool, min(needed, len(extra_pool))))
    
    result = []
    for i, q in enumerate(selected):
        result.append({
            "question_text": q["question_text"],
            "difficulty": difficulty,
            "option_a": q["option_a"],
            "option_b": q["option_b"],
            "option_c": q["option_c"],
            "option_d": q["option_d"],
            "correct_answer": q["correct_answer"],
            "order_num": start_index + i
        })
    return result

def _generate_generic_fallback(topic: str, difficulty: str, count: int, start_index: int) -> List[dict]:
    """Last resort fallback."""
    diff_vn = {"easy": "cơ bản", "medium": "trung bình", "hard": "nâng cao"}.get(difficulty, difficulty)
    questions = []
    for i in range(count):
        questions.append({
            "question_text": f"Câu hỏi {diff_vn} số {i+1} về {topic}",
            "difficulty": difficulty,
            "option_a": "Đáp án A", "option_b": "Đáp án B",
            "option_c": "Đáp án C", "option_d": "Đáp án D",
            "correct_answer": random.choice(["A","B","C","D"]),
            "order_num": start_index + i
        })
    return questions

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

class QuizQuestionCreate(BaseModel):
    question_text: str
    difficulty: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str

class QuizCreate(QuizBase):
    questions: Optional[List[QuizQuestionCreate]] = None

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

# --- Generate questions from bank ---
async def generate_ai_questions(topic: str, difficulty: str, count: int, start_index: int) -> List[dict]:
    """Generate questions from local quiz bank (no API needed)."""
    return generate_bank_questions(topic, difficulty, count, start_index)

# --- Endpoints ---

@router.get("", response_model=List[QuizResponse])
async def get_quizzes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    quizzes = db.query(models.Quiz).filter(models.Quiz.teacher_id == current_user.id).all()
    return quizzes

@router.post("", response_model=QuizResponse)
async def create_quiz(quiz_data: QuizCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create quizzes")
    
    # Calculate total questions
    if quiz_data.questions:
        total_q = len(quiz_data.questions)
    else:
        total_q = quiz_data.easy_count + quiz_data.medium_count + quiz_data.hard_count
    
    new_quiz = models.Quiz(
        title=quiz_data.title,
        subject=quiz_data.subject,
        topic=quiz_data.topic,
        class_id=quiz_data.class_id,
        teacher_id=current_user.id,
        easy_count=quiz_data.easy_count if not quiz_data.questions else sum(1 for q in quiz_data.questions if q.difficulty == 'easy'),
        medium_count=quiz_data.medium_count if not quiz_data.questions else sum(1 for q in quiz_data.questions if q.difficulty == 'medium'),
        hard_count=quiz_data.hard_count if not quiz_data.questions else sum(1 for q in quiz_data.questions if q.difficulty == 'hard'),
        total_questions=total_q,
        deadline=quiz_data.deadline,
        allow_retake=quiz_data.allow_retake,
        created_at=datetime.now().isoformat(),
        status="draft"
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)
    
    generated_questions = []
    
    # Handle manual questions vs generated questions
    if quiz_data.questions:
        for idx, q_in in enumerate(quiz_data.questions):
             generated_questions.append({
                 "question_text": q_in.question_text,
                 "difficulty": q_in.difficulty,
                 "option_a": q_in.option_a,
                 "option_b": q_in.option_b,
                 "option_c": q_in.option_c,
                 "option_d": q_in.option_d,
                 "correct_answer": q_in.correct_answer,
                 "order_num": idx
             })
    else:
        # Generate Questions (From Bank)
        idx = 0
        # Easy
        if quiz_data.easy_count > 0:
            generated_questions.extend(await generate_ai_questions(quiz_data.topic, "easy", quiz_data.easy_count, idx))
            idx += quiz_data.easy_count
        
        # Medium
        if quiz_data.medium_count > 0:
            generated_questions.extend(await generate_ai_questions(quiz_data.topic, "medium", quiz_data.medium_count, idx))
            idx += quiz_data.medium_count
        
        # Hard
        if quiz_data.hard_count > 0:
            generated_questions.extend(await generate_ai_questions(quiz_data.topic, "hard", quiz_data.hard_count, idx))
    
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
    
    # --- Create Notification for Students ---
    try:
        from app.routers.notifications import create_notification_for_class
        create_notification_for_class(
            db=db,
            class_id=new_quiz.class_id,
            title=f"Bài kiểm tra mới: {new_quiz.title}",
            message=f"Môn {new_quiz.subject} - {new_quiz.topic}. Hạn nộp: {new_quiz.deadline}.",
            notif_type="quiz",
            action_url=f"/student/quiz/{new_quiz.id}"
        )
    except Exception as e:
        print(f"Failed to create notification: {e}")
        
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
    
    if current_user.role == "teacher" and quiz.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete related results first
    db.query(models.QuizResult).filter(models.QuizResult.quiz_id == quiz_id).delete()
    # Delete related questions
    db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz_id).delete()
    # Delete the quiz
    db.delete(quiz)
    db.commit()
    return {"message": "Deleted successfully"}

# --- Student Endpoints ---

@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz_details(quiz_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Student can view if active and in their class
    # Teacher can view their own
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if current_user.role == "student":
        if quiz.class_id != current_user.class_id:
             raise HTTPException(status_code=403, detail="Not authorized for this class")
        # if quiz.status != "active":
        #      raise HTTPException(status_code=403, detail="Quiz is not active")
        # Allow viewing if attempting (status might be active)
    elif current_user.role == "teacher":
        if quiz.teacher_id != current_user.id:
             raise HTTPException(status_code=403, detail="Not authorized")
             
    return quiz

@router.get("/{quiz_id}/my-result")
async def get_my_result(quiz_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "student":
        return {"attempted": False}
        
    result = db.query(models.QuizResult).filter(
        models.QuizResult.quiz_id == quiz_id,
        models.QuizResult.student_id == current_user.id
    ).first()
    
    if result:
        return {
            "attempted": True,
            "score": result.score,
            "total_questions": result.total_questions,
            "percentage": result.percentage,
            "completed_at": result.completed_at
        }
    return {"attempted": False}

class QuizSubmit(BaseModel):
    answers: dict[int, str] # question_id -> option (A, B, C, D)

@router.post("/{quiz_id}/submit")
async def submit_quiz(quiz_id: int, submit_data: QuizSubmit, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit quizzes")
        
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    # Check if already submitted
    existing = db.query(models.QuizResult).filter(
        models.QuizResult.quiz_id == quiz_id,
        models.QuizResult.student_id == current_user.id
    ).first()
    
    # Check retake policy (mocked check, currently if exists reject unless we impl retake logic)
    if existing and not quiz.allow_retake:
         raise HTTPException(status_code=400, detail="You have already submitted this quiz")
         
    # Calculate Score
    score = 0
    total = len(quiz.questions)
    
    # Create result
    import json
    
    # Basic scoring logic
    for q in quiz.questions:
        user_ans = submit_data.answers.get(q.id)
        if user_ans and user_ans == q.correct_answer:
            score += 1
            
    percentage = round((score / total) * 100, 1) if total > 0 else 0
    
    new_result = models.QuizResult(
        quiz_id=quiz_id,
        student_id=current_user.id,
        score=score,
        total_questions=total,
        percentage=percentage,
        answers=json.dumps(submit_data.answers),
        completed_at=datetime.now().isoformat()
    )
    
    # If retake is allowed, maybe we update existing or creating new?
    # For now, if existing, we delete it (overwrite) or just add new? 
    # Let's overwrite for simplicity if allow_retake is True
    if existing:
        db.delete(existing)
        
    db.add(new_result)
    db.commit()
    db.refresh(new_result)
    
    return {
        "score": score,
        "total_questions": total,
        "percentage": percentage,
        "completed_at": new_result.completed_at
    }

@router.post("/upload-docx")
async def upload_docx(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can upload quiz files")
        
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx files are supported")
        
    try:
        import docx
        import io
        
        contents = await file.read()
        doc = docx.Document(io.BytesIO(contents))
        
        questions = []
        current_q = None
        
        for p in doc.paragraphs:
            text = p.text.strip()
            if not text:
                continue
                
            # Detect Question
            if text.lower().startswith("câu"):
                if current_q and current_q.get("question_text"):
                    # ensure we have all 4 options before appending
                    if all(k in current_q for k in ["option_a", "option_b", "option_c", "option_d"]):
                        # ensure we have a default answer if none found
                        if not current_q.get("correct_answer"):
                             current_q["correct_answer"] = "A" # Default fallback
                        questions.append(current_q)
                
                # Extract question text (e.g. "Câu 1: Nội dung...")
                parts = text.split(":", 1)
                q_text = parts[1].strip() if len(parts) > 1 else text
                current_q = {
                    "question_text": q_text,
                    "difficulty": "medium", # default
                    "correct_answer": None
                }
                
            # Detect Options (A., B., C., D.)
            elif text.startswith("A.") or text.startswith("A "):
                 if current_q is not None:
                     current_q["option_a"] = text[2:].strip()
                     # Basic check for correct answer (e.g. if it has underline/bold, but plain text is hard)
                     # For now, let's just rely on standard extraction
            elif text.startswith("B.") or text.startswith("B "):
                 if current_q is not None:
                     current_q["option_b"] = text[2:].strip()
            elif text.startswith("C.") or text.startswith("C "):
                 if current_q is not None:
                     current_q["option_c"] = text[2:].strip()
            elif text.startswith("D.") or text.startswith("D "):
                 if current_q is not None:
                     current_q["option_d"] = text[2:].strip()
                     
            # Try to infer correct answer from text
            # E.g. "Đáp án: A"
            elif text.lower().startswith("đáp án:") or text.lower().startswith("đáp án "):
                 if current_q is not None:
                      ans = text.split(":")[1].strip().upper() if ":" in text else text.split()[2].strip().upper()
                      if ans in ["A", "B", "C", "D"]:
                          current_q["correct_answer"] = ans
        
        # Add the last question
        if current_q and current_q.get("question_text") and all(k in current_q for k in ["option_a", "option_b", "option_c", "option_d"]):
            if not current_q.get("correct_answer"):
                 current_q["correct_answer"] = "A" # Default fallback
            questions.append(current_q)
            
        return questions
        
    except Exception as e:
        print(f"Error parse docx: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse document. Please ensure standard format.")
