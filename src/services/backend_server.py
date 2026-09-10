"""
Book Discussion Agent Backend Server
Handles CORS and proxies requests to Claude API
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
import anthropic
import json
import os
import re
from dotenv import load_dotenv

from database import Base, engine, get_db
import db_models

load_dotenv()

# Initialize FastAPI
app = FastAPI(title="Book Agent API", version="1.0.0")

# Creates tables on first run; no-ops if they already exist. Fine for
# SQLite/dev — a real Postgres deployment would use proper migrations
# (e.g. Alembic) instead of this, but this keeps local setup to zero steps.
Base.metadata.create_all(bind=engine)

# CRITICAL: Enable CORS - This is what fixes the browser error
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get API key from .env file
# To configure:
# 1. Copy .env.example to .env: cp .env.example .env
# 2. Edit .env and add your actual API key
# 3. Get your key from: https://console.anthropic.com/
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Initialize Anthropic client only if API key is available and not placeholder
client = None
if ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "your_api_key_here":
    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        print("✅ Claude API client initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Claude API client: {e}")
        client = None
else:
    print("⚠️  Claude API key not configured. Please set ANTHROPIC_API_KEY environment variable or update the code.")

# Request/Response Models
class BookData(BaseModel):
    title: str
    author: str
    currentPage: Optional[int] = 1
    totalPages: Optional[int] = None
    progress: Optional[float] = 0
    publishedDate: Optional[str] = None
    categories: Optional[List[str]] = []
    description: Optional[str] = "No description available."

class UserData(BaseModel):
    firstName: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None

class ChatRequest(BaseModel):
    session_id: str
    message: str
    book_data: BookData
    conversation_history: Optional[List[Dict]] = []
    user: Optional[UserData] = None

class ChatResponse(BaseModel):
    message: str
    session_id: str
    success: bool
    error: Optional[str] = None

class CommunityRequest(BaseModel):
    book_data: BookData

class CommunitySource(BaseModel):
    category: str  # "discussion" | "reference" | "deep_dive"
    platform: str
    title: str
    description: str
    url: str
    relevance: Optional[str] = None  # "high" | "medium" | "low"
    # Not precise per-page spoiler detection yet (that needs the actual book
    # text) — just a coarse label per source, using the reader's progress as
    # a hint. Structured this way so a real per-page model can slot in later
    # without changing the response shape.
    spoiler_level: str = "may_contain_spoilers"  # "spoiler_free" | "may_contain_spoilers" | "full_book_spoilers"

class CommunityResponse(BaseModel):
    sources: List[CommunitySource] = []
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None

# Known camelCase fields on the frontend's book object, mapped to the
# matching snake_case column on the Book model. Anything the client sends
# that isn't in this map still gets saved (into `extra`), never dropped.
BOOK_FIELD_MAP = {
    "title": "title",
    "author": "author",
    "currentPage": "current_page",
    "totalPages": "total_pages",
    "progress": "progress",
    "pageChapter": "page_chapter",
    "chapter": "chapter",
    "thumbnail": "thumbnail",
    "description": "description",
    "publishedDate": "published_date",
    "isbn": "isbn",
    "categories": "categories",
    "publisher": "publisher",
    "language": "language",
    "averageRating": "average_rating",
    "pageCount": "page_count",
    "googleBooksId": "google_books_id",
    "startedAt": "started_at",
    "finishedAt": "finished_at",
    "status": "status",
    "rating": "rating",
}

class CreateBookRequest(BaseModel):
    user_id: str
    book: Dict[str, Any]

class UpdateBookRequest(BaseModel):
    updates: Dict[str, Any]

class CreateMessageRequest(BaseModel):
    user_id: str
    text: str
    isUser: bool
    isError: Optional[bool] = False

def book_to_dict(book: db_models.Book) -> Dict[str, Any]:
    """Serialize a Book row back into the camelCase shape the frontend expects."""
    result = dict(book.extra or {})
    for camel, snake in BOOK_FIELD_MAP.items():
        result[camel] = getattr(book, snake)
    result["id"] = book.id
    result["createdAt"] = book.created_at
    result["updatedAt"] = book.updated_at
    return result

def apply_book_fields(book: db_models.Book, fields: Dict[str, Any]) -> None:
    """Write incoming camelCase fields onto a Book row, unknown ones into `extra`."""
    extra = dict(book.extra or {})
    for key, value in fields.items():
        if key in BOOK_FIELD_MAP:
            setattr(book, BOOK_FIELD_MAP[key], value)
        elif key not in ("id", "createdAt", "updatedAt"):
            extra[key] = value
    book.extra = extra

def message_to_dict(message: db_models.Message) -> Dict[str, Any]:
    return {
        "id": message.id,
        "text": message.text,
        "isUser": message.is_user,
        "isError": message.is_error,
        "timestamp": message.created_at,
    }

# Helper functions
def get_session_key(book_data: BookData) -> str:
    """Generate a unique key for book sessions"""
    return f"{book_data.title}_{book_data.author}"

def create_system_prompt(book_data: BookData, user_data: Optional[UserData] = None) -> str:
    """Generate a system prompt that gives Waddle a consistent, book-aware personality."""
    user_name = user_data.firstName if user_data and user_data.firstName else None
    current_page = book_data.currentPage or 1
    genre = ', '.join(book_data.categories) if book_data.categories else None

    context_lines = [f'- Book: "{book_data.title}" by {book_data.author}']
    if genre:
        context_lines.append(f"- Genre: {genre}")
    if book_data.totalPages:
        progress_pct = round(book_data.progress or 0)
        context_lines.append(
            f"- Reader's progress: page {current_page} of {book_data.totalPages} ({progress_pct}% through)"
        )
    else:
        context_lines.append(f"- Reader's progress: page {current_page} (total length unknown)")
    if user_name:
        context_lines.append(f"- Reader's name: {user_name} (use sparingly, not in every reply)")

    context_block = "\n".join(context_lines)
    spoiler_bound = (
        f"page {current_page} of {book_data.totalPages}"
        if book_data.totalPages
        else f"page {current_page}"
    )

    return f"""You are Waddle, a sharp, well-read companion helping someone read "{book_data.title}" by {book_data.author}. You talk like a genuinely book-loving friend, not a customer-support bot.

