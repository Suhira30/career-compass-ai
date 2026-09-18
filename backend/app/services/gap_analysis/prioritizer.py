"""
Skill Prioritization & Personalized Learning Roadmap Generator Service (Explicit LCEL Chain)
"""

import logging
from typing import List, Tuple
from fastapi import HTTPException, status
from langchain_core.prompts import ChatPromptTemplate
from app.core import settings
from app.models.roadmap import PrioritizationBadges, WeeklyMilestone, RoadmapGenerateResponse
from app.models.analysis import GapAnalysisResponse

logger = logging.getLogger(__name__)

ROADMAP_SYSTEM_PROMPT = """
You are an expert AI EdTech Curriculum Designer and Technical Learning Coach.
Your task is to analyze missing skills from a candidate's gap analysis and construct a structured, week-by-week personalized upskilling plan.

Guidelines:
- Categorize missing skills into 3 Priority Badges: Priority 1 (Critical prerequisites), Priority 2 (High competency skills), Priority 3 (Secondary bonus skills).
- Build a week-by-week learning plan matching exact duration: {duration_weeks} weeks.
- Ensure target hours per week match the candidate's budget: {weekly_hours} hours/week.
- Provide practical tasks and verified documentation link resources for each week.
"""


class RoadmapGeneratedPayload(RoadmapGenerateResponse):
    pass


def categorize_skill_priorities(missing_skills: List[str], partial_skills: List[str]) -> PrioritizationBadges:
    """
    Categorizes skills into Priority 1 (Critical), Priority 2 (High), and Priority 3 (Secondary).
    """
    p1 = []
    p2 = []
    p3 = []

    combined = missing_skills + [s for s in partial_skills if s not in missing_skills]
    if not combined:
        return PrioritizationBadges(
            priority_1_critical=["Continuous Learning"],
            priority_2_high=["System Design"],
            priority_3_secondary=["Cloud Optimization"],
        )

    for i, skill in enumerate(combined):
        if i == 0 or "python" in skill.lower() or "sql" in skill.lower() or "docker" in skill.lower() or "fastapi" in skill.lower():
            p1.append(skill)
        elif i <= 3:
            p2.append(skill)
        else:
            p3.append(skill)

    if not p1 and combined:
        p1.append(combined[0])

    return PrioritizationBadges(
        priority_1_critical=p1,
        priority_2_high=p2,
        priority_3_secondary=p3,
    )


def _get_roadmap_prompt_template() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages([
        ("system", ROADMAP_SYSTEM_PROMPT),
        ("human", "{gap_summary}"),
    ])


def _try_groq_lcel(summary_text: str, weekly_hours: int, duration_weeks: int) -> RoadmapGenerateResponse:
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
            structured_llm = llm.with_structured_output(RoadmapGenerateResponse)
            lcel_chain = _get_roadmap_prompt_template() | structured_llm
            return lcel_chain.invoke({
                "gap_summary": summary_text,
                "weekly_hours": weekly_hours,
                "duration_weeks": duration_weeks,
            })
        except Exception as exc:
            last_err = exc
            continue
    raise last_err or RuntimeError("All Groq candidates failed in roadmap prioritizer.")


