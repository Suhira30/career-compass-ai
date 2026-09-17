"""
Document Ingestion Script — Career Compass AI Knowledge Base

Reads starter markdown files from 'backend/data/raw/', splits them into semantic chunks using the
adopted Parent-Child strategy (3A-K5: Child 250 chars -> Parent 1500 chars), embeds them, and populates the Vector Store.
"""

import os
import uuid
import logging
from pathlib import Path
from typing import List, Tuple, Dict

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


def chunk_documents_parent_child(
    documents: List[Document],
    child_chunk_size: int = 250,
    child_chunk_overlap: int = 35,
    parent_chunk_size: int = 1500,
    parent_chunk_overlap: int = 150,
) -> Tuple[List[Document], Dict[str, Document]]:
    """
    Splits raw documents using the adopted Parent-Child (Hierarchical) Strategy (3A-K5):
    - Parent Chunks (1500 chars): Provides full context window to LLM without fragmentation.
    - Child Chunks (250 chars): Indexed in vector store for sharp semantic vector matching.
    """
    parent_splitter = RecursiveCharacterTextSplitter(
        chunk_size=parent_chunk_size,
        chunk_overlap=parent_chunk_overlap,
        separators=["\n## ", "\n### ", "\n- ", "\n\n", "\n", " ", ""],
    )
    child_splitter = RecursiveCharacterTextSplitter(
        chunk_size=child_chunk_size,
        chunk_overlap=child_chunk_overlap,
        separators=["\n## ", "\n### ", "\n- ", "\n\n", "\n", " ", ""],
    )

    child_docs: List[Document] = []
    parent_map: Dict[str, Document] = {}

    parents = parent_splitter.split_documents(documents)
    for p in parents:
        p_id = str(uuid.uuid4())
        p.metadata["parent_id"] = p_id
        parent_map[p_id] = p

        children = child_splitter.split_documents([p])
        for c in children:
            c.metadata["parent_id"] = p_id
            c.metadata["parent_content"] = p.page_content
            c.metadata["source"] = p.metadata.get("source", "unknown")
            child_docs.append(c)

    logger.info(
        f"Split {len(documents)} document(s) into {len(parents)} parent chunk(s) "
        f"and {len(child_docs)} child text chunk(s) using Parent-Child strategy (3A-K5)."
    )
    return child_docs, parent_map


def chunk_documents(documents: List[Document], chunk_size: int = 250, chunk_overlap: int = 35) -> List[Document]:
    """
    Legacy / simplified wrapper splitting raw documents into text chunks.
    Now defaults to child chunk parameters aligned with 3A-K5.
    """
    child_chunks, _ = chunk_documents_parent_child(
        documents,
        child_chunk_size=chunk_size,
        child_chunk_overlap=chunk_overlap,
    )
    return child_chunks


def ingest_career_documents() -> int:
    """
    Main ingestion pipeline workflow:
    1. Loads raw markdown files from backend/data/raw/
    2. Chunks documents using Parent-Child Strategy (3A-K5)
    3. Adds child documents (with parent context metadata) to Vector Store (Pinecone / ChromaDB)
    """
    logger.info("--- Starting Career Compass AI Knowledge Base Ingestion ---")
    
    raw_docs = load_raw_markdown_documents()
    if not raw_docs:
        logger.warning("No raw documents found to ingest.")
        return 0

    child_chunks, _ = chunk_documents_parent_child(raw_docs)
    if not child_chunks:
        logger.warning("No text chunks generated.")
        return 0

    try:
        vs = get_vector_store()
        logger.info(f"Adding {len(child_chunks)} child chunks to vector store...")
        vs.add_documents(child_chunks)
        logger.info("Successfully ingested knowledge base chunks into vector store using 3A-K5 strategy!")
        return len(child_chunks)
    except Exception as exc:
        logger.error(f"Failed to populate vector store: {exc}")
        raise RuntimeError(f"Document ingestion failed: {exc}") from exc


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    num_chunks = ingest_career_documents()
    print(f"Ingestion Complete. Total chunks processed: {num_chunks}")


