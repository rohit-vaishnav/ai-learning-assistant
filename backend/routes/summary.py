import os
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.summarizer import summarize_text
from backend.routes.upload import get_metadata, UPLOAD_DIR
from backend.utils.pdf_reader import read_pdf
from backend.utils.docx_reader import read_docx
from backend.utils.ppt_reader import read_pptx

router = APIRouter()

class SummaryRequest(BaseModel):
    text: str = ""
    summary_type: str = "short"  # short, detailed, bullets
    filename: str = ""           # Optional: name of uploaded file to summarize

@router.post("/summary")
async def summary_endpoint(request: SummaryRequest):
    """
    Summarization endpoint. Handles direct text input or fetches content from uploaded files.
    """
    content = request.text.strip()
    
    # If no text is provided, pull from uploaded files
    if not content:
        metadata = get_metadata()
        if not metadata:
            raise HTTPException(
                status_code=400, 
                detail="Please upload a document first or provide direct text input."
            )
            
        target_file = request.filename.strip()
        if not target_file:
            # Default to the first uploaded file in metadata
            target_file = list(metadata.keys())[0]
            
        file_path = os.path.join(UPLOAD_DIR, target_file)
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404, 
                detail=f"Uploaded file '{target_file}' not found on server."
            )
            
        ext = os.path.splitext(target_file)[1].lower()
        try:
            if ext == ".pdf":
                pages = await asyncio.to_thread(read_pdf, file_path)
            elif ext == ".docx":
                pages = await asyncio.to_thread(read_docx, file_path)
            elif ext == ".pptx":
                pages = await asyncio.to_thread(read_pptx, file_path)
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format.")
            content = "\n".join([p["text"] for p in pages])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")
            
    if not content.strip():
        raise HTTPException(status_code=400, detail="Extracted text content is empty.")
        
    try:
        doc_source = request.filename.strip() if request.filename.strip() else (target_file if 'target_file' in locals() else "")
        summary = await asyncio.to_thread(summarize_text, content, request.summary_type, doc_source)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")
