import re
try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter

try:
    from langchain_core.documents import Document
except ImportError:
    from langchain.docstore.document import Document

def clean_page_text(text: str) -> str:
    """
    Cleans raw page text by removing multiple newlines and spaces.
    """
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()

def chunk_documents(pages_data: list[dict], filename: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[Document]:
    """
    Chunks a list of page data dicts [{"text": text, "page": page_num}] into LangChain Document objects.
    Cleans text and de-duplicates chunks.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    
    seen_chunks = set()
    documents = []
    
    for page_item in pages_data:
        text = clean_page_text(page_item["text"])
        page_num = page_item["page"]
        
        chunks = splitter.split_text(text)
        for chunk in chunks:
            chunk_cleaned = chunk.strip()
            if not chunk_cleaned:
                continue
            
            # Simple deduplication key based on lowercased content
            chunk_key = chunk_cleaned.lower()
            if chunk_key not in seen_chunks:
                seen_chunks.add(chunk_key)
                doc = Document(
                    page_content=chunk_cleaned,
                    metadata={
                        "source": filename,
                        "page": page_num
                    }
                )
                documents.append(doc)
                
    return documents
