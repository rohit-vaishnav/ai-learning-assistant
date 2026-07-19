import os
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.quiz_generator import generate_quiz
from backend.routes.upload import get_metadata, UPLOAD_DIR
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
async def generate_quiz_endpoint(request: QuizRequest):
    """
    Quiz generator endpoint. Generates questions from direct text or uploaded files.
    """
    content = request.text.strip()
    target_file = request.filename.strip()
    
    if not content:
        metadata = get_metadata()
        if not metadata:
            raise HTTPException(
                status_code=400,
                detail="Please upload a document first or provide direct text input."
            )
            
        if not target_file:
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
        questions = await asyncio.to_thread(
            generate_quiz,
            content,
            request.quiz_type,
            request.difficulty,
            request.num_questions,
            target_file
        )
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")
