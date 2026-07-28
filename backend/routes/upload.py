import os
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from backend.database.connection import get_db, async_session
from backend.database.models import User, UploadedDocument, DocumentChunk
from backend.routes.auth import get_current_user
from backend.utils.pdf_reader import read_pdf
from backend.utils.docx_reader import read_docx
from backend.utils.ppt_reader import read_pptx
from backend.utils.text_chunker import chunk_documents
from backend.utils.vector_store import save_vector_store, clear_vector_store

router = APIRouter()

# Ensure uploads folder exists
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def process_document_background(filename: str, file_path: str, user_id: int):
    """
    Background worker task to extract text, chunk content, generate embeddings,
    and save relational records to PostgreSQL and vector indices to FAISS.
    """
    async with async_session() as db:
        try:
            ext = os.path.splitext(filename)[1].lower()
            
            # Step 1: Update status to Extracting Text
            result = await db.execute(
                select(UploadedDocument).where(
                    UploadedDocument.file_name == filename, 
                    UploadedDocument.user_id == user_id
                )
            )
            doc = result.scalars().first()
            if not doc:
                return
                
            doc.document_status = "Extracting Text..."
            await db.commit()
            
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
            doc.document_status = "Creating Embeddings..."
            await db.commit()
            
            # Split text into optimized chunk sizes (800 char blocks with 150 overlap)
            documents = chunk_documents(pages_data, filename, chunk_size=800, chunk_overlap=150)
            
            # Save to user-isolated FAISS store
            index_name = f"user_{user_id}"
            save_vector_store(documents, index_name)
            
            # Save chunks to PostgreSQL
            for i, chunk in enumerate(documents):
                db_chunk = DocumentChunk(
                    document_id=doc.id,
                    chunk_number=i,
                    chunk_text=chunk.page_content,
                    page_number=chunk.metadata.get("page", 1)
                )
                db.add(db_chunk)
                
            doc.document_status = "Ready"
            await db.commit()
            print(f"Background parsing complete for user {user_id}: {filename}")
            
        except Exception as e:
            print(f"Background process error for '{filename}': {e}")
            try:
                # Update DB record status to error
                result = await db.execute(
                    select(UploadedDocument).where(
                        UploadedDocument.file_name == filename, 
                        UploadedDocument.user_id == user_id
                    )
                )
                doc = result.scalars().first()
                if doc:
                    doc.document_status = f"Error: {str(e)}"
                    await db.commit()
            except Exception as db_err:
                print(f"Failed to save error status to DB: {db_err}")
                
            # Clean up file if failed
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass

@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    filename = file.filename.strip()
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in [".pdf", ".docx", ".pptx"]:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and PPTX files are supported.")
        
    # Check database to avoid duplicate uploads for this user
    result = await db.execute(
        select(UploadedDocument).where(
            UploadedDocument.file_name == filename, 
            UploadedDocument.user_id == current_user.id
        )
    )
    existing_doc = result.scalars().first()
    if existing_doc:
        # If it failed previously, allow re-upload
        if "Error" in existing_doc.document_status:
            await db.delete(existing_doc)
            await db.commit()
        else:
            return {
                "status": existing_doc.document_status,
                "filename": filename,
                "message": f"'{filename}' has already been processed."
            }
            
    temp_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{filename}")
    try:
        # Write contents to local uploads folder
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())
            
        # Create record in DB
        doc = UploadedDocument(
            user_id=current_user.id,
            file_name=filename,
            file_type=ext,
            file_size=os.path.getsize(temp_path),
            document_status="Processing"
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        
        # Spawn async background worker task
        background_tasks.add_task(process_document_background, filename, temp_path, current_user.id)
        
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
async def get_upload_status(
    filename: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the real-time processing stage of a document.
    """
    result = await db.execute(
        select(UploadedDocument).where(
            UploadedDocument.file_name == filename, 
            UploadedDocument.user_id == current_user.id
        )
    )
    doc = result.scalars().first()
    if doc:
        return {"status": doc.document_status}
    return {"status": "Not Found"}

@router.get("/documents")
async def get_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns list of uploaded and indexed files for the active user.
    """
    result = await db.execute(
        select(UploadedDocument).where(UploadedDocument.user_id == current_user.id)
    )
    docs = result.scalars().all()
    
    # Format to match frontend expectations
    documents_list = []
    for d in docs:
        # Fetch chunk count
        chunk_result = await db.execute(
            select(DocumentChunk).where(DocumentChunk.document_id == d.id)
        )
        chunks = chunk_result.scalars().all()
        
        # Approximate pages if reader failed to count
        num_pages = 0
        if chunks:
            num_pages = max(c.page_number for c in chunks)
            
        documents_list.append({
            "filename": d.file_name,
            "file_size": d.file_size,
            "num_chunks": len(chunks),
            "num_pages": num_pages if num_pages > 0 else 1,
            "status": d.document_status,
            "upload_date": d.upload_date.isoformat()
        })
        
    return documents_list

@router.delete("/documents")
async def delete_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Clears all documents for the authenticated user and clears their vector index.
    """
    # Find all documents belonging to user
    result = await db.execute(
        select(UploadedDocument).where(UploadedDocument.user_id == current_user.id)
    )
    docs = result.scalars().all()
    
    # Delete local physical files
    for d in docs:
        temp_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{d.file_name}")
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
                
    # Clear vector store for the user index
    index_name = f"user_{current_user.id}"
    clear_vector_store(index_name)
    
    # Delete from database (cascade deletes chunks, chat, summaries, quizzes)
    await db.execute(
        delete(UploadedDocument).where(UploadedDocument.user_id == current_user.id)
    )
    await db.commit()
    
    return {"message": "All user documents and vector index cleared successfully."}
