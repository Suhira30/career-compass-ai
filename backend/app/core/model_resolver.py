"""
Dynamic Model Resolver & Self-Healing Registry

Automatically discovers, prioritizes, and caches active LLM models from live provider APIs
(Google Gemini and Groq). If a model is deprecated, sunsetted, or returns a 404 error,
it is automatically blacklisted in-memory and the registry self-heals by discovering
and routing traffic to the next active, supported production model.
"""

import time
import logging
from typing import List, Set

from app.core import settings
from app.core.llm_provider_key import get_active_gemini_key

logger = logging.getLogger(__name__)

# In-memory caches and blacklists
_BLACKLISTED_GEMINI_MODELS: Set[str] = {
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
}
_BLACKLISTED_GROQ_MODELS: Set[str] = set()

_DISCOVERED_GEMINI_MODELS: List[str] = []
_DISCOVERED_GEMINI_TIMESTAMP: float = 0.0

_DISCOVERED_GROQ_MODELS: List[str] = []
_DISCOVERED_GROQ_TIMESTAMP: float = 0.0

# In-memory cooldown tracking for models experiencing temporary 429 quota exhaustion or 503 high-demand spikes
_COOLDOWN_MODELS: dict = {}

CACHE_TTL_SECONDS: float = 3600.0  # 1 hour discovery cache


def is_model_deprecated_error(exc: Exception) -> bool:
    """
    Returns True if an exception indicates the model is retired, not found (404),
    or sunsetted by the provider API.
    """
    msg = (str(exc) or repr(exc)).lower()
    return any(
        phrase in msg
        for phrase in [
            "no longer available",
            "not found for api version",
            "is not found",
            "404",
            "model_not_found",
            "deprecated",
            "unsupported model",
            "does not exist",
        ]
    )


def is_quota_or_rate_limit_error(exc: Exception) -> bool:
    """
    Returns True if an exception indicates a temporary rate limit (429), quota exhaustion,
    or provider service spike (503).
    """
    msg = (str(exc) or repr(exc)).lower()
    return any(
        phrase in msg
        for phrase in [
            "429",
            "503",
            "quota exceeded",
            "rate limit",
            "resource_exhausted",
            "experiencing high demand",
            "spikes in demand",
            "serviceunavailable",
        ]
    )


def mark_model_cooldown(model_name: str, duration_seconds: float = 600.0) -> None:
    """
    Temporarily cools down a model (default 10 minutes) when it encounters a 429 quota or 503 spike,
    routing subsequent requests to the next healthy model instantly in 0ms.
    """
    clean_name = model_name.replace("models/", "").strip()
    _COOLDOWN_MODELS[clean_name] = time.time() + duration_seconds
    logger.warning(
        f"Placed model '{clean_name}' in temporary cooldown for {duration_seconds}s (quota limit / demand spike)."
    )


def is_model_in_cooldown(model_name: str) -> bool:
    """
    Returns True if the model is currently within its cooldown window.
    Automatically purges expired cooldowns.
    """
    clean_name = model_name.replace("models/", "").strip()
    expiry = _COOLDOWN_MODELS.get(clean_name, 0.0)
    if time.time() < expiry:
        return True
    if clean_name in _COOLDOWN_MODELS:
        del _COOLDOWN_MODELS[clean_name]
    return False


def mark_gemini_model_deprecated(model_name: str) -> None:
    """
    Blacklists a Gemini model in-memory so subsequent requests bypass it immediately.
    """
    clean_name = model_name.replace("models/", "").strip()
    if clean_name not in _BLACKLISTED_GEMINI_MODELS:
        _BLACKLISTED_GEMINI_MODELS.add(clean_name)
        logger.warning(
            f"Blacklisted deprecated Gemini model '{clean_name}'. Subsequent requests will avoid it."
        )


def mark_groq_model_deprecated(model_name: str) -> None:
    """
    Blacklists a Groq model in-memory so subsequent requests bypass it immediately.
    """
    clean_name = model_name.strip()
    if clean_name not in _BLACKLISTED_GROQ_MODELS:
        _BLACKLISTED_GROQ_MODELS.add(clean_name)
        logger.warning(
            f"Blacklisted deprecated Groq model '{clean_name}'. Subsequent requests will avoid it."
        )


