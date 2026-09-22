"""
Job Description Ingestion & Parsing REST API Controller (/api/v1/jobs/extract)
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.orm_models import JobDescriptionDB
from app.models.job import JobExtractRequest, JobExtractResponse
from app.services.extractors.jd_extractor import extract_job_info
import uuid
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

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
async def extract_job_description(request: JobExtractRequest, db: Session = Depends(get_db)):
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

    # 4. Persist to Supabase PostgreSQL database only if user is logged in
    user_id = getattr(request, "user_id", None)
    if user_id:
        try:
            db_job = JobDescriptionDB(
                id=job_id,
                user_id=user_id,
                company_name=getattr(extracted_job, "company_name", None) or "Target Company",
                job_title=extracted_job.job_title or "Software Engineer",
                raw_job_description=clean_text,
                required_skills=extracted_job.required_skills or [],
                preferred_skills=extracted_job.preferred_skills or [],
                responsibilities=extracted_job.responsibilities or [],
                required_experience=extracted_job.required_experience or "Not Specified",
                education_requirements=extracted_job.education_requirements or "Not Specified",
                work_mode=extracted_job.work_mode or "Not Specified",
                location=extracted_job.location or "Not Specified",
                salary_range=extracted_job.salary_range or "Not Specified",
                created_at=datetime.utcnow().isoformat() + "Z",
            )
            db.add(db_job)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning(f"Could not persist job description to Supabase (using in-memory fallback): {e}")

    return response

