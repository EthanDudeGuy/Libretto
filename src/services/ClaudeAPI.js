import { Platform } from 'react-native';
import {
  handleAPIError,
  handleClaudeResponse,
  logError,
} from '../utils/ErrorHandler';

// Backend API endpoints (no more direct Claude API calls)
// Use different URLs based on platform for React Native compatibility
const BACKEND_BASE_URL = Platform.OS === 'ios' 
  ? 'http://127.0.0.1:8001'  // iOS Simulator
  : 'http://10.0.2.2:8001';  // Android Emulator
const CHAT_ENDPOINT = `${BACKEND_BASE_URL}/api/chat`;
const SUMMARY_ENDPOINT = `${BACKEND_BASE_URL}/api/summary`;
const SAVE_SESSION_ENDPOINT = `${BACKEND_BASE_URL}/api/save-session`;

// Note: Book context and system prompt generation is now handled by the backend server

// Send message to backend API
export const sendMessageToClaude = async (
  userMessage,
  book,
  conversationHistory = [],
  user = null
) => {
  try {
    // Prepare book data for backend
    const bookData = {
      title: book.title,
      author: book.author,
      currentPage: book.currentPage || 1,
      totalPages: book.totalPages,
      progress: book.progress || 0,
      publishedDate: book.publishedDate,
      categories: book.categories || [],
      description: book.description || 'No description available.',
    };

    const requestBody = {
      session_id: 'book-chat-session', // Simple session ID
      message: userMessage,
      book_data: bookData,
      conversation_history: conversationHistory,
      user: user
        ? {
            firstName: user.firstName,
            name: user.name,
            email: user.email,
          }
        : null,
    };

    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = `Backend API error: ${response.status}`;
      try {
        const errorText = await response.text();
        errorMessage += ` - ${errorText}`;
      } catch (e) {
        errorMessage += ' - Unable to read error details';
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Use the new error handling utility
    return handleClaudeResponse(
      data,
      "I'm sorry, I couldn't process your message right now."
    );
  } catch (error) {
    logError(error, 'Chat API call', { endpoint: CHAT_ENDPOINT });
    return {
      success: false,
      error: handleAPIError(error, 'Chat API'),
      message: handleAPIError(error, 'Chat API'),
    };
  }
};

// Generate book summary using backend API
export const generateBookSummary = async (book, user = null) => {
  try {
    // Prepare book data for backend
    const bookData = {
      title: book.title,
      author: book.author,
      currentPage: book.currentPage || 1,
      totalPages: book.totalPages,
      progress: book.progress || 0,
      publishedDate: book.publishedDate,
      categories: book.categories || [],
      description: book.description || 'No description available.',
    };

    const requestBody = {
      session_id: 'book-summary-session',
      book_data: bookData,
      user: user
        ? {
            firstName: user.firstName,
            name: user.name,
            email: user.email,
          }
        : null,
    };

    const response = await fetch(SUMMARY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = `Backend API error: ${response.status}`;
      try {
        const errorText = await response.text();
        errorMessage += ` - ${errorText}`;
      } catch (e) {
        errorMessage += ' - Unable to read error details';
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Use the new error handling utility for summary responses
    const result = handleClaudeResponse(
      data,
      'Welcome! What would you like to discuss?'
    );

    // Adapt the response format for summary (summary vs message)
    if (result.success) {
      return {
        success: true,
        summary: result.message,
      };
    } else {
      return {
        success: false,
        error: result.error,
        summary: result.message,
      };
    }
  } catch (error) {
    logError(error, 'Summary API call', { endpoint: SUMMARY_ENDPOINT });
    return {
      success: false,
      error: handleAPIError(error, 'Summary API'),
      summary: handleAPIError(error, 'Summary API'),
    };
  }
};

// Save session summary using backend API
export const saveSessionSummary = async (book, conversationHistory = []) => {
  try {
    // Prepare book data for backend
    const bookData = {
      title: book.title,
      author: book.author,
      currentPage: book.currentPage || 1,
      totalPages: book.totalPages,
      progress: book.progress || 0,
      publishedDate: book.publishedDate,
      categories: book.categories || [],
      description: book.description || 'No description available.',
    };

    // Generate a simple summary from conversation history
    const userMessages = conversationHistory.filter(msg => msg.isUser);
    let conversationSummary = 'No previous conversation found.';

    if (userMessages.length > 0) {
      // Simple keyword extraction for topics discussed
      const topics = [];
      for (const msg of userMessages.slice(-5)) {
        // Last 5 user messages
        const text = msg.text.toLowerCase();
        if (text.includes('character')) topics.push('characters');
        if (text.includes('plot')) topics.push('plot');
        if (text.includes('theme')) topics.push('themes');
        if (text.includes('chapter')) topics.push('chapters');
      }

      if (topics.length > 0) {
        const uniqueTopics = [...new Set(topics)];
        if (uniqueTopics.length === 1) {
          conversationSummary = `Last time we discussed ${uniqueTopics[0]}.`;
        } else {
          conversationSummary = `Last time we discussed ${uniqueTopics.slice(0, -1).join(', ')} and ${uniqueTopics[uniqueTopics.length - 1]}.`;
        }
      } else {
        conversationSummary =
          'Last time we had a general discussion about the book.';
      }
    }

    const requestBody = {
      session_id: 'book-session-save',
      book_data: bookData,
      conversation_summary: conversationSummary,
    };

    const response = await fetch(SAVE_SESSION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        message: data.message,
      };
    } else {
      throw new Error('Invalid response format from Backend API');
    }
  } catch (error) {
    console.error('Save session API error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
