"""
Cover Letter & Outreach Generation Pydantic Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class MatchingProject(BaseModel):
    title: str = Field(..., description="Project title", example="Microservices API Gateway")
    description: Optional[str] = Field(None, description="Project summary, tech stack, and key metrics", example="Built with FastAPI, Redis, and Docker handling 5k req/s")


class CoverLetterRequest(BaseModel):
    candidate_name: Optional[str] = Field(None, description="Candidate full name", example="Jane Doe")
    target_role: str = Field(..., description="Target job title", example="Senior Backend Engineer")
    company_name: Optional[str] = Field(None, description="Target company or organization name", example="Acme Corp")
    job_description: Optional[str] = Field(None, description="Target job description or requirements summary")
    matched_skills: List[str] = Field(default_factory=list, description="Skills candidate possesses that match job requirements", example=["Python", "FastAPI", "PostgreSQL", "Docker"])
    missing_skills: List[str] = Field(default_factory=list, description="Target skills to proactively address or highlight willingness to master", example=["Kubernetes", "Kafka"])
    projects: List[MatchingProject] = Field(default_factory=list, description="Matching candidate projects with technical achievements")
    work_experience_summary: Optional[str] = Field(None, description="Highlights from prior roles")
    # Academic & University Details (Optional)
    institution: Optional[str] = Field(None, description="University or college graduated from", example="University of Moratuwa")
    degree: Optional[str] = Field(None, description="Degree or program title", example="B.Sc. (Hons) in Computer Science & Engineering")
    gpa: Optional[str] = Field(None, description="Optional CGPA or highest SGPA / Academic standing", example="3.85 / 4.0")
    # Contact Details for Professional Sign-off
    email: Optional[str] = Field(None, description="Candidate email address", example="alex.dev@gmail.com")
    phone: Optional[str] = Field(None, description="Candidate phone number", example="+1 (555) 234-5678")
    linkedin_url: Optional[str] = Field(None, description="Candidate LinkedIn URL", example="https://linkedin.com/in/alexdev")
    github_url: Optional[str] = Field(None, description="Candidate GitHub URL", example="https://github.com/alexdev")
    portfolio_url: Optional[str] = Field(None, description="Candidate portfolio website URL", example="https://alexdev.io")
    generation_type: str = Field(
        default="cover_letter",
        description="Type of generation: 'cover_letter', 'application_email', or 'recruiter_email'"
    )
    tone: str = Field(
        default="confident",
        description="Tone: 'confident', 'formal', 'enthusiastic', or 'concise'"
    )


class CoverLetterResponse(BaseModel):
    generation_type: str = Field(..., description="The type of document generated")
    subject_line: Optional[str] = Field(None, description="Subject line (for email formats)")
    content: str = Field(..., description="Full text body of the cover letter or email outreach")
    matching_projects_highlighted: List[str] = Field(default_factory=list, description="Names of projects referenced in the letter")
    key_strengths_referenced: List[str] = Field(default_factory=list, description="Key skills and strengths emphasized")
