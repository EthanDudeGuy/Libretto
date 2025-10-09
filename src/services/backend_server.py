"""
Book Discussion Agent Backend Server
Handles CORS and proxies requests to Claude API
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import anthropic
import os
import uuid

# Initialize FastAPI
app = FastAPI(title="Book Agent API", version="1.0.0")

# CRITICAL: Enable CORS - This is what fixes the browser error
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get API key from environment variable or hardcode it here
# Option 1: Set environment variable: export ANTHROPIC_API_KEY=your_key_here
# Option 2: Replace 'your_api_key_here' below with your actual Claude API key
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY") or "your_api_key_here"

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

# In-memory session storage (use Redis/database in production)
sessions = {}

# Session history storage for tracking last session summaries
session_history = {}

# Request/Response Models
class BookData(BaseModel):
    title: str
    author: str
    currentPage: Optional[int] = 1
    totalPages: Optional[int] = None
    progress: Optional[int] = 0
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

class SummaryRequest(BaseModel):
    session_id: str
    book_data: BookData
    user: Optional[UserData] = None

class SummaryResponse(BaseModel):
    summary: str
    session_id: str
    success: bool

class SaveSessionRequest(BaseModel):
    session_id: str
    book_data: BookData
    conversation_summary: str

class SaveSessionResponse(BaseModel):
    success: bool
    message: str

# Helper functions
def get_session_key(book_data: BookData) -> str:
    """Generate a unique key for book sessions"""
    return f"{book_data.title}_{book_data.author}"

def generate_session_summary(conversation_history: List[Dict]) -> str:
    """Generate a brief 1-2 sentence summary of the conversation"""
    if not conversation_history:
        return "No previous conversation found."
    
    # Extract key topics from the conversation
    user_messages = [msg.get("text", "") for msg in conversation_history if msg.get("isUser", False)]
    ai_messages = [msg.get("text", "") for msg in conversation_history if not msg.get("isUser", False)]
    
    # Simple keyword extraction for topics discussed
    topics = []
    for msg in user_messages[-5:]:  # Last 5 user messages
        if any(word in msg.lower() for word in ["character", "plot", "theme", "chapter", "page"]):
            if "character" in msg.lower():
                topics.append("characters")
            if "plot" in msg.lower():
                topics.append("plot")
            if "theme" in msg.lower():
                topics.append("themes")
    
    if topics:
        unique_topics = list(set(topics))
        if len(unique_topics) == 1:
            return f"Last time we discussed {unique_topics[0]}."
        else:
            return f"Last time we discussed {', '.join(unique_topics[:-1])} and {unique_topics[-1]}."
    else:
        return "Last time we had a general discussion about the book."

def create_system_prompt(book_data: BookData, user_data: Optional[UserData] = None) -> str:
    """Generate system prompt with book context"""
    user_name = user_data.firstName if user_data and user_data.firstName else "reader"
    
    return f"""You are Waddle, a friendly and knowledgeable AI assistant specializing in book discussions. You're helping {user_name} explore "{book_data.title}" by {book_data.author}.

Book Context:
- Current page: {book_data.currentPage} of {book_data.totalPages or 'Unknown'} ({book_data.progress or 0}% complete)
- Genre: {', '.join(book_data.categories) if book_data.categories else 'Unknown'}
- Description: {book_data.description or 'No description available'}

Guidelines:
1. Be conversational and encouraging, like a knowledgeable friend
2. Focus on themes, character development, literary techniques, and plot analysis
3. Avoid spoilers beyond the current page ({book_data.currentPage})
4. Ask thoughtful questions to deepen understanding
5. Reference specific passages or moments when relevant
6. Keep responses concise but insightful (2 paragraphs max)
7. Address the reader by name ({user_name}) to create a personal connection

Remember: You're discussing a book, so maintain an academic yet accessible tone."""

