"""
Job Description Extraction Pydantic Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class JobExtractRequest(BaseModel):
    raw_job_description: str = Field(
        ...,
        min_length=10,
        max_length=15000,
        description="Raw job description text pasted by the user (max 15,000 characters)",
    )


class ExtractedJobData(BaseModel):
    job_title: str = Field(..., description="Job title or role name")
    required_skills: List[str] = Field(default_factory=list, description="Must-have technical and domain skills")
    preferred_skills: List[str] = Field(default_factory=list, description="Nice-to-have or preferred skills")
    required_experience: str = Field(default="Not Specified", description="Required years of experience")
    education_requirements: str = Field(default="Not Specified", description="Degree or educational requirements")
    responsibilities: List[str] = Field(default_factory=list, description="Core duties and key responsibilities")
    work_mode: str = Field(default="Not Specified", description="Work arrangement: Remote, Hybrid, On-site, or Not Specified")
    location: str = Field(default="Not Specified", description="Job office location or geographical region")
    salary_range: str = Field(default="Not Specified", description="Salary or compensation details if explicitly stated")


class JobExtractResponse(BaseModel):
    job_id: str = Field(..., description="Unique generated job description identifier")
    extracted_job: ExtractedJobData = Field(..., description="Parsed job description details")

