"""
API v1 Router Aggregator
"""

from fastapi import APIRouter
from app.api.v1.profile import router as profile_router

api_v1_router = APIRouter()

# Mount User Profile sub-router under /profile
api_v1_router.include_router(profile_router)

