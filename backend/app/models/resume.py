"""
Resume Extraction Pydantic Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ExtractedEducation(BaseModel):
    degree: Optional[str] = Field(default=None, description="Degree or certificate name")
    institution: Optional[str] = Field(default=None, description="Educational institution name")
    year: Optional[int] = Field(default=None, description="Graduation year if available")


class ExtractedWorkExperience(BaseModel):
    company: Optional[str] = Field(default=None, description="Company or organization name")
    role: Optional[str] = Field(default=None, description="Job title or role")
    duration: Optional[str] = Field(default=None, description="Employment duration (e.g. 2022 - 2024)")
    highlights: List[str] = Field(default_factory=list, description="Key achievements or responsibilities")


class ExtractedProject(BaseModel):
    title: str = Field(..., description="Project title")
    description: Optional[str] = Field(default=None, description="Project description or tech stack used")


class ExtractedCertification(BaseModel):
    title: str = Field(..., description="Certification title")
    verification_link: Optional[str] = Field(default=None, description="Verification URL if present")


class ExtractedLinks(BaseModel):
    github: Optional[str] = Field(default=None, description="GitHub profile URL")
    linkedin: Optional[str] = Field(default=None, description="LinkedIn profile URL")
    portfolio: Optional[str] = Field(default=None, description="Personal website or portfolio URL")


class ExtractedResumeData(BaseModel):
    technical_skills: List[str] = Field(default_factory=list, description="Technical skills extracted from resume")
    soft_skills: List[str] = Field(default_factory=list, description="Soft skills extracted from resume")
    education: List[ExtractedEducation] = Field(default_factory=list, description="Education background")
    work_experience: List[ExtractedWorkExperience] = Field(default_factory=list, description="Work experience list")
    projects: List[ExtractedProject] = Field(default_factory=list, description="Notable projects")
    certifications: List[ExtractedCertification] = Field(default_factory=list, description="Certifications list")
    links: ExtractedLinks = Field(default_factory=ExtractedLinks, description="Extracted web & social links")


class ResumeUploadResponse(BaseModel):
    file_name: str = Field(..., description="Uploaded file name")
    extracted_data: ExtractedResumeData = Field(..., description="Parsed resume information")

