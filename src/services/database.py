"""
Database engine and session setup.

Defaults to a local SQLite file so the app has real, persistent storage with
zero external setup. Swapping to Postgres (Supabase or otherwise) later is a
one-line change: set DATABASE_URL and nothing else in this file needs to move.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./libretto.db")

# check_same_thread is only needed for SQLite (each FastAPI request may run
# on a different thread); it's a no-op / unsupported arg on other engines.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a session, always closed after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
