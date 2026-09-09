import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import theme from '../constants/theme';
import Bookshelf from '../components/Bookshelf';
import AppHeader from '../components/AppHeader';
import { loadBooks, addBook } from '../utils/BookStorage';

export default function Homepage({
  onNavigateToChat,
  onNavigateToSettings,
  onNavigateHome,
  pendingAddBook,
  onConsumePendingAddBook,
}) {
  const [books, setBooks] = useState([]);
  const [pendingBook, setPendingBook] = useState(null);
  const [pageChapter, setPageChapter] = useState('');
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadBooksFromStorage();
  }, []);

  useEffect(() => {
    if (pendingAddBook) {
      setPendingBook(pendingAddBook);
      setPageChapter('');
      onConsumePendingAddBook?.();
    }
  }, [pendingAddBook]);

  const loadBooksFromStorage = async () => {
    try {
      const storedBooks = await loadBooks();
      setBooks(storedBooks);
    } catch (error) {
      console.error('Error loading books:', error);
      Alert.alert('Error', 'Failed to load your books');
    } finally {
      setLoading(false);
    }
  };

  const animateToChat = book => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onNavigateToChat(book);
    });
  };

  const handleSelectSearchBook = book => {
    setPendingBook(book);
    setPageChapter('');
  };

  const closeProgressModal = () => {
    setPendingBook(null);
    setPageChapter('');
  };

  const handleConfirmAddBook = async () => {
    if (!pendingBook) {
      return;
    }

    if (!pageChapter.trim()) {
      Alert.alert('Error', 'Please enter your current page or chapter');
      return;
    }

    const totalPages = pendingBook.pageCount || null;
    if (!totalPages || totalPages <= 0) {
      Alert.alert(
        'Page Count Not Available',
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
      googleBooksId: pendingBook.id || null,
      thumbnail: pendingBook.thumbnail || null,
      description: pendingBook.description || '',
      publishedDate: pendingBook.publishedDate || '',
      isbn: pendingBook.isbn || null,
      categories: pendingBook.categories || [],
      publisher: pendingBook.publisher || '',
    };

    try {
      const addedBook = await addBook(newBook);
      setBooks(prevBooks => [addedBook, ...prevBooks]);
      closeProgressModal();
      animateToChat(addedBook);
    } catch (error) {
      console.error('Error adding book:', error);
      Alert.alert('Error', 'Failed to add book to your library');
    }
  };

  useEffect(() => {
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.appContainer}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
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
            <Bookshelf books={books} onPressBook={animateToChat} />
          )}
        </View>
      </Animated.View>

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
              onChangeText={setPageChapter}
              placeholder='Page or chapter (e.g. 42)'
              placeholderTextColor={theme.colors.textMuted}
              keyboardType='number-pad'
              autoFocus
              returnKeyType='done'
              onSubmitEditing={handleConfirmAddBook}
            />
            <View style={styles.progressActions}>
              <TouchableOpacity
                style={styles.progressCancel}
                onPress={closeProgressModal}
              >
                <Text style={styles.progressCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.progressConfirm}
                onPress={handleConfirmAddBook}
              >
                <Text style={styles.progressConfirmText}>Start reading</Text>
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
  progressConfirmText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
