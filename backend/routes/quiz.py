import os
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database.connection import get_db
from backend.database.models import User, UploadedDocument, GeneratedQuiz, DocumentChunk
from backend.routes.auth import get_current_user
from backend.routes.upload import UPLOAD_DIR
from backend.services.quiz_generator import generate_quiz
from backend.utils.pdf_reader import read_pdf
from backend.utils.docx_reader import read_docx
from backend.utils.ppt_reader import read_pptx

router = APIRouter()

class QuizRequest(BaseModel):
    text: str = ""
    quiz_type: str = "mcq"        # mcq, tf, short
    difficulty: str = "medium"     # easy, medium, hard
    num_questions: int = 3
    filename: str = ""            # Optional: uploaded file to generate quiz from

@router.post("/quiz")
async def generate_quiz_endpoint(
    request: QuizRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Quiz generator endpoint. Generates questions from direct text or uploaded files.
    """
    content = request.text.strip()
    target_file = request.filename.strip()
    doc_id = None
    
    if not content:
        if not target_file:
            # Default to the first uploaded file in db for this user
            doc_result = await db.execute(
                select(UploadedDocument)
                .where(UploadedDocument.user_id == current_user.id)
                .order_by(UploadedDocument.upload_date.desc())
            )
            doc = doc_result.scalars().first()
            if not doc:
                raise HTTPException(
                    status_code=400,
                    detail="Please upload a document first or provide direct text input."
                )
            target_file = doc.file_name
            doc_id = doc.id
        else:
            doc_result = await db.execute(
                select(UploadedDocument).where(
                    UploadedDocument.user_id == current_user.id,
                    UploadedDocument.file_name == target_file
                )
            )
            doc = doc_result.scalars().first()
            if not doc:
                raise HTTPException(
                    status_code=404,
                    detail=f"Uploaded file '{target_file}' not found for this user."
                )
            doc_id = doc.id
            
        # Retrieve chunks directly from database to avoid re-reading and re-parsing file from disk
        chunk_result = await db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == doc_id)
            .order_by(DocumentChunk.chunk_number.asc())
        )
        db_chunks = chunk_result.scalars().all()
        if not db_chunks:
            raise HTTPException(status_code=404, detail="No parsed text chunks found for this document in the database.")
        content = "\n".join([c.chunk_text for c in db_chunks])
            
    if not content.strip():
        raise HTTPException(status_code=400, detail="Extracted text content is empty.")
        
    try:
        questions = await asyncio.to_thread(
            generate_quiz,
            content,
            request.quiz_type,
            request.difficulty,
            request.num_questions,
            target_file if target_file else "custom_text"
        )
        
        # Save generated quiz to database if we have a valid document reference
        if doc_id:
            db_quiz = GeneratedQuiz(
                document_id=doc_id,
                quiz_json={"questions": questions}
            )
            db.add(db_quiz)
            await db.commit()
            
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")
