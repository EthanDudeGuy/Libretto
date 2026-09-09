import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import theme from '../constants/theme';
import HorizontalBookCard from '../components/HorizontalBookCard';
import AddBookModal from '../components/AddBookModal';
import SettingsScreen from './SettingsScreen';
import {
  loadBooks,
  saveBooks,
  addBook,
  updateBook,
} from '../utils/BookStorage';
import { useAuth } from '../context/AuthContext';

export default function Homepage({ onNavigateToChat }) {
  const [books, setBooks] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { logout, user } = useAuth();

  // Load books from storage on component mount
  useEffect(() => {
    loadBooksFromStorage();
  }, []);

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

  const handleAddBook = async newBook => {
    try {
      const addedBook = await addBook(newBook);
      setBooks(prevBooks => [addedBook, ...prevBooks]); // Add new book to the beginning for top-left positioning
    } catch (error) {
      console.error('Error adding book:', error);
      Alert.alert('Error', 'Failed to add book to your library');
    }
  };

  const handleBookAddedAndNavigate = async newBook => {
    try {
      // Add the book to storage
      const addedBook = await addBook(newBook);
      setBooks(prevBooks => [addedBook, ...prevBooks]);

      // Close the modal first
      setShowAddBookModal(false);

      // Start fade out and scale animation
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
        // Navigate to chat after animation completes
        onNavigateToChat(addedBook);
      });
    } catch (error) {
      console.error('Error adding book:', error);
      Alert.alert('Error', 'Failed to add book to your library');
    }
  };

  const handleAddBookPress = () => {
    setShowAddBookModal(true);
  };

  const updateBookmark = async (bookId, newPage, chapter) => {
    try {
      const updatedBooks = await updateBook(bookId, {
        currentPage: newPage,
        chapter,
      });
      setBooks(updatedBooks);
    } catch (error) {
      console.error('Error updating bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark');
    }
  };

  const handleChatWithBook = book => {
    // Start fade out and scale animation
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
      // Navigate to chat after animation completes
      onNavigateToChat(book);
    });
  };

  // Reset animation when component mounts (returning from chat)
  useEffect(() => {
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
  }, [fadeAnim, scaleAnim]);

  const handleLogout = async () => {
    setShowUserDropdown(false);
    await logout();
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const handleSettings = () => {
    setShowUserDropdown(false);
    setShowSettings(true);
  };

  const renderBook = ({ item }) => (
    <HorizontalBookCard
      book={item}
      onUpdateBookmark={updateBookmark}
      onChat={handleChatWithBook}
    />
  );

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
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode='contain'
              />
              <View>
                <Text style={styles.title}>Libretto</Text>
                {user && (
                  <Text style={styles.welcomeText}>
                    Welcome, {user.firstName || user.name}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddBookPress}
              >
                <Svg width='16' height='16' viewBox='0 0 24 24' fill='none' style={styles.plusIcon}>
                  <Path
                    d='M7 12L12 12M12 12L17 12M12 12V7M12 12L12 17'
                    stroke={theme.colors.textPrimary}
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </Svg>
                <Text style={styles.addButtonText}>Add book</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.userIconButton}
                onPress={toggleUserDropdown}
              >
                <Text style={styles.userIcon}>👤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          <View style={styles.contentContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading your books...</Text>
              </View>
            ) : books.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No books in your library yet
                </Text>
                <Text style={styles.emptySubtext}>
                  Tap the + button to add your first book!
                </Text>
              </View>
            ) : (
              <FlatList
                data={books}
                renderItem={renderBook}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              © 2025 Libretto - Your literary journey
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* User Dropdown */}
      {showUserDropdown && (
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity
            style={styles.dropdownBackdrop}
            activeOpacity={1}
            onPress={() => setShowUserDropdown(false)}
          >
            <View style={styles.userDropdown}>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={handleSettings}
              >
                <Text style={styles.dropdownOptionIcon}>⚙️</Text>
                <Text style={styles.dropdownOptionText}>Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dropdownOption, styles.logoutOption]}
                onPress={handleLogout}
              >
                <Text style={styles.dropdownOptionIcon}>🚪</Text>
                <Text style={[styles.dropdownOptionText, styles.logoutText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <AddBookModal
        visible={showAddBookModal}
        onClose={() => setShowAddBookModal(false)}
        onAddBook={handleAddBook}
        onBookAddedAndNavigate={handleBookAddedAndNavigate}
      />

      {showSettings && (
        <SettingsScreen onClose={() => setShowSettings(false)} />
      )}

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
  header: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    paddingTop: 48,
    paddingBottom: 18,
    backgroundColor: theme.colors.background,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  logo: {
    width: 53,
    height: 53,
  },
  mainContent: {
    flex: 1,
    paddingVertical: 6,
  },
  contentContainer: {
    paddingHorizontal: 22,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    flex: 1,
  },
  footer: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingVertical: 6,
  },
  footerContent: {
    paddingHorizontal: 16,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.orange,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 31,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  welcomeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 22,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  userIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  userIcon: {
    fontSize: 22,
    color: theme.colors.textPrimary,
  },
  listContainer: {
    paddingBottom: 22,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  userDropdown: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 160,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  logoutOption: {
    borderBottomWidth: 0,
  },
  dropdownOptionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  dropdownOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  logoutText: {
    color: '#ff6b6b',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 66,
    paddingHorizontal: 44,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 9,
    fontFamily: 'Inter_600SemiBold',
  },
  emptySubtext: {
    fontSize: 18,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
  plusIcon: {
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
});
