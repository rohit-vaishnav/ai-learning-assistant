import os
import requests
import logging
import time
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2:3b").strip()

# List of models in order of priority for automatic fallback if preferred model isn't pulled
PREFERRED_MODELS = [
    OLLAMA_MODEL,
    "llama3.2:3b",
    "llama3.1:8b",
    "phi3:mini",
    "qwen2.5:7b",
    "phi3",
    "qwen2.5"
]

_selected_model = None
# Shared Session object for connection pooling and reuse
_session = requests.Session()

def get_active_model() -> str:
    """
    Checks the local Ollama instance tags to find the best available model.
    Falls back gracefully if the preferred model is not pulled.
    """
    global _selected_model
    if _selected_model is not None:
        return _selected_model
        
    try:
        response = _session.get(f"{OLLAMA_HOST}/api/tags", timeout=5)
        if response.status_code == 200:
            models_info = response.json().get("models", [])
            local_models = [m["name"] for m in models_info]
            
            # Check for exact matches first
            for candidate in PREFERRED_MODELS:
                if candidate in local_models:
                    _selected_model = candidate
                    logger.info(f"Ollama Service: Selected exact matching model '{_selected_model}'")
                    return _selected_model
                    
            # Check for base name matches (e.g., if 'llama3.1:latest' exists but we asked for 'llama3.1:8b')
            for candidate in PREFERRED_MODELS:
                candidate_base = candidate.split(":")[0]
                for lm in local_models:
                    if lm.startswith(candidate_base + ":") or lm == candidate_base:
                        _selected_model = lm
                        logger.info(f"Ollama Service: Selected base-matching model '{_selected_model}' for candidate '{candidate}'")
                        return _selected_model
            
            # Last resort fallback: use whatever model is pulled locally
            if local_models:
                _selected_model = local_models[0]
                logger.warning(f"Ollama Service: Requested model '{OLLAMA_MODEL}' not found. Using first available local model '{_selected_model}'")
                return _selected_model
    except Exception as e:
        logger.warning(f"Ollama tags query failed: {e}. Defaulting to configured model '{OLLAMA_MODEL}'")
        
    _selected_model = OLLAMA_MODEL
    return _selected_model

def call_ollama(endpoint: str, payload: dict, timeout: int = 60) -> str:
    """
    Base helper to call Ollama APIs with timeout, retry logic, and connection pooling.
    Sets keep_alive to -1 to keep the model loaded in RAM/VRAM indefinitely.
    """
    url = f"{OLLAMA_HOST}{endpoint}"
    
    if "model" not in payload:
        payload["model"] = get_active_model()
        
    payload["stream"] = False
    payload["keep_alive"] = -1  # Keep the model loaded in memory indefinitely
    
    max_retries = 3
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Sending request to Ollama endpoint '{endpoint}' using model '{payload['model']}' (Attempt {attempt+1}/{max_retries})")
            response = _session.post(url, json=payload, timeout=timeout)
            response.raise_for_status()
            
            data = response.json()
            if endpoint == "/api/chat":
                return data["message"]["content"].strip()
            else:
                return data["response"].strip()
                
        except requests.exceptions.Timeout as t_err:
            logger.warning(f"Ollama call timed out: {t_err}")
            if attempt == max_retries - 1:
                raise RuntimeError(f"Ollama API call timed out after {max_retries} attempts.")
        except Exception as e:
            logger.warning(f"Ollama call failed on attempt {attempt+1}: {e}")
            if attempt == max_retries - 1:
                raise RuntimeError(f"Ollama API call failed: {str(e)}")
                
        time.sleep(retry_delay)
        retry_delay *= 2
        
    raise RuntimeError("Ollama call failed due to unexpected flow")

def call_generate(prompt: str, system: str = None, options: dict = None, format: str = None) -> str:
    """
    Generates text using the Ollama completion endpoint.
    """
    payload = {
        "prompt": prompt,
        "options": options or {"temperature": 0.1}
    }
    if system:
        payload["system"] = system
    if format:
        payload["format"] = format
    return call_ollama("/api/generate", payload)

def call_chat(messages: list, options: dict = None, format: str = None) -> str:
    """
    Generates text using the Ollama chat completions endpoint (useful for history).
    """
    payload = {
        "messages": messages,
        "options": options or {"temperature": 0.1}
    }
    if format:
        payload["format"] = format
    return call_ollama("/api/chat", payload)

def call_chat_stream(messages: list, options: dict = None):
    """
    Generator yielding tokens from the Ollama chat stream progressively.
    """
    url = f"{OLLAMA_HOST}/api/chat"
    payload = {
        "model": get_active_model(),
        "messages": messages,
        "options": options or {"temperature": 0.1},
        "stream": True,
        "keep_alive": -1
    }
    
    # Establish connection and yield chunks as they arrive
    response = _session.post(url, json=payload, stream=True, timeout=60)
    response.raise_for_status()
    for line in response.iter_lines():
        if line:
            chunk = json.loads(line.decode('utf-8'))
            token = chunk.get("message", {}).get("content", "")
            if token:
                yield token
