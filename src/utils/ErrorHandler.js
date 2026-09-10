/**
 * Error Handling Utilities
 * Provides consistent error handling across the application
 */

export const ErrorMessages = {
  NETWORK_ERROR: 'Please check your internet connection and try again.',
  API_ERROR:
    "I'm having trouble connecting to the AI service. Please try again in a moment.",
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

/**
 * Handles API errors and returns user-friendly messages
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @returns {string} User-friendly error message
 */
export const handleAPIError = (error, context = 'API call') => {
  console.error(`Error in ${context}:`, error);

  if (error.message) {
    // Check for specific error patterns
    if (
      error.message.includes('Network request failed') ||
      error.message.includes('fetch')
    ) {
      return ErrorMessages.NETWORK_ERROR;
    }

    if (
      error.message.includes('Backend API error') ||
      error.message.includes('Claude API')
    ) {
      return ErrorMessages.API_ERROR;
    }

    if (error.message.includes('Invalid response format')) {
      return ErrorMessages.API_ERROR;
    }
  }

  return ErrorMessages.UNKNOWN_ERROR;
};

/**
 * Handles Claude API responses with better error handling
 * @param {Object} response - The response from Claude API
 * @param {string} fallbackMessage - Message to show if response is invalid
 * @returns {Object} Standardized response object
 */
export const handleClaudeResponse = (
  response,
  fallbackMessage = "I'm sorry, I couldn't process that request."
) => {
  if (!response || typeof response !== 'object') {
    return {
      success: false,
      message: fallbackMessage,
      error: 'Invalid response format',
    };
  }

  // An explicit success: false always means failure, regardless of whether
  // a message is present — this must be checked before the generic
  // "has a message" fallback below, or a failed response with a friendly
  // error message would be reported back to the caller as a success.
  if (response.success === false) {
    return {
      success: false,
      message: response.message || fallbackMessage,
      error: response.error || 'Request failed',
    };
  }

  // Handle success case
  if (response.success && response.message) {
    return {
      success: true,
      message: response.message.trim(),
    };
  }

  // No explicit success flag, but an error is present — treat as failure.
  if (response.error) {
    return {
      success: false,
      message: response.message || handleAPIError(new Error(response.error)),
      error: response.error,
    };
  }

  // Handle case where there's a message but no explicit success flag
  if (response.message) {
    return {
      success: true,
      message: response.message.trim(),
    };
  }

  // Fallback for unexpected response format
  return {
    success: false,
    message: fallbackMessage,
    error: 'Unexpected response format',
  };
};

/**
 * Logs errors with context for debugging
 * @param {Error|Object} error - Error to log
 * @param {string} context - Context where error occurred
 * @param {Object} additionalInfo - Additional information to log
 */
export const logError = (error, context = 'Unknown', additionalInfo = {}) => {
  const errorInfo = {
    context,
    message: error.message || error.toString(),
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  };

  console.error('Application Error:', errorInfo);

  // In production, you might want to send this to an error tracking service
  // like Sentry, Bugsnag, or LogRocket
};
