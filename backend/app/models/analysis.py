"""
Skill Gap Analysis Pydantic Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class GapAnalysisRequest(BaseModel):
    profile_id: str = Field(..., description="Unique User Profile ID (e.g. usr_987654321)")
    job_id: str = Field(..., description="Unique Job Description ID (e.g. job_123456789)")


class SkillMatrix(BaseModel):
    matched_skills: List[str] = Field(default_factory=list, description="Skills user possesses that meet job requirements")
    missing_skills: List[str] = Field(default_factory=list, description="Required job skills missing from user profile")
    partially_available_skills: List[str] = Field(default_factory=list, description="Foundational skills needing advancement")


class QualitativeAssessment(BaseModel):
    strengths: List[str] = Field(default_factory=list, description="Key candidate strengths relative to job requirements")
    skill_gaps: List[str] = Field(default_factory=list, description="Primary skill gaps identified")
    potential_weaknesses: List[str] = Field(default_factory=list, description="Areas needing improvement")
    recommended_improvements: List[str] = Field(default_factory=list, description="Actionable upskilling recommendations")


class GapAnalysisResponse(BaseModel):
    analysis_id: str = Field(..., description="Unique generated gap analysis identifier")
    readiness_category: str = Field(..., description="Readiness match tier: High Match, Moderate Match, or Low Match")
    match_score_percentage: float = Field(..., description="Calculated readiness overlap percentage (0.0 to 100.0)")
    skill_matrix: SkillMatrix = Field(..., description="3-way categorization of skills")
    assessment: QualitativeAssessment = Field(..., description="Qualitative evaluation and recommendations")

