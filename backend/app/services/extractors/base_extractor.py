"""
Unified Base LLM Structured Extractor Engine
Implements resilient multi-provider extraction (Gemini native JSON -> Groq candidates -> OpenAI)
"""

import json
import logging
from typing import Type, TypeVar, List
from fastapi import HTTPException, status
from pydantic import BaseModel

from app.core import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


def _get_active_groq_models() -> List[str]:
    """Dynamically queries Groq API for active chat models available to the current API key."""
    discovered = []
    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        models_data = client.models.list().data
        for m in models_data:
            m_id = getattr(m, "id", None) or (m.get("id") if isinstance(m, dict) else None)
            if m_id:
                lower_id = m_id.lower()
                if not any(x in lower_id for x in ["whisper", "audio", "guard", "vision", "safeguard", "embed"]):
                    discovered.append(m_id)
        if discovered:
            logger.info(f"Dynamically discovered {len(discovered)} active Groq models: {discovered}")
    except Exception as e:
        logger.warning(f"Could not dynamically list Groq models: {e}")

    priorities = settings.GROQ_CANDIDATE_MODELS if getattr(settings, "GROQ_CANDIDATE_MODELS", None) else [
        "gemma2-9b-it",
        "mixtral-8x7b-32768",
        "llama-3.3-70b-versatile",
        "llama-3.3-70b-specdec",
        "llama-3.2-3b-preview",
        "llama-3.2-1b-preview",
    ]
    if discovered:
        return [m for m in priorities if m in discovered] + [m for m in discovered if m not in priorities]
    return priorities


def _discover_active_gemini_models() -> List[str]:
    """Dynamically queries Google Gemini API for available chat/text generation models on this key."""
    candidates = []
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        for m in genai.list_models():
            if "generateContent" in getattr(m, "supported_generation_methods", []):
                name = getattr(m, "name", "").replace("models/", "")
                if name:
                    lower_name = name.lower()
                    if not any(x in lower_name for x in ["tts", "audio", "embedding", "imagen", "bison", "realtime"]):
                        candidates.append(name)
        if candidates:
            logger.info(f"Dynamically discovered {len(candidates)} active Gemini models: {candidates[:5]}")
    except Exception as exc:
        logger.warning(f"Dynamic Gemini model listing failed: {exc}")
    return candidates


def _try_gemini_extraction(system_prompt: str, user_text: str, schema_class: Type[T]) -> T:
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")

    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)

    # Phase 1: Fast Path (Read prioritized candidate models from settings with zero extra discovery latency)
    gemini_candidates = [settings.GEMINI_MODEL] + [
        m for m in getattr(settings, "GEMINI_CANDIDATE_MODELS", []) if m != settings.GEMINI_MODEL
    ]
    models_to_try = list(dict.fromkeys([m for m in gemini_candidates if m]))

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
            raw_text = response.text.strip()
            if raw_text.startswith("```"):
                raw_text = raw_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            data_dict = json.loads(raw_text)
            validated = schema_class.model_validate(data_dict)
            logger.info(f"Structured extraction succeeded using Gemini model: '{model_name}'")
            return validated
        except Exception as exc:
            last_err = exc
            logger.warning(f"Gemini candidate '{model_name}' failed: {exc}. Retrying next candidate...")
            continue

    # Phase 2: Self-Healing Recovery (Triggered dynamically ONLY if all known models fail)
    logger.info("Known Gemini models failed or deprecated. Triggering dynamic model discovery...")
    discovered = _discover_active_gemini_models()
    remaining_candidates = [m for m in discovered if m not in models_to_try]

    for model_name in remaining_candidates:
        try:
            logger.info(f"Retrying extraction with discovered Gemini model: '{model_name}'")
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config={"response_mime_type": "application/json", "temperature": 0.1},
            )
            response = model.generate_content(prompt_str)
            raw_text = response.text.strip()
            if raw_text.startswith("```"):
                raw_text = raw_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            data_dict = json.loads(raw_text)
            validated = schema_class.model_validate(data_dict)
            logger.info(f"Self-healing extraction succeeded using discovered Gemini model: '{model_name}'")
            return validated
        except Exception as exc:
            last_err = exc
            logger.warning(f"Discovered Gemini candidate '{model_name}' failed: {exc}")
            continue

    raise last_err or RuntimeError("All Gemini model candidates failed.")


def _try_groq_extraction(system_prompt: str, user_text: str, schema_class: Type[T]) -> T:
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured.")

    from langchain_groq import ChatGroq

    messages = [
        ("system", system_prompt),
        ("human", f"Input Text:\n\n{user_text}"),
    ]

    candidate_models = _get_active_groq_models()
    preferred = settings.GROQ_MODEL
    if preferred and preferred not in ("llama-3.1-8b-instant", "llama-3-8b-instant", "llama3-70b-8192", "llama3-8b-8192"):
        if preferred in candidate_models:
            candidate_models.remove(preferred)
        candidate_models.insert(0, preferred)

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


def extract_structured_data(
    raw_text: str,
    system_prompt: str,
    schema_class: Type[T],
    task_name: str = "Extraction",
) -> T:
    """
    Generic extraction executor with dynamic multi-provider fallback.
    Default provider priority: configured LLM_PROVIDER (e.g. Gemini) -> Groq -> OpenAI.
    """
    providers = ["gemini", "groq", "openai"] if settings.LLM_PROVIDER.lower() == "gemini" else ["groq", "gemini", "openai"]
    errors = []

    for provider in providers:
        try:
            logger.info(f"Attempting {task_name} with Provider: {provider.upper()}")
            if provider == "gemini":
                return _try_gemini_extraction(system_prompt, raw_text, schema_class)
            elif provider == "groq":
                return _try_groq_extraction(system_prompt, raw_text, schema_class)
            elif provider == "openai":
                return _try_openai_extraction(system_prompt, raw_text, schema_class)
        except Exception as exc:
            err_msg = f"{provider.capitalize()} failed: {str(exc) or repr(exc)}"
            logger.warning(f"{task_name} - {err_msg}")
            errors.append(err_msg)

    full_error_details = " | ".join(errors)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"All LLM {task_name.lower()} providers failed. Details: {full_error_details}",
    )

