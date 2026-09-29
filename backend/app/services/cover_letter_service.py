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
from app.core.model_resolver import (
    get_active_gemini_models,
    get_active_groq_models,
    mark_gemini_model_deprecated,
    mark_groq_model_deprecated,
    is_model_deprecated_error,
)
from app.models.cover_letter import CoverLetterRequest, CoverLetterResponse

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Career Compass AI, an elite Executive Career Strategist and Technical Recruiter.
Your objective is to craft persuasive, high-conversion job application materials that highlight the candidate's matching technical projects, verified strengths, and alignment with the target role.

Core Guidelines:
1. Grounding in Projects: You MUST explicitly integrate the candidate's matching projects, citing specific technical details, architecture decisions, or measurable impact from their descriptions.
2. Academic Grounding: Always mention where the candidate graduated from (their university / institution) and their degree. If a CGPA or highest SGPA is provided, seamlessly reference this strong academic track record to substantiate engineering discipline.
3. Skill Alignment: Seamlessly weave the matched skills into the narrative without sounding like a keyword checklist.
4. Tone Fidelity: Strictly follow the requested tone (e.g. confident and direct, formal and traditional, enthusiastic, or concise).
5. No Generic Filler: Avoid cliches like "I am writing to express my interest..." or "I am a hard worker." Open with a compelling hook demonstrating competence and relevance.
6. Missing Skills (if any): Frame any mentioned gaps constructively around active upskilling, rapid learning velocity, or transferable concepts.
7. Sign-off & Real Contact Details: Conclude the document with:
   Best regards,

   {candidate_name}
   {signoff_contacts}
   CRITICAL: NEVER output generic bracket placeholders like '[Contact Information / LinkedIn / GitHub]' or '[Phone]'. Only output real contact details if provided; otherwise, just the candidate's name.
8. Email Formats: If generating an email ('recruiter_email' or 'application_email'), format the very first line as:
   Subject: <Compelling, ATS-Friendly Subject Line>
   Followed by a blank line, then the email body.
"""

USER_PROMPT_TEMPLATE = """
Candidate Name: {candidate_name}
Target Role: {target_role}
Target Company: {company_name}

Candidate Academic & University Background:
{academic_str}

Candidate Matched Skills:
{matched_skills_str}

Candidate Matching Projects:
{projects_str}

Candidate Background & Experience Highlights:
{experience_str}

Target Job Description / Key Requirements:
{job_description_str}

Candidate Contact Details to Include in Sign-off:
{signoff_contacts_str}

Document Type to Generate: {generation_type}
Desired Tone: {tone}

Instructions for Document Type:
- 'cover_letter': Write a persuasive 3 to 4 paragraph letter connecting the candidate's matching projects, academic foundation, and matched skills directly to the employer's needs. Include professional sign-off with provided contact details.
- 'application_email': Write a polished, professional email (150-220 words) accompanying a resume submission. Include a crisp subject line, 2-3 focused paragraphs spotlighting a flagship project and degree background, and call to action.
- 'recruiter_email': Write a high-response cold outreach email or LinkedIn InMail (100-140 words). Include a compelling subject line, hook, brief reference to a matching project, and a low-friction question or call to action.

