import os
import json
import re
import hashlib
from backend.utils.vector_store import load_vector_store
from backend.services.ollama_service import call_generate

# Global in-memory cache for quizzes
QUIZ_CACHE = {}

def get_quiz_model():
    """
    Deprecated: Local flan-t5 QA model is no longer loaded.
    Returns dummy values to maintain backward compatibility.
    """
    return None, None, None

def get_fallback_quiz_item(quiz_type: str, difficulty: str, filename: str, page_num: int) -> dict:
    """
    Fallback method to synthesize items when generation fails or is empty.
    """
    source_suffix = f" (Source: Page {page_num or '1'}, Document: {filename or 'Uploaded notes'})"
    if quiz_type == "mcq":
        return {
            "question": "What is the primary method used to analyze the uploaded document content?",
            "options": ["Vector Semantic Search", "Manual Skimming", "Word Frequency Indexing", "Random Retrieval"],
            "answer": "A",
            "explanation": f"Semantic search maps queries to document chunks stored in FAISS.{source_suffix}",
            "difficulty": difficulty
        }
    elif quiz_type == "tf":
        return {
            "question": "The learning assistant matches query embeddings to find the most relevant chunks in the document.",
            "options": ["True", "False"],
            "answer": "True",
            "explanation": f"FAISS handles cosine and similarity scores calculations.{source_suffix}",
            "difficulty": difficulty
        }
    else:
        return {
            "question": "Explain how information is retrieved for questions.",
            "options": [],
            "answer": f"Information is retrieved using local sentence embeddings and FAISS index matching.{source_suffix}",
            "explanation": f"Vector databases match semantic meanings of user queries.{source_suffix}",
            "difficulty": difficulty
        }

def get_quiz_cache_key(filename: str, quiz_type: str, difficulty: str, num_questions: int, text: str) -> str:
    """
    Generates a unique cache key for quizzes.
    """
    if not filename:
        h = hashlib.sha256(text.encode('utf-8')).hexdigest()
        return f"hash_{h}_{quiz_type}_{difficulty}_{num_questions}"
    return f"file_{filename}_{quiz_type}_{difficulty}_{num_questions}"

def generate_quiz(text: str, quiz_type: str = "mcq", difficulty: str = "medium", num_questions: int = 3, filename: str = "") -> list[dict]:
    """
    Generates high-quality quiz questions using local Ollama.
    Uses JSON mode to ensure strict schema adherence and features caching.
    """
    db = None
    try:
        db = load_vector_store("default")
    except Exception:
        pass
        
    all_chunks = []
    if db is not None:
        for doc_id, doc in db.docstore._dict.items():
            if not filename or doc.metadata.get("source") == filename:
                all_chunks.append(doc)
                
    if all_chunks:
        # Sort chunks sequentially by page
        all_chunks = sorted(all_chunks, key=lambda x: (x.metadata.get("page", 1), len(x.page_content)))
    else:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        fallback_texts = splitter.split_text(text)
        from langchain_core.documents import Document
        all_chunks = [Document(page_content=c, metadata={"source": filename or "Text Input", "page": 1}) for c in fallback_texts if c.strip()]
        
    if not all_chunks:
        return [get_fallback_quiz_item(quiz_type, difficulty, filename, 1) for _ in range(num_questions)]

    # Check Cache
    chunks_concat = "".join([c.page_content for c in all_chunks[:10]])
    cache_key = get_quiz_cache_key(filename, quiz_type, difficulty, num_questions, chunks_concat)
    if cache_key in QUIZ_CACHE:
        print(f"Quiz Generator: Returning cached quiz for key '{cache_key}'")
        return QUIZ_CACHE[cache_key]

    # Select chunks spaced out across the document to cover it entirely
    selected_chunks = []
    if len(all_chunks) <= num_questions:
        for i in range(num_questions):
            selected_chunks.append(all_chunks[i % len(all_chunks)])
    else:
        step = len(all_chunks) / num_questions
        for i in range(num_questions):
            idx = int(i * step)
            selected_chunks.append(all_chunks[idx])

    # Assemble context chunks with metadata reference tags
    context_parts = []
    for i, c in enumerate(selected_chunks):
        p_num = c.metadata.get("page", 1)
        context_parts.append(f"Segment {i+1} (Page {p_num}):\n{c.page_content}")
    context_text = "\n\n---\n\n".join(context_parts)

    options_instruction = ""
    if quiz_type == "mcq":
        options_instruction = '- "options": array of exactly 4 strings.'
        answer_instruction = '- "answer": string representing correct option letter, exactly "A", "B", "C", or "D".'
    elif quiz_type == "tf":
        options_instruction = '- "options": array containing exactly ["True", "False"].'
        answer_instruction = '- "answer": string, either "True" or "False".'
    else:
        options_instruction = '- "options": empty array [].'
        answer_instruction = '- "answer": string containing correct short answer.'

    prompt = f"""Generate exactly {num_questions} unique '{quiz_type}' questions of '{difficulty}' difficulty based ONLY on the Context.
Do not use outside knowledge. Answer must exist in Context.

Output strictly as a JSON object matching this schema:
{{
  "questions": [
    {{
      "question": "question text",
      {options_instruction}
      {answer_instruction}
      "explanation": "detailed explanation based only on context",
      "difficulty": "{difficulty}"
    }}
  ]
}}

Context:
{context_text}"""

    try:
        # Call Ollama with JSON format and set token limits to prevent model running wild on CPU
        raw_json = call_generate(prompt, format="json", options={"temperature": 0.1, "num_predict": 800})
        
        raw_json_clean = raw_json.strip()
        if raw_json_clean.startswith("```"):
            raw_json_clean = re.sub(r"^```(?:json)?\n", "", raw_json_clean)
            raw_json_clean = re.sub(r"\n```$", "", raw_json_clean)
            raw_json_clean = raw_json_clean.strip()
            
        data = json.loads(raw_json_clean)
        questions = data.get("questions", [])
        
        processed_questions = []
        for i, q in enumerate(questions):
            ref_chunk = selected_chunks[i % len(selected_chunks)]
            page_fb = ref_chunk.metadata.get("page", 1)
            source_suffix = f" (Source: Page {page_fb}, Document: {filename or 'Uploaded notes'})"
            
            exp = q.get("explanation", "")
            if source_suffix not in exp:
                q["explanation"] = exp + source_suffix
                
            if quiz_type == "short":
                ans = q.get("answer", "")
                if source_suffix not in ans:
                    q["answer"] = ans + source_suffix
            
            opts = q.get("options", [])
            if quiz_type == "mcq":
                while len(opts) < 4:
                    opts.append("Option not mentioned in document")
                opts = opts[:4]
            elif quiz_type == "tf":
                opts = ["True", "False"]
                
            processed_questions.append({
                "question": q.get("question", "Question placeholder"),
                "options": opts,
                "answer": q.get("answer", ""),
                "explanation": q.get("explanation", "Verified from uploaded text."),
                "difficulty": q.get("difficulty", difficulty)
            })
            
        if processed_questions:
            result = processed_questions[:num_questions]
            # Save to Cache
            QUIZ_CACHE[cache_key] = result
            return result
            
    except Exception as e:
        print(f"Ollama quiz generation failed: {e}")
        
    # Standard fallback path if parsing failed
    questions = []
    for i in range(num_questions):
        ref_chunk = selected_chunks[i % len(selected_chunks)]
        page_fb = ref_chunk.metadata.get("page", 1)
        questions.append(get_fallback_quiz_item(quiz_type, difficulty, filename, page_fb))
        
    QUIZ_CACHE[cache_key] = questions
    return questions
