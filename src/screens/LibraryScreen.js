import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import theme from '../constants/theme';
import AppHeader from '../components/AppHeader';
import BookGrid from '../components/BookGrid';
import { loadBooks } from '../utils/BookStorage';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'want_to_read', label: 'Want to Read' },
  { key: 'currently_reading', label: 'Currently Reading' },
  { key: 'read', label: 'Read' },
];

export default function LibraryScreen({
  onBack,
  onNavigateHome,
  onNavigateSettings,
  onNavigateToLibrary,
  onSelectBook,
}) {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('currently_reading');

  useEffect(() => {
    if (user?.id) {
      loadBooksFromStorage();
    }
  }, [user?.id]);

  const loadBooksFromStorage = async () => {
    try {
      const storedBooks = await loadBooks(user.id);
      setBooks(storedBooks);
    } catch (error) {
      console.error('Error loading books:', error);
      Alert.alert('Error', 'Failed to load your books');
    } finally {
      setLoading(false);
    }
  };

  const booksForTab = useMemo(
    () => books.filter(book => book.status === activeTab),
    [books, activeTab]
  );

  return (
    <View style={styles.container}>
      <AppHeader
        onNavigateHome={onNavigateHome ?? onBack}
        onNavigateSettings={onNavigateSettings}
        onNavigateLibrary={onNavigateToLibrary}
        onBack={onBack}
      />

      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.tabIndicator,
                  isActive && styles.tabIndicatorActive,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your library...</Text>
        </View>
      ) : (
        <BookGrid
          books={booksForTab}
          onPressBook={onSelectBook}
          emptyHint="No books here yet."
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 18,
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingTop: 10,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.textMuted,
  },
  tabLabelActive: {
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  tabIndicator: {
    height: 2,
    alignSelf: 'stretch',
    marginTop: 10,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    backgroundColor: theme.colors.sage,
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
