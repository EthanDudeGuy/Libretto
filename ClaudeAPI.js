// Backend API endpoints (no more direct Claude API calls)
const BACKEND_BASE_URL = 'http://localhost:8000';
const CHAT_ENDPOINT = `${BACKEND_BASE_URL}/api/chat`;
const SUMMARY_ENDPOINT = `${BACKEND_BASE_URL}/api/summary`;


// Note: Book context and system prompt generation is now handled by the backend server

// Send message to backend API
export const sendMessageToClaude = async (userMessage, book, conversationHistory = []) => {
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
      description: book.description || 'No description available.'
    };
    
    const requestBody = {
      session_id: "book-chat-session", // Simple session ID
      message: userMessage,
      book_data: bookData,
      conversation_history: conversationHistory
    };

    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.success && data.message) {
      return {
        success: true,
        message: data.message.trim()
      };
    } else {
      throw new Error('Invalid response format from Backend API');
    }
    
  } catch (error) {
    console.error('Chat API error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate book summary using backend API
export const generateBookSummary = async (book) => {
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
      description: book.description || 'No description available.'
    };
    
    const requestBody = {
      session_id: "book-summary-session",
      book_data: bookData
    };

    const response = await fetch(SUMMARY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.success && data.summary) {
      return {
        success: true,
        summary: data.summary.trim()
      };
    } else {
      throw new Error('Invalid response format from Backend API');
    }
    
  } catch (error) {
    console.error('Summary API error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};