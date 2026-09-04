"""
User Profile REST API Route Controller (/api/v1/profile)
"""

from fastapi import APIRouter, HTTPException, status
from app.models.profile import UserProfileCreate, UserProfileResponse, UserProfileDetail
from datetime import datetime
import uuid

router = APIRouter(prefix="/profile", tags=["User Profile"])

# In-memory storage repository for profile data (ready for SQLAlchemy/Supabase migration in Task 1.3)
profiles_db = {}


@router.post(
    "",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or update user profile",
    description="Creates a new career profile or updates existing profile attributes. (Target Requirement: FR-01)",
)
async def create_or_update_profile(profile_in: UserProfileCreate):
    """
    POST /api/v1/profile
    """
    profile_id = f"usr_{uuid.uuid4().hex[:9]}"
    now_str = datetime.utcnow().isoformat() + "Z"

    full_profile = UserProfileDetail(
        profile_id=profile_id,
        created_at=now_str,
        status="active",
        **profile_in.model_dump()
    )

    # Persist in repository
    profiles_db[profile_id] = full_profile

    return UserProfileResponse(
        profile_id=profile_id,
        full_name=full_profile.full_name,
        target_role=full_profile.target_role,
        created_at=now_str,
        status="active",
    )


@router.get(
    "/{profile_id}",
    response_model=UserProfileDetail,
    status_code=status.HTTP_200_OK,
    summary="Fetch user profile by ID",
    description="Retrieves a user's full career profile details including skills, target role, and education.",
)
async def get_profile(profile_id: str):
    """
    GET /api/v1/profile/{profile_id}
    """
    if profile_id not in profiles_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User profile '{profile_id}' not found.",
        )
    
    return profiles_db[profile_id]

