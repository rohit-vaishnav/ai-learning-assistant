# Use a lightweight python image with PyTorch compatibility
FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=7860 \
    HOME=/home/user

# Create user with UID 1000 to comply with Hugging Face Spaces security
RUN useradd -m -u 1000 user
WORKDIR $HOME/app

# Install build dependencies for FAISS compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies first to maximize build caching
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY --chown=user:user . .

# Create active folders and set owner permissions
RUN mkdir -p uploads vector_db && chown -R user:user uploads vector_db

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
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
