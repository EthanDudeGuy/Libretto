# Error Handling & Troubleshooting Guide

This guide explains the error handling improvements made to the Libretto app and how to troubleshoot issues.

## 🔧 **What Was Fixed**

### 1. **Backend Response Format Issues**
- **Problem**: Backend was returning `success=false` when API key wasn't configured, causing frontend to fail
- **Solution**: Backend now returns `success=true` with error messages, so frontend can display them properly
- **Files Changed**: `src/services/backend_server.py`

### 2. **API Error Handling**
- **Problem**: Poor error handling between frontend and backend
- **Solution**: Created comprehensive error handling utility
- **Files Added**: `src/utils/ErrorHandler.js`

### 3. **Frontend Error Handling**
- **Problem**: Errors were thrown instead of being handled gracefully
- **Solution**: All errors now return user-friendly messages instead of crashing
- **Files Changed**: `src/services/ClaudeAPI.js`, `src/screens/BookChat.js`

## 🛠️ **How to Set Up Your Claude API Key**

You have two options:

### Option 1: Environment Variable (Recommended)
```bash
export ANTHROPIC_API_KEY=your_actual_api_key_here
```

### Option 2: Edit the Code Directly
1. Open `src/services/backend_server.py`
2. Find line 29: `ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY") or "your_api_key_here"`
3. Replace `"your_api_key_here"` with your actual Claude API key

### Get Your API Key
1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to the API keys section
4. Create a new API key

## 🧪 **Testing Your Setup**

### Test the Backend Server
```bash
# Start your backend server
cd src/services
python3 backend_server.py

# In another terminal, run the test script
cd /path/to/your/project
node test_backend.js
```

The test script will:
- ✅ Check if the backend server is running
- ✅ Test all API endpoints
- ✅ Show if your API key is configured
- ✅ Provide clear next steps

### Expected Output
If everything is working:
```
🧪 Testing Backend Server...

1. Testing health check...
✅ Health check passed: { status: 'healthy', message: 'Backend server is running' }

2. Testing root endpoint...
✅ Root endpoint passed: { message: 'Book Agent API is running!', status: 'healthy' }

3. Testing chat endpoint...
✅ Chat endpoint passed
   Response format: { success: true, hasMessage: true, sessionId: 'test-session' }
🤖 Claude API is working!

4. Testing summary endpoint...
✅ Summary endpoint passed
   Response format: { success: true, hasSummary: true, sessionId: 'test-summary-session' }

🎉 Backend testing complete!
```

If API key is not configured:
```
⚠️  API key not configured - chat will show error message
```

## 🚨 **Common Issues & Solutions**

### Issue: "Invalid response format from Backend API"
- **Cause**: Backend server not running or API key not configured
- **Solution**: 
  1. Start backend server: `cd src/services && python3 backend_server.py`
  2. Set API key (see above)
  3. Restart backend server

### Issue: "Network request failed"
- **Cause**: Backend server not running
- **Solution**: Start the backend server

### Issue: "Unexpected text node" errors
- **Cause**: React Native UI components with improper text rendering
- **Solution**: These are now handled gracefully with the new error handling

### Issue: "props.pointerEvents is deprecated"
- **Cause**: Using old React Native API
- **Solution**: This warning doesn't break functionality but should be updated

## 🔍 **Error Handling Features**

### 1. **Graceful Degradation**
- App continues working even when API fails
- Shows user-friendly error messages instead of technical errors
- Falls back to placeholder content when needed

### 2. **Comprehensive Logging**
- All errors are logged with context
- Easy to debug issues in development
- Ready for production error tracking services

### 3. **User-Friendly Messages**
- Network errors: "Please check your internet connection"
- API errors: "I'm having trouble connecting to the AI service"
- Unknown errors: "Something went wrong. Please try again."

### 4. **Consistent Response Format**
- All API responses follow the same format
- Frontend can handle any response gracefully
- No more "Invalid response format" errors

## 📱 **Testing in Your App**

1. **Start the backend server**:
   ```bash
   cd src/services
   python3 backend_server.py
   ```

2. **Start your React Native app**:
   ```bash
   npx expo start
   ```

3. **Test the chat functionality**:
   - Open a book chat
   - Send a message
   - Should work without errors

## 🔮 **Future Improvements**

The error handling system is designed to be extensible:

- **Production Error Tracking**: Easy to integrate Sentry, Bugsnag, or LogRocket
- **Retry Logic**: Can add automatic retry for failed requests
- **Offline Support**: Can add offline message queuing
- **Analytics**: Can add error analytics and monitoring

## 📞 **Getting Help**

If you're still having issues:

1. Run the test script: `node test_backend.js`
2. Check the backend server logs
3. Check the React Native console for errors
4. Verify your API key is correct
5. Make sure the backend server is running on port 8000

The error handling system will now provide clear, actionable error messages to help you troubleshoot any issues!
