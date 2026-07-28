# 🎓 AI Learning Assistant

A full-featured, interactive AI Learning Assistant built with a **React (Vite)** frontend and **FastAPI** backend. It leverages **LangChain** and **FAISS** for Retrieval-Augmented Generation (RAG), allowing students to upload study documents and learn interactively.

### 🌟 Core Features:
* **💬 Interactive Document Chat (RAG)**: Ask questions about your study documents with responses structured into clear direct answers, detailed explanations, and bulleted key points.
* **📝 AI Outlines & Summaries**: Generate short overview paragraphs, detailed revision notes, or quick bullet points from your uploaded notes.
* **🧠 Custom Quiz Generator**: Test your knowledge with dynamically generated Multiple Choice, True/False, or Short Answer quizzes. If you pass, you can download a personalized PDF Certificate of Achievement.
* **📖 Concept Explainer**: Get definitions of complex academic terms simplified using friendly analogies (Beginner), standard definitions (Student), or code/deep breakdowns (Technical).
* **🌐 Language Translator**: Translate study material into multiple languages (Hindi, Spanish, French, etc.) instantly.

The application implements a full local **Retrieval-Augmented Generation (RAG)** pipeline. It uses local sentence embeddings for semantic search and document indexing, combined with **Ollama running locally** for Chat, Summarization, Quiz Generation, Topic Simplification, and Language Translation. **No external cloud APIs or keys (such as Groq, OpenAI, or Anthropic) are required.**

---

## Technical Stack Overview

### Backend
* **FastAPI**: Core async python web server framework optimized with asynchronous execution pools.
* **Ollama**: Local inference server running the LLM (preferred: `llama3.1:8b`, fallback: `llama3.2:3b`, `phi3:mini`, `qwen2.5:7b`).
* **Sentence Transformers**: Generates 384-dimensional dense vectors using `all-MiniLM-L6-v2` loaded locally.
* **LangChain**: Manages document representation and context aggregation.
* **FAISS**: Performs fast CPU-based similarity search indices.
* **PyMuPDF (`fitz`), python-docx, python-pptx**: Document parsers.

### Frontend
* **React (Vite)**: Component-based UI framework.
* **Tailwind CSS v4**: CSS-first modern styling engine.
* **Framer Motion**: Smooth entry/exit animations.
* **React Markdown**: Renders formatted mathematical and code structures.
* **Lucide Icons**: Clean, developer-friendly iconography.
* **Axios**: API request handler.

---

## Project Folder Structure

```text
├── backend/
│   ├── app.py                      # FastAPI entrypoint, middleware, CORS, lifespan preloading
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # Configuration (Ollama model selection)
│   ├── routes/
│   │   ├── upload.py               # /upload, /documents controllers
│   │   ├── chat.py                 # /chat controller (RAG QA)
│   │   ├── summary.py              # /summary controller
│   │   ├── quiz.py                 # /quiz controller
│   │   ├── translate.py            # /translate controller
│   │   └── explain.py              # /explain controller
│   ├── services/
│   │   ├── embeddings.py           # Embeddings manager (all-MiniLM-L6-v2)
│   │   ├── ollama_service.py       # Centralized Ollama service (TCP pooling, fallbacks, retries)
│   │   ├── rag.py                  # RAG context builder and question condensing
│   │   ├── summarizer.py           # Text summarizer with intermediate segmentation & caching
│   │   ├── quiz_generator.py       # Quiz builder (native JSON parsing schema)
│   │   ├── translator.py           # Multi-language translator (Hindi, Gujarati, French, Spanish)
│   │   └── explainer.py            # Topic explainer (analogy, beginner, technical modes)
│   ├── utils/
│   │   ├── pdf_reader.py           # PDF PyMuPDF extractor
│   │   ├── docx_reader.py          # Word paragraph extractor
│   │   ├── ppt_reader.py           # Slides text extractor
│   │   ├── text_chunker.py         # Recursive splitter utility
│   │   └── vector_store.py         # FAISS database manager
│   ├── uploads/                    # Cached uploaded files
│   └── vector_db/                  # FAISS local indexing binary store
│
├── frontend/
│   ├── index.html                  # HTML entry point
│   ├── package.json                # NPM configuration
│   ├── src/
│   │   ├── main.jsx                # React app renderer
│   │   ├── App.jsx                 # Routing tree & global overlays
│   │   └── pages/
│   │       ├── LandingPage.jsx     # Landing page
│   │       ├── Dashboard.jsx       # Workspace index and stats view
│   │       ├── UploadPage.jsx      # Drag & Drop document manager
│   │       ├── ChatPage.jsx        # Dialog with source citations
│   │       ├── SummaryPage.jsx     # Outlining & revision exporter
│   │       ├── QuizPage.jsx        # Quiz module (MCQ, T/F, Short)
│   │       ├── ExplainPage.jsx     # Multi-mode simplified guide builder
│   │       └── TranslatePage.jsx   # Dual-pane translator interface
```

---

## Local Installation Guide

### Prerequisites
* Python 3.9 or higher
* Node.js v16+ and NPM
* **Ollama** installed and running locally ([Download Ollama](https://ollama.com))

### 1. Setup Ollama
Make sure Ollama is running and pull the preferred LLM:
```bash
# Pull the preferred LLM model
ollama pull llama3.1:8b

# If your system has limited RAM (e.g. less than 16GB), pull a smaller model:
ollama pull llama3.2:3b
# or
ollama pull phi3:mini
```

### 2. Run the Backend Server
Open a terminal in the `backend/` directory:

```bash
cd backend

# Create a virtual environment
python -m venv venv
# Activate virtual environment (Windows Powershell)
.\venv\Scripts\Activate.ps1
# On MacOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the development server
python app.py
```
The FastAPI backend runs on `http://localhost:8000`. You can visit `http://localhost:8000/docs` to see Swagger documentation.

During startup:
- The backend loads the local embedding model `sentence-transformers/all-MiniLM-L6-v2` into memory.
- The backend connects to the local Ollama instance and pre-loads the configured model, so the first query runs instantly.

### 3. Start the Frontend App
Open a separate terminal in the `frontend/` directory:

```bash
cd frontend

# Install package dependencies
npm install

# Start Vite server
npm run dev
```
The React frontend starts on `http://localhost:5173`. Open your browser and navigate there to enter the app.

---

## API Documentation

* `POST /upload`: Uploads a document (PDF, DOCX, PPTX). Parses, splits, embeds, and indexes to FAISS.
* `GET /documents`: Returns JSON list of all indexed files.
* `DELETE /documents`: Clears FAISS DB and wipes temp documents.
* `POST /chat`: Queries document vectors using RAG context. Returns `{ answer: str, sources: [...] }` formatted in strict markdown schema.
* `POST /summary`: Generates summary formats (short summary, detailed overview, or bullet notes) with in-memory caching.
* `POST /quiz`: Builds customizable tests (MCQ, True/False, Short answers) using Ollama JSON output mode.
* `POST /explain`: Simplifies target vocabulary using analogy, beginner, student, or technical modes.
* `POST /translate`: Translates texts to Hindi, Gujarati, French, Spanish, or English.
* `GET /health`: Verifies server and local Ollama model connection status.
