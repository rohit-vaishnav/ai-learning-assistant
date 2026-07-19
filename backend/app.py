import os
import sys

# Ensure both the backend and parent directories are in Python's search path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.upload import router as upload_router
from routes.chat import router as chat_router
from routes.summary import router as summary_router
from routes.quiz import router as quiz_router
from routes.explain import router as explain_router
from routes.translate import router as translate_router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing local AI services once during FastAPI startup...")
    try:
        from backend.services.embeddings import get_embeddings_model
        from backend.services.ollama_service import get_active_model, call_generate
        
        # Load local embeddings model into memory
        print("Pre-loading local sentence embeddings model (sentence-transformers/all-MiniLM-L6-v2)...")
        get_embeddings_model()
        
        # Verify Ollama connectivity and trigger model load
        active_model = get_active_model()
        print(f"Connecting to local Ollama. Pre-loading LLM model '{active_model}'...")
        # Make a tiny prompt request to trigger model loading in Ollama
        call_generate("Preload", options={"num_predict": 1})
        print("All local AI services successfully initialized and ready for queries!")
    except Exception as e:
        print(f"Startup warning: failed to preload models: {e}")
    yield

app = FastAPI(
    title="AI Learning Assistant API",
    description="Backend server leveraging local Ollama and Hugging Face local models for RAG QA, Summarization, Translation, Quizzes, and Explanations.",
    version="1.0.0",
    lifespan=lifespan
)

# Allow Cross-Origin Resource Sharing (CORS) for local and production deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route controllers
app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(summary_router)
app.include_router(quiz_router)
app.include_router(explain_router)
app.include_router(translate_router)

@app.get("/health")
async def health_check():
    """
    Health check endpoint verifying backend availability and detailing pipeline models.
    """
    from backend.services.ollama_service import get_active_model
    try:
        active_model = get_active_model()
    except Exception:
        active_model = "unknown (ollama offline)"
        
    return {
        "status": "healthy",
        "models_integrated": {
            "embeddings": "sentence-transformers/all-MiniLM-L6-v2",
            "llm": f"Ollama ({active_model})"
        }
    }

if __name__ == "__main__":
    import uvicorn
    # Start the server on port 8000
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
