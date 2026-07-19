from langchain_community.embeddings import HuggingFaceEmbeddings
import torch

_embeddings = None

def get_embeddings_model():
    """
    Initializes and caches the Hugging Face SentenceTransformer Embeddings model.
    """
    global _embeddings
    if _embeddings is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Loading embeddings model 'sentence-transformers/all-MiniLM-L6-v2' on device: {device}")
        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": device},
            encode_kwargs={"device": device}
        )
    return _embeddings
