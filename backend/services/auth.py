"""
JWT Authentication Service with Access & Refresh Token Support

Features:
- Access tokens: 24-hour expiry
- Refresh tokens: 30-day expiry, stored in database
- Password hashing with bcrypt
- JWT encode/decode with python-jose
- Optional OAuth2 integration with authlib (Google, GitHub, etc.)
- FastAPI dependency for protected routes
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple
import os
import logging

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Security configuration
SECRET_KEY = os.getenv(
    "SECRET_KEY", 
    "change-this-to-a-random-secret-key-in-production-use-at-least-32-chars"
)
ALGORITHM = "HS256"

# Token expiry times
ACCESS_TOKEN_EXPIRE_HOURS = 24  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = 30  # 30 days


# Password hashing context
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)


# ============================================================================
# Pydantic Models
# ============================================================================

class TokenData(BaseModel):
    """JWT token payload structure"""
    user_id: Optional[int] = None
    email: Optional[str] = None
    token_type: Optional[str] = None  # "access" or "refresh"


class TokenResponse(BaseModel):
    """Response structure for token endpoints"""
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int  # seconds


class AccessTokenResponse(BaseModel):
    """Response when issuing only access token (e.g., /refresh)"""
    access_token: str
    token_type: str
    expires_in: int


# ============================================================================
# Password Verification & Hashing
# ============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a bcrypt hash.
    
    Args:
        plain_password: Plaintext password from user input
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plaintext password to hash
        
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


# ============================================================================
# JWT Token Generation
# ============================================================================

def create_access_token(
    user_id: int,
    email: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token with 24-hour expiry.
    
    Args:
        user_id: User's ID
        email: User's email
        expires_delta: Optional custom expiry duration
        
    Returns:
        JWT token string
    """
    to_encode = {
        "user_id": user_id,
        "email": email,
        "token_type": "access"
    }
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def create_refresh_token(
    user_id: int,
    email: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token with 30-day expiry.
    
    Args:
        user_id: User's ID
        email: User's email
        expires_delta: Optional custom expiry duration
        
    Returns:
        JWT token string
    """
    to_encode = {
        "user_id": user_id,
        "email": email,
        "token_type": "refresh"
    }
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def create_token_pair(user_id: int, email: str) -> Tuple[str, str]:
    """
    Create both access and refresh tokens.
    
    Args:
        user_id: User's ID
        email: User's email
        
    Returns:
        Tuple of (access_token, refresh_token)
    """
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id, email)
    return access_token, refresh_token


# ============================================================================
# JWT Token Verification
# ============================================================================

def decode_token(token: str) -> Optional[TokenData]:
    """
    Decode and verify a JWT token (access or refresh).
    
    Args:
        token: JWT token string
        
    Returns:
        TokenData if valid, None if invalid/expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")
        token_type: str = payload.get("token_type")
        
        if user_id is None:
            return None
            
        return TokenData(user_id=user_id, email=email, token_type=token_type)
        
    except JWTError as e:
        logger.debug(f"JWT decode error: {e}")
        return None


def verify_access_token(token: str) -> Optional[TokenData]:
    """
    Verify a token is a valid access token.
    
    Args:
        token: JWT token string
        
    Returns:
        TokenData if valid access token, None otherwise
    """
    token_data = decode_token(token)
    if token_data and token_data.token_type == "access":
        return token_data
    return None


def verify_refresh_token(token: str) -> Optional[TokenData]:
    """
    Verify a token is a valid refresh token.
    
    Args:
        token: JWT token string
        
    Returns:
        TokenData if valid refresh token, None otherwise
    """
    token_data = decode_token(token)
    if token_data and token_data.token_type == "refresh":
        return token_data
    return None


# ============================================================================
# FastAPI Dependencies for Protected Routes
# ============================================================================

def get_current_user_id(
    authorization: Optional[str] = Header(None)
) -> int:
    """
    FastAPI dependency to extract and validate user_id from JWT token.
    
    Use this in any protected route:
    
    @router.get("/protected")
    def protected_route(user_id: int = Depends(get_current_user_id)):
        # user_id is now the authenticated user's ID
        pass
    
    Args:
        authorization: Authorization header value (e.g., "Bearer <token>")
        
    Returns:
        user_id if token is valid
        
    Raises:
        HTTPException 401 if token is missing, invalid, or expired
    """
    # Check if Authorization header is present
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract token from "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Use: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = parts[1]
    
    # Decode and verify token
    token_data = verify_access_token(token)
    
    if not token_data or token_data.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return token_data.user_id


# ============================================================================
# OAuth2 Helper Functions (Optional - for future Google/GitHub OAuth)
# ============================================================================

def create_oauth_user(
    db: Session,
    email: str,
    oauth_provider: str,
    oauth_id: str
) -> int:
    """
    Create a new user via OAuth2 provider.
    
    Args:
        db: Database session
        email: User's email from OAuth provider
        oauth_provider: Provider name (e.g., "google", "github")
        oauth_id: User ID from OAuth provider
        
    Returns:
        New user's ID
    """
    from models.db_models import User
    
    user = User(
        email=email,
        password="",  # OAuth users don't have password
        oauth_provider=oauth_provider,
        oauth_id=oauth_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user.id


def get_or_create_oauth_user(
    db: Session,
    email: str,
    oauth_provider: str,
    oauth_id: str
) -> Tuple[int, bool]:
    """
    Get existing OAuth user or create new one.
    
    Args:
        db: Database session
        email: User's email from OAuth provider
        oauth_provider: Provider name
        oauth_id: User ID from OAuth provider
        
    Returns:
        Tuple of (user_id, is_new_user)
    """
    from models.db_models import User
    
    user = db.query(User).filter(
        User.oauth_id == oauth_id,
        User.oauth_provider == oauth_provider
    ).first()
    
    if user:
        return user.id, False
    
    # Create new user
    user_id = create_oauth_user(db, email, oauth_provider, oauth_id)
    return user_id, True


# ============================================================================
# Refresh Token Management
# ============================================================================

def save_refresh_token(
    db: Session,
    user_id: int,
    refresh_token: str,
    expiry_days: int = REFRESH_TOKEN_EXPIRE_DAYS
) -> None:
    """
    Save refresh token to database for tracking/revocation.
    
    Args:
        db: Database session
        user_id: User's ID
        refresh_token: JWT refresh token string
        expiry_days: Days until token expires
    """
    from models.db_models import RefreshToken
    
    token_record = RefreshToken(
        user_id=user_id,
        token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=expiry_days)
    )
    db.add(token_record)
    db.commit()


def verify_refresh_token_in_db(db: Session, user_id: int, refresh_token: str) -> bool:
    """
    Verify refresh token exists in database and is not revoked.
    
    Args:
        db: Database session
        user_id: User's ID
        refresh_token: JWT refresh token string
        
    Returns:
        True if valid, False if revoked or not found
    """
    from models.db_models import RefreshToken
    
    token_record = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.token == refresh_token,
        RefreshToken.is_revoked == 0,
        RefreshToken.expires_at > datetime.utcnow()
    ).first()
    
    return token_record is not None


