import os
import shutil
from langchain_community.vectorstores import FAISS
from backend.services.embeddings import get_embeddings_model

# Ensure vector database directory exists
DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vector_db"))
os.makedirs(DB_DIR, exist_ok=True)

# Global in-memory cache for loaded FAISS indexes
_loaded_indices = {}

def save_vector_store(documents, index_name="default"):
    """
    Creates or updates the local FAISS vector store with new documents.
    Updates the in-memory cache to ensure queries reuse the new index instantly.
    """
    global _loaded_indices
    embeddings = get_embeddings_model()
    path = os.path.join(DB_DIR, index_name)
    
    if os.path.exists(os.path.join(path, "index.faiss")):
        db = FAISS.load_local(path, embeddings, allow_dangerous_deserialization=True)
        db.add_documents(documents)
    else:
        db = FAISS.from_documents(documents, embeddings)
        
    db.save_local(path)
    # Cache the updated index in memory
    _loaded_indices[index_name] = db
    return db

def load_vector_store(index_name="default"):
    """
    Loads the local FAISS index if it exists, using in-memory cache to avoid redundant disk reads.
    """
    global _loaded_indices
    if index_name in _loaded_indices:
        return _loaded_indices[index_name]
        
    embeddings = get_embeddings_model()
    path = os.path.join(DB_DIR, index_name)
    if os.path.exists(os.path.join(path, "index.faiss")):
        db = FAISS.load_local(path, embeddings, allow_dangerous_deserialization=True)
        _loaded_indices[index_name] = db
        return db
    return None

def clear_vector_store(index_name="default"):
    """
    Clears the local FAISS files and removes the index from the in-memory cache.
    """
    global _loaded_indices
    if index_name in _loaded_indices:
        del _loaded_indices[index_name]
        
    path = os.path.join(DB_DIR, index_name)
    if os.path.exists(path):
        shutil.rmtree(path)
