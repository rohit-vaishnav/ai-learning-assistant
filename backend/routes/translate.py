import asyncio
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.connection import get_db
from backend.database.models import User, TranslationHistory
from backend.routes.auth import get_current_user
from backend.services.translator import translate_text

router = APIRouter()

class TranslateRequest(BaseModel):
    text: str
    target_lang: str  # hindi, gujarati, french, spanish, english

@router.post("/translate")
async def translate_endpoint(
    request: TranslateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Translation endpoint. Translates input English text to target language.
    """
    text_to_translate = request.text.strip()
    target_language = request.target_lang.strip()
    
    if not text_to_translate:
        raise HTTPException(status_code=400, detail="Translation content cannot be empty.")
    if not target_language:
        raise HTTPException(status_code=400, detail="Target language must be specified.")
        
    try:
        translated = await asyncio.to_thread(translate_text, text_to_translate, target_language)
        
        # Save translation to database history
        db_translation = TranslationHistory(
            document_id=None,  # Not tied to a specific physical document upload in generic translation
            source_language="English",
            target_language=target_language,
            translated_text=translated
        )
        db.add(db_translation)
        await db.commit()
        
        return {"translated_text": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
