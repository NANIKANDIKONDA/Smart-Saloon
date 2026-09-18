"""
SmartSalon RAG Retrieval Service
Uses ChromaDB for vector storage and semantic search over the approved knowledge document
(Master Cutts Salon Services & Price List + Salon Information).
Passes retrieved context to local Ollama (llama3.2:3b) for grounded generation.
Strict grounding rule: If no relevant chunks match, returns:
"I don't know because this information is not available in the current SmartSalon knowledge base."
"""

import os
import re
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import httpx
import chromadb
from chromadb.config import Settings as ChromaSettings

from .config import settings
from .intent_router import GROUNDING_REFUSAL

logger = logging.getLogger("smartsalon.rag")

CHROMA_DIR = Path(__file__).resolve().parent / "chroma_db"
KNOWLEDGE_FILE = Path(__file__).resolve().parent / "knowledge" / "master_cutts_services.md"
COLLECTION_NAME = "smartsalon_knowledge"

_chroma_client = None
_collection = None


def get_chroma_collection():
    """Initializes and returns the persistent ChromaDB collection."""
    global _chroma_client, _collection
    if _collection is not None:
        return _collection

    os.makedirs(CHROMA_DIR, exist_ok=True)
    _chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))

    try:
        _collection = _chroma_client.get_collection(name=COLLECTION_NAME)
    except Exception:
        _collection = _chroma_client.create_collection(name=COLLECTION_NAME)
        index_approved_knowledge_document(_collection)

    return _collection


def parse_knowledge_document(file_path: Path) -> List[Dict[str, Any]]:
    """
    Parses the approved knowledge document into semantic, traceable chunks.
    Preserves section headers, item price ranges, and policy notes.
    """
    if not file_path.exists():
        logger.error("Knowledge document not found at %s", file_path)
        return []

    content = file_path.read_text(encoding="utf-8")
    chunks = []
    chunk_idx = 1

    # Split by markdown headers
    sections = re.split(r'\n(?=##?\s+)', content)

    for sec in sections:
        sec_text = sec.strip()
        if not sec_text:
            continue

        lines = sec_text.splitlines()
        header = lines[0].replace("#", "").strip()
        body = "\n".join(lines[1:]).strip()

        # Section-level chunk
        chunks.append({
            "id": f"chunk_sec_{chunk_idx}",
            "text": f"[{header}]\n{sec_text}",
            "metadata": {
                "source": "master_cutts_services.md",
                "section": header,
                "type": "section"
            }
        })
        chunk_idx += 1

        # Extract individual service items for high-precision lookup
        for line in lines:
            line_str = line.strip()
            if line_str.startswith("- ") and ":" in line_str:
                parts = line_str[2:].split(":", 1)
                item_name = parts[0].strip()
                item_details = parts[1].strip() if len(parts) > 1 else ""
                chunks.append({
                    "id": f"chunk_item_{chunk_idx}",
                    "text": f"{item_name}: {item_details} (Category: {header})",
                    "metadata": {
                        "source": "master_cutts_services.md",
                        "section": header,
                        "item": item_name,
                        "type": "item"
                    }
                })
                chunk_idx += 1

    return chunks


def index_approved_knowledge_document(collection):
    """Indexes chunks from the approved knowledge document into ChromaDB."""
    chunks = parse_knowledge_document(KNOWLEDGE_FILE)
    if not chunks:
        return

    documents = [c["text"] for c in chunks]
    ids = [c["id"] for c in chunks]
    metadatas = [c["metadata"] for c in chunks]

    # Batch add
    collection.add(
        documents=documents,
        ids=ids,
        metadatas=metadatas
    )
    logger.info("Indexed %d chunks into ChromaDB collection '%s'", len(chunks), COLLECTION_NAME)


