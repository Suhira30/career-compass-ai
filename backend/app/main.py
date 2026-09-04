"""
Career Compass AI — FastAPI Main Application Entry Point
"""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
import time
from app.core import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Career Navigation, Skill Gap Analysis & Upskilling Platform Backend",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS Middleware using settings.CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", status_code=status.HTTP_200_OK, tags=["System Health"])
async def root():
    """
    Root API Health Check Endpoint
    """
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": time.time(),
        "docs": "/docs",
    }


@app.get("/health", status_code=status.HTTP_200_OK, tags=["System Health"])
async def health_check():
    """
    Detailed System Health Status
    """
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "components": {
            "api": "operational",
            "database": "ready",
            "vector_store": "ready",
            "groq_ai_engine": "ready" if settings.GROQ_API_KEY else "key_missing",
        },
    }


# Mount API v1 Routes (/api/v1)
from app.api.v1 import api_v1_router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

