import { BACKEND_BASE_URL } from '../services/backendConfig';

const BOOKS_ENDPOINT = `${BACKEND_BASE_URL}/api/books`;

// Helper function to calculate progress percentage. Still used client-side
// for optimistic UI before the server's own (authoritative) value comes back.
export const calculateProgress = (currentPage, totalPages) => {
  if (!totalPages || totalPages <= 0) return 0;
  return Math.round((currentPage / totalPages) * 100);
};

const assertOk = async response => {
  if (response.ok) return;
  let detail = '';
  try {
    const body = await response.json();
    detail = body.detail || '';
  } catch (e) {
    // response wasn't JSON — fine, just report the status.
  }
  throw new Error(`Backend API error: ${response.status}${detail ? ` - ${detail}` : ''}`);
};

// Load all books belonging to a user.
export const loadBooks = async userId => {
  try {
    const response = await fetch(
      `${BOOKS_ENDPOINT}?user_id=${encodeURIComponent(userId)}`
    );
    await assertOk(response);
    const data = await response.json();
    return data.books || [];
  } catch (error) {
    console.error('Error loading books:', error);
    return [];
  }
};

// Add a new book to a user's library.
export const addBook = async (newBook, userId) => {
  try {
    const response = await fetch(BOOKS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, book: newBook }),
    });
    await assertOk(response);
    return await response.json();
  } catch (error) {
    console.error('Error adding book:', error);
    throw error;
  }
};

// Update an existing book. Returns the updated book — progress and
// finishedAt are recomputed server-side (same rules as before: finishedAt
// auto-stamps at 100% progress and clears if progress drops back below it).
export const updateBook = async (bookId, updates) => {
  try {
    const response = await fetch(`${BOOKS_ENDPOINT}/${bookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    await assertOk(response);
    return await response.json();
  } catch (error) {
    console.error('Error updating book:', error);
    throw error;
  }
};

// Load a book's chat history, oldest first.
export const loadMessages = async bookId => {
  try {
    const response = await fetch(`${BOOKS_ENDPOINT}/${bookId}/messages`);
    await assertOk(response);
    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
};

// Persist one chat message (user or assistant) against a book.
export const saveMessage = async (bookId, userId, message) => {
  try {
    const response = await fetch(`${BOOKS_ENDPOINT}/${bookId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        text: message.text,
        isUser: !!message.isUser,
        isError: !!message.isError,
      }),
    });
    await assertOk(response);
    return await response.json();
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};
