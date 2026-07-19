import os
import json
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from backend.utils.pdf_reader import read_pdf
from backend.utils.docx_reader import read_docx
from backend.utils.ppt_reader import read_pptx
from backend.utils.text_chunker import chunk_documents
from backend.utils.vector_store import save_vector_store

router = APIRouter()

# Ensure uploads folder exists
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
METADATA_FILE = os.path.join(UPLOAD_DIR, "files_metadata.json")

# In-memory status tracking dictionary for upload progression
PROCESSING_STATUS = {}

def get_metadata() -> dict:
    if os.path.exists(METADATA_FILE):
        try:
            with open(METADATA_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_metadata(metadata: dict):
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=4)

def process_document_background(filename: str, file_path: str):
    """
    Background worker task to extract text, chunk content, and generate embeddings.
    """
    try:
        ext = os.path.splitext(filename)[1].lower()
        
        # Step 1: Extract Text (Status was set to Extracting Text... on upload receipt)
        PROCESSING_STATUS[filename] = "Extracting Text..."
        
        if ext == ".pdf":
            pages_data = read_pdf(file_path)
        elif ext == ".docx":
            pages_data = read_docx(file_path)
        elif ext == ".pptx":
            pages_data = read_pptx(file_path)
        else:
            raise ValueError("Unsupported file format.")
            
        if not pages_data:
            raise ValueError("Document contains no readable text contents.")
            
        # Step 2: Creating Embeddings
        PROCESSING_STATUS[filename] = "Creating Embeddings..."
        
        # Split text into optimized chunk sizes (800 char blocks with 150 overlap)
        documents = chunk_documents(pages_data, filename, chunk_size=800, chunk_overlap=150)
        
        # Save to local FAISS store (adds to default index index.faiss)
        save_vector_store(documents, "default")
        
        # Save file info metadata cache
        metadata = get_metadata()
        metadata[filename] = {
            "filename": filename,
            "file_size": os.path.getsize(file_path),
            "num_chunks": len(documents),
            "num_pages": len(pages_data)
        }
        save_metadata(metadata)
        
        PROCESSING_STATUS[filename] = "Ready"
        print(f"Background parsing complete for: {filename}")
        
    except Exception as e:
        print(f"Background process error for '{filename}': {e}")
        PROCESSING_STATUS[filename] = f"Error: {str(e)}"
        # Clean up corrupted file if upload failed
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

@router.post("/upload")
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in [".pdf", ".docx", ".pptx"]:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and PPTX files are supported.")
        
    # Check cache to avoid duplicate embeddings and parsing
    metadata = get_metadata()
    if filename in metadata:
        PROCESSING_STATUS[filename] = "Ready"
        return {
            "status": "Ready",
            "filename": filename,
            "message": f"'{filename}' has already been processed (cached)."
        }
        
    temp_path = os.path.join(UPLOAD_DIR, filename)
    try:
        # Write contents to uploads
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())
            
        # Set status and spawn async background worker task
        PROCESSING_STATUS[filename] = "Extracting Text..."
        background_tasks.add_task(process_document_background, filename, temp_path)
        
        return {
            "status": "Processing",
            "filename": filename,
            "message": "Upload complete. Processing details in the background."
        }
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/upload/status")
async def get_upload_status(filename: str):
    """
    Returns the real-time processing stage of a document.
    """
    # If not in memory status dict, check if it already exists in metadata cache
    status = PROCESSING_STATUS.get(filename)
    if status is None:
        metadata = get_metadata()
        status = "Ready" if filename in metadata else "Ready"
    return {"status": status}

@router.get("/documents")
async def get_documents():
    """
    Returns list of uploaded and indexed files.
    """
    metadata = get_metadata()
    return list(metadata.values())

@router.delete("/documents")
async def delete_documents():
    """
    Clears all documents and clears the vector database.
    """
    from backend.utils.vector_store import clear_vector_store
    clear_vector_store("default")
    PROCESSING_STATUS.clear()
    
    # Delete local files
    for fname in os.listdir(UPLOAD_DIR):
        fpath = os.path.join(UPLOAD_DIR, fname)
        if os.path.isfile(fpath):
            os.remove(fpath)
            
    # Reset metadata
    if os.path.exists(METADATA_FILE):
        os.remove(METADATA_FILE)
        
    return {"message": "All documents cleared successfully."}
