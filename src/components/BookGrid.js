import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import theme from '../constants/theme';

const CARD_WIDTH = 130;
const COVER_HEIGHT = 180;

function BookCard({ book, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={() => onPress?.(book)}
    >
      {book.thumbnail ? (
        <Image source={{ uri: book.thumbnail }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text style={styles.coverPlaceholderText} numberOfLines={4}>
            {book.title}
          </Text>
        </View>
      )}
      <Text style={styles.title} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={styles.author} numberOfLines={1}>
        {book.author}
      </Text>
    </TouchableOpacity>
  );
}

export default function BookGrid({ books = [], onPressBook, emptyHint }) {
  if (books.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyHint}>
          {emptyHint || 'No books here yet.'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
    >
      {books.map(book => (
        <BookCard key={book.id} book={book} onPress={onPressBook} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.x3,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: theme.spacing.x4,
  },
  card: {
    width: CARD_WIDTH,
    gap: 6,
  },
  cover: {
    width: CARD_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderGlass,
  },
  coverPlaceholder: {
    backgroundColor: theme.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  coverPlaceholderText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sm,
    fontFamily: 'Inter_600SemiBold',
  },
  author: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.xs,
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyHint: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
