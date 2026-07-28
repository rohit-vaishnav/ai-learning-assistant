import asyncio
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.connection import get_db
from backend.database.models import User
from backend.routes.auth import get_current_user
from backend.services.rag import query_rag, query_rag_stream

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    index_name: str = "default"

@router.post("/chat")
async def chat_endpoint(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    RAG-based chat QA endpoint. Streams response tokens progressively.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question content cannot be empty.")
    try:
        # Returns a FastAPI StreamingResponse to stream chunks in real-time, isolated by user ID
        return StreamingResponse(
            query_rag_stream(request.question, current_user.id, request.index_name),
            media_type="text/plain"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QA Query failed: {str(e)}")