def discover_gemini_models_from_api() -> List[str]:
    """
    Queries Google Gemini API for all available models supporting generateContent,
    filtering out non-text modalities and deprecated models.
    Prioritizes 'flash' variants, followed by 'pro' variants.
    """
    global _DISCOVERED_GEMINI_MODELS, _DISCOVERED_GEMINI_TIMESTAMP

    active_key = get_active_gemini_key()
    if not active_key:
        return []

    try:
        import google.generativeai as genai
        genai.configure(api_key=active_key)

        discovered = []
        for m in genai.list_models():
            if "generateContent" in getattr(m, "supported_generation_methods", []):
                name = getattr(m, "name", "").replace("models/", "").strip()
                if not name:
                    continue
                lower = name.lower()
                # Filter out specialized non-chat / non-generation models
                if any(x in lower for x in ["tts", "audio", "embedding", "imagen", "bison", "realtime", "aqa"]):
                    continue
                if name in _BLACKLISTED_GEMINI_MODELS:
                    continue
                discovered.append(name)

        # Sort: GA flash models first (fastest & highest free quota), then pro models
        def _sort_key(model_name: str) -> tuple:
            m_low = model_name.lower()
            # Tier 0: Stable GA 3.5 Flash & Flash-Lite (Highest Free Quota, fastest latency)
            if "3.5-flash" in m_low and "preview" not in m_low:
                tier = 0
            elif "3.6-flash" in m_low and "preview" not in m_low:
                tier = 1
            elif "flash" in m_low and "preview" not in m_low:
                tier = 2
            elif "flash" in m_low:
                tier = 3
            elif "pro" in m_low and "preview" not in m_low:
                tier = 4
            elif "pro" in m_low:
                tier = 5
            else:
                tier = 6
            return (tier, model_name)

        discovered.sort(key=_sort_key)
        _DISCOVERED_GEMINI_MODELS = discovered
        _DISCOVERED_GEMINI_TIMESTAMP = time.time()
        logger.info(f"Dynamically discovered {len(discovered)} active Gemini models: {discovered[:5]}")
        return discovered
    except Exception as exc:
        logger.warning(f"Live Gemini model discovery failed: {exc}")
        return []


def get_active_gemini_models() -> List[str]:
    """
    Returns priority-ordered list of active, non-deprecated Gemini models.
    Combines configured models with dynamically discovered models, filtering out
    any blacklisted, sunsetted, or temporarily rate-limited cooldown models.
    """
    global _DISCOVERED_GEMINI_MODELS, _DISCOVERED_GEMINI_TIMESTAMP

    # 1. Configured candidates (from settings / env vars)
    configured = [settings.GEMINI_MODEL] + list(getattr(settings, "GEMINI_CANDIDATE_MODELS", []))
    candidates = [
        m.replace("models/", "").strip()
        for m in configured
        if m and m.replace("models/", "").strip() not in _BLACKLISTED_GEMINI_MODELS
    ]
    candidates = list(dict.fromkeys(candidates))

    # 2. Check if cached discovery is fresh
    now = time.time()
    if (now - _DISCOVERED_GEMINI_TIMESTAMP) < CACHE_TTL_SECONDS and _DISCOVERED_GEMINI_MODELS:
        for m in _DISCOVERED_GEMINI_MODELS:
            if m not in candidates and m not in _BLACKLISTED_GEMINI_MODELS:
                candidates.append(m)

    # 3. If candidates list is empty or discovery was never run, query API
    if not candidates:
        discovered = discover_gemini_models_from_api()
        for m in discovered:
            if m not in candidates and m not in _BLACKLISTED_GEMINI_MODELS:
                candidates.append(m)

    # 4. Fallback safeguard if all discovery failed
    if not candidates:
        candidates = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash"]

    # 5. Filter out models currently in cooldown (e.g. models hitting temporary 429 quota or 503 spikes)
    active_candidates = [m for m in candidates if not is_model_in_cooldown(m)]
    return active_candidates if active_candidates else candidates


def discover_groq_models_from_api() -> List[str]:
    """
    Queries Groq API for active chat models available to the current API key.
    """
    global _DISCOVERED_GROQ_MODELS, _DISCOVERED_GROQ_TIMESTAMP

    if not settings.GROQ_API_KEY:
        return []

    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        models_data = client.models.list().data
        discovered = []
        for m in models_data:
            m_id = getattr(m, "id", None) or (m.get("id") if isinstance(m, dict) else None)
            if m_id:
                clean_id = m_id.strip()
                lower_id = clean_id.lower()
                if not any(x in lower_id for x in ["whisper", "audio", "guard", "vision", "safeguard", "embed"]):
                    if clean_id not in _BLACKLISTED_GROQ_MODELS:
                        discovered.append(clean_id)

        _DISCOVERED_GROQ_MODELS = discovered
        _DISCOVERED_GROQ_TIMESTAMP = time.time()
        logger.info(f"Dynamically discovered {len(discovered)} active Groq models: {discovered[:5]}")
        return discovered
    except Exception as exc:
        logger.warning(f"Live Groq model discovery failed: {exc}")
        return []


def get_active_groq_models() -> List[str]:
    """
    Returns priority-ordered list of active, non-deprecated Groq models.
    """
    global _DISCOVERED_GROQ_MODELS, _DISCOVERED_GROQ_TIMESTAMP

    priorities = getattr(settings, "GROQ_CANDIDATE_MODELS", [
        "llama-3.3-70b-versatile",
        "llama-3.3-70b-specdec",
        "llama-3.2-3b-preview",
        "llama-3.2-1b-preview",
    ])
    configured = [settings.GROQ_MODEL] + list(priorities)
    candidates = [m.strip() for m in configured if m and m.strip() not in _BLACKLISTED_GROQ_MODELS]
    candidates = list(dict.fromkeys(candidates))

    now = time.time()
    if (now - _DISCOVERED_GROQ_TIMESTAMP) < CACHE_TTL_SECONDS and _DISCOVERED_GROQ_MODELS:
        for m in _DISCOVERED_GROQ_MODELS:
            if m not in candidates and m not in _BLACKLISTED_GROQ_MODELS:
                candidates.append(m)
        return candidates

    discovered = discover_groq_models_from_api()
    for m in discovered:
        if m not in candidates:
            candidates.append(m)

    return candidates or ["llama-3.3-70b-versatile"]
