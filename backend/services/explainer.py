import os
import hashlib
from backend.services.ollama_service import call_generate

# Global in-memory cache for explanations
EXPLAIN_CACHE = {}

def get_explainer_model():
    """
    Deprecated: Local flan-t5 QA model is no longer loaded.
    Returns dummy values to maintain backward compatibility.
    """
    return None, None, None

def get_explain_cache_key(filename: str, topic: str, mode: str) -> str:
    """
    Generates a unique cache key for explanations.
    """
    return f"file_{filename or 'global'}_{topic.lower()}_{mode}"

def explain_topic(topic: str, mode: str = "student", context: str = None, filename: str = "") -> str:
    """
    Generates a highly structured, educational explanation of a topic using local Ollama.
    Retrieves Top 4 relevant chunks from the vector database first. Features caching.
    """
    cache_key = get_explain_cache_key(filename, topic, mode)
    if cache_key in EXPLAIN_CACHE:
        print(f"Explainer: Returning cached explanation for key '{cache_key}'")
        return EXPLAIN_CACHE[cache_key]

    # 1. Retrieve chunks if context is not already provided
    if not context:
        from backend.utils.vector_store import load_vector_store
        db = load_vector_store("default")
        if db is not None:
            search_kwargs = {}
            if filename:
                search_kwargs["filter"] = {"source": filename}
            # Retrieve top 4 chunks (RAG optimization) for speed and relevance
            docs = db.similarity_search(topic, k=4, **search_kwargs)
            if docs:
                context = "\n---\n".join([doc.page_content for doc in docs])
                
    if not context or not context.strip():
        return "I couldn't find this information in the uploaded document."

    # Style description based on mode
    style_instruction = ""
    if mode == "beginner":
        style_instruction = "Use simple vocabulary, analogies, and a friendly explanation style suitable for beginners."
    elif mode == "technical":
        style_instruction = "Use technical language, precise engineering terminology, and detailed mechanics."
    else: # student
        style_instruction = "Use academic, student-friendly definitions and step-by-step explanations."

    prompt = f"""You are a professional educational explainer. Based ONLY on the Context, write a structured explanation of the topic "{topic}".
Style: {style_instruction}

Requirements:
1. Explain the topic using ONLY the Context. Do not use outside knowledge.
2. If not present in the Context, reply with exactly: "I couldn't find this information in the uploaded document." and nothing else.
3. Format response exactly as follows:

# {topic}

## Introduction
[Intro overview, 2-3 sentences based only on the context]

## Explanation
[Detailed explanation, 3-4 sentences based only on the context]

## Key Points
• [Key point 1]
• [Key point 2]
• [Key point 3]

## Example
[Practical study example or analogy based strictly on the context]

## Conclusion
[Brief summary conclusion, 1-2 sentences based only on the context]

RULES:
- Do not speculate. If context doesn't provide details (like Example), write 'Not mentioned in document.' under that section.
- If topic is not in Context, do not output headings, just reply with exactly: "I couldn't find this information in the uploaded document."

Context:
{context}"""

    try:
        # Use low temperature and limit output token length to 500 for fast CPU response
        explanation = call_generate(prompt, options={"temperature": 0.1, "num_predict": 500})
        
        # Clean potential empty formatting
        if "i couldn't find this information in the uploaded document" in explanation.lower() or len(explanation.strip()) < 100:
            explanation = "I couldn't find this information in the uploaded document."
            
        # Append source info
        if explanation != "I couldn't find this information in the uploaded document." and filename:
            explanation += f"\n\n---\n### 📚 Source References\n* **Document**: {filename}\n* **Explanation Basis**: Retrieved context from uploaded notes."
            
        # Save to Cache
        EXPLAIN_CACHE[cache_key] = explanation
        return explanation
    except Exception as e:
        print(f"Ollama explanation failed: {e}")
        return f"Failed to generate explanation. Error: {str(e)}"
