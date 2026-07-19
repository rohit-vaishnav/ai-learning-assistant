import os
import torch
import json
from backend.utils.vector_store import load_vector_store
from backend.services.ollama_service import call_chat, call_generate, call_chat_stream

# Global in-memory conversation history dictionary mapping document session keys to (question, answer) tuples
CHAT_HISTORY = {}

def get_rag_model():
    """
    Deprecated: Local flan-t5 QA model is no longer loaded.
    Returns dummy values to maintain backward compatibility.
    """
    return None, None, None

def condense_question(question: str, history: list) -> str:
    """
    Rewrites a follow-up question into a standalone question using conversation history via Ollama.
    """
    if not history:
        return question
        
    history_str = ""
    for past_q, past_a in history[-2:]:  # Use last 2 turns
        # Strip source references block from history response to avoid cluttering context
        clean_past_a = past_a.split("### Source")[0].split("\n\n---")[0].strip()
        history_str += f"User: {past_q}\nAssistant: {clean_past_a}\n"
        
    prompt = f"""Given the following conversation history and a follow-up question, rewrite the follow-up question to be a standalone search query. Do not answer it, just output the rewritten question.

Chat History:
{history_str}
Follow-up Question: {question}

Standalone Question:"""

    try:
        # Use low token limit for speed
        condensed = call_generate(prompt, options={"temperature": 0.1, "num_predict": 50})
        if "standalone question:" in condensed.lower():
            condensed = condensed.lower().split("standalone question:")[-1].strip()
        return condensed.strip() if condensed.strip() else question
    except Exception as e:
        print(f"Error condensing question via Ollama: {e}")
        return question

def query_rag(question: str, index_name: str = "default", k: int = 4) -> dict:
    """
    Queries the vector DB for context, loads past conversation history, and answers the question.
    Formats the response with source references and page numbers using local Ollama.
    """
    db = load_vector_store(index_name)
    if db is None:
        return {
            "answer": "No documents uploaded. Please upload a document to proceed.",
            "sources": []
        }
    
    # Get conversation history
    history = CHAT_HISTORY.get(index_name, [])
    
    # Condense question (Multi-turn memory)
    condensed_question = condense_question(question, history)
    
    # Retrieve top 6 chunks from FAISS (instead of 8) for performance
    docs = db.similarity_search(condensed_question, k=6)
    
    if not docs:
        return {
            "answer": "I couldn't find this information in the uploaded document.",
            "sources": []
        }
    
    # De-duplicate chunks and sort by document name and page number (Context ordering)
    seen_contents = set()
    filtered_docs = []
    
    for doc in docs:
        content_key = doc.page_content.strip().lower()
        if content_key not in seen_contents:
            seen_contents.add(content_key)
            filtered_docs.append(doc)
            
    # Sort docs by source filename and page number to maintain sequential context flow
    filtered_docs = sorted(filtered_docs, key=lambda x: (x.metadata.get("source", ""), x.metadata.get("page", 1)))
    
    # Restrict to Top 4 chunks (RAG optimization)
    filtered_docs = filtered_docs[:k]
    
    sources = []
    for doc in filtered_docs:
        sources.append({
            "source": doc.metadata.get("source", "Unknown"),
            "page": doc.metadata.get("page", 1),
            "content": doc.page_content
        })
        
    if not filtered_docs:
        return {
            "answer": "I couldn't find this information in the uploaded document.",
            "sources": []
        }
    
    # Format context with source metadata for Ollama
    formatted_context_parts = []
    for i, doc in enumerate(filtered_docs):
        src_name = doc.metadata.get("source", "Unknown")
        page_num = doc.metadata.get("page", 1)
        formatted_context_parts.append(
            f"Segment {i+1} (Source: {src_name}, Page: {page_num}):\n{doc.page_content}"
        )
    context = "\n\n".join(formatted_context_parts)
    
    system_prompt = f"""You are a strict educational assistant.
Answer the user's question based strictly and ONLY on the provided Context below.
Never use outside knowledge. Do not guess or hallucinate.

Context:
{context}

RULES:
1. Answer ONLY using facts directly in the Context. If not present, reply with exactly: "I couldn't find this information in the uploaded document." and nothing else.
2. Format response exactly as follows:

# Answer
[Concise direct answer based only on the context]

## Explanation
[Brief explanation, max 3 sentences based only on the context]

### Key Points
- [Key point 1]
- [Key point 2]

### Source
- [List the document names and page numbers used to answer, e.g. "lecture1.pdf (Page 5)"]

3. If the Context does not contain the answer, output no headings, just reply with exactly: "I couldn't find this information in the uploaded document." """

    messages = [{"role": "system", "content": system_prompt}]
    
    # Append conversation history (Multi-turn memory)
    for past_q, past_a in history[-2:]:  # Use last 2 turns to save context tokens
        clean_past_a = past_a.split("### Source")[0].split("\n\n---")[0].strip()
        messages.append({"role": "user", "content": past_q})
        messages.append({"role": "assistant", "content": clean_past_a})
        
    messages.append({"role": "user", "content": condensed_question})
    
    try:
        # Use low temperature (0.1) for factual accuracy and restrict max output tokens to 400
        answer = call_chat(messages, options={"temperature": 0.1, "num_predict": 400})
        
        # Post-processing verification
        lowered_answer = answer.lower().strip()
        unanswered_phrases = [
            "not mentioned", "not in the context", "couldn't find", "i do not know", 
            "no information", "not provided", "does not state", "unable to find",
            "not present", "not contain the answer", "insufficient information"
        ]
        
        if not answer.strip() or any(phrase in lowered_answer for phrase in unanswered_phrases):
            answer = "I couldn't find this information in the uploaded document."
        
        # Normalization verification
        if "# Answer" not in answer and answer != "I couldn't find this information in the uploaded document.":
            unique_sources = {}
            for src in sources:
                src_name = src["source"]
                page_num = src["page"]
                if src_name not in unique_sources:
                    unique_sources[src_name] = set()
                unique_sources[src_name].add(page_num)
            source_lines = []
            for src_name, pages in unique_sources.items():
                pages_sorted = sorted(list(pages))
                pages_str = ", ".join([str(p) for p in pages_sorted])
                source_lines.append(f"- {src_name} (Page {pages_str})")
            source_str = "\n".join(source_lines)
            
            answer = f"# Answer\nRefer to the detailed explanation below.\n\n## Explanation\n{answer}\n\n### Key Points\n- Information extracted from retrieved document segments.\n\n### Source\n{source_str}"
            
        if answer != "I couldn't find this information in the uploaded document.":
            if index_name not in CHAT_HISTORY:
                CHAT_HISTORY[index_name] = []
            CHAT_HISTORY[index_name].append((question, answer))
            
        return {
            "answer": answer,
            "sources": sources
        }
    except Exception as e:
        print(f"Chat generation failed: {e}")
        return {
            "answer": "I couldn't find this information in the uploaded document.",
            "sources": []
        }

