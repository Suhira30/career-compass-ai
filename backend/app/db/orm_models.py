"""
SQLAlchemy Relational Database ORM Models
"""

from typing import List, Optional
from datetime import datetime
from sqlalchemy import String, Integer, Float, Text, JSON, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class UserProfileDB(Base):
    """
    User Profile ORM Table (user_profiles)
    """
    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    education_degree: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    institution: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    graduation_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    current_role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    target_role: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Store JSON arrays for skills, soft skills, and interests
    skills: Mapped[list] = mapped_column(JSON, default=list)
    soft_skills: Mapped[list] = mapped_column(JSON, default=list)
    career_interests: Mapped[list] = mapped_column(JSON, default=list)

    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[str] = mapped_column(String(100), default=lambda: datetime.utcnow().isoformat() + "Z")

    # One-to-many relationships
    experiences: Mapped[List["WorkExperienceDB"]] = relationship(
        "WorkExperienceDB", back_populates="profile", cascade="all, delete-orphan"
    )
    certifications: Mapped[List["CertificationDB"]] = relationship(
        "CertificationDB", back_populates="profile", cascade="all, delete-orphan"
    )
    analyses: Mapped[List["AnalysisResultDB"]] = relationship(
        "AnalysisResultDB", back_populates="profile", cascade="all, delete-orphan"
    )


class WorkExperienceDB(Base):
    """
    Work Experience ORM Table (work_experiences)
    """
    __tablename__ = "work_experiences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    profile_id: Mapped[str] = mapped_column(String(50), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    duration: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    highlights: Mapped[list] = mapped_column(JSON, default=list)

    profile: Mapped["UserProfileDB"] = relationship("UserProfileDB", back_populates="experiences")


class CertificationDB(Base):
    """
    Certification ORM Table (certifications)
    """
    __tablename__ = "certifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    profile_id: Mapped[str] = mapped_column(String(50), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    verification_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    profile: Mapped["UserProfileDB"] = relationship("UserProfileDB", back_populates="certifications")


class JobDescriptionDB(Base):
    """
    Job Description ORM Table (job_descriptions)
    """
    __tablename__ = "job_descriptions"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    company_name: Mapped[str] = mapped_column(String(255), default="Target Company")
    job_title: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_job_description: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Store JSON arrays for required/preferred skills and responsibilities
    required_skills: Mapped[list] = mapped_column(JSON, default=list)
    preferred_skills: Mapped[list] = mapped_column(JSON, default=list)
    responsibilities: Mapped[list] = mapped_column(JSON, default=list)

    required_experience: Mapped[str] = mapped_column(String(100), default="Not Specified")
    education_requirements: Mapped[str] = mapped_column(String(255), default="Not Specified")
    work_mode: Mapped[str] = mapped_column(String(100), default="Not Specified")
    location: Mapped[str] = mapped_column(String(255), default="Not Specified")
    salary_range: Mapped[str] = mapped_column(String(100), default="Not Specified")

    created_at: Mapped[str] = mapped_column(String(100), default=lambda: datetime.utcnow().isoformat() + "Z")

    analyses: Mapped[List["AnalysisResultDB"]] = relationship(
        "AnalysisResultDB", back_populates="job", cascade="all, delete-orphan"
    )


class AnalysisResultDB(Base):
    """
    Skill Gap Analysis Result ORM Table (analysis_results)
    """
    __tablename__ = "analysis_results"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    profile_id: Mapped[str] = mapped_column(String(50), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[str] = mapped_column(String(50), ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    
    readiness_category: Mapped[str] = mapped_column(String(100), nullable=False)
    match_score_percentage: Mapped[float] = mapped_column(Float, nullable=False)

    # Store JSON objects for skill matrix and qualitative assessment
    matched_skills: Mapped[list] = mapped_column(JSON, default=list)
    missing_skills: Mapped[list] = mapped_column(JSON, default=list)
    partially_available_skills: Mapped[list] = mapped_column(JSON, default=list)
    assessment: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[str] = mapped_column(String(100), default=lambda: datetime.utcnow().isoformat() + "Z")

    profile: Mapped["UserProfileDB"] = relationship("UserProfileDB", back_populates="analyses")
    job: Mapped["JobDescriptionDB"] = relationship("JobDescriptionDB", back_populates="analyses")


class RoadmapDB(Base):
    """
    Roadmap ORM Table (roadmaps)
    """
    __tablename__ = "roadmaps"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    analysis_id: Mapped[Optional[str]] = mapped_column(String(50), ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    job_title: Mapped[str] = mapped_column(String(255), nullable=False)
    ats_score_percentage: Mapped[int] = mapped_column(Integer, default=75)
    weekly_hours: Mapped[int] = mapped_column(Integer, default=5)
    duration_weeks: Mapped[int] = mapped_column(Integer, default=4)
    prioritization_badges: Mapped[dict] = mapped_column(JSON, default=dict)
    weekly_milestones: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[str] = mapped_column(String(100), default=lambda: datetime.utcnow().isoformat() + "Z")

    tasks: Mapped[List["RoadmapTaskDB"]] = relationship(
        "RoadmapTaskDB", back_populates="roadmap", cascade="all, delete-orphan"
    )


class RoadmapTaskDB(Base):
    """
    Roadmap Task Checkbox ORM Table (roadmap_tasks)
    """
    __tablename__ = "roadmap_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    roadmap_id: Mapped[str] = mapped_column(String(50), ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    task_key: Mapped[str] = mapped_column(String(100), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[str] = mapped_column(String(100), default=lambda: datetime.utcnow().isoformat() + "Z")

    roadmap: Mapped["RoadmapDB"] = relationship("RoadmapDB", back_populates="tasks")

