"""
Skill Categorization Engine & Readiness Scorer Service with Explicit LCEL Runnable Chains
"""

import logging
from typing import Tuple, List
from fastapi import HTTPException, status
from langchain_core.prompts import ChatPromptTemplate
from app.core import settings
from app.core.llm_provider_key import (
    get_active_gemini_key,
    is_quota_exhausted_error,
    LLMQuotaExhaustedException,
)
from app.models.analysis import SkillMatrix, QualitativeAssessment
from app.models.profile import UserProfileDetail
from app.models.job import ExtractedJobData

logger = logging.getLogger(__name__)

ASSESSMENT_SYSTEM_PROMPT = """
You are an expert Senior Technical Career Strategist and AI Hiring Analyst.
Your task is to analyze candidate profile details and target job description requirements, and produce a constructive qualitative assessment.

Evaluation Guidelines:
- Highlight key candidate strengths relevant to the job.
- Identify specific critical skill gaps.
- Note potential risk areas or weaknesses.
- Provide actionable, prioritized upskilling recommendations.
"""


def compute_skill_matrix_and_score(
    user_skills: List[str],
    job_required: List[str],
    job_preferred: List[str],
) -> Tuple[SkillMatrix, float, str]:
    """
    Computes deterministic skill overlap, 3-way matrix categorization, and match score percentage.
    """
    user_skills_set = {s.strip().lower() for s in user_skills if s and s.strip()}
    req_set = {s.strip().lower() for s in job_required if s and s.strip()}
    pref_set = {s.strip().lower() for s in job_preferred if s and s.strip()}
    
    all_job_skills_lower = req_set.union(pref_set)
    if not all_job_skills_lower:
        # Fallback if JD has no explicit skills listed
        return (
            SkillMatrix(matched_skills=user_skills, missing_skills=[], partially_available_skills=[]),
            100.0,
            "High Match",
        )

    matched_lower = set()
    partial_lower = set()
    missing_lower = set()

    for skill in job_required + job_preferred:
        s_lower = skill.strip().lower()
        if not s_lower:
            continue

        if s_lower in user_skills_set:
            matched_lower.add(skill.strip())
        else:
            # Check for partial keyword overlap (e.g. user knows "Python", job wants "Python 3")
            has_partial = any(
                u_skill in s_lower or s_lower in u_skill
                for u_skill in user_skills_set
                if len(u_skill) > 2
            )
            if has_partial:
                partial_lower.add(skill.strip())
            else:
                missing_lower.add(skill.strip())

    matched_skills = list(matched_lower)
    partially_available_skills = list(partial_lower)
    missing_skills = list(missing_lower)

    # Weighted scoring formula: required skills (weight 1.0), preferred skills (weight 0.5), partials (weight 0.5)
    total_points = (len(req_set) * 1.0) + (len(pref_set) * 0.5)
    if total_points <= 0:
        total_points = 1.0

    earned_points = 0.0
    for req in req_set:
        req_orig = next((s for s in job_required if s.strip().lower() == req), req)
        if req_orig in matched_skills:
            earned_points += 1.0
        elif req_orig in partially_available_skills:
            earned_points += 0.5

    for pref in pref_set:
        pref_orig = next((s for s in job_preferred if s.strip().lower() == pref), pref)
        if pref_orig in matched_skills:
            earned_points += 0.5
        elif pref_orig in partially_available_skills:
            earned_points += 0.25

    match_score_percentage = min(100.0, max(0.0, round((earned_points / total_points) * 100.0, 1)))

    # Classification logic
    if match_score_percentage >= 75.0:
        readiness_category = "High Match"
    elif match_score_percentage >= 50.0:
        readiness_category = "Moderate Match"
    else:
        readiness_category = "Low Match"

    matrix = SkillMatrix(
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        partially_available_skills=partially_available_skills,
    )

    return matrix, match_score_percentage, readiness_category


def _get_prompt_template() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages([
        ("system", ASSESSMENT_SYSTEM_PROMPT),
        ("human", "{gap_summary}"),
    ])


def _try_groq_lcel(summary_text: str) -> QualitativeAssessment:
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is missing")
    from langchain_groq import ChatGroq

    candidate_models = ["gemma2-9b-it", "mixtral-8x7b-32768", "llama-3.3-70b-versatile"]
    preferred = settings.GROQ_MODEL
    if preferred and preferred not in ("llama-3.1-8b-instant", "llama3-70b-8192", "llama3-8b-8192"):
        if preferred in candidate_models:
            candidate_models.remove(preferred)
        candidate_models.insert(0, preferred)

    last_err: Exception | None = None
    for m in candidate_models:
        try:
            llm = ChatGroq(
                api_key=settings.GROQ_API_KEY,
                model_name=m,
                temperature=0.1,
            )
            structured_llm = llm.with_structured_output(QualitativeAssessment)
            lcel_chain = _get_prompt_template() | structured_llm
            return lcel_chain.invoke({"gap_summary": summary_text})
        except Exception as exc:
            last_err = exc
            continue
    raise last_err or RuntimeError("All Groq candidates failed in skill matcher.")


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


