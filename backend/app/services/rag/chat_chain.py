"""
Streaming RAG AI Career Assistant Service (Explicit LCEL Chain)
"""

import logging
from typing import List, AsyncGenerator, Dict, Any, Tuple
from langchain_core.prompts import ChatPromptTemplate
from app.core import settings
from app.models.chat import ChatMessageResponse
from app.models.analysis import GapAnalysisResponse

logger = logging.getLogger(__name__)

CHAT_SYSTEM_PROMPT = """
You are Career Compass AI Assistant, an empathetic, highly knowledgeable Senior AI Career Mentor and Technical Strategist.
Your goal is to guide candidates through their career transition, skill gap analysis, interview preparation, and upskilling roadmap.

Candidate Context Provided:
{context_str}

Instructions:
- Provide clear, practical, encouraging, and highly specific advice.
- When answering questions about skill gaps, explain why the skills matter and how to build them.
- Suggest concrete hands-on projects and interview tips tailored to the target role.
- Keep tone professional, constructive, and actionable.
"""


def _get_chat_prompt_template() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages([
        ("system", CHAT_SYSTEM_PROMPT),
        ("human", "{user_message}"),
    ])


def format_candidate_context(analysis: GapAnalysisResponse = None, session_history: List[Dict[str, str]] = None) -> str:
    """
    Formats candidate gap analysis details and past conversation turns into prompt context.
    """
    parts = []
    if analysis:
        parts.append(f"Readiness Match Category: {analysis.readiness_category} ({analysis.match_score_percentage}%)")
        parts.append(f"Matched Skills: {', '.join(analysis.skill_matrix.matched_skills) if analysis.skill_matrix.matched_skills else 'None'}")
        parts.append(f"Missing Skills: {', '.join(analysis.skill_matrix.missing_skills) if analysis.skill_matrix.missing_skills else 'None'}")
        parts.append(f"Partially Available Skills: {', '.join(analysis.skill_matrix.partially_available_skills) if analysis.skill_matrix.partially_available_skills else 'None'}")
        parts.append(f"Recommended Improvements: {', '.join(analysis.assessment.recommended_improvements)}")

    if session_history:
        parts.append("\nRecent Conversation History:")
        for turn in session_history[-4:]:  # Include last 4 messages
            parts.append(f"{turn['role'].capitalize()}: {turn['content']}")

    return "\n".join(parts) if parts else "No prior candidate analysis context available."


def generate_suggested_followups(user_message: str, response_text: str) -> List[str]:
    """
    Generates 2-3 contextual follow-up questions for the candidate.
    """
    msg_lower = user_message.lower()
    if "interview" in msg_lower or "question" in msg_lower:
        return [
            "Can you give me 3 sample technical interview questions for my missing skills?",
            "How should I structure my STAR response for my resume projects?",
        ]
    elif "resume" in msg_lower or "cv" in msg_lower:
        return [
            "How do I rephrase my partial experience to highlight transferable skills?",
            "What bullet points should I add to my GitHub project description?",
        ]
    else:
        return [
            "How do I prioritize learning my missing skills efficiently?",
            "What practical hands-on project should I build first?",
        ]


def invoke_chat_chain(
    user_message: str,
    context_str: str,
    session_id: str,
) -> ChatMessageResponse:
    """
    Synchronous LCEL RAG Chat Chain execution with multi-provider fallback (Groq -> Gemini -> OpenAI).
    """
    prompt_template = _get_chat_prompt_template()

    # 1. Primary: Groq
    if settings.GROQ_API_KEY:
        try:
            from langchain_groq import ChatGroq
            llm = ChatGroq(api_key=settings.GROQ_API_KEY, model_name=settings.GROQ_MODEL, temperature=0.3)
            chain = prompt_template | llm
            res = chain.invoke({"context_str": context_str, "user_message": user_message})
            text = res.content if hasattr(res, "content") else str(res)
            return ChatMessageResponse(
                session_id=session_id,
                response=text,
                suggested_followups=generate_suggested_followups(user_message, text),
            )
        except Exception as exc:
            logger.warning(f"Groq Chat failed: {exc}")

    # 2. Fallback 1: Gemini
    if settings.GEMINI_API_KEY:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(google_api_key=settings.GEMINI_API_KEY, model=settings.GEMINI_MODEL, temperature=0.3)
            chain = prompt_template | llm
            res = chain.invoke({"context_str": context_str, "user_message": user_message})
            text = res.content if hasattr(res, "content") else str(res)
            return ChatMessageResponse(
                session_id=session_id,
                response=text,
                suggested_followups=generate_suggested_followups(user_message, text),
            )
        except Exception as exc:
            logger.warning(f"Gemini Chat failed: {exc}")

    # 3. Fallback 2: OpenAI
    if settings.OPENAI_API_KEY:
        try:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(api_key=settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL, temperature=0.3)
            chain = prompt_template | llm
            res = chain.invoke({"context_str": context_str, "user_message": user_message})
            text = res.content if hasattr(res, "content") else str(res)
            return ChatMessageResponse(
                session_id=session_id,
                response=text,
                suggested_followups=generate_suggested_followups(user_message, text),
            )
        except Exception as exc:
            logger.warning(f"OpenAI Chat failed: {exc}")

    # Final Fallback
    fallback_text = (
        "I analyzed your profile and target role requirements. Focus on strengthening your core "
        "required technical skills first through practical hands-on projects, then format your accomplishments "
        "using quantifiable metrics on your resume."
    )
    return ChatMessageResponse(
        session_id=session_id,
        response=fallback_text,
        suggested_followups=generate_suggested_followups(user_message, fallback_text),
    )


async def stream_chat_chain(
    user_message: str,
    context_str: str,
) -> AsyncGenerator[str, None]:
    """
    Asynchronous streaming generator yielding real-time text tokens using explicit LCEL Runnable Chain.
    """
    prompt_template = _get_chat_prompt_template()

    # 1. Primary: Groq Streaming
    if settings.GROQ_API_KEY:
        try:
            from langchain_groq import ChatGroq
            llm = ChatGroq(api_key=settings.GROQ_API_KEY, model_name=settings.GROQ_MODEL, temperature=0.3, streaming=True)
            chain = prompt_template | llm
            async for chunk in chain.astream({"context_str": context_str, "user_message": user_message}):
                content = chunk.content if hasattr(chunk, "content") else str(chunk)
                if content:
                    yield content
            return
        except Exception as exc:
            logger.warning(f"Groq Streaming failed: {exc}")

    # 2. Fallback 1: Gemini Streaming
    if settings.GEMINI_API_KEY:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(google_api_key=settings.GEMINI_API_KEY, model=settings.GEMINI_MODEL, temperature=0.3, streaming=True)
            chain = prompt_template | llm
            async for chunk in chain.astream({"context_str": context_str, "user_message": user_message}):
                content = chunk.content if hasattr(chunk, "content") else str(chunk)
                if content:
                    yield content
            return
        except Exception as exc:
            logger.warning(f"Gemini Streaming failed: {exc}")

    # Fallback non-streaming text yield
    res = invoke_chat_chain(user_message, context_str, "temp_sess")
    yield res.response

