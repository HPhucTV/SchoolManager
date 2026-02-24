from app.database import get_db, SessionLocal
from app import models
from app.routers.auth import get_current_user
from sqlalchemy.orm import Session
from fastapi import APIRouter, HTTPException, Body, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from app.services.word_service import word_service
from app.services.riddle_service import riddle_service
import json
import os
import random
import asyncio
import logging

# configure module logger
logger = logging.getLogger(__name__)

router = APIRouter()

# Load chatbot fallback dataset
CHATBOT_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "chatbot_responses.json")
chatbot_fallback = {"responses": {}, "keywords": {}}

def load_fallback():
    global chatbot_fallback
    try:
        with open(CHATBOT_DATA_PATH, "r", encoding="utf-8") as f:
            chatbot_fallback = json.load(f)
        logger.info("Loaded chatbot fallback dataset")
    except Exception as e:
        logger.warning("Could not load chatbot fallback: %s", e)

# do initial load
load_fallback()


def get_fallback_response(message: str, persona: str) -> str:
    """Get a fallback response from local dataset based on message keywords and persona."""
    responses = chatbot_fallback.get("responses", {})
    keywords_map = chatbot_fallback.get("keywords", {})
    
    # Use the persona's responses, fallback to 'default'
    persona_responses = responses.get(persona, responses.get("default", {}))
    if not persona_responses:
        return "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau."
    
    # Detect category from message keywords
    message_lower = message.lower()
    detected_category = "general"
    max_matches = 0
    
    for category, keywords in keywords_map.items():
        matches = sum(1 for kw in keywords if kw in message_lower)
        if matches > max_matches:
            max_matches = matches
            detected_category = category
    
    # Get responses for detected category
    category_responses = persona_responses.get(detected_category, persona_responses.get("general", []))
    if not category_responses:
        # Flatten all responses as last resort
        all_responses = []
        for cat_resps in persona_responses.values():
            all_responses.extend(cat_resps)
        category_responses = all_responses
    
    return random.choice(category_responses) if category_responses else "Mình ở đây lắng nghe bạn! 😊"

def update_student_sentiment(user_id: int, message_content: str):
    """
    Background task to analyze sentiment and update student scores.
    Creates its own DB session to avoid holding connections during streaming.
    """
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            return

        last_message = message_content.lower()
        
        negative_keywords = ["buồn", "chán", "mệt", "stress", "áp lực", "khó quá", "không hiểu", "ghét"]
        positive_keywords = ["vui", "thích", "hào hứng", "dễ", "yêu", "tuyệt"]
        
        is_negative = any(k in last_message for k in negative_keywords)
        is_positive = any(k in last_message for k in positive_keywords)
        
        if is_negative:
            if "stress" in last_message or "áp lực" in last_message:
                user.mental_health_score = max(0, user.mental_health_score - 10)
            
            if "chán" in last_message or "ghét" in last_message:
                user.engagement_score = max(0, user.engagement_score - 10)
                
            if "buồn" in last_message:
                user.happiness_score = max(0, user.happiness_score - 10)
                
            # General decrease if just general negative
            if not any(k in last_message for k in ["stress", "áp lực", "chán", "ghét", "buồn"]):
                 user.happiness_score = max(0, user.happiness_score - 5)
                 
            db.commit()
        
        elif is_positive:
            # Slight recovery
            user.happiness_score = min(100, user.happiness_score + 2)
            user.mental_health_score = min(100, user.mental_health_score + 2)
            db.commit()
            
    except Exception as e:
        logger.error("Error in background sentiment update: %s", e)
    finally:
        db.close()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    persona: str

class ChatResponse(BaseModel):
    response: str

@router.post("/chat/reload")
def reload_chatbot(current_user: models.User = Depends(get_current_user)):
    """Reload the fallback dataset from disk. Useful for admin/debug."""
    load_fallback()
    return {"status": "ok"}


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest, 
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user)
):
    """
    Chatbot endpoint powered solely by the local fallback dataset.
    Sentiment analysis runs in a background task.  Streams the selected reply
    back to the client character‑by‑character for a natural feel.
    """
    last_message = request.messages[-1].content
    
    # Offload sentiment analysis to background task (async aware)
    background_tasks.add_task(update_student_sentiment, current_user.id, last_message)

    # Generate response entirely from the fallback dataset
    response_text = get_fallback_response(last_message, request.persona)

    async def generate():
        for char in response_text:
            yield char
            await asyncio.sleep(0.02)

    return StreamingResponse(generate(), media_type="text/plain")

class WordChainRequest(BaseModel):
    current_word: str
    history: List[str] = []

class WordChainResponse(BaseModel):
    valid: bool
    next_word: Optional[str] = None
    message: Optional[str] = None

class RiddleNextRequest(BaseModel):
    history: List[int] = []

class RiddleCheckRequest(BaseModel):
    riddle_id: int
    answer: str

class RiddleRevealRequest(BaseModel):
    riddle_id: int

@router.post("/word-chain", response_model=WordChainResponse)
@router.post("/word-chain/test", response_model=WordChainResponse)
async def check_word_chain(request: WordChainRequest):
    """
    Validate user's word and provide AI response.
    Supports both authenticated and test endpoints.
    """
    # 1. Get AI response using word_service
    result = word_service.get_response(request.current_word, request.history)
    
    return WordChainResponse(
        valid=result["valid"],
        next_word=result["next_word"],
        message=result["message"]
    )

@router.post("/riddles/next")
async def get_next_riddle(request: RiddleNextRequest):
    riddle = riddle_service.get_next_riddle(request.history)
    return {"riddle": riddle}

@router.post("/riddles/check")
async def check_riddle_answer(request: RiddleCheckRequest):
    result = riddle_service.check_answer(request.riddle_id, request.answer)
    return {"result": result}

@router.post("/riddles/reveal")
async def reveal_riddle_answer(request: RiddleRevealRequest):
    riddle = riddle_service.get_riddle_by_id(request.riddle_id)
    if not riddle:
        raise HTTPException(status_code=404, detail="Riddle not found")
    return {"result": {"correct_answer": riddle["answer"]}}
