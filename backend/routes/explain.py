import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.explainer import explain_topic
from backend.utils.vector_store import load_vector_store

router = APIRouter()

class ExplainRequest(BaseModel):
    topic: str
    mode: str = "student"       # beginner, student, technical
    filename: str = ""          # Optional: explain using context from uploaded files

@router.post("/explain")
async def explain_topic_endpoint(request: ExplainRequest):
    """
    Topic explainer endpoint. Uses local Ollama to explain concepts in varying styles.
    """
    topic_str = request.topic.strip()
    if not topic_str:
        raise HTTPException(status_code=400, detail="Topic field cannot be empty.")
        
    context = None
    # If a document context is requested, find the most relevant chunks in FAISS
    if request.filename.strip():
        db = load_vector_store("default")
        if db is not None:
            docs = await asyncio.to_thread(db.similarity_search, topic_str, k=2)
            if docs:
                context = "\n---\n".join([doc.page_content for doc in docs])
                
    try:
        explanation = await asyncio.to_thread(explain_topic, topic_str, request.mode, context, request.filename)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation generation failed: {str(e)}")
