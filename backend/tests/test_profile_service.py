"""
Unit & Integration Tests for User Profile Management (Task 2.1 — FR-01)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.profile_service import ProfileService, profiles_db
from app.models.profile import UserProfileCreate, UserProfileUpdate

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_profiles_db():
    """Clears in-memory profile database before each test."""
    profiles_db.clear()
    yield
    profiles_db.clear()


def test_profile_service_create_and_get():
    """Tests ProfileService direct creation and retrieval."""
    profile_in = UserProfileCreate(
        full_name="Alice Smith",
        education_degree="B.S. Software Engineering",
        institution="Tech University",
        graduation_year=2023,
        current_role="Junior Backend Developer",
        target_role="Senior AI Engineer",
        skills=["Python", "FastAPI", "Docker"],
        soft_skills=["Communication"],
        career_interests=["Machine Learning"],
    )

    created = ProfileService.create_profile(profile_in)
    assert created.profile_id.startswith("usr_")
    assert created.full_name == "Alice Smith"
    assert created.target_role == "Senior AI Engineer"

    fetched = ProfileService.get_profile(created.profile_id)
    assert fetched is not None
    assert fetched.profile_id == created.profile_id
    assert fetched.skills == ["Python", "FastAPI", "Docker"]


def test_profile_service_update():
    """Tests ProfileService partial update."""
    profile_in = UserProfileCreate(
        full_name="Bob Jones",
        target_role="Data Scientist",
        skills=["Python", "SQL"],
    )
    created = ProfileService.create_profile(profile_in)

    update_in = UserProfileUpdate(
        target_role="Lead Data Scientist",
        skills=["Python", "SQL", "PyTorch"],
    )
    updated = ProfileService.update_profile(created.profile_id, update_in)
    assert updated is not None
    assert updated.target_role == "Lead Data Scientist"
    assert updated.skills == ["Python", "SQL", "PyTorch"]
    assert updated.full_name == "Bob Jones"  # Unchanged


def test_profile_service_delete():
    """Tests ProfileService deletion."""
    profile_in = UserProfileCreate(
        full_name="Charlie Brown",
        target_role="DevOps Engineer",
    )
    created = ProfileService.create_profile(profile_in)

    deleted = ProfileService.delete_profile(created.profile_id)
    assert deleted is True

    fetched = ProfileService.get_profile(created.profile_id)
    assert fetched is None


def test_api_profile_crud_flow():
    """Tests REST API endpoints for Profile CRUD (/api/v1/profile)."""
    # 1. POST /api/v1/profile
    payload = {
        "full_name": "Jane Doe",
        "target_role": "AI Architect",
        "skills": ["Python", "LangChain"],
    }
    response = client.post("/api/v1/profile", json=payload)
    assert response.status_code == 201
    res_json = response.json()
    assert "profile_id" in res_json
    p_id = res_json["profile_id"]

    # 2. GET /api/v1/profile/{id}
    response = client.get(f"/api/v1/profile/{p_id}")
    assert response.status_code == 200
    assert response.json()["full_name"] == "Jane Doe"

    # 3. PUT /api/v1/profile/{id}
    update_payload = {"target_role": "Principal AI Architect", "skills": ["Python", "LangChain", "PyTorch"]}
    response = client.put(f"/api/v1/profile/{p_id}", json=update_payload)
    assert response.status_code == 200
    assert response.json()["target_role"] == "Principal AI Architect"
    assert "PyTorch" in response.json()["skills"]

    # 4. DELETE /api/v1/profile/{id}
    response = client.delete(f"/api/v1/profile/{p_id}")
    assert response.status_code == 200

    # 5. GET non-existent
    response = client.get(f"/api/v1/profile/{p_id}")
    assert response.status_code == 404

