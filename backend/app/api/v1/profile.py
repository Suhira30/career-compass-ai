"""
User Profile REST API Route Controller (/api/v1/profile)
Handles POST, GET, PUT, and DELETE endpoints for User Profiles (FR-01).
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.orm_models import UserProfileDB
from app.models.profile import (
    UserProfileCreate,
    UserProfileUpdate,
    UserProfileResponse,
    UserProfileDetail,
)
from app.services.profile_service import ProfileService, profiles_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["User Profile"])


@router.post(
    "",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user career profile",
    description="Creates a new career profile with technical skills, education, and target role. (FR-01)",
)
async def create_profile(profile_in: UserProfileCreate, db: Session = Depends(get_db)):
    """
    POST /api/v1/profile
    """
    full_profile = ProfileService.create_profile(profile_in)
    user_id = getattr(profile_in, "user_id", None)
    if user_id:
        try:
            db_profile = UserProfileDB(
                id=full_profile.profile_id,
                user_id=user_id,
                full_name=full_profile.full_name,
                education_degree=full_profile.education_degree,
                institution=full_profile.institution,
                current_role=full_profile.current_role,
                target_role=full_profile.target_role,
                skills=full_profile.skills,
                soft_skills=full_profile.soft_skills,
                career_interests=full_profile.career_interests,
                status=full_profile.status,
                created_at=full_profile.created_at,
            )
            db.add(db_profile)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning(f"Could not persist profile to Supabase (using in-memory fallback): {e}")

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
async def get_profile(profile_id: str, db: Session = Depends(get_db)):
    """
    GET /api/v1/profile/{profile_id}
    """
    profile = ProfileService.get_profile(profile_id)
    if not profile:
        # Check Supabase database by profile ID or user_id UUID
        try:
            from sqlalchemy import select
            stmt = select(UserProfileDB).where(
                (UserProfileDB.id == profile_id) | (UserProfileDB.user_id == profile_id)
            ).order_by(UserProfileDB.created_at.desc())
            db_res = db.scalars(stmt).first()
            if db_res:
                profile = UserProfileDetail(
                    profile_id=db_res.id,
                    user_id=db_res.user_id,
                    full_name=db_res.full_name,
                    education_degree=db_res.education_degree,
                    institution=db_res.institution,
                    graduation_year=db_res.graduation_year,
                    current_role=db_res.current_role,
                    target_role=db_res.target_role,
                    skills=db_res.skills or [],
                    soft_skills=db_res.soft_skills or [],
                    career_interests=db_res.career_interests or [],
                    status=db_res.status or "active",
                    created_at=str(db_res.created_at),
                )
        except Exception as e:
            logger.warning(f"Could not load profile from Supabase: {e}")

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
