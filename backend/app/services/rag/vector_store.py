"""
Vector Store Engine Service — Career Compass AI

Supports Pinecone Cloud Serverless with automatic local ChromaDB fallback.
Uses HuggingFace 'sentence-transformers/all-MiniLM-L6-v2' (384-dimensional dense embeddings).
"""

import os
import logging
from typing import List, Optional, Any
from pathlib import Path

from app.core import settings
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

# Lazy singleton vector store and embeddings variables
_embeddings = None
_vector_store = None


def get_embedding_model():
    """
    Returns or lazily initializes the HuggingFace embeddings model.
    Model: sentence-transformers/all-MiniLM-L6-v2 (384 dims, fast & lightweight)
    """
    global _embeddings
    if _embeddings is None:
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
            logger.info("Initializing HuggingFaceEmbeddings ('sentence-transformers/all-MiniLM-L6-v2')...")
            _embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True},
            )
        except Exception as exc:
            logger.error(f"Failed to load HuggingFaceEmbeddings: {exc}")
            raise RuntimeError(f"Embedding model initialization failed: {exc}") from exc
    return _embeddings


def get_vector_store():
    """
    Returns initialized Vector Store client instance.
    Checks for Pinecone Cloud API Key first; falls back to local ChromaDB directory.
    """
    global _vector_store
    if _vector_store is not None:
        return _vector_store

    embeddings_model = get_embedding_model()

    # 1. Primary: Pinecone Cloud Serverless
    if settings.PINECONE_API_KEY and settings.PINECONE_INDEX_NAME:
        try:
            from langchain_pinecone import PineconeVectorStore
            logger.info(f"Connecting to Pinecone Cloud Serverless (Index: '{settings.PINECONE_INDEX_NAME}')...")
            os.environ["PINECONE_API_KEY"] = settings.PINECONE_API_KEY
            _vector_store = PineconeVectorStore(
                index_name=settings.PINECONE_INDEX_NAME,
                embedding=embeddings_model,
            )
            return _vector_store
        except Exception as exc:
            logger.warning(f"Pinecone Cloud connection failed ({exc}). Falling back to local ChromaDB.")

    # 2. Fallback / Local: ChromaDB
    try:
        from langchain_community.vectorstores import Chroma
        persist_dir = settings.VECTOR_DB_DIR
        Path(persist_dir).mkdir(parents=True, exist_ok=True)
        logger.info(f"Initializing local ChromaDB vector store at '{persist_dir}'...")
        _vector_store = Chroma(
            collection_name="career_compass_knowledge",
            embedding_function=embeddings_model,
            persist_directory=persist_dir,
        )
        return _vector_store
    except Exception as exc:
        logger.error(f"Local ChromaDB initialization failed: {exc}")
        raise RuntimeError(f"Vector store initialization error: {exc}") from exc


def similarity_search_with_score(query: str, k: int = 4) -> List[tuple[Document, float]]:
    """
    Performs similarity search against the vector store returning top-k matching documents with scores.
    """
    try:
        vs = get_vector_store()
        return vs.similarity_search_with_score(query, k=k)
    except Exception as exc:
        logger.error(f"Vector search failed for query '{query}': {exc}")
        return []


def search_relevant_context(query: str, k: int = 3) -> str:
    """
    Convenience method returning joined text context string from top-k retrieved documents.
    """
    results = similarity_search_with_score(query, k=k)
    if not results:
        return ""
    
    docs_text = []
    for idx, (doc, score) in enumerate(results, 1):
        source = doc.metadata.get("source", "Knowledge Base")
        docs_text.append(f"[Snippet {idx} | Source: {source}]\n{doc.page_content}")
    
    return "\n\n".join(docs_text)

