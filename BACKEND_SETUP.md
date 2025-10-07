# Backend Server Setup Guide

## Overview
The Libretto app uses a Python backend server to handle Claude API calls. The mobile app connects to `http://localhost:8000` to communicate with the AI.

## Quick Setup

### 1. Install Dependencies
```bash
pip install fastapi anthropic uvicorn
```

### 2. Set Your API Key
Get your Claude API key from: https://console.anthropic.com/

**Option A: Environment Variable (Recommended)**
```bash
export ANTHROPIC_API_KEY=your_actual_api_key_here
```

**Option B: Edit the Code**
Edit `src/services/backend_server.py` line 29:
```python
ANTHROPIC_API_KEY = "your_actual_api_key_here"
```

### 3. Start the Server
```bash
cd src/services
python3 backend_server.py
```

You should see:
```
🚀 Starting Book Agent Backend Server...
📡 API will be available at: http://localhost:8000
🤖 Claude API is configured and ready!
```

### 4. Test the Setup
Run the test script:
```bash
node test_backend.js
```

## API Endpoints
- Health check: `GET http://localhost:8000/api/health`
- Chat: `POST http://localhost:8000/api/chat`
- Summary: `POST http://localhost:8000/api/summary`

## Mobile App Connection
The React Native app in `src/screens/BookChat.js` automatically connects to `http://localhost:8000`. Make sure the server is running before using the chat feature.

## Troubleshooting
- **"Connection refused"**: Server isn't running
- **"API key not configured"**: Set ANTHROPIC_API_KEY environment variable
- **Port 8000 in use**: Kill existing process with `lsof -ti:8000 | xargs kill`

## Production Deployment
For production, deploy the backend server to a cloud service (Heroku, Railway, etc.) and update the `BACKEND_BASE_URL` in `src/services/ClaudeAPI.js`.
