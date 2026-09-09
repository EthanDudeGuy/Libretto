import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import theme from '../constants/theme';
import openLibraryAPI from '../services/OpenLibraryAPI';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 280;

export default function BookSpotlightSearch({ onSelectBook }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      setIsOpen(isFocused && trimmed.length > 0);
      return;
    }

    setIsSearching(true);
    setIsOpen(true);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      try {
        const response = await openLibraryAPI.searchBooks(trimmed, {
          limit: 8,
          fields: [
            'title',
            'author_name',
            'number_of_pages_median',
            'key',
            'first_publish_year',
            'cover_i',
          ],
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setResults(response.books || []);
      } catch (searchError) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        console.error('Spotlight search error:', searchError);
        setResults([]);
        setError('Could not search books. Try again.');
      } finally {
        if (requestId === requestIdRef.current) {
          setIsSearching(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, isFocused]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setError(null);
    setIsSearching(false);
  };

  const handleSelect = book => {
    Keyboard.dismiss();
    clearSearch();
    inputRef.current?.blur();
    onSelectBook?.(book);
  };

  const handleBlur = () => {
    // Delay so result taps register before closing
    setTimeout(() => {
      setIsFocused(false);
      setIsOpen(false);
    }, 180);
  };

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.searchBar,
          isFocused && styles.searchBarFocused,
        ]}
      >
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder='Search books to add…'
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => {
            setIsFocused(true);
            if (query.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          onBlur={handleBlur}
          returnKeyType='search'
          autoCorrect={false}
          autoCapitalize='none'
          clearButtonMode='never'
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearSearch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDropdown && (
        <View style={styles.dropdown}>
          {query.trim().length < MIN_QUERY_LENGTH ? (
            <Text style={styles.hintText}>Keep typing to search…</Text>
          ) : isSearching && results.length === 0 ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size='small' color={theme.colors.orange} />
              <Text style={styles.hintText}>Searching…</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : results.length === 0 ? (
            <Text style={styles.hintText}>No books found</Text>
          ) : (
            <FlatList
              data={results}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps='handled'
              showsVerticalScrollIndicator={false}
              style={styles.resultsList}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.resultItem,
                    index === results.length - 1 && styles.resultItemLast,
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  {item.thumbnail ? (
                    <Image
                      source={{ uri: item.thumbnail }}
                      style={styles.thumbnail}
                    />
                  ) : (
                    <View style={[styles.thumbnail, styles.thumbnailFallback]}>
                      <Text style={styles.thumbnailFallbackText}>📕</Text>
                    </View>
                  )}
                  <View style={styles.resultText}>
                    <Text style={styles.resultTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.resultAuthor} numberOfLines={1}>
                      {item.author}
                      {item.publishedDate ? ` · ${item.publishedDate}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    zIndex: 20,
    position: 'relative',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    height: 36,
  },
  searchBarFocused: {
    borderColor: theme.colors.orange,
    backgroundColor: theme.colors.surfaceElevated,
  },
  searchIcon: {
    fontSize: 16,
    color: theme.colors.textMuted,
    marginRight: 8,
    marginTop: Platform.OS === 'web' ? -1 : 0,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
    outlineStyle: 'none',
  },
  clearButton: {
    marginLeft: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  dropdown: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    paddingVertical: 6,
    maxHeight: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
    zIndex: 30,
  },
  resultsList: {
    maxHeight: 348,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    gap: 12,
  },
  resultItemLast: {
    borderBottomWidth: 0,
  },
  thumbnail: {
    width: 36,
    height: 52,
    borderRadius: 4,
    backgroundColor: theme.colors.surface,
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailFallbackText: {
    fontSize: 16,
  },
  resultText: {
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  resultAuthor: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  hintText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
