from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import JournalEntry, MoodLog
from services.auth import decode_access_token
from services.emotion import emotion_service
from services.llm_chain import llm_chain_service

router = APIRouter()

SAFETY_KEYWORDS = ["suicide", "self-harm", "kill myself", "end my life", "hurt myself"]


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


class JournalRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


class JournalResponse(BaseModel):
    emotion: str
    summary: str
    insight: str
    suggestion: str


@router.post("/journal", response_model=JournalResponse)
async def create_journal(
    payload: JournalRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> JournalResponse:
    text = payload.text.strip()
    lowered = text.lower()
    emotion, _ = emotion_service.detect_emotion(text)

    if any(keyword in lowered for keyword in SAFETY_KEYWORDS):
        insights = {
            "summary": "You shared something very important and painful.",
            "insight": "Your words suggest you may need immediate human support, and you do not have to face this alone.",
            "suggestion": "Please contact local emergency services, a trusted person, or a crisis helpline in your area right now.",
        }
    else:
        insights = await llm_chain_service.run_journal_chain(text=text, emotion=emotion)

    entry = JournalEntry(
        user_id=user_id,
        text=text,
        emotion=emotion,
        summary=insights["summary"],
        insight=insights["insight"],
        suggestion=insights["suggestion"],
        date=datetime.utcnow(),
    )
    db.add(entry)
    db.add(MoodLog(user_id=user_id, emotion=emotion, date=datetime.utcnow()))
    db.commit()

    return JournalResponse(
        emotion=emotion,
        summary=insights["summary"],
        insight=insights["insight"],
        suggestion=insights["suggestion"],
    )
