from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import User
from services.auth import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str


class User_Response(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


@router.post("/signup", response_model=AuthResponse)
async def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user with hashed password
    hashed_password = get_password_hash(payload.password)
    user = User(email=payload.email, password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create access token
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email}
    )

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    # Find user by email
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify password
    if not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create access token
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email}
    )

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
    )


@router.get("/me", response_model=User_Response)
async def get_current_user(
    token: Optional[str] = None, db: Session = Depends(get_db)
):
    """Get current user info from token."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token_data = decode_access_token(token)
    if not token_data or token_data.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user
