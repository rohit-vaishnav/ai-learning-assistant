import os
import sys

# ZeroGPU Dynamic Import
if os.environ.get("SPACES_ZERO_GPU") == "true":
    try:
        import spaces
        @spaces.GPU
        def dummy_gpu_startup():
            return "ZeroGPU active"
    except Exception:
        pass

# Add root and backend directory to python search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

from backend.app import app

if __name__ == "__main__":
    import uvicorn
    # Hugging Face sets the PORT environment variable automatically
    port = int(os.environ.get("PORT", 7860))
    print(f"Starting server on port {port}...")
    uvicorn.run("backend.app:app", host="0.0.0.0", port=port)
