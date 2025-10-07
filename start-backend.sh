#!/bin/bash

# Libretto Backend Server Startup Script
echo "🚀 Starting Libretto Backend Server..."

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  ANTHROPIC_API_KEY environment variable is not set!"
    echo "Please set it with: export ANTHROPIC_API_KEY=your_actual_api_key_here"
    echo ""
    echo "Or edit src/services/backend_server.py line 29 with your API key"
    exit 1
fi

# Navigate to services directory
cd src/services

# Check if Python dependencies are installed
echo "📦 Checking Python dependencies..."
python3 -c "import fastapi, anthropic, uvicorn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Missing Python dependencies. Installing..."
    pip install fastapi anthropic uvicorn
fi

# Start the server
echo "🎯 Starting server on http://localhost:8000"
python3 backend_server.py
