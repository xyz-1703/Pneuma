from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    oauth_provider = Column(String(50), nullable=True)  # e.g., "google", "github"
    oauth_id = Column(String(255), nullable=True)  # OAuth provider's user ID

    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    journals = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    mood_logs = relationship("MoodLog", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    emotion = Column(String(20), nullable=False, default="neutral")
    embedding = Column(Vector(384), nullable=True)  # all-MiniLM-L6-v2 produces 384-dim vectors
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="messages")


class JournalEntry(Base):
    __tablename__ = "journal"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    emotion = Column(String(20), nullable=False)
    embedding = Column(Vector(384), nullable=True)  # all-MiniLM-L6-v2 produces 384-dim vectors
    summary = Column(String(300), nullable=False)
    insight = Column(Text, nullable=False)
    suggestion = Column(Text, nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="journals")


class MoodLog(Base):
    __tablename__ = "mood_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    emotion = Column(String(20), nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="mood_logs")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String(500), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    is_revoked = Column(Integer, default=0, nullable=False)  # 0=active, 1=revoked

    user = relationship("User", back_populates="refresh_tokens")
