"""
Database Engine & Session Factory Manager
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core import settings

# 1. Configure dialect-specific engine parameters
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite requires check_same_thread=False for multi-threaded FastAPI access
    connect_args = {"check_same_thread": False}

# 2. Create SQLAlchemy Engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,  # Automatically test connections before issuing queries
)

# 3. Create Session Factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI Dependency Injection Generator yielding a database session per request.
    Ensures connection is closed automatically after request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

