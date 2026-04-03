from datetime import datetime
from typing import List, Optional
import logging

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import JournalEntry, MoodLog
from services.auth import decode_access_token
from services.emotion import emotion_service
from services.llm_chain import llm_chain_service

router = APIRouter()
logger = logging.getLogger(__name__)

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
    id: int
    emotion: str
    summary: str
    insight: str
    suggestion: str
    date: datetime
    text: str


class JournalHistoryItem(BaseModel):
    id: int
    text: str
    emotion: str
    summary: str
    insight: str
    suggestion: str
    date: datetime

    class Config:
        from_attributes = True


@router.post("/journal", response_model=JournalResponse)
async def create_journal(
    payload: JournalRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> JournalResponse:
    logger.info(f"💾 Creating journal entry for user {user_id}")
    text = payload.text.strip()
    lowered = text.lower()
    emotion, _ = emotion_service.detect_emotion(text)
    logger.info(f"Detected emotion: {emotion}")

    if any(keyword in lowered for keyword in SAFETY_KEYWORDS):
        logger.warning(f"⚠️ Safety keyword detected in journal entry for user {user_id}")
        insights = {
            "summary": "You shared something very important and painful.",
            "insight": "Your words suggest you may need immediate human support, and you do not have to face this alone.",
            "suggestion": "Please contact local emergency services, a trusted person, or a crisis helpline in your area right now.",
        }
    else:
        logger.info("Running LLM journal analysis...")
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
    db.refresh(entry)
    logger.info(f"✅ Journal entry {entry.id} created successfully for user {user_id}")

    return JournalResponse(
        id=entry.id,
        text=entry.text,
        emotion=emotion,
        summary=insights["summary"],
        insight=insights["insight"],
        suggestion=insights["suggestion"],
        date=entry.date,
    )


@router.get("/journal", response_model=List[JournalHistoryItem])
async def get_journal_history(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> List[JournalHistoryItem]:
    """Fetch all journal entries for the user, ordered by most recent first."""
    logger.info(f"📖 GET /journal - Fetching journal entries for user {user_id}")
    try:
        entries = db.query(JournalEntry).filter(
            JournalEntry.user_id == user_id
        ).order_by(JournalEntry.date.desc()).all()
        logger.info(f"✅ Found {len(entries)} journal entries for user {user_id}")
        return entries
    except Exception as e:
        logger.error(f"❌ Error fetching journal entries: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching journal entries: {str(e)}"
        )


@router.put("/journal/{entry_id}", response_model=JournalResponse)
async def update_journal(
    entry_id: int,
    payload: JournalRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> JournalResponse:
    """Update an existing journal entry."""
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.user_id == user_id
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found",
        )
    
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

    entry.text = text
    entry.emotion = emotion
    entry.summary = insights["summary"]
    entry.insight = insights["insight"]
    entry.suggestion = insights["suggestion"]
    
    db.commit()
    db.refresh(entry)

    return JournalResponse(
        id=entry.id,
        text=entry.text,
        emotion=emotion,
        summary=insights["summary"],
        insight=insights["insight"],
        suggestion=insights["suggestion"],
        date=entry.date,
    )


@router.delete("/journal/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_journal(
    entry_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a journal entry."""
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.user_id == user_id
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found",
        )
    
    db.delete(entry)
    db.commit()

