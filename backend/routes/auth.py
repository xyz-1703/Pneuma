"""
Authentication Routes

Endpoints:
- POST /auth/register: Create new user account
- POST /auth/login: Authenticate user and get tokens
- POST /auth/refresh: Use refresh token to get new access token
- POST /auth/logout: Revoke refresh token
- POST /auth/logout-all: Revoke all tokens (logout from all devices)
- GET /auth/me: Get current authenticated user info
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import User
from services.auth import (
    create_token_pair,
    get_password_hash,
    verify_password,
    get_current_user_id,
    save_refresh_token,
    verify_refresh_token_in_db,
    revoke_refresh_token,
    revoke_all_user_tokens,
    verify_refresh_token,
    get_token_expiry_seconds,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_HOURS,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


# ============================================================================
# Request/Response Models
# ============================================================================

class RegisterRequest(BaseModel):
    """Request to register a new user"""
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    """Request to login"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Response containing access and refresh tokens"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds until access token expires
    user_id: int
    email: str


class RefreshTokenRequest(BaseModel):
    """Request to refresh access token"""
    refresh_token: str


class AccessTokenResponse(BaseModel):
    """Response containing only access token"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds until access token expires


class CurrentUserResponse(BaseModel):
    """Response for current user info"""
    id: int
    email: str

    class Config:
        from_attributes = True


class SessionValidationResponse(BaseModel):
    """Response for session validation"""
    is_valid: bool
    expires_in: int  # seconds until token expires
    user_id: int
    email: str
    message: str


class MessageResponse(BaseModel):
    """Generic message response"""
    message: str


# ============================================================================
# Authentication Endpoints
# ============================================================================

@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Register a new user account.
    
    Returns access and refresh tokens for immediate login.
    
    Args:
        payload: Email and password
        db: Database session
        
    Returns:
        TokenResponse with access_token, refresh_token, and user info
        
    Raises:
        HTTPException 400: Email already registered
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Validate password strength (optional but recommended)
    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )

    # Create new user with hashed password
    hashed_password = get_password_hash(payload.password)
    user = User(email=payload.email, password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create token pair
    access_token, refresh_token = create_token_pair(user.id, user.email)
    
    # Save refresh token to database
    save_refresh_token(db, user.id, refresh_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_HOURS * 3600,  # Convert hours to seconds
        user_id=user.id,
        email=user.email,
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Login with email and password.
    
    Returns access and refresh tokens on successful authentication.
    
    Args:
        payload: Email and password
        db: Database session
        
    Returns:
        TokenResponse with access_token, refresh_token, and user info
        
    Raises:
        HTTPException 401: Invalid email or password
    """
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

    # Create token pair
    access_token, refresh_token = create_token_pair(user.id, user.email)
    
    # Save refresh token to database
    save_refresh_token(db, user.id, refresh_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_HOURS * 3600,  # Convert hours to seconds
        user_id=user.id,
        email=user.email,
    )


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
) -> AccessTokenResponse:
    """
    Refresh an expired access token using a refresh token.
    
    Args:
        payload: Refresh token
        db: Database session
        
    Returns:
        AccessTokenResponse with new access_token
        
    Raises:
        HTTPException 401: Invalid, expired, or revoked refresh token
    """
    # Verify refresh token is valid JWT
    token_data = verify_refresh_token(payload.refresh_token)
    if not token_data or token_data.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Verify token exists in database and is not revoked
    if not verify_refresh_token_in_db(db, token_data.user_id, payload.refresh_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    # Get user
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Create new access token
    new_access_token = create_access_token(user.id, user.email)
    
    return AccessTokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_HOURS * 3600,  # Convert hours to seconds
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    refresh_token: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> MessageResponse:
    """
    Logout by revoking the refresh token.
    
    Args:
        refresh_token: User's refresh token to revoke
        db: Database session
        user_id: Current authenticated user's ID
        
    Returns:
        Message confirming logout
        
    Raises:
        HTTPException 401: User not authenticated
    """
    revoke_refresh_token(db, user_id, refresh_token)
    return MessageResponse(message="Logged out successfully")


@router.post("/logout-all", response_model=MessageResponse)
async def logout_all(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> MessageResponse:
    """
    Logout from all devices by revoking all refresh tokens.
    
    Args:
        db: Database session
        user_id: Current authenticated user's ID
        
    Returns:
        Message confirming logout from all devices
        
    Raises:
        HTTPException 401: User not authenticated
    """
    revoke_all_user_tokens(db, user_id)
    return MessageResponse(message="Logged out from all devices successfully")


@router.get("/me", response_model=CurrentUserResponse)
async def get_me(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> CurrentUserResponse:
    """
    Get current authenticated user info.
    
    Requires valid access token in Authorization header.
    
    Args:
        user_id: Current authenticated user's ID (from JWT)
        db: Database session
        
    Returns:
        CurrentUserResponse with user info
        
    Raises:
        HTTPException 401: Missing or invalid access token
        HTTPException 404: User not found
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return CurrentUserResponse(id=user.id, email=user.email)


@router.get("/validate-session", response_model=SessionValidationResponse)
async def validate_session(
    user_id: int = Depends(get_current_user_id),
    authorization: str = Header(None),
    db: Session = Depends(get_db),
) -> SessionValidationResponse:
    """
    Validate current session and return expiry info.
    
    Requires valid access token in Authorization header.
    Returns session validity and time remaining until expiry.
    
    Args:
        user_id: Current authenticated user's ID (from JWT)
        authorization: Authorization header with Bearer token
        db: Database session
        
    Returns:
        SessionValidationResponse with session status and expiry
        
    Raises:
        HTTPException 401: Missing or invalid access token
        HTTPException 404: User not found
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Extract token from Authorization header
    token = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
    
    # Get token expiry
    expires_in = 0
    if token:
        from services.auth import get_token_expiry_seconds
        expires_in_result = get_token_expiry_seconds(token)
        expires_in = expires_in_result if expires_in_result is not None else 0
    
    return SessionValidationResponse(
        is_valid=True,
        expires_in=expires_in,
        user_id=user.id,
        email=user.email,
        message="Session is valid"
    )
