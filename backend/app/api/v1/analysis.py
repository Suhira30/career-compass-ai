"""
Skill Gap Analysis REST API Controller (/api/v1/analysis/gap)
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.orm_models import AnalysisResultDB
from app.models.analysis import GapAnalysisRequest, GapAnalysisResponse
from app.services.gap_analysis.skill_matcher import (
    compute_skill_matrix_and_score,
    generate_qualitative_assessment,
)
from app.api.v1.profile import profiles_db
from app.api.v1.jobs import jobs_db
import uuid
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analysis", tags=["Skill Gap Analysis"])

# In-memory storage repository for analysis results (ready for Supabase migration in Task 1.3)
analysis_db = {}


@router.post(
    "/gap",
    response_model=GapAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Perform Skill Gap Analysis & Match Scoring",
    description="Compares User Profile against target Job Description requirements. Generates a 3-way skill matrix, match percentage, readiness tier, and LLM qualitative assessment.",
)
async def perform_skill_gap_analysis(request: GapAnalysisRequest, db: Session = Depends(get_db)):
    """
    POST /api/v1/analysis/gap
    """
    # 1. Fetch User Profile (in-memory or Supabase)
    profile = None
    if request.profile_id in profiles_db:
        profile = profiles_db[request.profile_id]
    else:
        try:
            from app.db.orm_models import UserProfileDB
            from app.models.profile import UserProfileDetail
            db_p = db.get(UserProfileDB, request.profile_id)
            if db_p:
                profile = UserProfileDetail(
                    profile_id=db_p.id,
                    full_name=db_p.full_name,
                    target_role=db_p.target_role,
                    education_degree=db_p.education_degree,
                    institution=db_p.institution,
                    graduation_year=db_p.graduation_year,
                    current_role=db_p.current_role,
                    skills=db_p.skills or [],
                    soft_skills=db_p.soft_skills or [],
                    career_interests=db_p.career_interests or [],
                    status=db_p.status or "active",
                    created_at=db_p.created_at,
                )
        except Exception:
            profile = None

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User Profile '{request.profile_id}' not found. Please create a profile first via POST /api/v1/profile.",
        )

    # 2. Fetch Job Description (in-memory or Supabase)
    job_data = None
    if request.job_id in jobs_db:
        job_data = jobs_db[request.job_id].extracted_job
    else:
        try:
            from app.db.orm_models import JobDescriptionDB
            from app.models.job import ExtractedJobData
            db_j = db.get(JobDescriptionDB, request.job_id)
            if db_j:
                job_data = ExtractedJobData(
                    company_name=db_j.company_name,
                    job_title=db_j.job_title,
                    required_skills=db_j.required_skills or [],
                    preferred_skills=db_j.preferred_skills or [],
                    responsibilities=db_j.responsibilities or [],
                    required_experience=db_j.required_experience or "Not Specified",
                    education_requirements=db_j.education_requirements or "Not Specified",
                    work_mode=db_j.work_mode or "Not Specified",
                    location=db_j.location or "Not Specified",
                    salary_range=db_j.salary_range or "Not Specified",
                )
        except Exception:
            job_data = None

    if not job_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job Description '{request.job_id}' not found. Please submit job description first via POST /api/v1/jobs/extract.",
        )

    # 3. Compute Deterministic Skill Overlap & Score
    matrix, score_pct, readiness_category = compute_skill_matrix_and_score(
        user_skills=profile.skills,
        job_required=job_data.required_skills,
        job_preferred=job_data.preferred_skills,
    )

    # 4. Generate Qualitative LLM Assessment (Multi-Provider Fallback)
    assessment = generate_qualitative_assessment(
        profile=profile,
        job=job_data,
        matrix=matrix,
        score=score_pct,
        category=readiness_category,
    )

    # 5. Generate Analysis ID and store response
    analysis_id = f"anl_{uuid.uuid4().hex[:9]}"
    response = GapAnalysisResponse(
        analysis_id=analysis_id,
        readiness_category=readiness_category,
        match_score_percentage=score_pct,
        skill_matrix=matrix,
        assessment=assessment,
    )

    analysis_db[analysis_id] = response

    # 6. Persist to Supabase PostgreSQL database only for authenticated users
    user_id = getattr(request, "user_id", None)
    if user_id:
        try:
            db_res = AnalysisResultDB(
                id=analysis_id,
                profile_id=request.profile_id,
                job_id=request.job_id,
                readiness_category=readiness_category,
                match_score_percentage=float(score_pct),
                matched_skills=matrix.matched_skills or [],
                missing_skills=matrix.missing_skills or [],
                partially_available_skills=matrix.partially_available_skills or [],
                assessment=assessment.model_dump(),
                created_at=datetime.utcnow().isoformat() + "Z",
            )
            db.add(db_res)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning(f"Could not persist analysis result to Supabase (using in-memory fallback): {e}")

    return response

