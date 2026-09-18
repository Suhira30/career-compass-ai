"""
User Profile Service Layer (Task 2.1 — FR-01)
Encapsulates Profile CRUD operations, schema validation, and repository persistence.
"""

from typing import Dict, Optional
from datetime import datetime
import uuid

from app.models.profile import (
    UserProfileCreate,
    UserProfileUpdate,
    UserProfileDetail,
    UserProfileResponse,
)

# In-memory storage repository for profile data (ready for SQLAlchemy/Supabase migration)
profiles_db: Dict[str, UserProfileDetail] = {}


class ProfileService:
    """
    Business logic and data management layer for User Profiles.
    """

    @staticmethod
    def create_profile(profile_in: UserProfileCreate) -> UserProfileDetail:
        """
        Creates a new user profile with a unique ID and timestamp.
        """
        profile_id = f"usr_{uuid.uuid4().hex[:9]}"
        now_str = datetime.utcnow().isoformat() + "Z"

        full_profile = UserProfileDetail(
            profile_id=profile_id,
            created_at=now_str,
            status="active",
            **profile_in.model_dump()
        )

        profiles_db[profile_id] = full_profile
        return full_profile

    @staticmethod
    def get_profile(profile_id: str) -> Optional[UserProfileDetail]:
        """
        Retrieves a user profile by ID.
        """
        return profiles_db.get(profile_id)

    @staticmethod
    def update_profile(profile_id: str, profile_update: UserProfileUpdate) -> Optional[UserProfileDetail]:
        """
        Updates an existing user profile with non-None attributes from UserProfileUpdate.
        """
        existing_profile = profiles_db.get(profile_id)
        if not existing_profile:
            return None

        update_data = profile_update.model_dump(exclude_unset=True)
        updated_dict = existing_profile.model_dump()

        for key, value in update_data.items():
            if value is not None:
                updated_dict[key] = value

        updated_profile = UserProfileDetail(**updated_dict)
        profiles_db[profile_id] = updated_profile
        return updated_profile

    @staticmethod
    def delete_profile(profile_id: str) -> bool:
        """
        Deletes a user profile by ID. Returns True if deleted, False if not found.
        """
        if profile_id in profiles_db:
            del profiles_db[profile_id]
            return True
        return False

