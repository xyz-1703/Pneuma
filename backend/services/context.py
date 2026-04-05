"""
Context builder for semantic memory and conversation history.
Combines pgvector semantic search with recent emotions and chat history.
"""

from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import desc, text

from models.db_models import Message, JournalEntry, MoodLog
from services.embedding import get_embedding_service


def get_user_context(user_id: int, message: str, db: Session) -> str:
    """
    Build comprehensive context for the LLM including:
    - Semantic search results (top 3 most similar past messages/journals)
    - Recent emotions (last 5 mood logs)
    - Recent chat history (last 2 chat messages)
    
    Returns formatted context string for the prompt.
    """
    embedding_service = get_embedding_service()
    
    # 1. Get embedding of current message
    message_embedding = embedding_service.embed_text(message)
    
    # 2. Semantic search for similar past messages (user messages only)
    try:
        # Use raw SQL for pgvector distance operator
        embedding_str = "[" + ",".join(map(str, message_embedding)) + "]"
        similar_messages = db.query(Message).filter(
            Message.user_id == user_id,
            Message.role == "user",
            Message.embedding.isnot(None)
        ).from_statement(
            text(f"""
                SELECT id, user_id, role, message, emotion, embedding, timestamp
                FROM messages
                WHERE user_id = :user_id AND role = 'user' AND embedding IS NOT NULL
                ORDER BY embedding <-> :embedding LIMIT 10
            """)
        ).params(user_id=user_id, embedding=embedding_str).all()
    except Exception as e:
        # Fallback: just get recent messages if pgvector doesn't work
        similar_messages = db.query(Message).filter(
            Message.user_id == user_id,
            Message.role == "user"
        ).order_by(desc(Message.timestamp)).limit(3).all()
    
    # 3. Get recent emotions (last 15)
    recent_emotions = db.query(MoodLog).filter(
        MoodLog.user_id == user_id
    ).order_by(desc(MoodLog.date)).limit(15).all()
    
    # 4. Get recent chat history (last 10 exchanges)
    recent_messages = db.query(Message).filter(
        Message.user_id == user_id
    ).order_by(desc(Message.timestamp)).limit(20).all()
    recent_messages.reverse()
    
    # Build context string
    context_parts = []
    
    # Add semantic memories
    if similar_messages:
        context_parts.append("📝 Past conversations you've had:")
        for msg in similar_messages:
            context_parts.append(f"  - \"{msg.message[:80]}...\" (emotion: {msg.emotion})")
    
    # Add recent emotional patterns
    if recent_emotions:
        emotion_summary = ", ".join([e.emotion for e in recent_emotions])
        context_parts.append(f"\n😊 Your recent emotional pattern: {emotion_summary}")
    
    # Add recent chat context
    if recent_messages:
        context_parts.append("\n💬 Recent conversation:")
        for msg in recent_messages:
            role_label = "You" if msg.role == "user" else "Mira"
            context_parts.append(f"  {role_label}: {msg.message[:100]}")
    
    return "\n".join(context_parts) if context_parts else "No prior conversation history."


def get_semantic_journal_context(user_id: int, message: str, db: Session) -> str:
    """
    Get semantic journal entries for context about user's patterns.
    Used when processing new journal entries.
    """
    embedding_service = get_embedding_service()
    
    # Get embedding of current message
    message_embedding = embedding_service.embed_text(message)
    
    # Find similar past journal entries
    try:
        embedding_str = "[" + ",".join(map(str, message_embedding)) + "]"
        similar_journals = db.query(JournalEntry).filter(
            JournalEntry.user_id == user_id,
            JournalEntry.embedding.isnot(None)
        ).from_statement(
            text(f"""
                SELECT id, user_id, text, emotion, embedding, summary, insight, suggestion, date
                FROM journal
                WHERE user_id = :user_id AND embedding IS NOT NULL
                ORDER BY embedding <-> :embedding LIMIT 5
            """)
        ).params(user_id=user_id, embedding=embedding_str).all()
    except Exception as e:
        # Fallback: just get recent entries if pgvector doesn't work
        similar_journals = db.query(JournalEntry).filter(
            JournalEntry.user_id == user_id
        ).order_by(desc(JournalEntry.date)).limit(2).all()
    
    context_parts = []
    if similar_journals:
        context_parts.append("Similar past journal patterns:")
        for entry in similar_journals:
            context_parts.append(f"  - Emotion: {entry.emotion}, Pattern: {entry.insight[:100]}")
    
    return "\n".join(context_parts) if context_parts else ""
