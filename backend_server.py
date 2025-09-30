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

# Get API key from environment variable
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY environment variable not set!")

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# In-memory session storage (use Redis/database in production)
sessions = {}

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

class ChatRequest(BaseModel):
    session_id: str
    message: str
    book_data: BookData
    conversation_history: Optional[List[Dict]] = []

class ChatResponse(BaseModel):
    message: str
    session_id: str
    success: bool

class SummaryRequest(BaseModel):
    session_id: str
    book_data: BookData

class SummaryResponse(BaseModel):
    summary: str
    session_id: str
    success: bool

# Helper function
def create_system_prompt(book_data: BookData) -> str:
    """Generate system prompt with book context"""
    return f"""You are Waddle, a friendly and knowledgeable AI assistant specializing in book discussions. You're helping a reader explore "{book_data.title}" by {book_data.author}.

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
7. Use the reader's name if provided, otherwise use friendly terms like "reader" or "you"

Remember: You're discussing a book, so maintain an academic yet accessible tone."""

@app.get("/")
async def root():
    return {"message": "Book Agent API is running!", "status": "healthy"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_book(request: ChatRequest):
    """Handle chat messages about a book"""
    try:
        # Create system prompt
        system_prompt = create_system_prompt(request.book_data)
        
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
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/api/summary", response_model=SummaryResponse)
async def generate_summary(request: SummaryRequest):
    """Generate a personalized book summary"""
    try:
        book_data = request.book_data
        
        system_prompt = f"""You are Waddle, a friendly AI assistant. Generate a VERY SHORT welcome message for a reader continuing to read "{book_data.title}" by {book_data.author}.

Context:
- Current page: {book_data.currentPage} of {book_data.totalPages or 'Unknown'} ({book_data.progress or 0}% complete)

CRITICAL REQUIREMENTS:
- Write EXACTLY 3 sentences only
- Each sentence should be short (under 15 words)
- Total response must be under 50 words
- Be warm but brief

Format: "Welcome back to [book]! You're on page [X] of [Y]. What would you like to discuss?" """

        # Call Claude API
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=50,  # Very low token limit to force short responses
            system=system_prompt,
            messages=[{
                "role": "user",
                "content": "Generate a 3-sentence welcome message under 50 words total."
            }]
        )
        
        # Extract response
        summary = response.content[0].text
        
        return SummaryResponse(
            summary=summary,
            session_id=request.session_id,
            success=True
        )
        
    except Exception as e:
        print(f"Error in summary endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Summary error: {str(e)}")

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
    uvicorn.run(app, host="0.0.0.0", port=8000)
