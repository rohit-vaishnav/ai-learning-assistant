import fitz  # PyMuPDF

def read_pdf(file_path: str) -> list[dict]:
    """
    Reads a PDF file and extracts text page-by-page.
    Returns:
        list of dict: [{"text": page_text, "page": page_number}]
    """
    pages_data = []
    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text()
            if text.strip():
                pages_data.append({
                    "text": text,
                    "page": page_num + 1
                })
        doc.close()
    except Exception as e:
        raise RuntimeError(f"Error parsing PDF: {str(e)}")
    return pages_data
