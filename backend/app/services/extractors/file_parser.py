"""
Ephemeral Resume File Parser Utility (In-Memory Stream Processing)
"""

import io
from fastapi import HTTPException, status
from pypdf import PdfReader
from docx import Document


def extract_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    """
    Extracts raw text content from PDF or DOCX file bytes in RAM.
    Guarantees zero disk persistence to meet PII security requirements (NFR-03).
    """
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    text_chunks = []

    if ext == "pdf":
        try:
            pdf_stream = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_stream)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_chunks.append(extracted)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not read PDF document: {str(exc)}",
            )
    elif ext == "docx":
        try:
            docx_stream = io.BytesIO(file_bytes)
            doc = Document(docx_stream)
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_chunks.append(paragraph.text.strip())
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not read Word document: {str(exc)}",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a .pdf or .docx file.",
        )

    full_text = "\n".join(text_chunks).strip()
    if not full_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text content found in the uploaded document.",
        )

    return full_text

