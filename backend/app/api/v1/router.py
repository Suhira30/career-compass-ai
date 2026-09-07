"""
Aggregated API v1 Router
"""

from fastapi import APIRouter
from app.api.v1.profile import router as profile_router
from app.api.v1.resume import router as resume_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.analysis import router as analysis_router

api_v1_router = APIRouter()

api_v1_router.include_router(profile_router)
api_v1_router.include_router(resume_router)
api_v1_router.include_router(jobs_router)
api_v1_router.include_router(analysis_router)
