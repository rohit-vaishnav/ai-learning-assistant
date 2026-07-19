import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.translator import translate_text

router = APIRouter()

class TranslateRequest(BaseModel):
    text: str
    target_lang: str  # hindi, gujarati, french, spanish, english

@router.post("/translate")
async def translate_endpoint(request: TranslateRequest):
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
        return {"translated_text": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
