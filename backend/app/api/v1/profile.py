"""
User Profile REST API Route Controller (/api/v1/profile)
Handles POST, GET, PUT, and DELETE endpoints for User Profiles (FR-01).
"""

from fastapi import APIRouter, HTTPException, status
from app.models.profile import (
    UserProfileCreate,
    UserProfileUpdate,
    UserProfileResponse,
    UserProfileDetail,
)
from app.services.profile_service import ProfileService, profiles_db

router = APIRouter(prefix="/profile", tags=["User Profile"])


@router.post(
    "",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user career profile",
    description="Creates a new career profile with technical skills, education, and target role. (FR-01)",
)
async def create_profile(profile_in: UserProfileCreate):
    """
    POST /api/v1/profile
    """
    full_profile = ProfileService.create_profile(profile_in)
    return UserProfileResponse(
        profile_id=full_profile.profile_id,
        full_name=full_profile.full_name,
        target_role=full_profile.target_role,
        created_at=full_profile.created_at,
        status=full_profile.status,
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
    profile = ProfileService.get_profile(profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User profile '{profile_id}' not found.",
        )
    return profile


@router.put(
    "/{profile_id}",
    response_model=UserProfileDetail,
    status_code=status.HTTP_200_OK,
    summary="Update user profile by ID",
    description="Updates existing profile attributes (partial update supported).",
)
async def update_profile(profile_id: str, profile_update: UserProfileUpdate):
    """
    PUT /api/v1/profile/{profile_id}
    """
    updated_profile = ProfileService.update_profile(profile_id, profile_update)
    if not updated_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User profile '{profile_id}' not found for update.",
        )
    return updated_profile


@router.delete(
    "/{profile_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete user profile by ID",
    description="Deletes a user profile from the system.",
)
async def delete_profile(profile_id: str):
    """
    DELETE /api/v1/profile/{profile_id}
    """
    success = ProfileService.delete_profile(profile_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User profile '{profile_id}' not found for deletion.",
        )
    return {"message": f"User profile '{profile_id}' successfully deleted."}
