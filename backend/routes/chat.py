import json
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import Message, MoodLog, User
from services.auth import decode_access_token
from services.emotion import emotion_service
from services.llm_chain import llm_chain_service
from services.memory import build_conversation_memory, memory_to_history_text
from services.nlu import nlu_service
from services.prompt_builder import resolve_tone

router = APIRouter()
logger = logging.getLogger(__name__)

SAFETY_MESSAGE = (
    "I am really glad you shared this. You deserve immediate support right now. "
    "Please contact your local emergency number or a trusted person nearby immediately. "
    "If available in your region, contact a suicide and crisis helpline now."
)


def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    """Extract user_id from JWT token in Authorization header."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )
    
    # Extract token from "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )
    
    token = parts[1]
    token_data = decode_access_token(token)
    
    if not token_data or token_data.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    
    return token_data.user_id


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    response: str
    emotion: str
    assistant_emotion: str
    intent: str
    patterns: List[str]


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> ChatResponse:
    text = payload.message.strip()
    user_emotion, emotion_confidence = emotion_service.detect_emotion(text)
    patterns = nlu_service.detect_patterns(text)

    history_rows: List[Message] = (
        db.query(Message)
        .filter(Message.user_id == user_id)
        .order_by(Message.timestamp.desc())
        .limit(10)
        .all()
    )
    history_rows.reverse()

    history = [
        {"role": row.role, "message": row.message, "emotion": row.emotion}
        for row in history_rows
    ]

    memory = build_conversation_memory(history)
    history_text = memory_to_history_text(memory)

    intent = await llm_chain_service.classify_intent(
        user_message=text,
        history_text=history_text,
    )
    tone = resolve_tone(
        emotion=user_emotion,
        intent=intent,
    )

    user_message = Message(
        user_id=user_id,
        role="user",
        message=text,
        emotion=user_emotion,
        timestamp=datetime.utcnow(),
    )
    db.add(user_message)

    db.add(MoodLog(user_id=user_id, emotion=user_emotion, date=datetime.utcnow()))

    has_risk, matched_keywords = nlu_service.detect_safety_risk(text)
    is_reflective = nlu_service.is_reflective_question(text)
    
    if has_risk:
        assistant_emotion = "supportive"
        assistant_text = SAFETY_MESSAGE
    elif is_reflective:
        # Handle philosophical/reflective questions conversationally
        assistant_text = await llm_chain_service.run_reflective_chain(user_message=text)
        assistant_emotion = "neutral"
    else:
        assistant_text = await llm_chain_service.run_chat_chain(
            user_message=text,
            emotion=user_emotion,
            emotion_confidence=emotion_confidence,
            intent=intent,
            patterns=patterns,
            tone=tone,
            history_text=history_text,
        )
        assistant_emotion, _ = emotion_service.detect_emotion(assistant_text)

    logger.info(
        "chat_signals=%s",
        json.dumps(
            {
                "user_id": user_id,
                "emotion": user_emotion,
                "emotion_confidence": round(emotion_confidence, 3),
                "intent": intent,
                "patterns": patterns,
                "risk_keywords": matched_keywords,
            },
            ensure_ascii=True,
        ),
    )

    assistant_message = Message(
        user_id=user_id,
        role="assistant",
        message=assistant_text,
        emotion=assistant_emotion,
        timestamp=datetime.utcnow(),
    )
    db.add(assistant_message)
    db.add(MoodLog(user_id=user_id, emotion=assistant_emotion, date=datetime.utcnow()))

    db.commit()

    return ChatResponse(
        response=assistant_text,
        emotion=user_emotion,
        assistant_emotion=assistant_emotion,
        intent=intent,
        patterns=patterns,
    )


class HistoryItem(BaseModel):
    role: str
    message: str
    emotion: str
    timestamp: datetime


@router.get("/chat/history", response_model=List[HistoryItem])
async def chat_history(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> List[HistoryItem]:
    rows = (
        db.query(Message)
        .filter(Message.user_id == user_id)
        .order_by(Message.timestamp.asc())
        .limit(200)
        .all()
    )
    return [
        HistoryItem(
            role=row.role,
            message=row.message,
            emotion=row.emotion,
            timestamp=row.timestamp,
        )
        for row in rows
    ]
