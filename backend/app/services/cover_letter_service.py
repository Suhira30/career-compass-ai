"""
Cover Letter & Outreach Generation Service

Synthesizes candidate background, matched skills, and matching project details
into high-converting, ATS-tailored cover letters, application emails, and recruiter cold outreach.
Multi-provider LLM chain: Gemini -> Groq -> OpenAI -> Rule-based Grounded Fallback.
"""

import logging
import re
from typing import Tuple, List, Optional
from langchain_core.prompts import ChatPromptTemplate
from app.core import settings
from app.core.llm_provider_key import (
    get_active_gemini_key,
    is_quota_exhausted_error,
)
from app.models.cover_letter import CoverLetterRequest, CoverLetterResponse

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Career Compass AI, an elite Executive Career Strategist and Technical Recruiter.
Your objective is to craft persuasive, high-conversion job application materials that highlight the candidate's matching technical projects, verified strengths, and alignment with the target role.

Core Guidelines:
1. Grounding in Projects: You MUST explicitly integrate the candidate's matching projects, citing specific technical details, architecture decisions, or measurable impact from their descriptions.
2. Skill Alignment: Seamlessly weave the matched skills into the narrative without sounding like a keyword checklist.
3. Tone Fidelity: Strictly follow the requested tone (e.g. confident and direct, formal and traditional, enthusiastic, or concise).
4. No Generic Filler: Avoid cliches like "I am writing to express my interest..." or "I am a hard worker." Open with a compelling hook demonstrating competence and relevance.
5. Missing Skills (if any): Frame any mentioned gaps constructively around active upskilling, rapid learning velocity, or transferable concepts.
6. Email Formats: If generating an email ('recruiter_email' or 'application_email'), format the very first line as:
   Subject: <Compelling, ATS-Friendly Subject Line>
   Followed by a blank line, then the email body.
"""

USER_PROMPT_TEMPLATE = """
Candidate Name: {candidate_name}
Target Role: {target_role}
Target Company: {company_name}

Candidate Matched Skills:
{matched_skills_str}

Candidate Matching Projects:
{projects_str}

Candidate Background & Experience Highlights:
{experience_str}

Target Job Description / Key Requirements:
{job_description_str}

Document Type to Generate: {generation_type}
Desired Tone: {tone}

Instructions for Document Type:
- 'cover_letter': Write a persuasive 3 to 4 paragraph letter connecting the candidate's matching projects and matched skills directly to the employer's needs. Include a professional sign-off.
- 'application_email': Write a polished, professional email (150-220 words) accompanying a resume submission. Include a crisp subject line, 2-3 focused paragraphs spotlighting a flagship project, and call to action.
- 'recruiter_email': Write a high-response cold outreach email or LinkedIn InMail (100-140 words). Include a compelling subject line, hook, brief reference to a matching project, and a low-friction question or call to action.

