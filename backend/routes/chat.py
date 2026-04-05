import json
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import Message, MoodLog, User
from services.auth import get_current_user_id
from services.emotion import emotion_service
from services.embedding import get_embedding_service
from services.context import get_user_context
from services.llm_chain import llm_chain_service
from services.nlu import nlu_service
from services.prompt_builder import resolve_tone

router = APIRouter()
logger = logging.getLogger(__name__)

SAFETY_MESSAGE = (
    "I am really glad you shared this. You deserve immediate support right now. "
    "Please contact your local emergency number or a trusted person nearby immediately. "
    "If available in your region, contact a suicide and crisis helpline now."
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    response: str
    emotion: str
    emotion_confidence: float
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
    embedding_service = get_embedding_service()
    
    # 0. Fetch previous emotion and recent history for context-aware detection
    previous_message = (
        db.query(Message)
        .filter(Message.user_id == user_id, Message.role == "user")
        .order_by(Message.timestamp.desc())
        .first()
    )
    prev_emotion = previous_message.emotion if previous_message else None
    
    # Get last 5 messages for context window
    recent_messages = (
        db.query(Message)
        .filter(Message.user_id == user_id)
        .order_by(Message.timestamp.desc())
        .limit(5)
        .all()
    )
    recent_messages.reverse()
    history_dicts = [
        {"role": msg.role, "message": msg.message}
        for msg in recent_messages
    ]
    
    # 1. Detect emotion with context awareness
    user_emotion, emotion_confidence = emotion_service.detect_emotion(
        text=text,
        history=history_dicts,
        prev_emotion=prev_emotion
    )
    
    # 2. Generate embedding
    message_embedding = embedding_service.embed_text(text)
    
    # 3. Detect patterns
    patterns = nlu_service.detect_patterns(text)
    
    # 4. Build context from semantic memory + recent history + emotions
    memory_context = get_user_context(user_id, text, db)
    
    # 5. Classify intent
    intent = await llm_chain_service.classify_intent(
        user_message=text,
        history_text=memory_context,
    )
    
    # 6. Resolve tone
    tone = resolve_tone(
        emotion=user_emotion,
        intent=intent,
    )
    
    # 7. Check for safety risks
    has_risk, matched_keywords = nlu_service.detect_safety_risk(text)
    is_reflective = nlu_service.is_reflective_question(text)
    
    # 7.5 Detect short replies
    is_short_reply = len(text.split()) <= 2
    
    # Get last bot message for context
    last_bot_message = None
    if recent_messages:
        for msg in reversed(recent_messages):
            if msg.role == "assistant":
                last_bot_message = msg.message
                break
    
    # Build short reply context
    short_reply_context = ""
    if is_short_reply and last_bot_message:
        short_reply_context = (
            f"⚠️ NOTE: The user gave a very short reply to this question:\n"
            f"\"{last_bot_message[:150]}\"\n"
            f"Continue the conversation naturally without repeating the question. "
            f"Acknowledge their response and ask a follow-up.\n\n"
        )
    
    # 8. Save user message with embedding
    user_message_db = Message(
        user_id=user_id,
        role="user",
        message=text,
        emotion=user_emotion,
        embedding=message_embedding,
        timestamp=datetime.utcnow(),
    )
    db.add(user_message_db)
    db.add(MoodLog(user_id=user_id, emotion=user_emotion, date=datetime.utcnow()))
    
    # 9. Generate response
    if has_risk:
        assistant_emotion = "supportive"
        assistant_text = SAFETY_MESSAGE
    elif is_reflective:
        assistant_text = await llm_chain_service.run_reflective_chain(user_message=text)
        assistant_emotion = user_emotion  # Reflect the user's emotion
    else:
        assistant_text = await llm_chain_service.run_chat_chain(
            user_message=text,
            emotion=user_emotion,
            emotion_confidence=emotion_confidence,
            intent=intent,
            patterns=patterns,
            tone=tone,
            history_text=memory_context,  # kept for backward compat
            memory_context=memory_context,
            short_reply_context=short_reply_context,
            chat_history=history_dicts,  # NEW: pass structured message array
        )
        # Detect assistant emotion with context awareness
        assistant_emotion, _ = emotion_service.detect_emotion(
            text=assistant_text,
            history=history_dicts + [{"role": "user", "message": text}],
            prev_emotion=user_emotion
        )
    
    # 10. Generate and save assistant response
    response_embedding = embedding_service.embed_text(assistant_text)
    assistant_message_db = Message(
        user_id=user_id,
        role="assistant",
        message=assistant_text,
        emotion=assistant_emotion,
        embedding=response_embedding,
        timestamp=datetime.utcnow(),
    )
    db.add(assistant_message_db)
    db.add(MoodLog(user_id=user_id, emotion=assistant_emotion, date=datetime.utcnow()))
    
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
    
    db.commit()
    
    return ChatResponse(
        response=assistant_text,
        emotion=user_emotion,
        emotion_confidence=round(emotion_confidence, 3),
        assistant_emotion=assistant_emotion,
        intent=intent,
        patterns=patterns,
    )


class HistoryItem(BaseModel):
    role: str
    message: str
    emotion: str
    timestamp: datetime


class GreetingResponse(BaseModel):
    context: str  # "new_user", "returning", "returning_after_break"
    last_emotion: Optional[str]
    days_since: Optional[int]


@router.get("/chat/greeting", response_model=GreetingResponse)
async def get_greeting(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> GreetingResponse:
    """
    Get personalized greeting context based on user's chat history.
    Returns context type and information about their last session.
    """
    last_message = (
        db.query(Message)
        .filter(Message.user_id == user_id, Message.role == "user")
        .order_by(Message.timestamp.desc())
        .first()
    )
    
    if not last_message:
        # New user with no chat history
        return GreetingResponse(
            context="new_user",
            last_emotion=None,
            days_since=None
        )
    
    days_since = (datetime.utcnow() - last_message.timestamp).days
    
    if days_since > 7:
        # Returning after a week or more
        context = "returning_after_break"
    else:
        # Recently active user
        context = "returning"
    
    return GreetingResponse(
        context=context,
        last_emotion=last_message.emotion,
        days_since=days_since
    )


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


class SafetyCheckRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class SafetyCheckResponse(BaseModel):
    is_crisis: bool
    keywords_found: List[str]
    message: str


@router.post("/safety-check", response_model=SafetyCheckResponse)
async def safety_check(payload: SafetyCheckRequest) -> SafetyCheckResponse:
    """
    Check for crisis keywords: "suicide", "kill myself", "self harm", "end my life", "want to die"
    Returns risk status and matched keywords.
    """
    has_risk, matched_keywords = nlu_service.detect_safety_risk(payload.message)
    
    if has_risk:
        message = (
            "Crisis detected. Please reach out to a mental health professional or crisis helpline immediately. "
            "You are not alone. Help is available 24/7."
        )
    else:
        message = "No immediate crisis indicators detected."
    
    return SafetyCheckResponse(
        is_crisis=has_risk,
        keywords_found=matched_keywords,
        message=message,
    )
