"""
LLM Job Description Structured Extraction Service
Powered by unified Base Extractor Engine (Gemini native JSON -> Groq candidates -> OpenAI)
"""

import logging
from app.models.job import ExtractedJobData
from app.services.extractors.base_extractor import extract_structured_data

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


def extract_job_info(raw_job_description: str) -> ExtractedJobData:
    """
    Extracts structured criteria from job description text using unified multi-provider fallback engine:
    1. Primary: Google Gemini (Native JSON mode)
    2. Fallback 1: Groq LPU (Dynamic candidates)
    3. Fallback 2: OpenAI (GPT-4o mini)
    """
    return extract_structured_data(
        raw_text=raw_job_description,
        system_prompt=JOB_EXTRACTION_SYSTEM_PROMPT,
        schema_class=ExtractedJobData,
        task_name="Job Description Extraction",
    )
