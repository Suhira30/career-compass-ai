"""
LLM Resume Structured Extraction Service
LLM Resume Structured Extraction Service with Multi-Provider Fallback (Groq -> Gemini -> OpenAI)
"""

import logging
from fastapi import HTTPException, status
from langchain_groq import ChatGroq
from app.core import settings
from app.models.resume import ExtractedResumeData

logger = logging.getLogger(__name__)

RESUME_EXTRACTION_SYSTEM_PROMPT = """
You are an expert AI Resume Parser and Career Data Analyst.
Your task is to analyze raw text extracted from a user's resume and accurately extract structured entity data into the exact required JSON schema.

Extraction Guidelines:
- Extract all technical skills (programming languages, frameworks, databases, tools, cloud platforms).
- Extract all soft skills (leadership, communication, problem-solving, teamwork, adaptability).
- Extract education history (degree name, institution, graduation year if available).
- Extract work experience (company, role, employment duration, key highlights/achievements).
- Extract projects (project title, tech stack / description).
- Extract certifications and any verifiable URLs/links.
- Extract web links (GitHub URL, LinkedIn profile URL, portfolio/personal website).
- If an optional field is missing or not mentioned in the resume, return null or empty list.
"""


def extract_resume_info(resume_text: str) -> ExtractedResumeData:
    """
    Extracts structured entities from resume text using Groq LLM (Llama-3.3-70b-versatile).
    """
def _try_groq(messages) -> ExtractedResumeData:
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Groq API Key is missing. Please set GROQ_API_KEY in backend environment.",
        )
        raise ValueError("GROQ_API_KEY is not configured.")
    
    from langchain_groq import ChatGroq
    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.GROQ_MODEL,
        temperature=0.1,
    )
    structured_llm = llm.with_structured_output(ExtractedResumeData)
    return structured_llm.invoke(messages)


def _try_gemini(messages) -> ExtractedResumeData:
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")
    
    try:
        llm = ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model_name="llama-3.3-70b-versatile",
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            google_api_key=settings.GEMINI_API_KEY,
            model=settings.GEMINI_MODEL,
            temperature=0.1,
        )
        structured_llm = llm.with_structured_output(ExtractedResumeData)
        return structured_llm.invoke(messages)
    except ImportError:
        # Fallback to google.generativeai if langchain package wrapper is missing
        import google.generativeai as genai
        import json
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        prompt_str = f"{RESUME_EXTRACTION_SYSTEM_PROMPT}\n\n{messages[-1][1]}\n\nReturn JSON matching schema: {ExtractedResumeData.model_json_schema()}"
        response = model.generate_content(prompt_str)
        cleaned_json = response.text.strip().removeprefix("```json").removesuffix("```").strip()
        data_dict = json.loads(cleaned_json)
        return ExtractedResumeData.model_validate(data_dict)

        messages = [
            ("system", RESUME_EXTRACTION_SYSTEM_PROMPT),
            ("human", f"Resume Text:\n\n{resume_text}"),
        ]

        extracted_data: ExtractedResumeData = structured_llm.invoke(messages)
        return extracted_data
def _try_openai(messages) -> ExtractedResumeData:
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not configured.")
    
    from langchain_openai import ChatOpenAI
    llm = ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model=settings.OPENAI_MODEL,
        temperature=0.1,
    )
    structured_llm = llm.with_structured_output(ExtractedResumeData)
    return structured_llm.invoke(messages)


def extract_resume_info(resume_text: str) -> ExtractedResumeData:
    """
    Extracts structured entities from resume text with multi-LLM resilience fallback:
    1. Primary: Groq LPU (Llama 3.3 70B)
    2. Fallback 1: Google Gemini (Gemini 2.0 Flash)
    3. Fallback 2: OpenAI (GPT-4o mini)
    """
    messages = [
        ("system", RESUME_EXTRACTION_SYSTEM_PROMPT),
        ("human", f"Resume Text:\n\n{resume_text}"),
    ]
    
    errors = []

    # 1. Attempt Primary Provider: Groq
    try:
        logger.info("Attempting resume extraction with Primary LLM Provider: Groq")
        return _try_groq(messages)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume AI extraction failed: {str(exc)}",
        )
        err_msg = f"Primary LLM Groq failed: {str(exc)}"
        logger.warning(err_msg)
        errors.append(err_msg)

    # 2. Attempt Fallback Provider 1: Gemini
    try:
        logger.info("Attempting resume extraction with Fallback LLM Provider 1: Gemini")
        return _try_gemini(messages)
    except Exception as exc:
        err_msg = f"Fallback LLM Gemini failed: {str(exc)}"
        logger.warning(err_msg)
        errors.append(err_msg)

    # 3. Attempt Fallback Provider 2: OpenAI
    try:
        logger.info("Attempting resume extraction with Fallback LLM Provider 2: OpenAI")
        return _try_openai(messages)
    except Exception as exc:
        err_msg = f"Fallback LLM OpenAI failed: {str(exc)}"
        logger.warning(err_msg)
        errors.append(err_msg)

    # All providers failed
    full_error_details = " | ".join(errors)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"All LLM extraction providers failed. Details: {full_error_details}",
    )