def revoke_refresh_token(db: Session, user_id: int, refresh_token: str) -> bool:
    """
    Revoke a refresh token (logout).
    
    Args:
        db: Database session
        user_id: User's ID
        refresh_token: JWT refresh token string
        
    Returns:
        True if revoked, False if not found
    """
    from models.db_models import RefreshToken
    
    token_record = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.token == refresh_token
    ).first()
    
    if not token_record:
        return False
    
    token_record.is_revoked = 1
    db.commit()
    return True


def revoke_all_user_tokens(db: Session, user_id: int) -> None:
    """
    Revoke all refresh tokens for a user (logout from all devices).
    
    Args:
        db: Database session
        user_id: User's ID
    """
    from models.db_models import RefreshToken
    
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.is_revoked == 0
    ).update({"is_revoked": 1})
    db.commit()


# ============================================================================
# Utility Functions
# ============================================================================

def get_token_expiry_seconds(token: str) -> Optional[int]:
    """
    Get remaining seconds until token expires.
    
    Args:
        token: JWT token string
        
    Returns:
        Seconds remaining, or None if invalid/expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = payload.get("exp")
        if exp:
            remaining = exp - datetime.utcnow().timestamp()
            return max(0, int(remaining))
        return None
    except JWTError:
        return None


# For backward compatibility with existing code
def decode_access_token(token: str) -> Optional[TokenData]:
    """Decode and verify a JWT access token. (Backward compatibility)"""
    return verify_access_token(token)


def create_token_with_delta(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT token with custom expiry. (Backward compatibility)"""
    # Extract fields from dict
    user_id = data.get("user_id")
    email = data.get("email")
    token_type = data.get("token_type", "access")
    
    if token_type == "refresh":
        return create_refresh_token(user_id, email, expires_delta)
    else:
        return create_access_token(user_id, email, expires_delta)
