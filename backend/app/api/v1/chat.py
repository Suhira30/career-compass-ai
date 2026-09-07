"""
Streaming RAG AI Career Assistant REST API Controller (/api/v1/chat/message)
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from app.models.chat import ChatMessageInput, ChatMessageResponse
from app.services.rag.chat_chain import (
    invoke_chat_chain,
    stream_chat_chain,
    format_candidate_context,
)
from app.api.v1.analysis import analysis_db
import uuid

router = APIRouter(prefix="/chat", tags=["Streaming RAG AI Career Assistant"])

# In-memory session history database (ready for Supabase migration in Task 1.3)
chat_sessions_db = {}


@router.post(
    "/message",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Send message to Streaming RAG AI Career Assistant",
    description="Interactive RAG career advisor. Accepts user message, candidate analysis context, and returns JSON or real-time StreamingResponse token stream.",
)
async def chat_message(request: ChatMessageInput):
    """
    POST /api/v1/chat/message
    """
    # 1. Resolve or create session ID
    session_id = request.session_id or f"sess_{uuid.uuid4().hex[:8]}"
    if session_id not in chat_sessions_db:
        chat_sessions_db[session_id] = []

    session_history = chat_sessions_db[session_id]

    # 2. Resolve Candidate Context from analysis_id if provided
    analysis = None
    if request.analysis_id and request.analysis_id in analysis_db:
        analysis = analysis_db[request.analysis_id]

    context_str = format_candidate_context(analysis=analysis, session_history=session_history)

    # 3. Append user message to history
    session_history.append({"role": "user", "content": request.message})

    # 4. Handle Real-Time Token Streaming
    if request.stream:
        async def event_generator():
            full_response_chunks = []
            async for token in stream_chat_chain(request.message, context_str):
                full_response_chunks.append(token)
                yield token
            
            # Save complete response to session history
            complete_text = "".join(full_response_chunks)
            session_history.append({"role": "assistant", "content": complete_text})

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    # 5. Handle Standard Synchronous Response
    response_payload = invoke_chat_chain(
        user_message=request.message,
        context_str=context_str,
        session_id=session_id,
    )

    # Save assistant response to session history
    session_history.append({"role": "assistant", "content": response_payload.response})

    return response_payload

