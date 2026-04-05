from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import MoodLog
from services.auth import get_current_user_id


router = APIRouter()

EMOTION_SCORE = {
    "joy": 5,
    "love": 5,
    "gratitude": 5,
    "admiration": 5,
    "approval": 4,
    "excitement": 5,
    "amusement": 4,
    "optimism": 4,
    "pride": 4,
    "relief": 4,
    "caring": 4,
    "surprise": 3,
    "curiosity": 3,
    "realization": 3,
    "neutral": 3,
    "confusion": 2,
    "fear": 2,
    "nervousness": 2,
    "sadness": 2,
    "disappointment": 2,
    "grief": 1,
    "remorse": 2,
    "embarrassment": 2,
    "anger": 1,
    "annoyance": 2,
    "disapproval": 2,
    "disgust": 1,
    "shame": 1,
}


class MoodPoint(BaseModel):
    date: str
    mood_score: float


class EmotionSlice(BaseModel):
    name: str
    value: int


class MoodResponse(BaseModel):
    timeline: List[MoodPoint]
    distribution: List[EmotionSlice]
    weekly_summary: str


@router.get("/mood", response_model=MoodResponse)
async def get_mood(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> MoodResponse:
    rows: List[MoodLog] = (
        db.query(MoodLog)
        .filter(MoodLog.user_id == user_id)
        .order_by(MoodLog.date.asc())
        .all()
    )

    if not rows:
        return MoodResponse(
            timeline=[],
            distribution=[],
            weekly_summary="No mood entries yet. Start chatting or journaling to see trends.",
        )

    by_day: Dict[str, List[int]] = defaultdict(list)
    counts = Counter()

    for row in rows:
        key = row.date.strftime("%Y-%m-%d")
        score = EMOTION_SCORE.get(row.emotion, 3)
        by_day[key].append(score)
        counts[row.emotion] += 1

    timeline = [
        MoodPoint(date=day, mood_score=round(sum(scores) / len(scores), 2))
        for day, scores in sorted(by_day.items())
    ]

    distribution = [EmotionSlice(name=name, value=value) for name, value in counts.items()]

    one_week_ago = datetime.utcnow() - timedelta(days=7)
    recent = [row for row in rows if row.date >= one_week_ago]
    recent_counts = Counter(row.emotion for row in recent)

    if recent_counts:
        top_emotion, top_count = recent_counts.most_common(1)[0]
        weekly_summary = (
            f"In the last 7 days, your most common emotion was {top_emotion} "
            f"({top_count} entries)."
        )
    else:
        weekly_summary = "No entries in the last 7 days yet."

    return MoodResponse(
        timeline=timeline,
        distribution=distribution,
        weekly_summary=weekly_summary,
    )


class EmotionLogEntry(BaseModel):
    emotion: str
    timestamp: datetime


@router.get("/mood/history", response_model=List[EmotionLogEntry])
async def get_mood_history(
    days: int = 7,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> List[EmotionLogEntry]:
    """
    Get emotion history for last N days (default 7).
    Returns emotion label + timestamp.
    Used for dashboard charts.
    """
    since = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(MoodLog)
        .filter(MoodLog.user_id == user_id, MoodLog.date >= since)
        .order_by(MoodLog.date.desc())
        .limit(500)
        .all()
    )
    return [
        EmotionLogEntry(emotion=row.emotion, timestamp=row.date)
        for row in rows
    ]
