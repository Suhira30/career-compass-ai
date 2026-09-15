"""
Database Initialization Script (Table Creation & Directory Setup)
"""

import os
import logging
from pathlib import Path
from app.core import settings
from app.db.base import Base
from app.db.session import engine
# Import all ORM models so SQLAlchemy metadata registers all tables
from app.db import orm_models  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db() -> None:
    """
    Creates database storage directory (if SQLite) and initializes all 5 database tables:
    - user_profiles
    - work_experiences
    - certifications
    - job_descriptions
    - analysis_results
    """
    # 1. Ensure local SQLite directory exists
    if settings.DATABASE_URL.startswith("sqlite"):
        db_path_str = settings.DATABASE_URL.replace("sqlite:///", "")
        db_dir = Path(db_path_str).parent
        if not db_dir.exists():
            logger.info(f"Creating local database directory: {db_dir}")
            db_dir.mkdir(parents=True, exist_ok=True)

    # 2. Create all ORM tables in target database
    logger.info(f"Initializing database tables on: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully!")


if __name__ == "__main__":
    init_db()

