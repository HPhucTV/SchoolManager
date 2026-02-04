from app.database import get_db
from app import models
from app.routers.auth import get_current_user
from sqlalchemy.orm import Session
from fastapi import APIRouter, HTTPException, Body, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.services.word_service import word_service
from app.services.riddle_service import riddle_service

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    persona: str

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Simple rule-based chatbot that analyzes sentiment and adjusts student scores.
    """
    last_message = request.messages[-1].content.lower()
    
    # Keyword Analysis Logic
    negative_keywords = ["buồn", "chán", "mệt", "stress", "áp lực", "khó quá", "không hiểu", "ghét"]
    positive_keywords = ["vui", "thích", "hào hứng", "dễ", "yêu", "tuyệt"]
    
    # Analyze sentiment
    is_negative = any(k in last_message for k in negative_keywords)
    is_positive = any(k in last_message for k in positive_keywords)
    
    if is_negative:
        # Decrease scores based on keywords
        if "stress" in last_message or "áp lực" in last_message:
            current_user.mental_health_score = max(0, current_user.mental_health_score - 10)
        
        if "chán" in last_message or "ghét" in last_message:
            current_user.engagement_score = max(0, current_user.engagement_score - 10)
            
        if "buồn" in last_message:
            current_user.happiness_score = max(0, current_user.happiness_score - 10)
            
        # General decrease if just general negative
        if not any(k in last_message for k in ["stress", "áp lực", "chán", "ghét", "buồn"]):
             current_user.happiness_score = max(0, current_user.happiness_score - 5)
             
        db.commit()
    
    elif is_positive:
        # Slight recovery
        current_user.happiness_score = min(100, current_user.happiness_score + 2)
        current_user.mental_health_score = min(100, current_user.mental_health_score + 2)
        db.commit()

    # Generate Response based on Persona
    response_text = ""
    if request.persona == "friend":
        if is_negative:
            response_text = "Mình hiểu cảm giác đó. Mọi chuyện sẽ ổn thôi! Bạn muốn kể thêm không? 😟"
        elif is_positive:
            response_text = "Tuyệt quá! Nghe mà mình cũng vui lây! 🎉"
        else:
            response_text = "Mình đang lắng nghe đây. Kể tiếp đi bạn! 😊"
            
    elif request.persona == "parent":
        if is_negative:
            response_text = "Ba mẹ luôn ở bên con. Nếu mệt quá thì nghỉ ngơi một chút nhé con yêu. ❤️"
        elif is_positive:
            response_text = "Ba mẹ rất tự hào về con! Cố gắng phát huy nhé! 👏"
        else:
            response_text = "Ba mẹ vẫn đang nghe con nói đây. 🏡"

    elif request.persona == "teacher":
        if is_negative:
            response_text = "Thầy cô hiểu áp lực của em. Chúng ta cùng tìm cách giải quyết nhé. Đừng lo lắng! 📚"
        elif is_positive:
            response_text = "Rất tốt! Thầy cô ghi nhận sự tích cực của em. Tiếp tục phát huy nhé! ⭐"
        else:
            response_text = "Thầy cô có thể giúp gì thêm cho em không? 🎓"

    return {"response": response_text}

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