def _try_gemini_lcel(summary_text: str, weekly_hours: int, duration_weeks: int) -> RoadmapGenerateResponse:
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is missing")
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            google_api_key=settings.GEMINI_API_KEY,
            model=settings.GEMINI_MODEL,
            temperature=0.1,
        )
        structured_llm = llm.with_structured_output(RoadmapGenerateResponse)
        lcel_chain = _get_roadmap_prompt_template() | structured_llm
        return lcel_chain.invoke({
            "gap_summary": summary_text,
            "weekly_hours": weekly_hours,
            "duration_weeks": duration_weeks,
        })
    except Exception as lc_exc:
        logger.info(f"LangChain Gemini not available ({lc_exc}). Using native google.generativeai SDK...")

    import google.generativeai as genai
    import json
    genai.configure(api_key=settings.GEMINI_API_KEY)

    models_to_try = [settings.GEMINI_MODEL, "gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
    models_to_try = list(dict.fromkeys([m for m in models_to_try if m]))

    prompt_str = f"{ROADMAP_SYSTEM_PROMPT.format(weekly_hours=weekly_hours, duration_weeks=duration_weeks)}\n\n{summary_text}\n\nReturn valid JSON matching schema: {json.dumps(RoadmapGenerateResponse.model_json_schema())}"
    last_err: Exception | None = None
    for gm in models_to_try:
        try:
            model = genai.GenerativeModel(gm, generation_config={"response_mime_type": "application/json", "temperature": 0.1})
            response = model.generate_content(prompt_str)
            raw = response.text.strip()
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            data_dict = json.loads(raw)
            data_dict["roadmap_id"] = "rdm_temp"
            return RoadmapGenerateResponse.model_validate(data_dict)
        except Exception as g_err:
            last_err = g_err
            continue
    raise last_err or RuntimeError("All Gemini candidates failed in roadmap prioritizer.")


def _try_openai_lcel(summary_text: str, weekly_hours: int, duration_weeks: int) -> RoadmapGenerateResponse:
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is missing")
    from langchain_openai import ChatOpenAI
    llm = ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model=settings.OPENAI_MODEL,
        temperature=0.1,
    )
    structured_llm = llm.with_structured_output(RoadmapGenerateResponse)
    lcel_chain = _get_roadmap_prompt_template() | structured_llm
    return lcel_chain.invoke({
        "gap_summary": summary_text,
        "weekly_hours": weekly_hours,
        "duration_weeks": duration_weeks,
    })


def generate_learning_roadmap(
    analysis: GapAnalysisResponse,
    weekly_hours: int,
    duration_weeks: int,
) -> RoadmapGenerateResponse:
    """
    Generates a personalized learning roadmap using explicit LCEL Runnable Chains with multi-provider LLM fallback.
    """
    badges = categorize_skill_priorities(
        missing_skills=analysis.skill_matrix.missing_skills,
        partial_skills=analysis.skill_matrix.partially_available_skills,
    )

    summary_text = f"""
Candidate Readiness Match Tier: {analysis.readiness_category} ({analysis.match_score_percentage}%)
Priority 1 Critical Skills: {', '.join(badges.priority_1_critical)}
Priority 2 High Skills: {', '.join(badges.priority_2_high)}
Priority 3 Secondary Skills: {', '.join(badges.priority_3_secondary)}

Available Weekly Hours: {weekly_hours} hours/week
Target Duration: {duration_weeks} weeks
Candidate Recommended Improvements: {', '.join(analysis.assessment.recommended_improvements)}
"""

    # Multi-provider LCEL Runnable Chain Fallback based on configured LLM_PROVIDER
    providers = ["gemini", "groq", "openai"] if settings.LLM_PROVIDER.lower() == "gemini" else ["groq", "gemini", "openai"]
    for p in providers:
        try:
            if p == "gemini":
                res = _try_gemini_lcel(summary_text, weekly_hours, duration_weeks)
                res.prioritization_badges = badges
                return res
            elif p == "groq":
                res = _try_groq_lcel(summary_text, weekly_hours, duration_weeks)
                res.prioritization_badges = badges
                return res
            elif p == "openai":
                res = _try_openai_lcel(summary_text, weekly_hours, duration_weeks)
                res.prioritization_badges = badges
                return res
        except Exception as exc:
            logger.warning(f"{p.capitalize()} roadmap chain failed: {exc}")

    # Fallback heuristic milestones if all LLMs are offline
    milestones = []
    skills_pool = badges.priority_1_critical + badges.priority_2_high + badges.priority_3_secondary
    for w in range(1, duration_weeks + 1):
        focus = skills_pool[(w - 1) % len(skills_pool)]
        milestones.append(
            WeeklyMilestone(
                week=w,
                focus_skill=f"Mastering {focus}",
                target_hours=weekly_hours,
                tasks=[
                    f"Study core concepts and documentation for {focus}",
                    f"Build hands-on practical project exercises using {focus}",
                ],
                resources=[f"https://docs.reference.org/{focus.lower().replace(' ', '-')}"],
            )
        )

    import uuid
    return RoadmapGenerateResponse(
        roadmap_id=f"rdm_{uuid.uuid4().hex[:9]}",
        prioritization_badges=badges,
        weekly_milestones=milestones,
    )

