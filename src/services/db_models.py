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
    history_events = relationship(
        "BookHistoryEvent", back_populates="book", cascade="all, delete-orphan"
    )


class BookHistoryEvent(Base):
    """One row per tracked-field change on a book (page, status, rating,
    finished date) — a track-changes log for the History tab, distinct from
    the point-in-time snapshot already stored on `Book` itself."""

    __tablename__ = "book_history_events"

    id = Column(String, primary_key=True, default=new_id)
    book_id = Column(String, ForeignKey("books.id"), nullable=False, index=True)
    user_id = Column(String, nullable=False, index=True)

    field = Column(String, nullable=False)  # camelCase field name, e.g. "currentPage"
    old_value = Column(Text, nullable=True)  # JSON-encoded
    new_value = Column(Text, nullable=True)  # JSON-encoded

    created_at = Column(String, default=now_iso)

    book = relationship("Book", back_populates="history_events")


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
Index("ix_history_book_created", BookHistoryEvent.book_id, BookHistoryEvent.created_at)


# --- Catalog (Information tab) -------------------------------------------
#
# Separate from `Book` above: `Book` is a per-user library entry (one row per
# user per book, tracking their own progress/status). The classes below are
# the shared, canonical catalog — one row per real-world book, generated
# once by the research pipeline and served read-only to every user. They're
# named `CatalogBook`/`CatalogAuthor`/`CatalogSeries` to avoid colliding with
# the existing per-user `Book`; table names stay under `catalog_*` for the
# same reason.

CONTENT_SECTIONS = ("synopsis", "how_it_was_written", "historical_context", "reception_and_legacy")
CONTENT_STATUSES = ("pending", "researching", "ready")

RELATED_CONTENT_TYPES = (
    "adaptation_film",
    "adaptation_tv",
    "adaptation_stage",
    "documentary",
    "podcast",
    "article",
    "essay",
    "academic",
    "interview",
    "video",
)


def default_content_status():
    return {section: "pending" for section in CONTENT_SECTIONS}


class CatalogAuthor(Base):
    __tablename__ = "catalog_authors"

    id = Column(String, primary_key=True, default=new_id)
    name = Column(String, nullable=False)
    bio = Column(Text, nullable=True)

    created_at = Column(String, default=now_iso)
    updated_at = Column(String, default=now_iso, onupdate=now_iso)

    books = relationship("CatalogBook", back_populates="author")


class CatalogSeries(Base):
    __tablename__ = "catalog_series"

    id = Column(String, primary_key=True, default=new_id)
    name = Column(String, nullable=False)

    created_at = Column(String, default=now_iso)
    updated_at = Column(String, default=now_iso, onupdate=now_iso)

    books = relationship(
        "CatalogBook", back_populates="series", order_by="CatalogBook.series_position"
    )


class CatalogBook(Base):
    """A canonical, shared book record — metadata plus the LLM-researched
    narrative sections for the Information tab. Generated once and never
    regenerated on page view; `content_status` tracks per-section progress."""

    __tablename__ = "catalog_books"

    id = Column(String, primary_key=True, default=new_id)

    title = Column(String, nullable=False)
    author_id = Column(String, ForeignKey("catalog_authors.id"), nullable=True, index=True)
    series_id = Column(String, ForeignKey("catalog_series.id"), nullable=True, index=True)
    series_position = Column(Integer, nullable=True)

    publication_date = Column(String, nullable=True)
    original_language = Column(String, nullable=True)
    genres = Column(JSON, default=list)

    # Each of these four holds { summary: str, sources: [{title, url, publisher}] }
    synopsis = Column(JSON, nullable=True)
    how_it_was_written = Column(JSON, nullable=True)
    historical_context = Column(JSON, nullable=True)
    reception_and_legacy = Column(JSON, nullable=True)

    # { synopsis, how_it_was_written, historical_context, reception_and_legacy: pending|researching|ready }
    content_status = Column(JSON, default=default_content_status)

    created_at = Column(String, default=now_iso)
    updated_at = Column(String, default=now_iso, onupdate=now_iso)

    author = relationship("CatalogAuthor", back_populates="books")
    series = relationship("CatalogSeries", back_populates="books")
    related_content = relationship(
        "RelatedContent", back_populates="book", cascade="all, delete-orphan"
    )


class RelatedContent(Base):
    __tablename__ = "related_content"

    id = Column(String, primary_key=True, default=new_id)
    book_id = Column(String, ForeignKey("catalog_books.id"), nullable=False, index=True)

    title = Column(String, nullable=False)
    type = Column(String, nullable=False)  # one of RELATED_CONTENT_TYPES
    url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    source = Column(String, nullable=True)
    publication_date = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)

    created_at = Column(String, default=now_iso)
    updated_at = Column(String, default=now_iso, onupdate=now_iso)

    book = relationship("CatalogBook", back_populates="related_content")


Index("ix_related_content_book_type", RelatedContent.book_id, RelatedContent.type)
