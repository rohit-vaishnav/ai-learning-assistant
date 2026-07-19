import os
import re
import hashlib
from langchain_text_splitters import RecursiveCharacterTextSplitter
from backend.services.ollama_service import call_generate

_sum_tokenizer = None
_sum_model = None
_device = None

# Global in-memory cache for summaries mapping (cache_key) to (generated_summary_text)
SUMMARY_CACHE = {}

def get_summarizer_model():
    """
    Deprecated: Local summarizer model is no longer loaded.
    Returns dummy values to maintain backward compatibility.
    """
    return None, None, None

def clean_text(text: str) -> str:
    """
    Cleans raw document text by removing duplicate lines, extra whitespaces,
    and page header garbage.
    """
    lines = text.split("\n")
    seen = set()
    cleaned_lines = []
    
    for line in lines:
        line_strip = line.strip()
        if not line_strip:
            continue
            
        # Filter page numbers and short garbage lines
        if re.match(r'^\d+$', line_strip) or len(line_strip) <= 2:
            continue
            
        line_lower = line_strip.lower()
        if line_lower not in seen:
            seen.add(line_lower)
            cleaned_lines.append(line_strip)
            
    combined = " ".join(cleaned_lines)
    combined = re.sub(r'\s+', ' ', combined)
    return combined.strip()

def get_cache_key(filename: str, summary_type: str, text: str) -> str:
    """
    Generates a unique cache key based on filename and summary type.
    If filename is not available, uses a hash of the text content.
    """
    if not filename:
        h = hashlib.sha256(text.encode('utf-8')).hexdigest()
        return f"hash_{h}_{summary_type}"
    return f"file_{filename}_{summary_type}"

def summarize_text(text: str, summary_type: str = "short", filename: str = "") -> str:
    """
    Hierarchical summarization pipeline using local Ollama.
    Optimized for CPU inference speeds and token lengths.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return "No text content available to summarize."
        
    cache_key = get_cache_key(filename, summary_type, cleaned)
    if cache_key in SUMMARY_CACHE:
        print(f"Summarizer: Returning cached summary for key '{cache_key}'")
        return SUMMARY_CACHE[cache_key]

    # Split document into chunks of 4000 characters
    splitter = RecursiveCharacterTextSplitter(chunk_size=4000, chunk_overlap=400)
    chunks = splitter.split_text(cleaned)
    
    # If the document is small, we summarize it directly
    if len(chunks) == 1:
        merged_summaries_text = chunks[0]
    else:
        # Hierarchically generate bullet summaries for each segment
        individual_summaries = []
        for i, chunk in enumerate(chunks):
            chunk_prompt = f"""Read the segment and extract the core concepts in 2-3 brief bullet points. Do not hallucinate.

Segment {i+1}:
{chunk}

takeaways:"""
            try:
                # Use low token limit for fast execution
                summary_part = call_generate(chunk_prompt, options={"temperature": 0.1, "num_predict": 120})
                individual_summaries.append(summary_part.strip())
            except Exception as e:
                print(f"Error summarizing chunk {i+1}: {e}")
                individual_summaries.append(chunk[:300])
                
        merged_summaries_text = "\n\n".join(individual_summaries)

    # Synthesize the final summary based on requested type
    if summary_type == "short":
        prompt = f"""Write a cohesive summary of 300-500 words in 5 short paragraphs based ONLY on the context. Do not use bullets or lists. Write in your own words.

Context:
{merged_summaries_text}

Short Summary:"""
        num_predict = 400
        
    elif summary_type == "detailed":
        prompt = f"""Write a detailed educational overview of 1000-1500 words explaining the document based ONLY on the context. Use clear markdown headings (##) and subheadings (###). Define terms and include examples.

Context:
{merged_summaries_text}

Detailed Summary:"""
        num_predict = 1000
        
    else:  # bullets / study notes
        prompt = f"""Format the document into detailed academic study notes based ONLY on the context. Use these exact headers:

# Study Notes
[brief introduction]

# Main Topics & Concepts
- [bullet points]

# Key Definitions & Formulas
- [list definitions]

# Examples
- [practical study examples]

# Important Notes
- [things to remember]

# Common Interview Questions
- [3 interview questions with answers]

# Revision Notes
- [quick review points]

Context:
{merged_summaries_text}

Study Notes:"""
        num_predict = 800

    try:
        final_summary = call_generate(prompt, options={"temperature": 0.1, "num_predict": num_predict})
        
        if filename:
            final_summary += f"\n\n---\n### 📚 Source References\n* **Document**: {filename}\n* **Summary Coverage**: Optimized hierarchical summary generated via Ollama."
            
        # Cache the result
        SUMMARY_CACHE[cache_key] = final_summary
        return final_summary
    except Exception as e:
        print(f"Summary formatting failed: {e}")
        return merged_summaries_text
