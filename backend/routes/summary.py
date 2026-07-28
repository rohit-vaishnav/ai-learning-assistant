import os
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database.connection import get_db
from backend.database.models import User, UploadedDocument, GeneratedSummary, DocumentChunk
from backend.routes.auth import get_current_user
from backend.routes.upload import UPLOAD_DIR
from backend.services.summarizer import summarize_text
from backend.utils.pdf_reader import read_pdf
from backend.utils.docx_reader import read_docx
from backend.utils.ppt_reader import read_pptx

router = APIRouter()

class SummaryRequest(BaseModel):
    text: str = ""
    summary_type: str = "short"  # short, detailed, bullets
    filename: str = ""           # Optional: name of uploaded file to summarize

@router.post("/summary")
async def summary_endpoint(
    request: SummaryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Summarization endpoint. Handles direct text input or fetches content from uploaded files.
    """
    content = request.text.strip()
    target_file = request.filename.strip()
    doc_id = None
    
    # If no text is provided, pull from uploaded files
    if not content:
        # Get active documents from db
        if not target_file:
            # Get the first uploaded file in db for this user
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
        doc_source = target_file if target_file else ""
        summary = await asyncio.to_thread(summarize_text, content, request.summary_type, doc_source)
        
        # Save generated summary to database if we have a valid document reference
        if doc_id:
            db_summary = GeneratedSummary(
                document_id=doc_id,
                summary_type=request.summary_type,
                summary_text=summary
            )
            db.add(db_summary)
            await db.commit()
            
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")
