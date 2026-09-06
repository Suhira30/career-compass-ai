"""
Resume Upload REST API Route Controller (/api/v1/resume/upload)
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, status
from app.models.resume import ResumeUploadResponse
from app.services.extractors.file_parser import extract_text_from_bytes
from app.services.extractors.resume_extractor import extract_resume_info

router = APIRouter(prefix="/resume", tags=["Resume Management"])

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {"pdf", "docx"}


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload and parse resume file",
    description="Accepts .pdf or .docx files (max 10MB). Ephemerally extracts structured skills, work experience, education, and links.",
)
async def upload_resume(file: UploadFile = File(...)):
    """
    POST /api/v1/resume/upload
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename.",
        )

    filename_lower = file.filename.lower()
    ext = filename_lower.rsplit(".", 1)[-1] if "." in filename_lower else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '.{ext}'. Supported formats: .pdf, .docx",
        )

    # Read binary content into memory buffer
    contents = await file.read()

    # Validate file size
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size ({len(contents) / (1024*1024):.2f} MB) exceeds maximum allowed limit of 10 MB.",
        )

    # 1. Ephemeral Text Extraction (RAM only)
    raw_text = extract_text_from_bytes(contents, file.filename)

    # 2. LLM Structured Extraction
    extracted_data = extract_resume_info(raw_text)

    return ResumeUploadResponse(
        file_name=file.filename,
        extracted_data=extracted_data,
    )

