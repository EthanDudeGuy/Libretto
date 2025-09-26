import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BOOKS_STORAGE_KEY = '@libretto_books';

// Save books to storage
export const saveBooks = async (books) => {
  try {
    const jsonValue = JSON.stringify(books);
    if (Platform.OS === 'web') {
      localStorage.setItem(BOOKS_STORAGE_KEY, jsonValue);
    } else {
      await AsyncStorage.setItem(BOOKS_STORAGE_KEY, jsonValue);
    }
  } catch (error) {
    console.error('Error saving books:', error);
  }
};

// Load books from storage
export const loadBooks = async () => {
  try {
    let jsonValue;
    if (Platform.OS === 'web') {
      jsonValue = localStorage.getItem(BOOKS_STORAGE_KEY);
    } else {
      jsonValue = await AsyncStorage.getItem(BOOKS_STORAGE_KEY);
    }
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading books:', error);
    return [];
  }
};

// Add a new book to storage
export const addBook = async (newBook) => {
  try {
    const existingBooks = await loadBooks();
    const bookWithId = {
      ...newBook,
      id: Date.now().toString(), // Simple ID generation
      progress: Math.round((newBook.currentPage / newBook.totalPages) * 100)
    };
    const updatedBooks = [...existingBooks, bookWithId];
    await saveBooks(updatedBooks);
    return bookWithId;
  } catch (error) {
    console.error('Error adding book:', error);
    throw error;
  }
};

// Update an existing book
export const updateBook = async (bookId, updates) => {
  try {
    const existingBooks = await loadBooks();
    const updatedBooks = existingBooks.map(book => 
      book.id === bookId 
        ? { 
            ...book, 
            ...updates,
            progress: updates.currentPage ? Math.round((updates.currentPage / book.totalPages) * 100) : book.progress
          }
        : book
    );
    await saveBooks(updatedBooks);
    return updatedBooks;
  } catch (error) {
    console.error('Error updating book:', error);
    throw error;
  }
};

// Delete a book from storage
export const deleteBook = async (bookId) => {
  try {
    const existingBooks = await loadBooks();
    const updatedBooks = existingBooks.filter(book => book.id !== bookId);
    await saveBooks(updatedBooks);
    return updatedBooks;
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
};
