"""
LLM Job Description Structured Extraction Service with Multi-Provider Fallback (Groq -> Gemini -> OpenAI)
"""

import logging
from fastapi import HTTPException, status
from app.core import settings
from app.models.job import ExtractedJobData

logger = logging.getLogger(__name__)

JOB_EXTRACTION_SYSTEM_PROMPT = """
You are an expert AI Job Description Analyst and Talent Acquisition Specialist.
Your task is to analyze raw target Job Description text and accurately extract structured criteria into the exact required JSON schema.

Extraction Guidelines:
- Extract the official Job Title.
- Extract all Required / Must-Have Technical & Domain Skills.
- Extract all Preferred / Nice-to-Have Skills.
- Extract Required Years of Experience (e.g. "3+ years", "5-7 years"). If not explicitly mentioned, return "Not Specified".
- Extract Education Requirements (e.g. "Bachelor's in CS or equivalent"). If not explicitly mentioned, return "Not Specified".
- Extract Core Responsibilities as a list of bullet strings.
- Extract Work Mode ("Remote", "Hybrid", "On-site"). If not explicitly mentioned, return "Not Specified".
- Extract Location (city, state, region). If not explicitly mentioned, return "Not Specified".
- Extract Salary / Compensation Range if explicitly stated in text. If missing or unlisted, return "Not Specified".
"""


def _get_active_groq_models() -> list[str]:
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

    priorities = [
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


def _try_groq(messages) -> ExtractedJobData:
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured.")
    
    from langchain_groq import ChatGroq

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
            structured_llm = llm.with_structured_output(ExtractedJobData)
            result = structured_llm.invoke(messages)
            logger.info(f"Job extraction succeeded using Groq model: '{model_name}'")
            return result
        except Exception as exc:
            last_error = exc
            logger.warning(f"Groq candidate '{model_name}' unavailable: {exc}. Retrying with next model...")
            continue

    raise last_error or RuntimeError("All Groq candidate models failed.")


def _try_gemini(messages) -> ExtractedJobData:
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")
    
    # 1. Attempt LangChain ChatGoogleGenerativeAI
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            google_api_key=settings.GEMINI_API_KEY,
            model=settings.GEMINI_MODEL,
            temperature=0.1,
        )
        structured_llm = llm.with_structured_output(ExtractedJobData)
        return structured_llm.invoke(messages)
    except Exception as lc_exc:
        logger.info(f"LangChain Gemini structured output not available ({lc_exc}). Using native google.generativeai SDK...")

    # 2. Native google.generativeai SDK fallback (supports new AQ... keys and all Gemini models)
    import google.generativeai as genai
    import json

    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    gemini_models_to_try = [
        settings.GEMINI_MODEL,
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-flash-latest",
    ]
    gemini_models_to_try = list(dict.fromkeys([m for m in gemini_models_to_try if m]))

    prompt_str = (
        f"{JOB_EXTRACTION_SYSTEM_PROMPT}\n\n"
        f"JOB DESCRIPTION TEXT:\n{messages[-1][1]}\n\n"
        f"Return valid JSON strictly matching this schema:\n"
        f"{json.dumps(ExtractedJobData.model_json_schema())}"
    )

    last_gemini_err: Exception | None = None
    for g_model_name in gemini_models_to_try:
        try:
            model = genai.GenerativeModel(
                model_name=g_model_name,
                generation_config={"response_mime_type": "application/json", "temperature": 0.1},
            )
            response = model.generate_content(prompt_str)
            raw_text = response.text.strip()
            if raw_text.startswith("```"):
                raw_text = raw_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            data_dict = json.loads(raw_text)
            validated = ExtractedJobData.model_validate(data_dict)
            logger.info(f"Job extraction succeeded using Gemini model: '{g_model_name}'")
            return validated
        except Exception as g_exc:
            last_gemini_err = g_exc
            logger.warning(f"Gemini candidate '{g_model_name}' failed: {g_exc}. Retrying next Gemini candidate...")
            continue

    raise last_gemini_err or RuntimeError("All Gemini model candidates failed.")


def _try_openai(messages) -> ExtractedJobData:
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not configured.")
    
    from langchain_openai import ChatOpenAI
    llm = ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model=settings.OPENAI_MODEL,
        temperature=0.1,
    )
    structured_llm = llm.with_structured_output(ExtractedJobData)
    return structured_llm.invoke(messages)


def extract_job_info(raw_job_description: str) -> ExtractedJobData:
    """
    Extracts structured criteria from job description text using multi-LLM resilience fallback:
    1. Primary: Groq LPU (Llama 3.3 70B)
    2. Fallback 1: Google Gemini (Gemini 2.0 Flash)
    3. Fallback 2: OpenAI (GPT-4o mini)
    """
    messages = [
        ("system", JOB_EXTRACTION_SYSTEM_PROMPT),
        ("human", f"Job Description Text:\n\n{raw_job_description}"),
    ]
    
    errors = []

    providers = ["gemini", "groq", "openai"] if settings.LLM_PROVIDER.lower() == "gemini" else ["groq", "gemini", "openai"]

    for provider in providers:
        try:
            logger.info(f"Attempting job extraction with Provider: {provider.upper()}")
            if provider == "gemini":
                return _try_gemini(messages)
            elif provider == "groq":
                return _try_groq(messages)
            elif provider == "openai":
                return _try_openai(messages)
        except Exception as exc:
            err_msg = f"{provider.capitalize()} failed: {str(exc) or repr(exc)}"
            logger.warning(err_msg)
            errors.append(err_msg)

    # All providers failed
    full_error_details = " | ".join(errors)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"All LLM job extraction providers failed. Details: {full_error_details}",
    )

