"""
Personalized Learning Roadmap REST API Controller (/api/v1/roadmap/generate)
"""

from fastapi import APIRouter, HTTPException, status
from app.models.roadmap import RoadmapGenerateRequest, RoadmapGenerateResponse
from app.services.gap_analysis.prioritizer import generate_learning_roadmap
from app.api.v1.analysis import analysis_db
import uuid

router = APIRouter(prefix="/roadmap", tags=["Learning Roadmap Generator"])

# In-memory storage repository for roadmaps (ready for Supabase migration in Task 1.3)
roadmap_db = {}


@router.post(
    "/generate",
    response_model=RoadmapGenerateResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Personalized Learning Roadmap",
    description="Ranks missing skills into priority badges (Priority 1, Priority 2, Priority 3) and creates a week-by-week upskilling roadmap matching candidate available weekly hours.",
)
async def generate_roadmap(request: RoadmapGenerateRequest):
    """
    POST /api/v1/roadmap/generate
    """
    # 1. Fetch Gap Analysis Result
    if request.analysis_id not in analysis_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Gap Analysis '{request.analysis_id}' not found. Please run gap analysis first via POST /api/v1/analysis/gap.",
        )
    analysis = analysis_db[request.analysis_id]

    # 2. Generate Personalized Roadmap using explicit LCEL Runnable Chain
    roadmap_response = generate_learning_roadmap(
        analysis=analysis,
        weekly_hours=request.available_hours_per_week,
        duration_weeks=request.preferred_duration_weeks,
    )

    # 3. Generate unique roadmap_id if not present
    if not roadmap_response.roadmap_id or roadmap_response.roadmap_id == "rdm_temp":
        roadmap_response.roadmap_id = f"rdm_{uuid.uuid4().hex[:9]}"

    # 4. Store in memory repository
    roadmap_db[roadmap_response.roadmap_id] = roadmap_response
    return roadmap_response

