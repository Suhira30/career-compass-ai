"""
Streaming RAG AI Career Assistant Pydantic Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessageInput(BaseModel):
    session_id: Optional[str] = Field(default=None, description="Active chat session identifier")
    analysis_id: Optional[str] = Field(default=None, description="Gap Analysis ID to inject candidate context")
    message: str = Field(..., min_length=1, max_length=2000, description="User query or question for the AI Career Assistant")
    stream: bool = Field(default=False, description="Set true for real-time text streaming response")


class ChatMessageResponse(BaseModel):
    session_id: str = Field(..., description="Active session identifier")
    response: str = Field(..., description="Full text response from AI Career Assistant")
    suggested_followups: List[str] = Field(default_factory=list, description="Contextual suggested follow-up questions")

