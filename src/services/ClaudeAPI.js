import {
  handleAPIError,
  handleClaudeResponse,
  logError,
} from '../utils/ErrorHandler';
import { BACKEND_BASE_URL } from './backendConfig';

const CHAT_ENDPOINT = `${BACKEND_BASE_URL}/api/chat`;
const COMMUNITY_ENDPOINT = `${BACKEND_BASE_URL}/api/community`;

// Note: Book context and system prompt generation is now handled by the backend server

// Shared subset of book fields the backend needs. Callers spread this and
// add anything endpoint-specific (chat needs more context than community search).
const buildBookData = book => ({
  title: book.title,
  author: book.author,
  currentPage: book.currentPage || 1,
  totalPages: book.totalPages,
  progress: book.progress || 0,
});

// Throws with as much detail as the response gives us; callers catch this
// alongside network errors so both funnel through the same error handling.
const assertOk = async response => {
  if (response.ok) return;
  let errorMessage = `Backend API error: ${response.status}`;
  try {
    errorMessage += ` - ${await response.text()}`;
  } catch (e) {
    errorMessage += ' - Unable to read error details';
  }
  throw new Error(errorMessage);
};

// Strip the client-only welcome placeholder, failed-request messages, and
// any empty entries before sending history to the backend. Claude never
// actually authored the welcome message or the error text shown after a
// failed request — including them as real turns confuses follow-ups like
// "try again," since Claude would see its own error message as context
// instead of the question that failed.
const cleanConversationHistory = (conversationHistory = []) =>
  conversationHistory
    .filter(
      msg =>
        !msg.isWelcomeMessage &&
        !msg.isError &&
        typeof msg.text === 'string' &&
        msg.text.trim().length > 0
    )
    .map(msg => ({ isUser: !!msg.isUser, text: msg.text }));

// Send message to backend API
export const sendMessageToClaude = async (
  userMessage,
  book,
  conversationHistory = [],
  user = null
) => {
  try {
    const bookData = {
      ...buildBookData(book),
      publishedDate: book.publishedDate,
      categories: book.categories || [],
      description: book.description || 'No description available.',
    };

    const requestBody = {
      session_id: 'book-chat-session', // Simple session ID
      message: userMessage,
      book_data: bookData,
      conversation_history: cleanConversationHistory(conversationHistory),
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

    await assertOk(response);
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

// Find community discussions and reference resources for a book via the
// backend's web-search-backed endpoint.
export const getCommunityResources = async book => {
  try {
    const bookData = buildBookData(book);

    const response = await fetch(COMMUNITY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ book_data: bookData }),
    });

    await assertOk(response);
    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        sources: Array.isArray(data.sources) ? data.sources : [],
      };
    }

    return {
      success: false,
      sources: [],
      error: data.message || handleAPIError(new Error(data.error), 'Community API'),
    };
  } catch (error) {
    logError(error, 'Community API call', { endpoint: COMMUNITY_ENDPOINT });
    return {
      success: false,
      sources: [],
      error: handleAPIError(error, 'Community API'),
    };
  }
};
