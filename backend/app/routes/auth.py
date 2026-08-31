from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from ..database import get_db, User
from ..auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    UserProfile,
    AuthResponse,
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user from JWT token (optional)"""
    if not credentials:
        return None
    
    token_data = decode_access_token(credentials.credentials)
    if not token_data:
        return None
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    return user


def get_required_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from JWT token (required)"""
    token_data = decode_access_token(credentials.credentials)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account"""
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to create account"
        )

    username = user_data.email.split("@", 1)[0][:50]
    if db.query(User).filter(User.username == username).first():
        username = f"{username}_{int(datetime.utcnow().timestamp())}"[:50]

    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=username,
        email=user_data.email,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate token
    access_token = create_access_token(
        data={"sub": str(new_user.id), "username": new_user.username}
    )
    
    return AuthResponse(
        access_token=access_token,
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=AuthResponse)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Login with username/email and password"""
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Generate token
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username}
    )
    
    return AuthResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_required_user)):
    """Get current user info"""
    return UserResponse.model_validate(current_user)


@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_required_user), db: Session = Depends(get_db)):
    """Get current user profile with stats"""
    from ..database import AnimeListItem, ListStatus
    
    # Calculate stats
    stats = {
        "plan_to_watch": db.query(AnimeListItem).filter(
            AnimeListItem.user_id == current_user.id,
            AnimeListItem.status == ListStatus.PLAN_TO_WATCH
        ).count(),
        "watching": db.query(AnimeListItem).filter(
            AnimeListItem.user_id == current_user.id,
            AnimeListItem.status == ListStatus.WATCHING
        ).count(),
        "completed": db.query(AnimeListItem).filter(
            AnimeListItem.user_id == current_user.id,
            AnimeListItem.status == ListStatus.COMPLETED
        ).count(),
        "paused": db.query(AnimeListItem).filter(
            AnimeListItem.user_id == current_user.id,
            AnimeListItem.status == ListStatus.PAUSED
        ).count(),
        "dropped": db.query(AnimeListItem).filter(
            AnimeListItem.user_id == current_user.id,
            AnimeListItem.status == ListStatus.DROPPED
        ).count(),
    }
    stats["total"] = sum(stats.values())
    
    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at,
        stats=stats
    )


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    avatar_url: Optional[str] = None,
    current_user: User = Depends(get_required_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if avatar_url is not None:
        current_user.avatar_url = avatar_url
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)
