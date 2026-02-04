from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import json
import random
import os
from app.database import get_db
from app import models
from app.routers.auth import get_current_user
from sqlalchemy.orm import Session

router = APIRouter()

# Load crossword dataset
DATASET_PATH = "app/data/crosswords.json"
crossword_data = []

def load_data():
    global crossword_data
    try:
        with open(DATASET_PATH, "r", encoding="utf-8") as f:
            crossword_data = json.load(f)
    except Exception as e:
        print(f"Error loading crossword data: {e}")
        crossword_data = []

load_data()

class CrosswordCheckRequest(BaseModel):
    id: int
    answer: str

class CrosswordResponse(BaseModel):
    id: int
    topic: str
    question: str
    hint: str
    length: int

@router.get("/crossword/random", response_model=CrosswordResponse)
async def get_random_crossword(current_user: models.User = Depends(get_current_user)):
    if not crossword_data:
        load_data()
        if not crossword_data:
             raise HTTPException(status_code=500, detail="No crossword data available")
    
    item = random.choice(crossword_data)
    
    # Return scrambled or hidden answer if needed, but here we just return length
    return CrosswordResponse(
        id=item["id"],
        topic=item["topic"],
        question=item["question"],
        hint=item["hint"],
        length=len(item["answer"])
    )

@router.post("/crossword/check")
async def check_crossword_answer(
    request: CrosswordCheckRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    item = next((x for x in crossword_data if x["id"] == request.id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Question not found")
        
    correct = item["answer"].upper() == request.answer.upper().replace(" ", "")
    
    bonus = 0
    if correct:
        bonus = 10
        # Add bonus to student score
        current_user.happiness_score = min(100, current_user.happiness_score + 5)
        current_user.engagement_score = min(100, current_user.engagement_score + 2)
        db.commit()
        
    return {
        "correct": correct,
        "correct_answer": item["answer"] if correct else None, # Only reveal if correct (or fail policy)
        "message": "Chính xác! Bạn nhận được điểm thưởng." if correct else "Chưa đúng, thử lại nhé!",
        "bonus_score": bonus
    }
