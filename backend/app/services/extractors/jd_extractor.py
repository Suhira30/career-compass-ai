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


def _try_groq(messages) -> ExtractedJobData:
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured.")
    
    from langchain_groq import ChatGroq
    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.GROQ_MODEL,
        temperature=0.1,
    )
    structured_llm = llm.with_structured_output(ExtractedJobData)
    return structured_llm.invoke(messages)


def _try_gemini(messages) -> ExtractedJobData:
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")
    
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            google_api_key=settings.GEMINI_API_KEY,
            model=settings.GEMINI_MODEL,
            temperature=0.1,
        )
        structured_llm = llm.with_structured_output(ExtractedJobData)
        return structured_llm.invoke(messages)
    except ImportError:
        import google.generativeai as genai
        import json
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        prompt_str = f"{JOB_EXTRACTION_SYSTEM_PROMPT}\n\n{messages[-1][1]}\n\nReturn JSON matching schema: {ExtractedJobData.model_json_schema()}"
        response = model.generate_content(prompt_str)
        cleaned_json = response.text.strip().removeprefix("```json").removesuffix("```").strip()
        data_dict = json.loads(cleaned_json)
        return ExtractedJobData.model_validate(data_dict)


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

    # 1. Attempt Primary Provider: Groq
    try:
        logger.info("Attempting job extraction with Primary LLM Provider: Groq")
        return _try_groq(messages)
    except Exception as exc:
        err_msg = f"Primary LLM Groq failed: {str(exc)}"
        logger.warning(err_msg)
        errors.append(err_msg)

    # 2. Attempt Fallback Provider 1: Gemini
    try:
        logger.info("Attempting job extraction with Fallback LLM Provider 1: Gemini")
        return _try_gemini(messages)
    except Exception as exc:
        err_msg = f"Fallback LLM Gemini failed: {str(exc)}"
        logger.warning(err_msg)
        errors.append(err_msg)

    # 3. Attempt Fallback Provider 2: OpenAI
    try:
        logger.info("Attempting job extraction with Fallback LLM Provider 2: OpenAI")
        return _try_openai(messages)
    except Exception as exc:
        err_msg = f"Fallback LLM OpenAI failed: {str(exc)}"
        logger.warning(err_msg)
        errors.append(err_msg)

    # All providers failed
    full_error_details = " | ".join(errors)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"All LLM job extraction providers failed. Details: {full_error_details}",
    )

