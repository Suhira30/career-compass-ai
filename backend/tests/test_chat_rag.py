"""
Unit and Integration Tests for Streaming RAG Career Assistant (Task 2.7 & 3.4)
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.services.rag.chat_chain import condense_query_with_history, format_candidate_context
from app.models.analysis import GapAnalysisResponse, SkillMatrix, QualitativeAssessment

client = TestClient(app)


def test_condense_query_without_history():
    query = "Tell me about FastAPI async concurrency"
    condensed = condense_query_with_history(query, session_history=None)
    assert condensed == query


def test_condense_query_with_deictic_followup():
    query = "Explain that further"
    history = [
        {"role": "user", "content": "What is Redis caching?"},
        {"role": "assistant", "content": "Redis provides high-throughput in-memory data caching with key eviction policies."},
    ]
    condensed = condense_query_with_history(query, session_history=history)
    assert "focus: Redis provides high-throughput" in condensed


def test_format_candidate_context():
    mock_analysis = GapAnalysisResponse(
        analysis_id="test_analysis_123",
        readiness_category="Moderate Match",
        match_score_percentage=75,
        skill_matrix=SkillMatrix(
            matched_skills=["Python", "FastAPI"],
            missing_skills=["Docker", "Redis"],
            partially_available_skills=["SQL"],
        ),
        assessment=QualitativeAssessment(
            strengths=["Solid Python async background"],
            skill_gaps=["No hands-on Redis deployment experience"],
            potential_weaknesses=[],
            recommended_improvements=["Build Docker compose pipeline with Redis cache"],
        ),
    )

    with patch("app.services.rag.chat_chain.search_relevant_context", return_value="[Source: technical/fastapi_guide.md] FastAPI is fast."):
        formatted = format_candidate_context(
            analysis=mock_analysis,
            session_history=[{"role": "user", "content": "Hi"}],
            user_message="Tell me about FastAPI",
        )
        assert "Moderate Match" in formatted
        assert "Docker, Redis" in formatted
        assert "FastAPI is fast" in formatted


def test_chat_message_sync_endpoint():
    with patch("app.services.rag.chat_chain.search_relevant_context", return_value="FastAPI context"):
        with patch("langchain_groq.ChatGroq.invoke") as mock_invoke:
            mock_res = MagicMock()
            mock_res.content = "FastAPI uses ASGI event loop for high concurrency."
            mock_invoke.return_value = mock_res

            response = client.post(
                "/api/v1/chat/message",
                json={
                    "message": "Explain FastAPI concurrency",
                    "stream": False,
                },
            )
            assert response.status_code == 200
            data = response.json()
            assert "session_id" in data
            assert len(data["response"]) > 0
            assert "suggested_followups" in data


def test_chat_message_streaming_endpoint():
    with patch("app.services.rag.chat_chain.search_relevant_context", return_value="FastAPI context"):
        async def mock_astream(*args, **kwargs):
            chunks = ["FastAPI ", "supports ", "async/await."]
            for c in chunks:
                yield MagicMock(content=c)

        with patch("langchain_groq.ChatGroq.astream", side_effect=mock_astream):
            response = client.post(
                "/api/v1/chat/message",
                json={
                    "message": "Stream FastAPI info",
                    "stream": True,
                },
            )
            assert response.status_code == 200
            assert response.headers["content-type"].startswith("text/event-stream")
            content = response.text
            assert "FastAPI" in content
