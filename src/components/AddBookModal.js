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
import theme from '../constants/theme';
import openLibraryAPI from '../services/OpenLibraryAPI';

export default function AddBookModal({ visible, onClose, onAddBook, onBookAddedAndNavigate }) {
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
    if (!selectedGoogleBook) {
      Alert.alert('Error', 'Please select a book from the search results');
      return;
    }
    if (!pageChapter.trim()) {
      Alert.alert('Error', 'Please enter your current page number or chapter');
      return;
    }

    // Parse current page from pageChapter input
    const currentPage = parseInt(pageChapter.trim()) || 1;
    
    // Use page count from Open Library API
    const totalPages = selectedGoogleBook?.pageCount || null;
    
    if (!totalPages || totalPages <= 0) {
      Alert.alert(
        'Page Count Not Available',
        'This book does not have page count information available. Please try selecting a different book.',
        [{ text: 'OK' }]
      );
      return;
    }
    const progress = Math.round((currentPage / totalPages) * 100);

    const newBook = {
      title: selectedGoogleBook.title,
      author: selectedGoogleBook.author,
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

    // Use the new callback for navigation with animation
    if (onBookAddedAndNavigate) {
      onBookAddedAndNavigate(newBook);
    } else {
      // Fallback to original behavior
      onAddBook(newBook);
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
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
      const results = await openLibraryAPI.searchBooks(searchQuery, {
        limit: 15,
        fields: ['title', 'author_name', 'number_of_pages_median', 'key', 'first_publish_year', 'cover_i']
      });
      
      setSearchResults(results.books || []);
      setShowSearchResults(true);
    } catch (error) {
      Alert.alert('Search Error', 'Failed to search for books. Please try again.');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };



  const selectBook = (book) => {
    setPageChapter(''); // Leave page field empty - user must input their current page
    setShowSearchResults(false);
    setSearchQuery('');
    
    // Store the Open Library book data (already includes page count from search)
    setSelectedGoogleBook({
      ...book,
      pageCountSource: book.pageCount > 0 ? 'openlibrary' : 'none'
    });
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
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
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
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>
                    Search Results ({searchResults.length})
                  </Text>
                  <TouchableOpacity 
                    style={styles.clearResultsButton}
                    onPress={() => setShowSearchResults(false)}
                  >
                    <Text style={styles.clearResultsText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity 
                      style={[
                        styles.searchResultItem,
                        index === 0 && styles.topResultItem // Highlight top result
                      ]}
                      onPress={() => selectBook(item)}
                    >
                      <View style={styles.searchResultContent}>
                        {item.thumbnail && (
                          <Image source={{ uri: item.thumbnail }} style={styles.searchResultThumbnail} />
                        )}
                        <View style={styles.searchResultText}>
                          <View style={styles.resultHeader}>
                            <Text style={styles.searchResultTitle} numberOfLines={2}>
                              {item.title}
                            </Text>
                            {index === 0 && (
                              <View style={styles.topResultBadge}>
                                <Text style={styles.topResultBadgeText}>Best Match</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.searchResultAuthor} numberOfLines={1}>
                            {item.author}
                          </Text>
                          <View style={styles.resultDetails}>
                            {item.pageCount > 0 && (
                              <Text style={styles.searchResultPages}>
                                {item.pageCount} pages
                              </Text>
                            )}
                            {item.publishedDate && (
                              <Text style={styles.searchResultYear}>
                                {item.publishedDate.split('-')[0]}
                              </Text>
                            )}
                            {item.publisher && (
                              <Text style={styles.searchResultPublisher} numberOfLines={1}>
                                {item.publisher}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  style={styles.searchResultsList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {selectedGoogleBook && (
              <View style={styles.selectedBookContainer}>
                <Text style={styles.selectedBookTitle}>Selected book:</Text>
                <View style={styles.selectedBookInfo}>
                  <Text style={styles.selectedBookName}>{selectedGoogleBook.title}</Text>
                  <Text style={styles.selectedBookAuthor}>by {selectedGoogleBook.author}</Text>
                  {selectedGoogleBook.pageCount && (
                    <Text style={styles.selectedBookPages}>
                      {selectedGoogleBook.pageCount} pages
                    </Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.form}>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Page / Chapter</Text>
                <TextInput
                  style={styles.input}
                  value={pageChapter}
                  onChangeText={setPageChapter}
                  placeholder="Enter your current page or chapter"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>

            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.addButton} onPress={handleAddBook}>
                <Text style={styles.addButtonText}>Add book</Text>
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
  helperText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
    fontFamily: 'Inter_400Regular',
  },
  selectedBookContainer: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  selectedBookTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  selectedBookInfo: {
    gap: 4,
  },
  selectedBookName: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  selectedBookAuthor: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  selectedBookPages: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: 'Inter_400Regular',
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
  // Enhanced Search Results Styles
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearResultsButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearResultsText: {
    fontSize: 12,
    color: theme.colors.blue,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  topResultItem: {
    borderColor: theme.colors.blue,
    borderWidth: 2,
    backgroundColor: theme.colors.surface,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  topResultBadge: {
    backgroundColor: theme.colors.blue,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  topResultBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  resultDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    alignItems: 'center',
  },
  searchResultYear: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  searchResultPublisher: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
});