def query_rag_stream(question: str, index_name: str = "default", k: int = 4):
    """
    Generator yielding RAG source metadata first as JSON, followed by Ollama response tokens.
    """
    db = load_vector_store(index_name)
    if db is None:
        yield json.dumps({"sources": []}) + "\n"
        yield "No documents uploaded. Please upload a document to proceed."
        return
        
    history = CHAT_HISTORY.get(index_name, [])
    condensed_question = condense_question(question, history)
    
    docs = db.similarity_search(condensed_question, k=6)
    if not docs:
        yield json.dumps({"sources": []}) + "\n"
        yield "I couldn't find this information in the uploaded document."
        return
        
    seen_contents = set()
    filtered_docs = []
    for doc in docs:
        content_key = doc.page_content.strip().lower()
        if content_key not in seen_contents:
            seen_contents.add(content_key)
            filtered_docs.append(doc)
            
    filtered_docs = sorted(filtered_docs, key=lambda x: (x.metadata.get("source", ""), x.metadata.get("page", 1)))
    filtered_docs = filtered_docs[:k]
    
    sources = []
    for doc in filtered_docs:
        sources.append({
            "source": doc.metadata.get("source", "Unknown"),
            "page": doc.metadata.get("page", 1),
            "content": doc.page_content
        })
        
    if not filtered_docs:
        yield json.dumps({"sources": []}) + "\n"
        yield "I couldn't find this information in the uploaded document."
        return
        
    # Yield sources first as JSON line
    yield json.dumps({"sources": sources}) + "\n"
    
    # Format Context
    formatted_context_parts = []
    for i, doc in enumerate(filtered_docs):
        src_name = doc.metadata.get("source", "Unknown")
        page_num = doc.metadata.get("page", 1)
        formatted_context_parts.append(
            f"Segment {i+1} (Source: {src_name}, Page: {page_num}):\n{doc.page_content}"
        )
    context = "\n\n".join(formatted_context_parts)
    
    system_prompt = f"""You are a strict educational assistant.
Answer the user's question based strictly and ONLY on the provided Context below.
Never use outside knowledge. Do not guess or hallucinate.

Context:
{context}

RULES:
1. Answer ONLY using facts directly in the Context. If not present, reply with exactly: "I couldn't find this information in the uploaded document." and nothing else.
2. Format response exactly as follows:

# Answer
[Concise direct answer based only on the context]

## Explanation
[Brief explanation, max 3 sentences based only on the context]

### Key Points
- [Key point 1]
- [Key point 2]

### Source
- [List the document names and page numbers used to answer, e.g. "lecture1.pdf (Page 5)"]

3. If the Context does not contain the answer, output no headings, just reply with exactly: "I couldn't find this information in the uploaded document." """

    messages = [{"role": "system", "content": system_prompt}]
    for past_q, past_a in history[-2:]:
        clean_past_a = past_a.split("### Source")[0].split("\n\n---")[0].strip()
        messages.append({"role": "user", "content": past_q})
        messages.append({"role": "assistant", "content": clean_past_a})
        
    messages.append({"role": "user", "content": condensed_question})
    
    try:
        full_response = ""
        # Stream the tokens from Ollama
        for token in call_chat_stream(messages, options={"temperature": 0.1, "num_predict": 400}):
            full_response += token
            yield token
            
        # Post-process history storage
        if full_response.strip():
            lowered_ans = full_response.lower().strip()
            unanswered_phrases = ["not mentioned", "not in the context", "couldn't find", "i do not know", "no information"]
            if not any(p in lowered_ans for p in unanswered_phrases):
                if index_name not in CHAT_HISTORY:
                    CHAT_HISTORY[index_name] = []
                CHAT_HISTORY[index_name].append((question, full_response))
    except Exception as e:
        print(f"Streaming failed: {e}")
        yield "An error occurred during response streaming."
