"""
Personalized Learning Roadmap Pydantic Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class RoadmapGenerateRequest(BaseModel):
    analysis_id: Optional[str] = Field(default=None, description="Unique Gap Analysis ID (e.g. anl_555666777)")
    available_hours_per_week: int = Field(
        default=5,
        ge=1,
        le=40,
        description="Candidate's available weekly study hours (1 to 40 hours/week)",
    )
    preferred_duration_weeks: int = Field(
        default=4,
        ge=1,
        le=52,
        description="Preferred learning plan duration in weeks (1 to 52 weeks)",
    )
    gap_analysis_data: Optional[dict] = Field(
        default=None,
        description="Cached gap analysis data payload to allow instant roadmap generation without requiring backend memory"
    )


class PrioritizationBadges(BaseModel):
    priority_1_critical: List[str] = Field(default_factory=list, description="Critical prerequisite skills for daily responsibilities")
    priority_2_high: List[str] = Field(default_factory=list, description="Core technical skills needed for role competency")
    priority_3_secondary: List[str] = Field(default_factory=list, description="Nice-to-have or secondary bonus skills")


class WeeklyMilestone(BaseModel):
    week: int = Field(default=1, description="Week number in the learning roadmap")
    focus_skill: str = Field(default="Core Technical Competency", description="Primary skill focus for this week")
    target_hours: int = Field(default=5, description="Target study hours allocated for this week")
    tasks: List[str] = Field(default_factory=list, description="Actionable learning tasks and practical exercises")
    resources: List[str] = Field(default_factory=list, description="Recommended documentation and learning resource links")


class RoadmapGenerateResponse(BaseModel):
    roadmap_id: str = Field(..., description="Unique generated learning roadmap identifier")
    prioritization_badges: PrioritizationBadges = Field(..., description="Skill priority classification badges")
    weekly_milestones: List[WeeklyMilestone] = Field(default_factory=list, description="Structured week-by-week learning plan")


class RoadmapSaveRequest(BaseModel):
    roadmap_id: str
    user_id: Optional[str] = None
    analysis_id: Optional[str] = None
    company_name: Optional[str] = "Target Opportunity"
    job_title: Optional[str] = "AI Role"
    ats_score_percentage: Optional[float] = 75.0
    weekly_hours: Optional[int] = 5
    duration_weeks: Optional[int] = 4
    prioritization_badges: Optional[PrioritizationBadges] = Field(default_factory=PrioritizationBadges)
    weekly_milestones: Optional[List[WeeklyMilestone]] = Field(default_factory=list)


class RoadmapTaskToggleRequest(BaseModel):
    task_key: str
    is_completed: bool
    user_id: Optional[str] = None


class TrackedRoadmapResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    analysis_id: Optional[str] = None
    company_name: str
    job_title: str
    ats_score_percentage: int
    weekly_hours: int
    duration_weeks: int
    created_at: str
    prioritization_badges: PrioritizationBadges
    weekly_milestones: List[WeeklyMilestone]
    completed_tasks: dict = Field(default_factory=dict)

