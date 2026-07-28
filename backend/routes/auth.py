from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from backend.database.connection import get_db
from backend.database.models import (
    User,
    UploadedDocument,
    ChatHistory,
    GeneratedSummary,
    GeneratedQuiz,
    TopicExplanation,
    TranslationHistory
)
from backend.database.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# Schemes for JWT OAuth2 Password bearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

# Pydantic Schemas
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """
    Dependency injection helper. Retrieves the current logged in user context using the JWT token.
    Raises UNAUTHORIZED if token is invalid, expired, or missing.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session expired or invalid token. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
        
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
        
    return user

@router.post("/register", response_model=TokenResponse)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    """
    Registers a new student, hashes password, saves to DB, and returns a JWT token.
    """
    email_clean = payload.email.strip().lower()
    
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == email_clean))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered."
        )
        
    # Create new student
    password_hashed = hash_password(payload.password)
    user = User(
        name=payload.name.strip(),
        email=email_clean,
        password_hash=password_hashed,
        role="student"
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create token
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(days=7) # Remember me default
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Verifies credentials and issues a JWT token.
    """
    email_clean = payload.email.strip().lower()
    
    result = await db.execute(select(User).where(User.email == email_clean))
    user = result.scalars().first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(days=7)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Endpoint for secure client-side logout validation check.
    """
    return {"message": "Logged out successfully."}

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Simulates a forgot-password flow. Generates a temporary reset token.
    """
    email_clean = payload.email.strip().lower()
    result = await db.execute(select(User).where(User.email == email_clean))
    user = result.scalars().first()
    
    if not user:
        return {"message": "If the email is registered, you will receive a reset link shortly."}
        
    reset_token = create_access_token(
        data={"sub": user.email, "purpose": "reset"},
        expires_delta=timedelta(minutes=15)
    )
    
    print(f"\n==================================================")
    print(f"RESET LINK GENERATED FOR: {user.email}")
    print(f"Token: {reset_token}")
    print(f"Reset Link Simulation: http://localhost:5173/reset-password?token={reset_token}")
    print(f"==================================================\n")
    
    return {"message": "If the email is registered, you will receive a reset link shortly."}

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Validates reset token and updates the student's password.
    """
    token_payload = decode_access_token(payload.token)
    if token_payload is None or token_payload.get("purpose") != "reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset link is invalid or has expired."
        )
        
    email = token_payload.get("sub")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    user.password_hash = hash_password(payload.password)
    await db.commit()
    
    return {"message": "Password has been reset successfully. Please log in with your new password."}

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the authenticated student's profile.
    """
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at
    }

@router.get("/dashboard-stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Compiles learning stats and activity logs for the student dashboard.
    """
    user_id = current_user.id
    
    # 1. Query Counts
    files_cnt_res = await db.execute(
        select(func.count(UploadedDocument.id)).where(UploadedDocument.user_id == user_id)
    )
    files_count = files_cnt_res.scalar() or 0
    
    chats_cnt_res = await db.execute(
        select(func.count(ChatHistory.id)).where(ChatHistory.user_id == user_id)
    )
    chats_count = chats_cnt_res.scalar() or 0
    
    summaries_cnt_res = await db.execute(
        select(func.count(GeneratedSummary.id))
        .join(UploadedDocument)
        .where(UploadedDocument.user_id == user_id)
    )
    summaries_count = summaries_cnt_res.scalar() or 0
    
    quizzes_cnt_res = await db.execute(
        select(func.count(GeneratedQuiz.id))
        .join(UploadedDocument)
        .where(UploadedDocument.user_id == user_id)
    )
    quizzes_count = quizzes_cnt_res.scalar() or 0
    
    # 2. Query Recent Lists
    docs_res = await db.execute(
        select(UploadedDocument)
        .where(UploadedDocument.user_id == user_id)
        .order_by(desc(UploadedDocument.upload_date))
        .limit(5)
    )
    recent_docs = docs_res.scalars().all()
    
    chats_res = await db.execute(
        select(ChatHistory)
        .where(ChatHistory.user_id == user_id)
        .order_by(desc(ChatHistory.created_at))
        .limit(5)
    )
    recent_chats = chats_res.scalars().all()
    
    quizzes_res = await db.execute(
        select(GeneratedQuiz)
        .join(UploadedDocument)
        .where(UploadedDocument.user_id == user_id)
        .options(selectinload(GeneratedQuiz.document))
        .order_by(desc(GeneratedQuiz.created_at))
        .limit(5)
    )
    recent_quizzes = quizzes_res.scalars().all()

    summaries_res = await db.execute(
        select(GeneratedSummary)
        .join(UploadedDocument)
        .where(UploadedDocument.user_id == user_id)
        .options(selectinload(GeneratedSummary.document))
        .order_by(desc(GeneratedSummary.created_at))
        .limit(5)
    )
    recent_summaries = summaries_res.scalars().all()
    
    # Format Response data
    docs_list = [{
        "filename": d.file_name,
        "file_size": d.file_size,
        "status": d.document_status,
        "upload_date": d.upload_date.isoformat()
    } for d in recent_docs]
    
    chats_list = [{
        "question": c.question,
        "answer": c.answer.split("### Source")[0].split("\n\n---")[0].strip(),
        "created_at": c.created_at.isoformat()
    } for c in recent_chats]
    
    quizzes_list = [{
        "id": q.id,
        "filename": q.document.file_name if q.document else "Workspace Document",
        "questions": q.quiz_json.get("questions", []),
        "questions_count": len(q.quiz_json.get("questions", [])),
        "created_at": q.created_at.isoformat()
    } for q in recent_quizzes]

    summaries_list = [{
        "id": s.id,
        "filename": s.document.file_name if s.document else "Workspace Document",
        "summary_type": s.summary_type,
        "summary_text": s.summary_text,
        "created_at": s.created_at.isoformat()
    } for s in recent_summaries]
    
    return {
        "user_name": current_user.name,
        "stats": {
            "uploaded_files": files_count,
            "chat_messages": chats_count,
            "generated_summaries": summaries_count,
            "generated_quizzes": quizzes_count
        },
        "recent_documents": docs_list,
        "recent_chats": chats_list,
        "recent_quizzes": quizzes_list,
        "recent_summaries": summaries_list
    }
