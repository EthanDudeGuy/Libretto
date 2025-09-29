import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  FlatList,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from './theme';
import googleBooksAPI from './GoogleBooksAPI';

export default function AddBookModal({ visible, onClose, onAddBook }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pageChapter, setPageChapter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedGoogleBook, setSelectedGoogleBook] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleAddBook = () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a book title');
      return;
    }
    if (!author.trim()) {
      Alert.alert('Error', 'Please enter an author');
      return;
    }
    if (!pageChapter.trim()) {
      Alert.alert('Error', 'Please enter a page number or chapter');
      return;
    }

    // Parse current page from pageChapter input
    const currentPage = parseInt(pageChapter.trim()) || 1;
    
    // Use Google Books data if available, otherwise use defaults
    const totalPages = selectedGoogleBook?.pageCount || 300; // Default to 300 if no page count available
    const progress = Math.round((currentPage / totalPages) * 100);

    const newBook = {
      title: title.trim(),
      author: author.trim(),
      pageChapter: pageChapter.trim(),
      // Use real data from Google Books API
      totalPages: totalPages,
      currentPage: currentPage,
      chapter: 1, // Default value - could be enhanced later
      progress: progress,
      // Store additional Google Books data for future use
      googleBooksId: selectedGoogleBook?.id || null,
      thumbnail: selectedGoogleBook?.thumbnail || null,
      description: selectedGoogleBook?.description || '',
      publishedDate: selectedGoogleBook?.publishedDate || '',
      isbn: selectedGoogleBook?.isbn || null,
      categories: selectedGoogleBook?.categories || [],
      publisher: selectedGoogleBook?.publisher || '',
    };

    onAddBook(newBook);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setPageChapter('');
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedGoogleBook(null);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    setIsSearching(true);
    try {
      const results = await googleBooksAPI.searchBooks(searchQuery, {
        maxResults: 10,
        filter: 'partial'
      });
      
      setSearchResults(results.books);
      setShowSearchResults(true);
    } catch (error) {
      Alert.alert('Search Error', 'Failed to search for books. Please try again.');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectBook = (book) => {
    setTitle(book.title);
    setAuthor(book.author);
    setPageChapter('1'); // Default to page 1
    setShowSearchResults(false);
    setSearchQuery('');
    
    // Store the Google Books data for later use
    setSelectedGoogleBook(book);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <Animated.View style={[
            styles.modal,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}>
            <Text style={styles.title}>Add book</Text>
            
            {/* Search Section */}
            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>Search for a book</Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by title, author, or ISBN..."
                  placeholderTextColor={theme.colors.textMuted}
                />
                <TouchableOpacity 
                  style={[styles.searchButton, isSearching && styles.searchButtonDisabled]} 
                  onPress={handleSearch}
                  disabled={isSearching}
                >
                  <Text style={styles.searchButtonText}>
                    {isSearching ? 'Searching...' : 'Search'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Results */}
            {showSearchResults && (
              <View style={styles.searchResultsContainer}>
                <Text style={styles.resultsTitle}>Search Results:</Text>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.searchResultItem}
                      onPress={() => selectBook(item)}
                    >
                      <View style={styles.searchResultContent}>
                        {item.thumbnail && (
                          <Image source={{ uri: item.thumbnail }} style={styles.searchResultThumbnail} />
                        )}
                        <View style={styles.searchResultText}>
                          <Text style={styles.searchResultTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={styles.searchResultAuthor} numberOfLines={1}>
                            {item.author}
                          </Text>
                          {item.pageCount > 0 && (
                            <Text style={styles.searchResultPages}>
                              {item.pageCount} pages
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  style={styles.searchResultsList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            <Text style={styles.divider}>Or add manually:</Text>
            
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Author</Text>
                <TextInput
                  style={styles.input}
                  value={author}
                  onChangeText={setAuthor}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Page / Chapter</Text>
                <TextInput
                  style={styles.input}
                  value={pageChapter}
                  onChangeText={setPageChapter}
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.addButton} onPress={handleAddBook}>
                <Text style={styles.addButtonText}>Add Book</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter_700Bold',
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    fontFamily: 'Inter_400Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  addButton: {
    flex: 1,
    backgroundColor: theme.colors.blue,
    borderRadius: 12,
    padding: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  // Search Section Styles
  searchSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    fontFamily: 'Inter_400Regular',
  },
  searchButton: {
    backgroundColor: theme.colors.blue,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  // Search Results Styles
  searchResultsContainer: {
    marginBottom: 20,
    maxHeight: 200,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  searchResultsList: {
    maxHeight: 150,
  },
  searchResultItem: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  searchResultContent: {
    flexDirection: 'row',
    gap: 8,
  },
  searchResultThumbnail: {
    width: 40,
    height: 50,
    borderRadius: 4,
  },
  searchResultText: {
    flex: 1,
    justifyContent: 'center',
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
    fontFamily: 'Inter_600SemiBold',
  },
  searchResultAuthor: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
    fontFamily: 'Inter_400Regular',
  },
  searchResultPages: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
