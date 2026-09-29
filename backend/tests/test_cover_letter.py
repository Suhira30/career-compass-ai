import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.cover_letter import CoverLetterRequest, MatchingProject
from app.services.cover_letter_service import generate_cover_letter

client = TestClient(app)


def test_cover_letter_service_with_matching_projects():
    """
    Verify that cover letter service formats projects and produces a grounded document.
    """
    request = CoverLetterRequest(
        candidate_name="Alex Chen",
        target_role="Senior Backend Engineer",
        company_name="CloudScale Technologies",
        matched_skills=["Python", "FastAPI", "Docker", "PostgreSQL"],
        missing_skills=["Kubernetes"],
        projects=[
            MatchingProject(
                title="Distributed Task Queue",
                description="Engineered an async task processing system handling 10k jobs/min with Redis and FastAPI"
            ),
            MatchingProject(
                title="Microservices Auth Gateway",
                description="Implemented JWT OAuth2 security gateway with 99.99% uptime"
            )
        ],
        generation_type="cover_letter",
        tone="confident",
    )

    response = generate_cover_letter(request)
    assert response.generation_type == "cover_letter"
    assert len(response.content) > 100
    assert "Alex Chen" in response.content or "Candidate" in response.content
    assert "Distributed Task Queue" in response.matching_projects_highlighted
    assert "Microservices Auth Gateway" in response.matching_projects_highlighted


def test_recruiter_email_generation():
    """
    Verify cold recruiter outreach email format.
    """
    request = CoverLetterRequest(
        candidate_name="Alex Chen",
        target_role="Staff AI Platform Engineer",
        company_name="AI Dynamics",
        matched_skills=["LangChain", "Vector Databases", "Python"],
        projects=[
            MatchingProject(
                title="Enterprise RAG Search Engine",
                description="Built parent-child RAG pipeline reducing hallucination by 40%"
            )
        ],
        generation_type="recruiter_email",
        tone="concise",
    )

    response = generate_cover_letter(request)
    assert response.generation_type == "recruiter_email"
    assert response.subject_line is not None
    assert len(response.subject_line) > 5
    assert len(response.content) > 50


def test_endpoint_cover_letter_generate():
    """
    Verify POST /api/v1/cover-letter/generate endpoint via TestClient.
    """
    payload = {
        "candidate_name": "Jordan Smith",
        "target_role": "Lead Full Stack Developer",
        "company_name": "FinTech Prime",
        "matched_skills": ["React", "TypeScript", "Node.js", "GraphQL"],
        "projects": [
            {
                "title": "Real-Time Payment Dashboard",
                "description": "High-throughput financial dashboard built with WebSocket streaming"
            }
        ],
        "generation_type": "cover_letter",
        "tone": "confident"
    }

    res = client.post("/api/v1/cover-letter/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["generation_type"] == "cover_letter"
    assert "content" in data
    assert len(data["content"]) > 100
    assert "Real-Time Payment Dashboard" in data["matching_projects_highlighted"]
