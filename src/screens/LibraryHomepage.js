import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import theme from '../constants/theme';
import ActiveBooksPanel from '../components/ActiveBooksPanel';
import RecentQuestionsPanel from '../components/RecentQuestionsPanel';
import AppHeader from '../components/AppHeader';
import {
  loadBooks,
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
  onSelectBook,
}) {
  const { user } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const [books, setBooks] = useState([]);
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isNarrow = windowWidth < 640;

  useEffect(() => {
    if (user?.id) {
      loadBooksFromStorage();
      loadRecentQuestions(user.id).then(setRecentQuestions);
    }
  }, [user?.id]);

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

  return (
    <View style={styles.appContainer}>
      <View style={styles.container}>
        <AppHeader
          onSelectBook={onSelectBook}
          onNavigateHome={onNavigateHome}
          onNavigateSettings={onNavigateToSettings}
          onNavigateLibrary={onNavigateToLibrary}
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
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 18,
  },
  panelsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.x2_5,
    paddingVertical: theme.spacing.x2_5,
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
});
