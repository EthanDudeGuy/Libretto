import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import theme from '../constants/theme';

const WOOD = {
  frame: '#3a2a1f',
  frameEdge: '#2a1d14',
  back: '#2c2018',
  shelf: '#4a3426',
  shelfLip: '#5c4030',
  shelfHighlight: 'rgba(255, 220, 180, 0.08)',
  innerShadow: 'rgba(0, 0, 0, 0.35)',
};

const MIN_SHELVES = 3;

function chunkBooks(books, perShelf) {
  const rows = [];
  for (let i = 0; i < books.length; i += perShelf) {
    rows.push(books.slice(i, i + perShelf));
  }
  return rows;
}

function ShelfBook({ book, width, height, onPress }) {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress?.(book)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.bookWrapper,
        {
          width,
          height,
          transform: [{ translateY: pressed ? 2 : 0 }, { scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      {book.thumbnail ? (
        <Image
          source={{ uri: book.thumbnail }}
          style={styles.bookCover}
          resizeMode='cover'
        />
      ) : (
        <View style={[styles.bookCover, styles.bookPlaceholder]}>
          <Text style={styles.placeholderTitle} numberOfLines={4}>
            {book.title}
          </Text>
        </View>
      )}
      <View style={styles.bookSpineEdge} />
      <View style={styles.bookBottomShadow} />
    </TouchableOpacity>
  );
}

function ShelfRow({ books, bookWidth, bookHeight, gap, onPressBook }) {
  return (
    <View style={styles.shelfRow}>
      <View style={[styles.shelfBay, { minHeight: bookHeight + 18 }]}>
        <View style={styles.shelfBack} />
        <View style={[styles.shelfBooks, { gap }]}>
          {books.map(book => (
            <ShelfBook
              key={book.id}
              book={book}
              width={bookWidth}
              height={bookHeight}
              onPress={onPressBook}
            />
          ))}
        </View>
      </View>
      <View style={styles.shelfBoard}>
        <View style={styles.shelfBoardTop} />
        <View style={styles.shelfLip} />
      </View>
    </View>
  );
}

export default function Bookshelf({ books = [], onPressBook }) {
  const { width: windowWidth } = useWindowDimensions();

  const layout = useMemo(() => {
    const caseMaxWidth = Math.min(920, windowWidth - 40);
    const isNarrow = windowWidth < 640;
    const bookWidth = isNarrow ? 64 : 90;
    const bookHeight = isNarrow ? 96 : 135;
    const gap = isNarrow ? 10 : 16;
    const sidePadding = isNarrow ? 18 : 28;
    const usable = caseMaxWidth - sidePadding * 2;
    const perShelf = Math.max(3, Math.floor((usable + gap) / (bookWidth + gap)));

    return {
      caseMaxWidth,
      bookWidth,
      bookHeight,
      gap,
      sidePadding,
      perShelf,
    };
  }, [windowWidth]);

  const filledRows = useMemo(
    () => chunkBooks(books, layout.perShelf),
    [books, layout.perShelf]
  );

  const shelfCount = Math.max(MIN_SHELVES, filledRows.length);
  const shelves = Array.from({ length: shelfCount }, (_, index) => ({
    id: `shelf-${index}`,
    books: filledRows[index] || [],
  }));

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.caseOuter, { maxWidth: layout.caseMaxWidth }]}>
        <View style={styles.caseFrame}>
          <View
            style={[
              styles.caseInner,
              { paddingHorizontal: layout.sidePadding },
            ]}
          >
            {shelves.map(shelf => (
              <ShelfRow
                key={shelf.id}
                books={shelf.books}
                bookWidth={layout.bookWidth}
                bookHeight={layout.bookHeight}
                gap={layout.gap}
                onPressBook={onPressBook}
              />
            ))}
          </View>
        </View>
      </View>

      {books.length === 0 && (
        <Text style={styles.emptyHint}>
          Search above to add your first book
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 28,
    paddingBottom: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  caseOuter: {
    width: '100%',
    borderRadius: 10,
    padding: 10,
    backgroundColor: WOOD.frameEdge,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 14,
  },
  caseFrame: {
    borderRadius: 6,
    borderWidth: 3,
    borderColor: WOOD.frame,
    backgroundColor: WOOD.frame,
    overflow: 'hidden',
  },
  caseInner: {
    backgroundColor: WOOD.back,
    paddingTop: 16,
    paddingBottom: 10,
  },
  shelfRow: {
    marginBottom: 4,
  },
  shelfBay: {
    justifyContent: 'flex-end',
    position: 'relative',
  },
  shelfBack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: WOOD.back,
    borderTopWidth: 1,
    borderTopColor: WOOD.innerShadow,
  },
  shelfBooks: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'nowrap',
    paddingBottom: 2,
    zIndex: 2,
  },
  shelfBoard: {
    height: 14,
    backgroundColor: WOOD.shelf,
    borderTopWidth: 1,
    borderTopColor: WOOD.shelfHighlight,
    borderBottomWidth: 1,
    borderBottomColor: WOOD.frameEdge,
  },
  shelfBoardTop: {
    height: 3,
    backgroundColor: WOOD.shelfHighlight,
  },
  shelfLip: {
    position: 'absolute',
    left: -2,
    right: -2,
    bottom: -3,
    height: 6,
    backgroundColor: WOOD.shelfLip,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  bookWrapper: {
    borderRadius: 3,
    overflow: 'visible',
    backgroundColor: theme.colors.surfaceElevated,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  bookCover: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  bookPlaceholder: {
    backgroundColor: '#4a3b2e',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderTitle: {
    color: theme.colors.textPrimary,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
  },
  bookSpineEdge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  bookBottomShadow: {
    position: 'absolute',
    left: 2,
    right: 2,
    bottom: -2,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 2,
  },
  emptyHint: {
    marginTop: 18,
    color: theme.colors.textMuted,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
