# --- Stage 1: Build the React Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build the FastAPI Backend ---
FROM python:3.9-slim
ENV PYTHONUNBUFFERED=1 \
    PORT=7860 \
    HOME=/home/user
    
# Create user complying with Hugging Face Spaces security requirements
RUN useradd -m -u 1000 user
WORKDIR $HOME/app

# Install build dependencies for FAISS compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy python requirements first to leverage Docker cache
COPY --chown=user:user backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy built frontend assets from Stage 1
COPY --chown=user:user --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy backend code
COPY --chown=user:user backend/ ./backend/

# Create active folders and set owner permissions
RUN mkdir -p backend/uploads backend/vector_db && chown -R user:user backend/uploads backend/vector_db

# Pre-download and cache models to avoid spaces timeouts on startup
RUN python -c " \
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM; \
AutoTokenizer.from_pretrained('google/flan-t5-base'); \
AutoModelForSeq2SeqLM.from_pretrained('google/flan-t5-base'); \
AutoTokenizer.from_pretrained('google/flan-t5-large'); \
AutoModelForSeq2SeqLM.from_pretrained('google/flan-t5-large'); \
AutoTokenizer.from_pretrained('facebook/bart-large-cnn'); \
AutoModelForSeq2SeqLM.from_pretrained('facebook/bart-large-cnn'); \
AutoTokenizer.from_pretrained('facebook/nllb-200-distilled-600M'); \
AutoModelForSeq2SeqLM.from_pretrained('facebook/nllb-200-distilled-600M'); \
from sentence_transformers import SentenceTransformer; \
SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2') \
"

USER user
EXPOSE 7860

# Run FastAPI server
CMD ["python", "-m", "uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "7860"]
