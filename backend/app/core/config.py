"""
Career Compass AI — Core Application Configuration & Environment Settings
"""

from typing import List, Union
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from pathlib import Path

# Resolve base project directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """
    Type-safe Pydantic Settings class parsing environment variables.
    """
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # General Project Metadata
    PROJECT_NAME: str = "Career Compass AI API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development", description="System environment: development, testing, production")
    PORT: int = 8000
    DEBUG: bool = True

    # Security & CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # AI & LLM Provider Configuration
    LLM_PROVIDER: str = Field(default="groq", description="Primary LLM Provider: groq, gemini, openai")
    GROQ_API_KEY: str = Field(default="", description="API key from https://console.groq.com/keys")
    GROQ_MODEL: str = Field(default="llama-3.1-8b-instant", description="Default Groq model")
    
    # Fallback LLM Keys
    # Fallback LLM Configuration
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL: str = Field(default="gemini-1.5-flash", description="Fallback Gemini model")
    OPENAI_API_KEY: str = Field(default="")
    OPENAI_MODEL: str = Field(default="gpt-4o-mini", description="Fallback OpenAI model")

    # Database & Vector Store Settings
    DATABASE_URL: str = Field(
        default=f"sqlite:///{BASE_DIR}/data/career_compass.db",
        description="SQLAlchemy database connection URI",
    )
    VECTOR_DB_DIR: str = Field(
        default=str(BASE_DIR / "data" / "vector_store"),
        description="Local ChromaDB storage directory",
    )
    PINECONE_API_KEY: str = Field(default="", description="Pinecone cloud serverless API key")
    PINECONE_INDEX_NAME: str = Field(default="career-compass-index", description="Pinecone index name")
    EMBEDDING_MODEL_NAME: str = Field(
        default="BAAI/bge-small-en-v1.5",
        description="HuggingFace dense embedding model (384 dims, 512 max tokens capacity)",
    )

    # Document Upload Validation Limits
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx"]


# Instantiate singleton settings object
settings = Settings()