Reader context:
{context_block}

How to respond:
- Answer the actual question first. No preamble, no "great question," no restating what they asked.
- Match your length to the question. A quick factual question gets a sentence or two; a question about themes, motives, or craft earns a fuller, more developed answer. Stay tight either way — no padding, no filler.
- Talk like you're talking, not lecturing. Skip academic throat-clearing and jargon unless the reader's question already uses it.
- Don't summarize the plot or premise unless it's directly needed to answer the question.
- Don't end every reply with a follow-up question. Ask one only when it genuinely adds something, not as a reflex.
- No apologies, hedging, or "as an AI" disclaimers. Just talk about the book.

Spoilers:
- The reader is at {spoiler_bound}. Don't reveal or hint at anything that happens past that point, even indirectly.
- If answering fully would spoil something ahead, say so briefly and offer to come back to it once they're further along.

What you actually know:
- You don't have the book's exact text in front of you — you're drawing on general knowledge of the story, author, and genre. Never invent direct quotes, page numbers, or specific passages.
- If asked for an exact quote or line, say you can't quote it precisely and discuss the idea or moment instead.
- If you're not sure about a plot detail, say so plainly rather than guessing confidently."""

COMMUNITY_CATEGORIES = {"discussion", "reference", "deep_dive"}
COMMUNITY_RELEVANCE_LEVELS = {"high", "medium", "low"}
COMMUNITY_SPOILER_LEVELS = {"spoiler_free", "may_contain_spoilers", "full_book_spoilers"}
COMMUNITY_MAX_SOURCES = 8

# In-memory cache so flipping back to the Community tab (or reopening the
# same book) doesn't re-run a paid web-search call every time. No database —
# this is deliberately just process memory, cleared on restart.
community_cache = {}