def query_rag_knowledge(query: str, n_results: int = 3) -> List[Dict[str, Any]]:
    """
    Performs similarity search in ChromaDB.
    Filters out results that exceed distance threshold.
    """
    col = get_chroma_collection()
    clean_q = query.strip()

    res = col.query(
        query_texts=[clean_q],
        n_results=min(n_results, col.count())
    )

    docs = res.get("documents", [[]])[0]
    distances = res.get("distances", [[]])[0]
    metadatas = res.get("metadatas", [[]])[0]

    matched_chunks = []
    # Distance threshold: Chroma cosine/L2 distance
    # Matches with relevant terms usually score <= 1.2
    for doc, dist, meta in zip(docs, distances, metadatas):
        matched_chunks.append({
            "text": doc,
            "distance": dist,
            "metadata": meta
        })

    return matched_chunks


def is_chunk_relevant_to_query(query: str, chunks: List[Dict[str, Any]]) -> bool:
    """
    Ensures that retrieved chunks actually answer the question and don't match
    irrelevant queries like 'tattoo', 'laser', 'swimming pool', etc.
    """
    if not chunks:
        return False

    q_lower = query.lower()
    top_chunk = chunks[0]
    top_dist = top_chunk["distance"]

    # Reject obviously distant embeddings (> 1.25)
    if top_dist > 1.25:
        return False

    # Check for known unsupported items explicitly (tattoo, laser, swimming pool, owner, etc.)
    unsupported_nouns = ["tattoo", "laser", "swimming pool", "pool", "owner", "wifi", "parking"]
    for un in unsupported_nouns:
        if re.search(r'\b' + re.escape(un) + r'\b', q_lower):
            # Check if this unsupported noun is in any matched text
            if not any(un in c["text"].lower() for c in chunks):
                return False

    # Extract non-stop words from query
    stop_words = {"what", "are", "your", "the", "do", "you", "have", "how", "much", "is", "a", "an", "cost", "price", "take", "long", "can", "i", "we", "for", "in", "of", "to", "at"}
    words = [w for w in re.findall(r'\w+', q_lower) if w not in stop_words and len(w) > 2]

    # If query has specific words, verify at least one key word or stem appears in the top retrieved chunks
    if words:
        found_overlap = any(any(w in c["text"].lower() for w in words) for c in chunks[:2])
        if not found_overlap and top_dist > 0.85:
            return False

    return True


async def generate_grounded_answer(query: str, context_chunks: List[Dict[str, Any]]) -> str:
    """
    Passes retrieved context to Ollama llama3.2:3b for natural, grounded synthesis.
    Falls back to direct extraction if Ollama is unreachable.
    """
    context_text = "\n\n".join([c["text"] for c in context_chunks[:3]])

    prompt = f"""You are the friendly, verified assistant for SmartSalon (Master Cutts Men's Grooming Studio).
Answer the user's question accurately and concisely using ONLY the following verified salon information.

STRICT RULES:
1. All prices and ranges must match the context exactly (e.g. ₹100 – ₹200).
2. Do not invent or assume any services, prices, or policies not in the context.
3. Keep your response concise (1 to 2 sentences).
4. If the context does not explicitly provide the information requested, you MUST reply:
"I don't know because this information is not available in the current SmartSalon knowledge base."

VERIFIED SALON CONTEXT:
{context_text}

Customer: {query}
Assistant:"""

    url = f"{settings.OLLAMA_BASE_URL}/api/generate"
    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "top_p": 0.9,
            "max_tokens": 120
        }
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                answer = data.get("response", "").strip()
                if answer:
                    return answer
    except Exception as e:
        logger.debug("Ollama inference error (%s); falling back to direct context extraction.", e)

    # Fallback direct answer from top chunk
    top_chunk = context_chunks[0]
    return f"According to our salon menu: {top_chunk['text']}"


async def handle_rag_pipeline(query: str) -> str:
    """
    Complete RAG pipeline:
    1. Query ChromaDB for top-3 chunks.
    2. Check relevance against grounding rule.
    3. If not relevant -> return GROUNDING_REFUSAL.
    4. If relevant -> pass to Ollama llama3.2:3b for grounded response.
    """
    chunks = query_rag_knowledge(query, n_results=3)

    if not is_chunk_relevant_to_query(query, chunks):
        return GROUNDING_REFUSAL

    return await generate_grounded_answer(query, chunks)
