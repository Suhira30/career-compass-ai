"""
Aggregated API v1 Router
"""

from fastapi import APIRouter
from app.api.v1.profile import router as profile_router
from app.api.v1.resume import router as resume_router

api_v1_router = APIRouter()

api_v1_router.include_router(profile_router)
api_v1_router.include_router(resume_router)

