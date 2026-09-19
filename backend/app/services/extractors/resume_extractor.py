"""
LLM Resume Structured Extraction Service
Powered by unified Base Extractor Engine (Gemini native JSON -> Groq candidates -> OpenAI)
"""

import logging
from app.models.resume import ExtractedResumeData
from app.services.extractors.base_extractor import extract_structured_data

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
    Extracts structured entities from resume text using unified multi-provider fallback engine:
    1. Primary: Google Gemini (Native JSON mode)
    2. Fallback 1: Groq LPU (Dynamic candidates)
    3. Fallback 2: OpenAI (GPT-4o mini)
    """
    return extract_structured_data(
        raw_text=resume_text,
        system_prompt=RESUME_EXTRACTION_SYSTEM_PROMPT,
        schema_class=ExtractedResumeData,
        task_name="Resume Extraction",
    )
