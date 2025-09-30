import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Alert, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import theme from './theme';
import BookCard from './BookCard';
import AddBookModal from './AddBookModal';
import DeleteBookModal from './DeleteBookModal';
import { loadBooks, saveBooks, addBook, updateBook, deleteBook as deleteBookFromStorage } from './BookStorage';
import { useAuth } from './AuthContext';


export default function Homepage({ onNavigateToChat }) {
  const [books, setBooks] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const spinValue = useRef(new Animated.Value(0)).current;
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

  const handleAddBook = async (newBook) => {
    try {
      const addedBook = await addBook(newBook);
      setBooks(prevBooks => [addedBook, ...prevBooks]); // Add new book to the beginning for top-left positioning
    } catch (error) {
      console.error('Error adding book:', error);
      Alert.alert('Error', 'Failed to add book to your library');
    }
  };

  const handleBookAddedAndNavigate = async (newBook) => {
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
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Navigate to chat after animation completes
        onNavigateToChat(addedBook);
      });
      
    } catch (error) {
      console.error('Error adding book:', error);
      Alert.alert('Error', 'Failed to add book to your library');
    }
  };

  const spinIcon = () => {
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleAddBookPress = () => {
    spinIcon();
    setShowAddBookModal(true);
  };

  const updateBookmark = async (bookId, newPage, chapter) => {
    try {
      const updatedBooks = await updateBook(bookId, { currentPage: newPage, chapter });
      setBooks(updatedBooks);
    } catch (error) {
      console.error('Error updating bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark');
    }
  };

  const deleteBook = (bookId) => {
    const book = books.find(b => b.id === bookId);
    if (book) {
      setBookToDelete(book);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (!bookToDelete) return;
    
    try {
      const updatedBooks = await deleteBookFromStorage(bookToDelete.id);
      setBooks(updatedBooks);
    } catch (error) {
      console.error('Error deleting book:', error);
      Alert.alert('Error', 'Failed to delete book');
    } finally {
      setBookToDelete(null);
    }
  };

  const handleChatWithBook = (book) => {
    // Start fade out and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 600,
        useNativeDriver: true,
      })
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

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            setShowSettings(false);
            await logout();
          }
        }
      ]
    );
  };

  const renderBook = ({ item }) => (
    <View style={styles.bookCardContainer}>
      <BookCard 
        book={item} 
        onUpdateBookmark={updateBookmark}
        onChat={handleChatWithBook}
        onDelete={deleteBook}
      />
    </View>
  );

  return (
    <View style={styles.appContainer}>
      <Animated.View style={[styles.container, { 
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }]}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Image 
                source={require('./assets/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.title}>Libretto</Text>
                {user && (
                  <Text style={styles.welcomeText}>Welcome, {user.name}</Text>
                )}
              </View>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddBookPress}
              >
                <Animated.View
                  style={{
                    transform: [{
                      rotate: spinValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                      })
                    }]
                  }}
                >
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path 
                      d="M7 12L12 12M12 12L17 12M12 12V7M12 12L12 17" 
                      stroke={theme.colors.textPrimary} 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </Svg>
                </Animated.View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => setShowSettings(true)}
              >
                <Image 
                source={require('./assets/setting.png')} 
                style={styles.settingsIcon}
                resizeMode="contain"
                tintColor={theme.colors.textPrimary}
              />
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
                <Text style={styles.emptyText}>No books in your library yet</Text>
                <Text style={styles.emptySubtext}>Tap the + button to add your first book!</Text>
              </View>
            ) : (
              <FlatList
                data={books}
                renderItem={renderBook}
                keyExtractor={(item) => item.id}
                numColumns={3}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>© 2025 Libretto - Your literary journey</Text>
          </View>
        </View>
      </Animated.View>


      <Modal
        visible={showSettings}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModal}>
            <Text style={styles.settingsTitle}>Settings</Text>
            
            <TouchableOpacity style={styles.settingsOption} onPress={handleLogout}>
              <Text style={styles.settingsOptionText}>🚪 Logout</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AddBookModal
        visible={showAddBookModal}
        onClose={() => setShowAddBookModal(false)}
        onAddBook={handleAddBook}
        onBookAddedAndNavigate={handleBookAddedAndNavigate}
      />

      <DeleteBookModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setBookToDelete(null);
        }}
        onConfirm={confirmDelete}
        book={bookToDelete}
      />
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
    minHeight: '100%',
    backgroundColor: theme.colors.background,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    paddingTop: 55,
    paddingBottom: 18,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
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
    paddingVertical: 26,
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
    paddingVertical: 12,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
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
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  settingsIcon: {
    width: 22,
    height: 22,
  },
  listContainer: {
    paddingBottom: 22,
  },
  row: {
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bookCardContainer: {
    marginHorizontal: 25,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 26,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  settingsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 22,
    fontFamily: 'Inter_700Bold',
  },
  settingsOption: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 13,
    padding: 18,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  settingsOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 13,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
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
});