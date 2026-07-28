import asyncio
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database.connection import get_db
from backend.database.models import User, UploadedDocument, TopicExplanation
from backend.routes.auth import get_current_user
from backend.services.explainer import explain_topic
from backend.utils.vector_store import load_vector_store

router = APIRouter()

class ExplainRequest(BaseModel):
    topic: str
    mode: str = "student"       # beginner, student, technical
    filename: str = ""          # Optional: explain using context from uploaded files

@router.post("/explain")
async def explain_topic_endpoint(
    request: ExplainRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Topic explainer endpoint. Uses local Ollama to explain concepts in varying styles.
    """
    topic_str = request.topic.strip()
    if not topic_str:
        raise HTTPException(status_code=400, detail="Topic field cannot be empty.")
        
    context = None
    doc_id = None
    
    # If a document context is requested, find the most relevant chunks in FAISS
    if request.filename.strip():
        # Validate that the file belongs to this user and get its ID
        doc_result = await db.execute(
            select(UploadedDocument).where(
                UploadedDocument.user_id == current_user.id,
                UploadedDocument.file_name == request.filename.strip()
            )
        )
        doc = doc_result.scalars().first()
        if doc:
            doc_id = doc.id
            index_name = f"user_{current_user.id}"
            vector_db = load_vector_store(index_name)
            if vector_db is not None:
                docs = await asyncio.to_thread(vector_db.similarity_search, topic_str, k=2)
                if docs:
                    context = "\n---\n".join([doc_content.page_content for doc_content in docs])
                    
    try:
        explanation = await asyncio.to_thread(explain_topic, topic_str, request.mode, context, request.filename)
        
        # Save generated explanation to database
        db_explanation = TopicExplanation(
            document_id=doc_id,
            topic=topic_str,
            explanation=explanation
        )
        db.add(db_explanation)
        await db.commit()
        
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation generation failed: {str(e)}")