Generate the complete document now.
"""


def _format_contact_signoff(request: CoverLetterRequest) -> str:
    """
    Builds clean, professional contact details to place directly underneath the candidate's name.
    Omits missing lines cleanly without generic bracket placeholders.
    """
    lines = []
    contact_parts = []
    if request.phone:
        contact_parts.append(request.phone.strip())
    if request.email:
        contact_parts.append(request.email.strip())
    if contact_parts:
        lines.append(" • ".join(contact_parts))

    links = []
    if request.linkedin_url:
        links.append(f"LinkedIn: {request.linkedin_url.strip()}")
    if request.github_url:
        links.append(f"GitHub: {request.github_url.strip()}")
    if request.portfolio_url:
        links.append(f"Portfolio: {request.portfolio_url.strip()}")
    if links:
        lines.append(" | ".join(links))

    return "\n".join(lines)


def _format_academic_summary(request: CoverLetterRequest) -> str:
    parts = []
    if request.institution:
        deg = f" with a degree in {request.degree.strip()}" if request.degree else ""
        parts.append(f"Graduated from {request.institution.strip()}{deg}")
    elif request.degree:
        parts.append(f"Degree: {request.degree.strip()}")

    if request.gpa:
        parts.append(f"Academic Standing / CGPA / SGPA: {request.gpa.strip()}")

    return ". ".join(parts) if parts else "Solid foundational technical background."


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

    # Academic narrative insertion
    edu_text = ""
    if request.institution:
        deg_str = f" with a {request.degree}" if request.degree else ""
        gpa_str = f" (Academic CGPA: {request.gpa})" if request.gpa else ""
        edu_text = f"Graduating from {request.institution}{deg_str}{gpa_str}, I established strong fundamentals in computer science and scalable systems. "

    signoff_lines = [f"Best regards,\n{name}"]
    contacts = _format_contact_signoff(request)
    if contacts:
        signoff_lines.append(contacts)
    full_signoff = "\n".join(signoff_lines)

    if request.generation_type == "recruiter_email":
        subject = f"Connecting regarding {role} opening at {company}"
        content = (
            f"Hi there,\n\n"
            f"I came across the {role} opportunity at {company} and wanted to reach out directly. "
            f"{edu_text}"
            f"With a strong foundation in {skills_str}, I recently completed {project_text}, "
            f"delivering resilient, scalable architectures that align closely with what {company} is building.\n\n"
            f"Given your focus on high-impact engineering, I would value the chance to learn more about your current technical roadmap. "
            f"Do you have 10 minutes next week for a brief conversation?\n\n"
            f"{full_signoff}"
        )
    elif request.generation_type == "application_email":
        subject = f"Application for {role} - {name}"
        content = (
            f"Dear Hiring Team,\n\n"
            f"Please accept this application for the {role} position at {company}. "
            f"{edu_text}"
            f"My technical background centers on {skills_str}, complemented by real-world system implementations like {project_text}.\n\n"
            f"I have attached my resume detailing my accomplishments and technical proficiencies. "
            f"I am eager to discuss how my hands-on background and rapid learning velocity will add immediate value to {company}.\n\n"
            f"Thank you for your time and consideration.\n\n"
            f"{full_signoff}"
        )
    else:  # cover_letter
        subject = None
        content = (
            f"Dear Hiring Manager,\n\n"
            f"I am writing to express my strong interest in the {role} role at {company}. "
            f"{edu_text}"
            f"With targeted expertise in {skills_str}, I combine deep technical problem solving with a commitment to engineering excellence and measurable business outcomes.\n\n"
            f"A core demonstration of my technical capabilities is my work on {project_text}. "
            f"Through this initiative, I solved complex engineering challenges, architected modular components, and ensured reliability under production demands—standards I am enthusiastic to bring to {company}.\n\n"
            f"What attracts me most to {company} is your technical rigor and drive for innovation. "
            f"My background equips me to make immediate contributions while continuously expanding my technical scope to meet your team's objectives.\n\n"
            f"Thank you for reviewing my qualifications. I welcome the opportunity to discuss how my skill set and project track record align with your hiring goals.\n\n"
            f"{full_signoff}"
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
    academic_str = _format_academic_summary(request)
    signoff_contacts_str = _format_contact_signoff(request) or "None provided (use candidate name only)"

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", USER_PROMPT_TEMPLATE),
    ])

    prompt_vars = {
        "candidate_name": candidate_name,
        "target_role": request.target_role,
        "company_name": company_name,
        "academic_str": academic_str,
        "matched_skills_str": matched_skills_str,
        "projects_str": projects_str,
        "experience_str": experience_str,
        "job_description_str": job_description_str,
        "signoff_contacts_str": signoff_contacts_str,
        "generation_type": request.generation_type,
        "tone": request.tone,
    }

    # 1. Primary: Gemini
    active_gemini_key = get_active_gemini_key()
    if active_gemini_key:
        import google.generativeai as genai
        genai.configure(api_key=active_gemini_key)
        prompt_text = f"{SYSTEM_PROMPT}\n\n{USER_PROMPT_TEMPLATE.format(**prompt_vars)}"
        for model_name in get_active_gemini_models():
            try:
                model = genai.GenerativeModel(model_name=model_name, generation_config={"temperature": 0.4})
                response = model.generate_content(prompt_text)
                raw_text = response.text.strip() if hasattr(response, "text") else ""
                subject, content = _extract_subject_and_content(raw_text, request.generation_type)
                return CoverLetterResponse(
                    generation_type=request.generation_type,
                    subject_line=subject,
                    content=content,
                    matching_projects_highlighted=[p.title for p in request.projects],
                    key_strengths_referenced=request.matched_skills[:6],
                )
            except Exception as exc:
                if is_model_deprecated_error(exc):
                    mark_gemini_model_deprecated(model_name)
                logger.warning(f"Gemini Cover Letter candidate '{model_name}' failed: {exc}")
                continue

    # 2. Fallback 1: Groq
    if settings.GROQ_API_KEY:
        from langchain_groq import ChatGroq
        for model_name in get_active_groq_models():
            try:
                llm = ChatGroq(api_key=settings.GROQ_API_KEY, model_name=model_name, temperature=0.4)
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
                if is_model_deprecated_error(exc):
                    mark_groq_model_deprecated(model_name)
                logger.warning(f"Groq Cover Letter candidate '{model_name}' failed: {exc}")
                continue

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
