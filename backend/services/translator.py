import os
from backend.services.ollama_service import call_generate

# Map of standard languages for validation
SUPPORTED_LANGUAGES = ["english", "hindi", "gujarati", "french", "spanish"]

def get_translator_model():
    """
    Deprecated: Local translation model is no longer loaded.
    Returns dummy values to maintain backward compatibility.
    """
    return None, None, None

def translate_text(text: str, target_lang: str) -> str:
    """
    Translates text into Hindi, Gujarati, French, Spanish, or English using local Ollama.
    Optimized with short prompts and output token limits.
    """
    lang_key = target_lang.strip().lower()
    if lang_key not in SUPPORTED_LANGUAGES:
        return f"Unsupported target language: {target_lang}. Supported: English, Hindi, Gujarati, French, Spanish."
        
    if not text.strip():
        return "No text provided for translation."
        
    prompt = f"""Translate this text into {target_lang.capitalize()}. Output ONLY the translated text. Do not add comments or introduction.

Text:
{text}"""

    try:
        # Restrict max output tokens to 600
        translated = call_generate(prompt, options={"temperature": 0.1, "num_predict": 600})
        return translated
    except Exception as e:
        return f"Translation error: {str(e)}"
