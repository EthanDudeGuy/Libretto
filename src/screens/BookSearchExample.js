import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, Alert } from 'react-native';
import googleBooksAPI from '../services/GoogleBooksAPI';
import theme from '../constants/theme';

export default function BookSearchExample() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    setIsLoading(true);
    try {
      const results = await googleBooksAPI.searchBooks(searchQuery, {
        maxResults: 20,
        filter: 'partial' // Only books with preview available
      });
      
      setSearchResults(results.books);
      setTotalResults(results.totalItems);
    } catch (error) {
      Alert.alert('Search Error', 'Failed to search for books. Please check your API key.');
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderBookItem = ({ item }) => (
    <View style={styles.bookItem}>
      <View style={styles.bookInfo}>
        {item.thumbnail && (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        )}
        <View style={styles.bookDetails}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.author}>{item.author}</Text>
          <Text style={styles.publisher}>{item.publisher}</Text>
          {item.pageCount > 0 && (
            <Text style={styles.pageCount}>{item.pageCount} pages</Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Book Search</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for books..."
          placeholderTextColor={theme.colors.textMuted}
        />
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={handleSearch}
          disabled={isLoading}
        >
          <Text style={styles.searchButtonText}>
            {isLoading ? 'Searching...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      {totalResults > 0 && (
        <Text style={styles.resultsCount}>
          Found {totalResults} results
        </Text>
      )}

      <FlatList
        data={searchResults}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        style={styles.resultsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.surface,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  searchButton: {
    backgroundColor: theme.colors.blue,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsCount: {
    color: theme.colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  resultsList: {
    flex: 1,
  },
  bookItem: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  bookInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 60,
    height: 80,
    borderRadius: 4,
  },
  bookDetails: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  publisher: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  pageCount: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
