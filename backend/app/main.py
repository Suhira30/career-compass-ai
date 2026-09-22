import warnings
# Silence non-breaking Google library Python 3.9 EOL FutureWarnings in terminal output
warnings.filterwarnings("ignore", category=FutureWarning, module="google")
warnings.filterwarnings("ignore", category=PendingDeprecationWarning)

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from app.core import settings
from app.core.llm_provider_key import set_request_gemini_key, LLMQuotaExhaustedException

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
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def extract_client_api_key_middleware(request: Request, call_next):
    """
    Extracts optional client-provided Gemini API key from X-Gemini-API-Key header.
    Sets it into request-scoped context variable for downstream LLM services.
    """
    client_key = request.headers.get("x-gemini-api-key") or request.headers.get("X-Gemini-API-Key")
    set_request_gemini_key(client_key)
    response = await call_next(request)
    return response


@app.exception_handler(LLMQuotaExhaustedException)
async def llm_quota_exception_handler(request: Request, exc: LLMQuotaExhaustedException):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
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

