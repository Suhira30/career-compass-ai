"""
Document Ingestion Script — Career Compass AI Knowledge Base

Reads starter markdown files from 'backend/data/raw/', splits them into semantic chunks,
embeds them using HuggingFace 'all-MiniLM-L6-v2', and populates the Vector Store (Pinecone / ChromaDB).
"""

import os
import logging
from pathlib import Path
from typing import List

from app.core import settings
from app.services.rag.vector_store import get_vector_store
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

RAW_DATA_DIR = Path(settings.BASE_DIR) / "data" / "raw"


def load_raw_markdown_documents() -> List[Document]:
    """
    Reads all markdown files (.md) from the raw data directory and wraps them into LangChain Document objects.
    """
    if not RAW_DATA_DIR.exists():
        logger.warning(f"Raw data directory '{RAW_DATA_DIR}' does not exist. Creating directory...")
        RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
        return []

    documents = []
    md_files = list(RAW_DATA_DIR.glob("*.md"))
    
    if not md_files:
        logger.warning(f"No .md files found in '{RAW_DATA_DIR}'.")
        return []

    for file_path in md_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    doc = Document(
                        page_content=content,
                        metadata={
                            "source": file_path.name,
                            "path": str(file_path),
                        },
                    )
                    documents.append(doc)
                    logger.info(f"Loaded raw document: {file_path.name} ({len(content)} characters)")
        except Exception as exc:
            logger.error(f"Failed to read file '{file_path}': {exc}")

    return documents


def chunk_documents(documents: List[Document], chunk_size: int = 500, chunk_overlap: int = 50) -> List[Document]:
    """
    Splits raw documents into smaller overlapping text chunks for optimal vector retrieval.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n## ", "\n### ", "\n- ", "\n\n", "\n", " ", ""],
    )
    chunks = text_splitter.split_documents(documents)
    logger.info(f"Split {len(documents)} document(s) into {len(chunks)} text chunks.")
    return chunks


def ingest_career_documents() -> int:
    """
    Main ingestion pipeline workflow:
    1. Loads raw markdown files from backend/data/raw/
    2. Chunks documents using RecursiveCharacterTextSplitter
    3. Adds documents to Vector Store (Pinecone / ChromaDB)
    """
    logger.info("--- Starting Career Compass AI Knowledge Base Ingestion ---")
    
    raw_docs = load_raw_markdown_documents()
    if not raw_docs:
        logger.warning("No raw documents found to ingest.")
        return 0

    chunks = chunk_documents(raw_docs)
    if not chunks:
        logger.warning("No text chunks generated.")
        return 0

    try:
        vs = get_vector_store()
        logger.info(f"Adding {len(chunks)} chunks to vector store...")
        vs.add_documents(chunks)
        logger.info("Successfully ingested knowledge base chunks into vector store!")
        return len(chunks)
    except Exception as exc:
        logger.error(f"Failed to populate vector store: {exc}")
        raise RuntimeError(f"Document ingestion failed: {exc}") from exc


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    num_chunks = ingest_career_documents()
    print(f"Ingestion Complete. Total chunks processed: {num_chunks}")

