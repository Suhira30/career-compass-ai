"""
Unit Tests for Bring-Your-Own-Key (BYOK) & Quota Exhaustion Detection
"""

import pytest
from app.core.llm_provider_key import (
    set_request_gemini_key,
    get_active_gemini_key,
    is_quota_exhausted_error,
    LLMQuotaExhaustedException,
)
from app.core import settings


def test_get_active_gemini_key_default():
    """Verify that when no client key is set, settings.GEMINI_API_KEY is used."""
    set_request_gemini_key(None)
    key = get_active_gemini_key()
    assert key == (settings.GEMINI_API_KEY or "")


def test_client_gemini_key_override():
    """Verify that a client-supplied key overrides settings.GEMINI_API_KEY."""
    custom_key = "AIzaSyCustomTestKeyForBYOK123456"
    set_request_gemini_key(custom_key)
    try:
        active = get_active_gemini_key()
        assert active == custom_key
    finally:
        set_request_gemini_key(None)


def test_is_quota_exhausted_error_detection():
    """Verify that rate limit and quota exhaustion exceptions are accurately detected."""
    assert is_quota_exhausted_error(Exception("429 ResourceExhausted: Quota exceeded"))
    assert is_quota_exhausted_error(Exception("RESOURCE_EXHAUSTED: Rate limit reached"))
    assert is_quota_exhausted_error(Exception("insufficient_quota: You exceeded your current quota"))
    assert is_quota_exhausted_error(Exception("Too Many Requests"))
    
    # Generic errors should not be flagged as quota exhaustion
    assert not is_quota_exhausted_error(Exception("Connection timed out"))
    assert not is_quota_exhausted_error(Exception("JSONDecodeError: Expecting value"))


def test_llm_quota_exhausted_exception_structure():
    """Verify the structured HTTP 429 payload emitted by LLMQuotaExhaustedException."""
    exc = LLMQuotaExhaustedException(provider="gemini")
    assert exc.status_code == 429
    assert exc.detail["error_code"] == "LLM_QUOTA_EXHAUSTED"
    assert "https://aistudio.google.com/app/apikey" in exc.detail["instructions_url"]


def test_chat_chain_gemini_quota_exhaustion_raises():
    """Verify that when Gemini quota fails in chat_chain, LLMQuotaExhaustedException is raised."""
    from unittest.mock import patch, MagicMock
    from app.services.rag.chat_chain import invoke_chat_chain

    with patch("langchain_google_genai.ChatGoogleGenerativeAI") as mock_gemini:
        mock_instance = MagicMock()
        mock_instance.__or__.side_effect = Exception("429 ResourceExhausted: Quota exceeded for model")
        mock_gemini.return_value = mock_instance

        with pytest.raises(LLMQuotaExhaustedException):
            invoke_chat_chain(
                user_message="Hello",
                context_str="test context",
                session_id="test_sess"
            )