Generate the complete document now.
"""


def _format_projects(request: CoverLetterRequest) -> str:
    if not request.projects:
        return "None explicitly provided. Refer to core technical strengths."
    lines = []
    for idx, p in enumerate(request.projects, 1):
        desc = f": {p.description}" if p.description else ""
        lines.append(f"{idx}. {p.title}{desc}")
    return "\n".join(lines)


def _extract_subject_and_content(raw_text: str, generation_type: str) -> Tuple[Optional[str], str]:
    """
    Extracts Subject: line if present from email formats.
    """
    subject = None
    clean_content = raw_text.strip()

    subject_match = re.search(r"^(?:Subject|SUBJECT):\s*(.+)$", clean_content, re.MULTILINE)
    if subject_match:
        subject = subject_match.group(1).strip()
        # Remove the subject line and immediate blank lines
        clean_content = re.sub(r"^(?:Subject|SUBJECT):\s*.+\n*", "", clean_content).strip()
    elif generation_type in ("application_email", "recruiter_email"):
        subject = f"Application: {raw_text.splitlines()[0][:60]}"

    return subject, clean_content


def _generate_fallback(request: CoverLetterRequest) -> CoverLetterResponse:
    """
    Deterministic grounded fallback generator used if all external LLMs are unavailable or quota-limited.
    """
    name = request.candidate_name or "Candidate"
    company = request.company_name or "your team"
    role = request.target_role
    skills_str = ", ".join(request.matched_skills[:4]) if request.matched_skills else "modern software engineering practices"

    project_highlights = []
    for p in request.projects[:2]:
        desc = f" ({p.description})" if p.description else ""
        project_highlights.append(f"**{p.title}**{desc}")
    
    project_text = "; and ".join(project_highlights) if project_highlights else "hands-on production engineering workflows"

    if request.generation_type == "recruiter_email":
        subject = f"Connecting regarding {role} opening at {company}"
        content = (
            f"Hi there,\n\n"
            f"I came across the {role} opportunity at {company} and wanted to reach out directly. "
            f"With a strong foundation in {skills_str}, I recently completed {project_text}, "
            f"delivering resilient, scalable architectures that align closely with what {company} is building.\n\n"
            f"Given your focus on high-impact engineering, I would value the chance to learn more about your current technical roadmap. "
            f"Do you have 10 minutes next week for a brief conversation?\n\n"
            f"Best regards,\n{name}"
        )
    elif request.generation_type == "application_email":
        subject = f"Application for {role} - {name}"
        content = (
            f"Dear Hiring Team,\n\n"
            f"Please accept this application for the {role} position at {company}. "
            f"My technical background centers on {skills_str}, complemented by real-world system implementations like {project_text}.\n\n"
            f"I have attached my resume detailing my accomplishments and technical proficiencies. "
            f"I am eager to discuss how my hands-on background and rapid learning velocity will add immediate value to {company}.\n\n"
            f"Thank you for your time and consideration.\n\n"
            f"Sincerely,\n{name}"
        )
    else:  # cover_letter
        subject = None
        content = (
            f"Dear Hiring Manager,\n\n"
            f"I am writing to express my strong interest in the {role} role at {company}. "
            f"With targeted expertise in {skills_str}, I combine deep technical problem solving with a commitment to engineering excellence and measurable business outcomes.\n\n"
            f"A core demonstration of my technical capabilities is my work on {project_text}. "
            f"Through this initiative, I solved complex engineering challenges, architected modular components, and ensured reliability under production demands—standards I am enthusiastic to bring to {company}.\n\n"
            f"What attracts me most to {company} is your technical rigor and drive for innovation. "
            f"My background equips me to make immediate contributions while continuously expanding my technical scope to meet your team's objectives.\n\n"
            f"Thank you for reviewing my qualifications. I welcome the opportunity to discuss how my skill set and project track record align with your hiring goals.\n\n"
            f"Sincerely,\n{name}"
        )

    return CoverLetterResponse(
        generation_type=request.generation_type,
        subject_line=subject,
        content=content,
        matching_projects_highlighted=[p.title for p in request.projects],
        key_strengths_referenced=request.matched_skills[:5],
    )


def generate_cover_letter(request: CoverLetterRequest) -> CoverLetterResponse:
    """
    Executes cover letter / outreach generation using multi-provider fallback.
    """
    candidate_name = request.candidate_name or "Candidate"
    company_name = request.company_name or "Hiring Organization"
    matched_skills_str = ", ".join(request.matched_skills) if request.matched_skills else "Full-stack software engineering proficiencies"
    projects_str = _format_projects(request)
    experience_str = request.work_experience_summary or "Proven technical contributions across software systems."
    job_description_str = request.job_description[:1200] if request.job_description else f"Requirements for {request.target_role} role."

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", USER_PROMPT_TEMPLATE),
    ])

    prompt_vars = {
        "candidate_name": candidate_name,
        "target_role": request.target_role,
        "company_name": company_name,
        "matched_skills_str": matched_skills_str,
        "projects_str": projects_str,
        "experience_str": experience_str,
        "job_description_str": job_description_str,
        "generation_type": request.generation_type,
        "tone": request.tone,
    }

    # 1. Primary: Gemini
    active_gemini_key = get_active_gemini_key()
    if active_gemini_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(google_api_key=active_gemini_key, model=settings.GEMINI_MODEL, temperature=0.4)
            chain = prompt_template | llm
            res = chain.invoke(prompt_vars)
            raw_text = res.content if hasattr(res, "content") else str(res)
            subject, content = _extract_subject_and_content(raw_text, request.generation_type)
            return CoverLetterResponse(
                generation_type=request.generation_type,
                subject_line=subject,
                content=content,
                matching_projects_highlighted=[p.title for p in request.projects],
                key_strengths_referenced=request.matched_skills[:6],
            )
        except Exception as exc:
            logger.warning(f"Gemini Cover Letter generation failed: {exc}")

    # 2. Fallback 1: Groq
    if settings.GROQ_API_KEY:
        try:
            from langchain_groq import ChatGroq
            llm = ChatGroq(api_key=settings.GROQ_API_KEY, model_name=settings.GROQ_MODEL, temperature=0.4)
            chain = prompt_template | llm
            res = chain.invoke(prompt_vars)
            raw_text = res.content if hasattr(res, "content") else str(res)
            subject, content = _extract_subject_and_content(raw_text, request.generation_type)
            return CoverLetterResponse(
                generation_type=request.generation_type,
                subject_line=subject,
                content=content,
                matching_projects_highlighted=[p.title for p in request.projects],
                key_strengths_referenced=request.matched_skills[:6],
            )
        except Exception as exc:
            logger.warning(f"Groq Cover Letter generation failed: {exc}")

    # 3. Fallback 2: OpenAI
    if settings.OPENAI_API_KEY:
        try:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(api_key=settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL, temperature=0.4)
            chain = prompt_template | llm
            res = chain.invoke(prompt_vars)
            raw_text = res.content if hasattr(res, "content") else str(res)
            subject, content = _extract_subject_and_content(raw_text, request.generation_type)
            return CoverLetterResponse(
                generation_type=request.generation_type,
                subject_line=subject,
                content=content,
                matching_projects_highlighted=[p.title for p in request.projects],
                key_strengths_referenced=request.matched_skills[:6],
            )
        except Exception as exc:
            logger.warning(f"OpenAI Cover Letter generation failed: {exc}")

    # 4. Ultimate Grounded Fallback
    logger.info("Using grounded deterministic fallback for cover letter / outreach.")
    return _generate_fallback(request)
