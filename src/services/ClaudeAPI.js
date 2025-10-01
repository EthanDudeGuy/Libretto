// Backend API endpoints (no more direct Claude API calls)
const BACKEND_BASE_URL = 'http://localhost:8000';
const CHAT_ENDPOINT = `${BACKEND_BASE_URL}/api/chat`;
const SUMMARY_ENDPOINT = `${BACKEND_BASE_URL}/api/summary`;
const SAVE_SESSION_ENDPOINT = `${BACKEND_BASE_URL}/api/save-session`;


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
      description: book.description || 'No description available.'
    };
    
    // Generate a simple summary from conversation history
    const userMessages = conversationHistory.filter(msg => msg.isUser);
    let conversationSummary = "No previous conversation found.";
    
    if (userMessages.length > 0) {
      // Simple keyword extraction for topics discussed
      const topics = [];
      for (const msg of userMessages.slice(-5)) { // Last 5 user messages
        const text = msg.text.toLowerCase();
        if (text.includes("character")) topics.push("characters");
        if (text.includes("plot")) topics.push("plot");
        if (text.includes("theme")) topics.push("themes");
        if (text.includes("chapter")) topics.push("chapters");
      }
      
      if (topics.length > 0) {
        const uniqueTopics = [...new Set(topics)];
        if (uniqueTopics.length === 1) {
          conversationSummary = `Last time we discussed ${uniqueTopics[0]}.`;
        } else {
          conversationSummary = `Last time we discussed ${uniqueTopics.slice(0, -1).join(', ')} and ${uniqueTopics[uniqueTopics.length - 1]}.`;
        }
      } else {
        conversationSummary = "Last time we had a general discussion about the book.";
      }
    }
    
    const requestBody = {
      session_id: "book-session-save",
      book_data: bookData,
      conversation_summary: conversationSummary
    };

    const response = await fetch(SAVE_SESSION_ENDPOINT, {
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
    
    if (data.success) {
      return {
        success: true,
        message: data.message
      };
    } else {
      throw new Error('Invalid response format from Backend API');
    }
    
  } catch (error) {
    console.error('Save session API error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};