def _try_gemini_lcel(summary_text: str) -> QualitativeAssessment:
    active_key = get_active_gemini_key()
    if not active_key:
        raise ValueError("GEMINI_API_KEY is missing")

    import google.generativeai as genai
    import json
    genai.configure(api_key=active_key)

    models_to_try = [settings.GEMINI_MODEL, "gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
    models_to_try = list(dict.fromkeys([m for m in models_to_try if m]))

    prompt_str = f"{ASSESSMENT_SYSTEM_PROMPT}\n\n{summary_text}\n\nReturn valid JSON matching schema: {json.dumps(QualitativeAssessment.model_json_schema())}"
    last_err: Exception | None = None
    for gm in models_to_try:
        try:
            model = genai.GenerativeModel(gm, generation_config={"response_mime_type": "application/json", "temperature": 0.1})
            response = model.generate_content(prompt_str)
            raw = _extract_text_from_gemini_response(response)
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            return QualitativeAssessment.model_validate(json.loads(raw))
        except Exception as g_err:
            last_err = g_err
            continue
    raise last_err or RuntimeError("All Gemini candidates failed in skill matcher.")


def _try_openai_lcel(summary_text: str) -> QualitativeAssessment:
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is missing")
    from langchain_openai import ChatOpenAI
    llm = ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model=settings.OPENAI_MODEL,
        temperature=0.1,
    )
    structured_llm = llm.with_structured_output(QualitativeAssessment)
    # Explicit LCEL Runnable Chain Composition
    lcel_chain = _get_prompt_template() | structured_llm
    return lcel_chain.invoke({"gap_summary": summary_text})


def generate_qualitative_assessment(
    profile: UserProfileDetail,
    job: ExtractedJobData,
    matrix: SkillMatrix,
    score: float,
    category: str,
) -> QualitativeAssessment:
    """
    Generates qualitative strengths, skill gaps, weaknesses, and recommendations using explicit LCEL Runnable Chains (prompt | model) with multi-provider fallback.
    """
    summary_text = f"""
Candidate Name: {profile.full_name}
Current Role: {profile.current_role}
Target Role: {profile.target_role}
User Skills: {', '.join(profile.skills)}

Target Job Title: {job.job_title}
Required Job Skills: {', '.join(job.required_skills)}
Preferred Job Skills: {', '.join(job.preferred_skills)}
Required Experience: {job.required_experience}

Skill Matrix Analysis:
- Matched Skills: {', '.join(matrix.matched_skills) if matrix.matched_skills else 'None'}
- Missing Skills: {', '.join(matrix.missing_skills) if matrix.missing_skills else 'None'}
- Partially Available Skills: {', '.join(matrix.partially_available_skills) if matrix.partially_available_skills else 'None'}

Overall Readiness: {category} ({score}%)
"""

    # Multi-provider LCEL Runnable Chain Fallback based on configured LLM_PROVIDER
    providers = ["gemini", "groq", "openai"] if settings.LLM_PROVIDER.lower() == "gemini" else ["groq", "gemini", "openai"]
    errors = []
    for p in providers:
        try:
            if p == "gemini":
                return _try_gemini_lcel(summary_text)
            elif p == "groq":
                return _try_groq_lcel(summary_text)
            elif p == "openai":
                return _try_openai_lcel(summary_text)
        except Exception as exc:
            logger.warning(f"{p.capitalize()} LCEL chain assessment failed: {exc}")
            errors.append(exc)

    if any(is_quota_exhausted_error(e) for e in errors):
        raise LLMQuotaExhaustedException(
            message="AI model quota for skill gap analysis is exhausted. Please supply your own free Gemini API key to proceed."
        )

    # Fallback heuristic assessment if LLMs are offline
    return QualitativeAssessment(
        strengths=[f"Strong background in {', '.join(matrix.matched_skills[:2])}"] if matrix.matched_skills else ["Relevant technical background"],
        skill_gaps=[f"Missing experience with {', '.join(matrix.missing_skills[:2])}"] if matrix.missing_skills else ["No major skill gaps identified"],
        potential_weaknesses=["Needs exposure to target role's core technologies"] if matrix.missing_skills else ["General domain readiness"],
        recommended_improvements=[f"Focus on learning {s} first" for s in matrix.missing_skills[:3]] or ["Maintain current skill proficiency"],
    )
