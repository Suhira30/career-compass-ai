"""
Unified Base LLM Structured Extractor Engine
Implements resilient multi-provider extraction (Gemini native JSON -> Groq candidates -> OpenAI)
"""

import hashlib
import json
import logging
from typing import Type, TypeVar, List, Dict, Any
from fastapi import HTTPException, status
from pydantic import BaseModel

from app.core import settings
from app.core.llm_provider_key import (
    get_active_gemini_key,
    is_quota_exhausted_error,
    LLMQuotaExhaustedException,
)
from app.core.model_resolver import (
    get_active_gemini_models,
    get_active_groq_models,
    mark_gemini_model_deprecated,
    mark_groq_model_deprecated,
    is_model_deprecated_error,
)

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# Fast in-memory hash cache to prevent redundant quota usage on repeated user submissions
_EXTRACTION_CACHE: Dict[str, Any] = {}
_MAX_CACHE_SIZE = 128


def extract_structured_data(
    raw_text: str,
    system_prompt: str,
    schema_class: Type[T],
    task_name: str = "Extraction",
) -> T:
    """
    Generic extraction executor with dynamic multi-provider fallback.
    Default provider priority: configured LLM_PROVIDER (e.g. Gemini) -> Groq -> OpenAI.
    Includes SHA-256 hash caching to burn 0 API calls on identical inputs.
    """
    cache_key = hashlib.sha256(f"{task_name}:{raw_text.strip()}".encode("utf-8")).hexdigest()
    if cache_key in _EXTRACTION_CACHE:
        logger.info(f"Extraction cache hit for {task_name} (hash={cache_key[:8]}). Zero API calls consumed.")
        return _EXTRACTION_CACHE[cache_key]

    providers = ["gemini", "groq", "openai"] if settings.LLM_PROVIDER.lower() == "gemini" else ["groq", "gemini", "openai"]
    errors = []

    for provider in providers:
        try:
            logger.info(f"Attempting {task_name} with Provider: {provider.upper()}")
            result: T | None = None
            if provider == "gemini":
                result = _try_gemini_extraction(system_prompt, raw_text, schema_class)
            elif provider == "groq":
                result = _try_groq_extraction(system_prompt, raw_text, schema_class)
            elif provider == "openai":
                result = _try_openai_extraction(system_prompt, raw_text, schema_class)

            if result is not None:
                if len(_EXTRACTION_CACHE) >= _MAX_CACHE_SIZE:
                    _EXTRACTION_CACHE.pop(next(iter(_EXTRACTION_CACHE)))
                _EXTRACTION_CACHE[cache_key] = result
                return result
        except Exception as exc:
            err_msg = f"{provider.capitalize()} failed: {str(exc) or repr(exc)}"
            logger.warning(f"{task_name} - {err_msg}. Failing over to next provider...")
            errors.append(err_msg)
            continue

    # If all providers failed, check if we can do a brief cooldown retry on Gemini
    if any(is_quota_exhausted_error(Exception(e)) for e in errors):
        logger.info(f"Initial providers hit rate limits. Checking for Gemini availability after failover attempt...")
        try:
            return _try_gemini_extraction(system_prompt, raw_text, schema_class)
        except Exception:
            pass

        raise LLMQuotaExhaustedException(
            message=f"AI model quota for {task_name.lower()} is exhausted on all free providers. Please supply your own free Gemini API key to proceed."
        )

    full_error_details = " | ".join(errors)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"All LLM {task_name.lower()} providers failed. Details: {full_error_details}",
    )


def _extract_text_from_gemini_response(response) -> str:
    try:
        return response.text.strip()
    except Exception:
        parts_text = []
        if hasattr(response, "candidates") and response.candidates:
            for cand in response.candidates:
                if hasattr(cand, "content") and hasattr(cand.content, "parts"):
                    for part in cand.content.parts:
                        if hasattr(part, "text") and part.text:
                            parts_text.append(part.text)
        if parts_text:
            return "".join(parts_text).strip()
        raise


def _try_gemini_extraction(system_prompt: str, user_text: str, schema_class: Type[T]) -> T:
    active_key = get_active_gemini_key()
    if not active_key:
        raise ValueError("GEMINI_API_KEY is not configured.")

    import google.generativeai as genai
    genai.configure(api_key=active_key)

    # Get priority list of active, verified non-deprecated models
    models_to_try = get_active_gemini_models()

    prompt_str = (
        f"{system_prompt}\n\n"
        f"INPUT TEXT:\n{user_text}\n\n"
        f"Return valid JSON strictly matching this schema:\n"
        f"{json.dumps(schema_class.model_json_schema())}"
    )

    last_err: Exception | None = None
    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config={"response_mime_type": "application/json", "temperature": 0.1},
            )
            response = model.generate_content(prompt_str)
            raw_text = _extract_text_from_gemini_response(response)
            if raw_text.startswith("```"):
                raw_text = raw_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            data_dict = json.loads(raw_text)
            validated = schema_class.model_validate(data_dict)
            logger.info(f"Structured extraction succeeded using Gemini model: '{model_name}'")
            return validated
        except Exception as exc:
            last_err = exc
            if is_model_deprecated_error(exc):
                mark_gemini_model_deprecated(model_name)
            elif is_quota_exhausted_error(exc):
                logger.warning(f"Gemini API quota/rate limit reached on candidate '{model_name}'.")
            else:
                logger.warning(f"Gemini candidate '{model_name}' failed: {exc}. Retrying next candidate...")
            continue

    if last_err and is_quota_exhausted_error(last_err):
        raise LLMQuotaExhaustedException(
            message="Your Gemini API quota has been exhausted. Please supply your own free Gemini API key to proceed."
        ) from last_err

    raise last_err or RuntimeError("All Gemini model candidates failed.")


def _try_groq_extraction(system_prompt: str, user_text: str, schema_class: Type[T]) -> T:
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured.")

    from langchain_groq import ChatGroq

    messages = [
        ("system", system_prompt),
        ("human", f"Input Text:\n\n{user_text}"),
    ]

    candidate_models = get_active_groq_models()
    last_error: Exception | None = None
    for model_name in candidate_models:
        try:
            llm = ChatGroq(
                api_key=settings.GROQ_API_KEY,
                model_name=model_name,
                temperature=0.1,
            )
            structured_llm = llm.with_structured_output(schema_class)
            result = structured_llm.invoke(messages)
            logger.info(f"Structured extraction succeeded using Groq model: '{model_name}'")
            return result
        except Exception as exc:
            last_error = exc
            if is_model_deprecated_error(exc):
                mark_groq_model_deprecated(model_name)
            logger.warning(f"Groq candidate '{model_name}' unavailable: {exc}. Retrying with next model...")
            continue

    raise last_error or RuntimeError("All Groq candidate models failed.")


def _try_openai_extraction(system_prompt: str, user_text: str, schema_class: Type[T]) -> T:
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not configured.")

    from langchain_openai import ChatOpenAI

    messages = [
        ("system", system_prompt),
        ("human", f"Input Text:\n\n{user_text}"),
    ]

    llm = ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model=settings.OPENAI_MODEL,
        temperature=0.1,
    )
    structured_llm = llm.with_structured_output(schema_class)
    return structured_llm.invoke(messages)