def create_community_prompt(book_data: BookData) -> str:
    """Build the web-search prompt used to find community/reference links."""
    if book_data.totalPages:
        progress_note = (
            f"The reader is currently {round(book_data.progress or 0)}% through the book "
            f"(page {book_data.currentPage or 1} of {book_data.totalPages})."
        )
    else:
        progress_note = f"The reader has read to page {book_data.currentPage or 1}; total length is unknown."

    return f"""Find online communities and reference resources for the book "{book_data.title}" by {book_data.author}.

{progress_note}

Search the web for real, currently-existing pages — subreddits, discussion forums, Goodreads threads, Wikipedia, Fandom/wiki pages, and long-form analysis or essays about this specific book. Then respond with ONLY a raw JSON object (no markdown fences, no commentary before or after) matching exactly this shape:

{{
  "sources": [
    {{
      "category": "discussion" | "reference" | "deep_dive",
      "platform": "short platform/site name, e.g. Reddit, Wikipedia, Goodreads, SparkNotes",
      "title": "the specific page or community title, e.g. r/dune or Dune: Study Guide",
      "description": "one sentence on what a reader will actually find there and why it's worth visiting - not just a repeat of the platform name",
      "url": "the exact URL from your search results - never invent or guess a URL",
      "relevance": "high" | "medium" | "low" | null,
      "spoiler_level": "spoiler_free" | "may_contain_spoilers" | "full_book_spoilers"
    }}
  ]
}}

Categories:
- discussion: active reader discussion - subreddits, forums, Goodreads discussion threads
- reference: encyclopedic background - Wikipedia, Fandom wikis, official sites
- deep_dive: longer-form analysis, criticism, essays, or theories

Spoiler levels (use your judgment; when unsure, use "may_contain_spoilers"):
- spoiler_free: general background that doesn't reveal plot, e.g. an author bio or a spoiler-free overview
- may_contain_spoilers: typical discussion/wiki pages that likely reference plot details
- full_book_spoilers: pages that explicitly cover the ending or the entire plot, e.g. a full synopsis or "ending explained" page

Rules:
- Every url must come from an actual search result. Never fabricate a URL, subreddit, or wiki page.
- If you cannot verify a well-known community (like a specific subreddit) actually exists from your search results, leave it out rather than guessing at its URL.
- Prioritize sources specific to this book over generic ones.
- Skip low-quality results: SEO content farms, unrelated forums, dead links, anything requiring a download.
- Return at most {COMMUNITY_MAX_SOURCES} sources total, favoring quality over quantity.
- Omit a category entirely if nothing good was found for it - do not force results into a category."""

def parse_community_sources(raw_text: str) -> List[Dict]:
    """Extract and validate the sources list from Claude's final text block.

    Defensive by design in two ways:
    1. Extraction is best-effort, not strict. When Claude can't find a real
       book, it tends to explain that in prose *around* the JSON (e.g. "no
       results exist for this title... ```json {"sources": []}```") rather
       than returning bare JSON. We pull the JSON object out from wherever
       it appears instead of requiring the whole response to be clean JSON.
    2. Anything that still fails to parse is treated as "no sources found"
       (an empty list), not an error — that's a legitimate, expected outcome
       for an obscure or nonexistent book, not a system failure.
    3. Every individual source is still validated: a missing/blank field or
       a URL that doesn't look real gets that one source dropped rather than
       surfaced to the reader.
    """
    text = (raw_text or "").strip()

    json_str = None
    fence_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL | re.IGNORECASE)
    if fence_match:
        json_str = fence_match.group(1)
    else:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end > start:
            json_str = text[start:end + 1]

    if not json_str:
        return []

    try:
        data = json.loads(json_str)
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Community sources JSON did not parse, treating as no results: {e}")
        return []

    raw_sources = data.get("sources", []) if isinstance(data, dict) else []
    if not isinstance(raw_sources, list):
        return []

    cleaned = []
    for item in raw_sources:
        if not isinstance(item, dict):
            continue

        url = item.get("url")
        platform = str(item.get("platform") or "").strip()
        title = str(item.get("title") or "").strip()
        description = str(item.get("description") or "").strip()

        if not (isinstance(url, str) and url.startswith("http")):
            continue  # never surface a missing or fabricated-looking URL
        if not platform or not title or not description:
            continue

        category = item.get("category")
        if category not in COMMUNITY_CATEGORIES:
            category = "reference"

        relevance = item.get("relevance")
        if relevance not in COMMUNITY_RELEVANCE_LEVELS:
            relevance = None

        spoiler_level = item.get("spoiler_level")
        if spoiler_level not in COMMUNITY_SPOILER_LEVELS:
            spoiler_level = "may_contain_spoilers"

        cleaned.append({
            "category": category,
            "platform": platform,
            "title": title,
            "description": description,
            "url": url,
            "relevance": relevance,
            "spoiler_level": spoiler_level,
        })

        if len(cleaned) >= COMMUNITY_MAX_SOURCES:
            break

    return cleaned

@app.get("/")
async def root():
    return {"message": "Book Agent API is running!", "status": "healthy"}

# Cap how much history we send to Claude. This bounds prompt size and cost;
# it is not persistent memory — the frontend still owns the full transcript.
MAX_HISTORY_MESSAGES = 12