@app.get("/")
async def root():
    return {"message": "Book Agent API is running!", "status": "healthy"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_book(request: ChatRequest):
    """Handle chat messages about a book"""
    try:
        if not client:
            return ChatResponse(
                message="I'm sorry, but the AI chat service is not available right now. Please check that your Claude API key is configured.",
                session_id=request.session_id,
                success=True  # Return success=True but with error message
            )
        
        # Create system prompt
        system_prompt = create_system_prompt(request.book_data, request.user)
        
        # Prepare messages for Claude
        messages = []
        
        # Add conversation history
        for msg in request.conversation_history[-10:]:  # Last 10 messages
            role = "user" if msg.get("isUser", False) else "assistant"
            messages.append({
                "role": role,
                "content": msg.get("text", "")
            })
        
        # Add current message
        messages.append({
            "role": "user",
            "content": request.message
        })
        
        # Call Claude API
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            system=system_prompt,
            messages=messages
        )
        
        # Extract response
        claude_message = response.content[0].text
        
        return ChatResponse(
            message=claude_message,
            session_id=request.session_id,
            success=True
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return ChatResponse(
            message=f"I'm sorry, but I encountered an error: {str(e)}",
            session_id=request.session_id,
            success=True  # Return success=True but with error message
        )

@app.post("/api/save-session", response_model=SaveSessionResponse)
async def save_session_summary(request: SaveSessionRequest):
    """Save a session summary for future reference"""
    try:
        session_key = get_session_key(request.book_data)
        session_history[session_key] = {
            "book_data": request.book_data,
            "conversation_summary": request.conversation_summary,
            "timestamp": "now"  # In production, use actual timestamp
        }
        
        return SaveSessionResponse(
            success=True,
            message="Session summary saved successfully"
        )
        
    except Exception as e:
        print(f"Error saving session: {e}")
        return SaveSessionResponse(
            success=False,
            message=f"Error saving session: {str(e)}"
        )

@app.post("/api/summary", response_model=SummaryResponse)
async def generate_summary(request: SummaryRequest):
    """Generate a personalized book summary"""
    try:
        book_data = request.book_data
        user_data = request.user
        session_key = get_session_key(book_data)
        user_name = user_data.firstName if user_data and user_data.firstName else "there"
        
        # Generate a simple 3-sentence template-based summary
        if book_data.progress == 0:
            # First time opening the book
            summary = f"Welcome to \"{book_data.title}\", {user_name}! Any questions before we get started?"
        else:
            # Returning to the book - check for last session context
            if session_key in session_history:
                last_session = session_history[session_key]
                last_summary = last_session.get("conversation_summary", "")
                
                if last_summary and last_summary != "No previous conversation found.":
                    summary = f"Welcome back to \"{book_data.title}\", {user_name}! {last_summary} What would you like to discuss today?"
                else:
                    summary = f"Welcome back to \"{book_data.title}\", {user_name}! What would you like to discuss?"
            else:
                summary = f"Welcome back to \"{book_data.title}\", {user_name}! What would you like to discuss?"
        
        return SummaryResponse(
            summary=summary,
            session_id=request.session_id,
            success=True
        )
        
    except Exception as e:
        print(f"Error in summary endpoint: {e}")
        return SummaryResponse(
            summary=f"Welcome to \"{book_data.title}\"! I'm having trouble generating a summary right now, but feel free to ask me anything about the book.",
            session_id=request.session_id,
            success=True  # Return success=True but with fallback message
        )

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Backend server is running"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Book Agent Backend Server...")
    print("📡 API will be available at: http://localhost:8000")
    print("📚 Chat endpoint: http://localhost:8000/api/chat")
    print("📖 Summary endpoint: http://localhost:8000/api/summary")
    
    if client:
        print("🤖 Claude API is configured and ready!")
    else:
        print("⚠️  Claude API key not configured - chat features will be disabled")
        print("   To fix this:")
        print("   1. Get your API key from: https://console.anthropic.com/")
        print("   2. Either:")
        print("      - Set environment variable: export ANTHROPIC_API_KEY=your_key_here")
        print("      - Or edit line 29 in this file and replace 'your_api_key_here' with your actual key")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
