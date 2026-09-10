"""
SQLAlchemy ORM models.

`user_id` is a plain string on every table, not a foreign key to a `users`
table — there's no real backend-verified auth yet (that's deferred), so the
app just passes through whatever id the client-side auth stub already
generates. When real auth lands, only the source of that id changes; the
schema doesn't need to move.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship

from database import Base


def new_id():
    return uuid.uuid4().hex


def now_iso():
    return datetime.now(timezone.utc).isoformat()


class Book(Base):
    __tablename__ = "books"

    id = Column(String, primary_key=True, default=new_id)
    user_id = Column(String, nullable=False, index=True)

    title = Column(String, nullable=False)
    author = Column(String, nullable=True)

    current_page = Column(Integer, default=1)
    total_pages = Column(Integer, nullable=True)
    progress = Column(Float, default=0)
    page_chapter = Column(String, nullable=True)
    chapter = Column(Integer, nullable=True)

    thumbnail = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    published_date = Column(String, nullable=True)
    isbn = Column(String, nullable=True)
    categories = Column(JSON, default=list)
    publisher = Column(String, nullable=True)
    language = Column(String, nullable=True)
    average_rating = Column(Float, nullable=True)
    page_count = Column(Integer, nullable=True)
    google_books_id = Column(String, nullable=True)

    started_at = Column(String, nullable=True)
    finished_at = Column(String, nullable=True)
    status = Column(String, nullable=True)  # want_to_read | currently_reading | read | null
    rating = Column(Integer, nullable=True)  # 1-5 | null

    # Catch-all for any field the frontend sends that isn't modeled above yet
    # (the book shape has grown organically) — never silently drops data.
    extra = Column(JSON, default=dict)

    created_at = Column(String, default=now_iso)
    updated_at = Column(String, default=now_iso, onupdate=now_iso)

    messages = relationship("Message", back_populates="book", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=new_id)
    book_id = Column(String, ForeignKey("books.id"), nullable=False, index=True)
    user_id = Column(String, nullable=False, index=True)

    is_user = Column(Boolean, nullable=False)
    text = Column(Text, nullable=False)
    is_error = Column(Boolean, default=False)

    created_at = Column(String, default=now_iso)

    book = relationship("Book", back_populates="messages")


Index("ix_messages_book_created", Message.book_id, Message.created_at)
