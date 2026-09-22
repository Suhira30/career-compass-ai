"""
Career Compass AI — Dynamic LLM Provider Key & Quota Exhaustion Handler

Supports the Bring-Your-Own-Key (BYOK) architecture:
- Extracts optional client-provided API key from the `X-Gemini-API-Key` HTTP header.
- Provides thread-safe, request-scoped key resolution via `contextvars.ContextVar`.
- Gracefully intercepts quota exhaustion / 429 errors from Google Gemini, Groq, and OpenAI.
"""

from contextvars import ContextVar
from typing import Optional
from fastapi import HTTPException, status
import logging
from app.core import settings

logger = logging.getLogger(__name__)

# Request-scoped context variable holding client-supplied Gemini key
user_gemini_api_key_var: ContextVar[Optional[str]] = ContextVar("user_gemini_api_key", default=None)


def set_request_gemini_key(api_key: Optional[str]) -> None:
    """Sets client-provided Gemini API key for the current request context."""
    if api_key and api_key.strip():
        user_gemini_api_key_var.set(api_key.strip())
    else:
        user_gemini_api_key_var.set(None)


def get_active_gemini_key() -> str:
    """
    Returns the effective Gemini API key:
    1. Client-provided key from X-Gemini-API-Key header (if present)
    2. Server-configured GEMINI_API_KEY from settings/.env
    """
    user_key = user_gemini_api_key_var.get()
    if user_key and len(user_key.strip()) > 10:
        return user_key.strip()
    return settings.GEMINI_API_KEY or ""


class LLMQuotaExhaustedException(HTTPException):
    """
    Exception raised when all available LLM quotas / credits are exhausted.
    Triggers the frontend BYOK (Bring Your Own Key) guidance modal.
    """
    def __init__(
        self,
        message: str = "The AI service quota has been temporarily exhausted. Please provide your own free Gemini API key to continue uninterrupted.",
        provider: str = "gemini",
    ):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error_code": "LLM_QUOTA_EXHAUSTED",
                "provider": provider,
                "message": message,
                "instructions_url": "https://aistudio.google.com/app/apikey",
            },
        )


def is_quota_exhausted_error(exc: Exception) -> bool:
    """
    Detects whether an exception is caused by API rate limiting, quota exhaustion, or credit depletion.
    """
    err_str = str(exc).lower()
    quota_indicators = [
        "429",
        "resource_exhausted",
        "resourceexhausted",
        "quota",
        "quota exceeded",
        "rate limit",
        "ratelimit",
        "insufficient_quota",
        "credits",
        "exhausted",
        "too many requests",
    ]
    return any(indicator in err_str for indicator in quota_indicators)

