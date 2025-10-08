# Book Chat Backend Server

This is the backend server that handles Claude API integration for the Libretto book chat
application.

## Setup

1. **Install dependencies:**

   ```bash
   pip3 install fastapi uvicorn anthropic python-dotenv
   ```

2. **Start the server:**

   ```bash
   python3 backend_server.py
   ```

3. **Server will run on:** `http://localhost:8000`

## API Endpoints

- `GET /` - Health check
- `GET /api/health` - Detailed health check
- `POST /api/chat` - Send chat messages about books
- `POST /api/summary` - Generate book summaries

## Environment Variables

The server uses the Claude API key that's hardcoded in the file. For production, you should:

1. Create a `.env` file with:

   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

2. Update the server to load from environment variables

## CORS

The server has CORS enabled to allow requests from the React Native frontend.

## Production Notes

- Add proper session management (Redis/database)
- Add authentication/rate limiting
- Use environment variables for API keys
- Add proper error handling and logging
- Consider using a reverse proxy (nginx)
