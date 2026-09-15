import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import theme from '../constants/theme';
import ActiveBooksPanel from '../components/ActiveBooksPanel';
import RecentQuestionsPanel from '../components/RecentQuestionsPanel';
import AppHeader from '../components/AppHeader';
import {
  loadBooks,
  addBook,
  updateBook,
  loadMessages,
  loadRecentQuestions,
} from '../utils/BookStorage';
import { useAuth } from '../context/AuthContext';

export default function Homepage({
  onNavigateToChat,
  onNavigateToSettings,
  onNavigateHome,
  onNavigateToLibrary,
  pendingAddBook,
  onConsumePendingAddBook,
}) {
  const { user } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const [books, setBooks] = useState([]);
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [pendingBook, setPendingBook] = useState(null);
  const [pageChapter, setPageChapter] = useState('');
  const [addBookError, setAddBookError] = useState(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [loading, setLoading] = useState(true);
  const isNarrow = windowWidth < 640;

  useEffect(() => {
    if (user?.id) {
      loadBooksFromStorage();
      loadRecentQuestions(user.id).then(setRecentQuestions);
    }
  }, [user?.id]);

  useEffect(() => {
    if (pendingAddBook) {
      setPendingBook(pendingAddBook);
      setPageChapter('');
      setAddBookError(null);
      onConsumePendingAddBook?.();
    }
  }, [pendingAddBook]);

  const loadBooksFromStorage = async () => {
    try {
      const storedBooks = await loadBooks(user.id);

      const activeBooks = storedBooks.filter(
        book => book.status === 'currently_reading'
      );
      const lastMessages = await Promise.all(
        activeBooks.map(book => loadMessages(book.id))
      );
      const lastMessageByBookId = {};
      activeBooks.forEach((book, index) => {
        const messages = lastMessages[index];
        lastMessageByBookId[book.id] = messages?.length
          ? messages[messages.length - 1].text
          : null;
      });

      setBooks(
        storedBooks.map(book => ({
          ...book,
          lastMessage: lastMessageByBookId[book.id] || null,
        }))
      );
    } catch (error) {
      console.error('Error loading books:', error);
      Alert.alert('Error', 'Failed to load your books');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookPage = async (bookId, newPage) => {
    const updated = await updateBook(bookId, { currentPage: newPage });
    setBooks(prevBooks =>
      prevBooks.map(book =>
        book.id === bookId ? { ...book, ...updated } : book
      )
    );
  };

  const handleSelectSearchBook = book => {
    setPendingBook(book);
    setPageChapter('');
    setAddBookError(null);
  };

  const closeProgressModal = () => {
    setPendingBook(null);
    setPageChapter('');
    setAddBookError(null);
  };

  const handleConfirmAddBook = async () => {
    if (!pendingBook) {
      return;
    }

    if (!pageChapter.trim()) {
      setAddBookError('Please enter your current page or chapter.');
      return;
    }

    const totalPages = pendingBook.pageCount || null;
    if (!totalPages || totalPages <= 0) {
      setAddBookError(
        'This book does not have page count information. Please try a different edition.'
      );
      return;
    }

    const currentPage = parseInt(pageChapter.trim(), 10) || 1;
    const progress = Math.round((currentPage / totalPages) * 100);

    const newBook = {
      title: pendingBook.title,
      author: pendingBook.author,
      pageChapter: pageChapter.trim(),
      totalPages,
      currentPage,
      chapter: 1,
      progress,
      status: 'currently_reading',
      googleBooksId: pendingBook.id || null,
      thumbnail: pendingBook.thumbnail || null,
      description: pendingBook.description || '',
      publishedDate: pendingBook.publishedDate || '',
      isbn: pendingBook.isbn || null,
      categories: pendingBook.categories || [],
      publisher: pendingBook.publisher || '',
    };

    setAddBookError(null);
    setIsAddingBook(true);
    try {
      const addedBook = await addBook(newBook, user.id);
      setBooks(prevBooks => [addedBook, ...prevBooks]);
      closeProgressModal();
      onNavigateToChat(addedBook);
    } catch (error) {
      console.error('Error adding book:', error);
      setAddBookError(
        'Failed to add book to your library. Is the backend server running?'
      );
    } finally {
      setIsAddingBook(false);
    }
  };

  return (
    <View style={styles.appContainer}>
      <View style={styles.container}>
        <AppHeader
          onSelectBook={handleSelectSearchBook}
          onNavigateHome={onNavigateHome}
          onNavigateSettings={onNavigateToSettings}
        />

        <View style={styles.mainContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your bookshelf...</Text>
            </View>
          ) : (
            <View
              style={[
                styles.panelsRow,
                isNarrow && styles.panelsRowNarrow,
              ]}
            >
              <ActiveBooksPanel
                books={books}
                onPressBook={onNavigateToChat}
                onViewLibrary={onNavigateToLibrary}
                onUpdateBookPage={handleUpdateBookPage}
              />
              <RecentQuestionsPanel questions={recentQuestions} />
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={!!pendingBook}
        transparent
        animationType='fade'
        onRequestClose={closeProgressModal}
      >
        <KeyboardAvoidingView
          style={styles.progressOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.progressBackdrop}
            activeOpacity={1}
            onPress={closeProgressModal}
          />
          <View style={styles.progressModal}>
            <Text style={styles.progressTitle}>Where are you?</Text>
            {pendingBook && (
              <View style={styles.pendingBookRow}>
                {pendingBook.thumbnail ? (
                  <Image
                    source={{ uri: pendingBook.thumbnail }}
                    style={styles.pendingThumbnail}
                  />
                ) : null}
                <View style={styles.pendingBookText}>
                  <Text style={styles.pendingBookTitle} numberOfLines={2}>
                    {pendingBook.title}
                  </Text>
                  <Text style={styles.pendingBookAuthor} numberOfLines={1}>
                    {pendingBook.author}
                  </Text>
                </View>
              </View>
            )}
            <TextInput
              style={styles.progressInput}
              value={pageChapter}
              onChangeText={text => {
                setPageChapter(text);
                if (addBookError) {
                  setAddBookError(null);
                }
              }}
              placeholder='Page or chapter (e.g. 42)'
              placeholderTextColor={theme.colors.textMuted}
              keyboardType='number-pad'
              autoFocus
              returnKeyType='done'
              onSubmitEditing={handleConfirmAddBook}
            />
            {addBookError && (
              <Text style={styles.progressErrorText}>{addBookError}</Text>
            )}
            <View style={styles.progressActions}>
              <TouchableOpacity
                style={styles.progressCancel}
                onPress={closeProgressModal}
              >
                <Text style={styles.progressCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.progressConfirm,
                  isAddingBook && styles.progressConfirmDisabled,
                ]}
                onPress={handleConfirmAddBook}
                disabled={isAddingBook}
              >
                <Text style={styles.progressConfirmText}>
                  {isAddingBook ? 'Adding…' : 'Start reading'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mainContent: {
    flex: 1,
  },
  panelsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.x2_5,
    padding: theme.spacing.x2_5,
  },
  panelsRowNarrow: {
    flexDirection: 'column',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 66,
  },
  loadingText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
  },
  progressOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  progressBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
  },
  progressModal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    padding: 20,
    gap: 14,
    zIndex: 1,
  },
  progressTitle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  pendingBookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingThumbnail: {
    width: 40,
    height: 58,
    borderRadius: 4,
  },
  pendingBookText: {
    flex: 1,
    minWidth: 0,
  },
  pendingBookTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  pendingBookAuthor: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  progressInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    outlineStyle: 'none',
  },
  progressErrorText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: -4,
  },
  progressActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  progressCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radii.sm,
  },
  progressCancelText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  progressConfirm: {
    backgroundColor: theme.colors.orange,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radii.sm,
  },
  progressConfirmDisabled: {
    opacity: 0.6,
  },
  progressConfirmText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
