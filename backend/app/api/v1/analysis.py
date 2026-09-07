"""
Skill Gap Analysis REST API Controller (/api/v1/analysis/gap)
"""

from fastapi import APIRouter, HTTPException, status
from app.models.analysis import GapAnalysisRequest, GapAnalysisResponse
from app.services.gap_analysis.skill_matcher import (
    compute_skill_matrix_and_score,
    generate_qualitative_assessment,
)
from app.api.v1.profile import profiles_db
from app.api.v1.jobs import jobs_db
import uuid

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
async def perform_skill_gap_analysis(request: GapAnalysisRequest):
    """
    POST /api/v1/analysis/gap
    """
    # 1. Fetch User Profile
    if request.profile_id not in profiles_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User Profile '{request.profile_id}' not found. Please create a profile first via POST /api/v1/profile.",
        )
    profile = profiles_db[request.profile_id]

    # 2. Fetch Job Description
    if request.job_id not in jobs_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job Description '{request.job_id}' not found. Please submit job description first via POST /api/v1/jobs/extract.",
        )
    job_data = jobs_db[request.job_id].extracted_job

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
    return response

