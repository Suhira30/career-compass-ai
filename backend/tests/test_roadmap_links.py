"""
Unit Tests for Roadmap Resource Verification and Canonical Registry
Ensures all generated roadmap links are valid, verified, and free of dead domains.
"""

import pytest
from app.models.analysis import GapAnalysisResponse, SkillMatrix, QualitativeAssessment
from app.services.gap_analysis.resource_registry import (
    VERIFIED_DOCUMENTATION_REGISTRY,
    get_canonical_resource_for_skill,
    sanitize_resource_link,
)
from app.services.gap_analysis.prioritizer import generate_learning_roadmap


def test_verified_registry_entries():
    """Verify registry contains foundational technologies and valid URLs."""
    for skill, (url, label) in VERIFIED_DOCUMENTATION_REGISTRY.items():
        assert url.startswith("https://"), f"URL for {skill} must be HTTPS"
        assert label, f"Label for {skill} must not be empty"
        assert "reference.org" not in url, f"URL for {skill} cannot be dead reference.org"


def test_sanitize_resource_link_replaces_dead_domains():
    """Ensure dead domains like docs.reference.org are dropped (returned None), never forced."""
    dead_url = "https://docs.reference.org/system-design"
    cleaned = sanitize_resource_link(dead_url, "System Design")
    assert cleaned is None, "Dead domain must be dropped to None rather than using a fake link"

    cloud_dead = "https://docs.reference.org/cloud-infrastructure"
    cleaned_cloud = sanitize_resource_link(cloud_dead, "Cloud Infrastructure")
    assert cleaned_cloud is None, "Dead domain must be dropped to None"


def test_sanitize_markdown_link():
    """Ensure verified markdown link syntax is correctly extracted."""
    md_link = "[Docker Official Docs](https://docs.docker.com/)"
    cleaned = sanitize_resource_link(md_link, "Docker")
    assert cleaned == "https://docs.docker.com/"


def test_sanitize_unknown_domain():
    """Ensure unrecognized/unverified links from LLM are dropped to None."""
    fake_link = "https://myfakeprogrammingblog.xyz/tutorial/python"
    cleaned = sanitize_resource_link(fake_link, "Python")
    assert cleaned is None, "Unverified domains must be dropped to None"


def test_roadmap_milestones_have_verified_links_or_empty():
    """Ensure generated roadmap milestones never contain reference.org or fake links."""
    dummy_analysis = GapAnalysisResponse(
        analysis_id="anl_test_123",
        readiness_category="High Readiness",
        match_score_percentage=85.0,
        skill_matrix=SkillMatrix(
            matched_skills=["Python", "FastAPI"],
            missing_skills=["System Design", "Cloud Infrastructure", "Redis"],
            partially_available_skills=["Docker"],
        ),
        assessment=QualitativeAssessment(
            summary="Strong candidate",
            strengths=["Python"],
            primary_gaps=["System Design", "Cloud Infrastructure"],
            recommended_improvements=["Practice architecture"],
        ),
    )

    roadmap = generate_learning_roadmap(
        analysis=dummy_analysis,
        weekly_hours=5,
        duration_weeks=4,
    )

    assert len(roadmap.weekly_milestones) == 4
    for milestone in roadmap.weekly_milestones:
        for res in milestone.resources:
            assert "docs.reference.org" not in res, f"Found dead domain in: {res}"
            assert res.startswith("https://") or res.startswith("http://"), f"Invalid link: {res}"

