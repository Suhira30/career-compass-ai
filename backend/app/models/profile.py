"""
User Profile Pydantic Validation Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class UserProfileCreate(BaseModel):
    """
    Schema for creating or updating a user career profile.
    """
    user_id: Optional[str] = Field(None, description="Authenticated user account ID")
    full_name: str = Field(..., description="User's full name", example="Jane Doe")
    education_degree: Optional[str] = Field(None, description="Degree or qualification", example="B.S. in Computer Science")
    institution: Optional[str] = Field(None, description="School or university name", example="State University")
    graduation_year: Optional[int] = Field(None, description="Year of graduation", example=2024)
    current_role: Optional[str] = Field(None, description="Current job title", example="Junior Software Engineer")
    target_role: str = Field(..., description="Target aspirational job title", example="Senior Full-Stack AI Engineer")
    skills: List[str] = Field(default_factory=list, description="List of technical skills", example=["Python", "React", "FastAPI", "SQL"])
    soft_skills: List[str] = Field(default_factory=list, description="List of soft skills", example=["Problem Solving", "Teamwork"])
    career_interests: List[str] = Field(default_factory=list, description="Career topics of interest", example=["Artificial Intelligence", "Cloud Architecture"])


class UserProfileUpdate(BaseModel):
    """
    Schema for updating an existing user profile (all fields optional).
    """
    full_name: Optional[str] = Field(None, description="User's full name", example="Jane Doe")
    education_degree: Optional[str] = Field(None, description="Degree or qualification", example="B.S. in Computer Science")
    institution: Optional[str] = Field(None, description="School or university name", example="State University")
    graduation_year: Optional[int] = Field(None, description="Year of graduation", example=2024)
    current_role: Optional[str] = Field(None, description="Current job title", example="Junior Software Engineer")
    target_role: Optional[str] = Field(None, description="Target aspirational job title", example="Senior Full-Stack AI Engineer")
    skills: Optional[List[str]] = Field(None, description="List of technical skills", example=["Python", "React", "FastAPI", "SQL"])
    soft_skills: Optional[List[str]] = Field(None, description="List of soft skills", example=["Problem Solving", "Teamwork"])
    career_interests: Optional[List[str]] = Field(None, description="Career topics of interest", example=["Artificial Intelligence", "Cloud Architecture"])


class UserProfileResponse(BaseModel):
    """
    Schema for user profile creation confirmation response.
    """
    profile_id: str = Field(..., description="Unique profile identifier", example="usr_987654321")
    full_name: str
    target_role: str
    created_at: str
    status: str = "active"


class UserProfileDetail(UserProfileCreate):
    """
    Full detailed schema returned by GET /api/v1/profile/{profile_id}.
    """
    profile_id: str
    created_at: str
    status: str = "active"

