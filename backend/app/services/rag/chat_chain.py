"""
Streaming RAG AI Career Assistant Service (Explicit LCEL Chain)

Integrates candidate gap analysis context with RAG Vector Store search (Pinecone / ChromaDB)
for grounded, personalized career advice.
"""

import logging
from typing import List, AsyncGenerator, Dict, Any, Optional
from langchain_core.prompts import ChatPromptTemplate
from app.core import settings
from app.core.llm_provider_key import (
    get_active_gemini_key,
    is_quota_exhausted_error,
    LLMQuotaExhaustedException,
)
from app.models.chat import ChatMessageResponse
from app.models.analysis import GapAnalysisResponse
from app.services.rag.vector_store import search_relevant_context

logger = logging.getLogger(__name__)

CHAT_SYSTEM_PROMPT = """
You are Career Compass AI Assistant, an empathetic, highly knowledgeable Senior AI Career Mentor and Technical Strategist.
Your goal is to guide candidates through their career transition, skill gap analysis, interview preparation, and upskilling roadmap.

Context Provided:
{context_str}

Instructions:
- Ground your upskilling advice, interview prep guidance, and skill taxonomies strictly in the provided Candidate Context and Retrieved Domain Knowledge Base Context.
- Avoid inventing fake course links or unverified technical advice.
- Personalize all advice to the candidate's exact background (their matched skills vs missing skills).
- Provide concrete, actionable hands-on project recommendations and interview tips tailored to the target role.
- Keep tone professional, constructive, empathetic, and encouraging.
"""


def _get_chat_prompt_template() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages([
        ("system", CHAT_SYSTEM_PROMPT),
        ("human", "{user_message}"),
    ])


def condense_query_with_history(
    user_message: str,
    session_history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """
    Condenses follow-up queries that reference previous dialogue turns (e.g. 'tell me more about that',
    'how to prepare for that interview question?') by combining with the prior turn's topic.
    """
    if not session_history:
        return user_message

    words = set(user_message.lower().split())
    deictic_words = {"that", "this", "it", "more", "why", "how", "what", "drill", "example", "question"}
    
    # If the query is short or uses deictic referencing, enrich search with recent turn context
    if len(words) <= 7 or words.intersection(deictic_words):
        # Scan backwards for the most recent message with content
        for prev_turn in reversed(session_history):
            content = prev_turn.get("content", "").strip()
            if content:
                snippet = content[:120].replace("\n", " ")
                return f"{user_message} (focus: {snippet})"

    return user_message


def format_candidate_context(
    analysis: Optional[GapAnalysisResponse] = None,
    session_history: Optional[List[Dict[str, str]]] = None,
    user_message: str = "",
) -> str:
    """
    Formats candidate gap analysis details, recent chat history, and RAG Vector Store search snippets into prompt context.
    """
    parts = []
    
    # 1. Candidate Skill Profile & Gap Analysis Context
    if analysis:
        parts.append(f"Candidate Match Category: {analysis.readiness_category} ({analysis.match_score_percentage}%)")
        parts.append(f"Matched Skills: {', '.join(analysis.skill_matrix.matched_skills) if analysis.skill_matrix.matched_skills else 'None'}")
        parts.append(f"Missing Skills: {', '.join(analysis.skill_matrix.missing_skills) if analysis.skill_matrix.missing_skills else 'None'}")
        parts.append(f"Partially Available Skills: {', '.join(analysis.skill_matrix.partially_available_skills) if analysis.skill_matrix.partially_available_skills else 'None'}")
        parts.append(f"Recommended Improvements: {', '.join(analysis.assessment.recommended_improvements)}")

    # 2. RAG Vector Search Knowledge Base Context Retrieval (Parent-Child 3A-K5)
    if user_message:
        try:
            retrieval_query = condense_query_with_history(user_message, session_history)
            kb_context = search_relevant_context(retrieval_query, k=5)
            if kb_context:
                parts.append(f"\nRetrieved Domain Knowledge Base Context (Parent-Child 3A-K5):\n{kb_context}")
        except Exception as exc:
            logger.warning(f"RAG vector search skipped/failed: {exc}")

    # 3. Conversation History
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
    Synchronous LCEL RAG Chat Chain execution with multi-provider fallback (Gemini -> Groq -> OpenAI).
    """
    prompt_template = _get_chat_prompt_template()

    # 1. Primary: Gemini
    active_gemini_key = get_active_gemini_key()
    if active_gemini_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(google_api_key=active_gemini_key, model=settings.GEMINI_MODEL, temperature=0.3)
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
            if is_quota_exhausted_error(exc):
                raise LLMQuotaExhaustedException(
                    message="Gemini API quota or rate limit reached. Please supply a new or refreshed API key to continue chatting.",
                    provider="gemini",
                )

    # 2. Fallback 1: Groq
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
            if is_quota_exhausted_error(exc) and not settings.OPENAI_API_KEY:
                raise LLMQuotaExhaustedException(provider="groq")

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
            if is_quota_exhausted_error(exc):
                raise LLMQuotaExhaustedException(provider="openai")

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

    # 1. Primary: Gemini Streaming
    active_gemini_key = get_active_gemini_key()
    if active_gemini_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(google_api_key=active_gemini_key, model=settings.GEMINI_MODEL, temperature=0.3, streaming=True)
            chain = prompt_template | llm
            async for chunk in chain.astream({"context_str": context_str, "user_message": user_message}):
                content = chunk.content if hasattr(chunk, "content") else str(chunk)
                if content:
                    yield content
            return
        except Exception as exc:
            logger.warning(f"Gemini Streaming failed: {exc}")
            if is_quota_exhausted_error(exc):
                raise LLMQuotaExhaustedException(
                    message="Gemini API quota or rate limit reached. Please supply a new or refreshed API key to continue chatting.",
                    provider="gemini",
                )

    # 2. Fallback 1: Groq Streaming
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
            if is_quota_exhausted_error(exc):
                raise LLMQuotaExhaustedException(provider="groq")

    # Fallback non-streaming text yield
    res = invoke_chat_chain(user_message, context_str, "temp_sess")
    yield res.response