def build_message_history(conversation_history: List[Dict]) -> List[Dict]:
    """Turn stored chat history into clean, alternating Claude messages.

    Defensive on purpose: the frontend sends its own message list, which can
    contain an empty in-progress message (the typing welcome bubble) or, in
    edge cases, back-to-back turns from the same role. Claude's API requires
    strictly alternating user/assistant turns starting with "user", so we
    filter and repair rather than pass the raw list through.
    """
    cleaned = []
    for msg in conversation_history:
        text = (msg.get("text") or "").strip()
        if not text:
            continue
        role = "user" if msg.get("isUser") else "assistant"
        if cleaned and cleaned[-1]["role"] == role:
            # Same role twice in a row isn't valid — keep the most recent one.
            cleaned[-1] = {"role": role, "content": text}
            continue
        cleaned.append({"role": role, "content": text})

    cleaned = cleaned[-MAX_HISTORY_MESSAGES:]

    while cleaned and cleaned[0]["role"] != "user":
        cleaned.pop(0)

    return cleaned

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_book(request: ChatRequest):
    """Handle chat messages about a book"""
    if not client:
        return ChatResponse(
            message="Chat isn't available right now — the AI service isn't configured. Let the app owner know.",
            session_id=request.session_id,
            success=False,
            error="not_configured",
        )

    user_message = (request.message or "").strip()
    if not user_message:
        return ChatResponse(
            message="Looks like that message came through empty — try asking something about the book.",
            session_id=request.session_id,
            success=False,
            error="empty_message",
        )

    system_prompt = create_system_prompt(request.book_data, request.user)
    messages = build_message_history(request.conversation_history)
    # Guard the seam between history and the new turn: if history ends on a
    # user message (e.g. its answer was a failed request and got filtered
    # out), appending another user message here would break the strict
    # user/assistant alternation Claude's API requires.
    if messages and messages[-1]["role"] == "user":
        messages.pop()
    messages.append({"role": "user", "content": user_message})

    try:
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=700,
            system=system_prompt,
            messages=messages,
        )

        claude_message = response.content[0].text.strip() if response.content else ""
        if not claude_message:
            raise ValueError("Claude returned an empty response")

        return ChatResponse(
            message=claude_message,
            session_id=request.session_id,
            success=True,
        )

    except anthropic.RateLimitError as e:
        print(f"Claude rate limit hit: {e}")
        return ChatResponse(
            message="Waddle's getting a lot of questions right now — try again in a few seconds.",
            session_id=request.session_id,
            success=False,
            error="rate_limited",
        )
    except anthropic.AuthenticationError as e:
        print(f"Claude authentication failed (check ANTHROPIC_API_KEY): {e}")
        return ChatResponse(
            message="The chat service isn't set up correctly right now.",
            session_id=request.session_id,
            success=False,
            error="auth_error",
        )
    except (anthropic.APIConnectionError, anthropic.APITimeoutError) as e:
        print(f"Claude connection error: {e}")
        return ChatResponse(
            message="Having trouble reaching the AI service. Check your connection and try again.",
            session_id=request.session_id,
            success=False,
            error="connection_error",
        )
    except anthropic.APIStatusError as e:
        print(f"Claude API error: {e}")
        return ChatResponse(
            message="The AI service hit a snag on its end. Please try again in a moment.",
            session_id=request.session_id,
            success=False,
            error="api_error",
        )
    except Exception as e:
        print(f"Unexpected error in chat endpoint: {e}")
        return ChatResponse(
            message="Something went wrong on my end. Please try again.",
            session_id=request.session_id,
            success=False,
            error="unknown_error",
        )

@app.post("/api/community", response_model=CommunityResponse)
async def get_community_resources(request: CommunityRequest):
    """Find community discussions and reference resources for a book via web search.

    Uses Claude's server-side web search tool rather than a custom crawler —
    every URL returned to the client came from an actual search result
    (validated in parse_community_sources), never guessed or hardcoded.
    """
    if not client:
        return CommunityResponse(
            sources=[],
            success=False,
            message="Community search isn't available right now — the AI service isn't configured.",
            error="not_configured",
        )

    title = (request.book_data.title or "").strip()
    if not title:
        return CommunityResponse(
            sources=[],
            success=False,
            message="Missing a book title to search for.",
            error="missing_title",
        )

    cache_key = get_session_key(request.book_data)
    if cache_key in community_cache:
        return CommunityResponse(sources=community_cache[cache_key], success=True)

    prompt = create_community_prompt(request.book_data)

    try:
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=2000,
            tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 5}],
            messages=[{"role": "user", "content": prompt}],
        )

        text_blocks = [block.text for block in response.content if block.type == "text"]
        final_text = text_blocks[-1] if text_blocks else ""

        sources = parse_community_sources(final_text)
        community_cache[cache_key] = sources

        return CommunityResponse(sources=sources, success=True)

    except anthropic.RateLimitError as e:
        print(f"Claude rate limit hit (community): {e}")
        return CommunityResponse(
            sources=[],
            success=False,
            message="Community search is getting a lot of requests right now — try again shortly.",
            error="rate_limited",
        )
    except anthropic.AuthenticationError as e:
        print(f"Claude authentication failed (community, check ANTHROPIC_API_KEY): {e}")
        return CommunityResponse(
            sources=[],
            success=False,
            message="The community search service isn't set up correctly right now.",
            error="auth_error",
        )
    except (anthropic.APIConnectionError, anthropic.APITimeoutError) as e:
        print(f"Claude connection error (community): {e}")
        return CommunityResponse(
            sources=[],
            success=False,
            message="Having trouble reaching the search service. Check your connection and try again.",
            error="connection_error",
        )
    except anthropic.APIStatusError as e:
        print(f"Claude API error (community): {e}")
        return CommunityResponse(
            sources=[],
            success=False,
            message="The search service hit a snag on its end. Please try again in a moment.",
            error="api_error",
        )
    except Exception as e:
        print(f"Unexpected error in community endpoint: {e}")
        return CommunityResponse(
            sources=[],
            success=False,
            message="Something went wrong finding community links. Please try again.",
            error="unknown_error",
        )

