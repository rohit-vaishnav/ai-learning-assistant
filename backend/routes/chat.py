import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.services.rag import query_rag, query_rag_stream

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    index_name: str = "default"

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    RAG-based chat QA endpoint. Streams response tokens progressively.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question content cannot be empty.")
    try:
        # Returns a FastAPI StreamingResponse to stream chunks in real-time
        return StreamingResponse(
            query_rag_stream(request.question, request.index_name),
            media_type="text/plain"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QA Query failed: {str(e)}")
