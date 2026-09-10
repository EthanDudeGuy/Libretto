# Backend Server Setup Guide

## Overview

The Libretto app uses a Python (FastAPI) backend server for the Claude API calls, community-link
search, and book/chat data storage. The app connects to `http://127.0.0.1:8001` to talk to it.

## Quick Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Your API Key

Get your Claude API key from: https://console.anthropic.com/

```bash
cp .env.example .env
# then edit .env and set ANTHROPIC_API_KEY
```

### 3. Start the Server

```bash
cd src/services
python3 backend_server.py
```

You should see:

```
🚀 Starting Book Agent Backend Server...
📡 API will be available at: http://localhost:8001
🤖 Claude API is configured and ready!
```

## Database

Books and chat messages are stored in a local SQLite file (`src/services/libretto.db`), created
automatically on first run — no setup needed. To point at a different database (e.g. Postgres for a
real deployment), set `DATABASE_URL` before starting the server; nothing else needs to change:

```bash
export DATABASE_URL=postgresql://user:password@host:5432/libretto
```

## API Endpoints

- Health check: `GET /api/health`
- Chat: `POST /api/chat`
- Community links: `POST /api/community`
- Books: `GET/POST /api/books`, `PATCH /api/books/{id}`
- Chat history: `GET/POST /api/books/{id}/messages`

## Mobile App Connection

The frontend's backend URL lives in `src/services/backendConfig.js`. Update it there when deploying
somewhere other than localhost.

## Troubleshooting

- **"Connection refused"**: Server isn't running
- **"API key not configured"**: Set `ANTHROPIC_API_KEY` in `.env`
- **Port 8001 in use**: Kill the existing process with `lsof -ti:8001 | xargs kill`

## Production Deployment

For production: deploy the backend to a real host (Render, Railway, Fly.io, etc.), point
`DATABASE_URL` at a real Postgres instance instead of the local SQLite file, and update
`BACKEND_BASE_URL` in `src/services/backendConfig.js` to the deployed URL. Auth is still a local-only
stub at this point (see `src/context/AuthContext.js`) — that migration is tracked separately.
