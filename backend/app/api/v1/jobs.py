"""
Job Description Ingestion & Parsing REST API Controller (/api/v1/jobs/extract)
"""

from fastapi import APIRouter, HTTPException, status
from app.models.job import JobExtractRequest, JobExtractResponse
from app.services.extractors.jd_extractor import extract_job_info
import uuid

router = APIRouter(prefix="/jobs", tags=["Job Description Parsing"])

# In-memory storage repository for extracted jobs (ready for Supabase migration in Task 1.3)
jobs_db = {}


@router.post(
    "/extract",
    response_model=JobExtractResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract structured criteria from Job Description text",
    description="Parses pasted job description text into required skills, preferred skills, experience, education, work mode, location, and salary.",
)
async def extract_job_description(request: JobExtractRequest):
    """
    POST /api/v1/jobs/extract
    """
    clean_text = request.raw_job_description.strip()
    if len(clean_text) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text is too short. Please provide a full job post.",
        )

    # 1. LLM Structured Extraction with Multi-Provider Fallback
    extracted_job = extract_job_info(clean_text)

    # 2. Generate unique job identifier
    job_id = f"job_{uuid.uuid4().hex[:9]}"

    response = JobExtractResponse(
        job_id=job_id,
        extracted_job=extracted_job,
    )

    # 3. Persist in memory repository
    jobs_db[job_id] = response

    return response

