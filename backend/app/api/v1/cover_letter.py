"""
Cover Letter & Outreach Generation REST API Controller (/api/v1/cover-letter)
"""

from fastapi import APIRouter, HTTPException, status
from app.models.cover_letter import CoverLetterRequest, CoverLetterResponse
from app.services.cover_letter_service import generate_cover_letter
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cover-letter", tags=["Cover Letter & Outreach Generation"])


@router.post(
    "/generate",
    response_model=CoverLetterResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Tailored Cover Letter or Outreach Email",
    description=(
        "Synthesizes candidate background, matched skills, and matching project details into a "
        "compelling cover letter, job application email, or cold recruiter outreach message."
    ),
)
async def create_cover_letter(request: CoverLetterRequest):
    """
    POST /api/v1/cover-letter/generate
    """
    try:
        if not request.target_role or not request.target_role.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="target_role is required to generate tailored application documents."
            )
        
        response = generate_cover_letter(request)
        return response
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error generating cover letter: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate application materials: {str(exc)}"
        )