@app.get("/api/books")
async def list_books(user_id: str, db: Session = Depends(get_db)):
    """List all books for a user, most recently added first."""
    books = (
        db.query(db_models.Book)
        .filter(db_models.Book.user_id == user_id)
        .order_by(db_models.Book.created_at.desc())
        .all()
    )
    return {"books": [book_to_dict(b) for b in books]}

@app.post("/api/books")
async def create_book(request: CreateBookRequest, db: Session = Depends(get_db)):
    """Add a book to a user's library."""
    book = db_models.Book(user_id=request.user_id)
    apply_book_fields(book, request.book)
    if not book.title:
        raise HTTPException(status_code=400, detail="title is required")

    if book.total_pages:
        book.progress = round((book.current_page or 1) / book.total_pages * 100)
    if book.progress and book.progress >= 100:
        book.finished_at = book.finished_at or db_models.now_iso()

    db.add(book)
    db.commit()
    db.refresh(book)
    return book_to_dict(book)

@app.patch("/api/books/{book_id}")
async def update_book(book_id: str, request: UpdateBookRequest, db: Session = Depends(get_db)):
    """Partially update a book — same semantics as the old BookStorage.updateBook."""
    book = db.query(db_models.Book).filter(db_models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    apply_book_fields(book, request.updates)

    if "currentPage" in request.updates and book.total_pages:
        book.progress = round(book.current_page / book.total_pages * 100)

    # Mirrors the old applyFinishedAt: stamp/clear finishedAt based on progress,
    # unless the caller explicitly set finishedAt/status themselves this call.
    if "finishedAt" not in request.updates:
        if (book.progress or 0) >= 100:
            book.finished_at = book.finished_at or db_models.now_iso()
        else:
            book.finished_at = None

    db.commit()
    db.refresh(book)
    return book_to_dict(book)

@app.get("/api/books/{book_id}/messages")
async def list_messages(book_id: str, db: Session = Depends(get_db)):
    """List a book's chat history, oldest first."""
    messages = (
        db.query(db_models.Message)
        .filter(db_models.Message.book_id == book_id)
        .order_by(db_models.Message.created_at.asc())
        .all()
    )
    return {"messages": [message_to_dict(m) for m in messages]}

@app.post("/api/books/{book_id}/messages")
async def create_message(book_id: str, request: CreateMessageRequest, db: Session = Depends(get_db)):
    """Append one message to a book's chat history."""
    book = db.query(db_models.Book).filter(db_models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    message = db_models.Message(
        book_id=book_id,
        user_id=request.user_id,
        text=request.text,
        is_user=request.isUser,
        is_error=request.isError or False,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message_to_dict(message)

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Backend server is running"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Book Agent Backend Server...")
    print("📡 API will be available at: http://localhost:8001")
    print("📚 Chat endpoint: http://localhost:8001/api/chat")
    print("📖 Summary endpoint: http://localhost:8001/api/summary")
    
    if client:
        print("🤖 Claude API is configured and ready!")
    else:
        print("⚠️  Claude API key not configured - chat features will be disabled")
        print("   To fix this:")
        print("   1. Copy .env.example to .env in the project root")
        print("   2. Edit .env and add your API key")
        print("   3. Get your API key from: https://console.anthropic.com/")
        print("   4. Restart this server")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
