import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import theme from '../constants/theme';

function BookRow({ book, onPress, onUpdatePage }) {
  const [editing, setEditing] = useState(false);
  const [pageDraft, setPageDraft] = useState(String(book.currentPage || ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const recap = book.lastMessage
    ? book.lastMessage
    : 'No conversations yet — say hello!';
  const pageLabel = book.currentPage
    ? `Page ${book.currentPage}${book.totalPages ? ` of ${book.totalPages}` : ''}`
    : 'No page set yet';

  const startEditing = () => {
    setPageDraft(String(book.currentPage || ''));
    setError(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError(false);
  };

  const saveEditing = async () => {
    const newPage = parseInt(pageDraft, 10);
    if (
      !Number.isFinite(newPage) ||
      newPage < 1 ||
      (book.totalPages && newPage > book.totalPages)
    ) {
      setError(true);
      return;
    }
    setSaving(true);
    try {
      await onUpdatePage?.(book.id, newPage);
      setEditing(false);
    } catch (e) {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.rowMain}
        onPress={() => onPress?.(book)}
      >
        {book.thumbnail ? (
          <Image source={{ uri: book.thumbnail }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={styles.coverPlaceholderText} numberOfLines={3}>
              {book.title}
            </Text>
          </View>
        )}

        <View style={styles.rowBody}>
          <Text style={styles.title} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {book.author}
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, Math.max(0, book.progress || 0))}%` },
              ]}
            />
          </View>

          <Text style={styles.recap} numberOfLines={1}>
            {recap}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.pageRow}>
        {editing ? (
          <>
            <TextInput
              style={styles.pageInput}
              value={pageDraft}
              onChangeText={text => {
                setPageDraft(text.replace(/[^0-9]/g, ''));
                if (error) setError(false);
              }}
              keyboardType='number-pad'
              placeholder='Page'
              placeholderTextColor={theme.colors.textMuted}
              autoFocus
              maxLength={6}
              onSubmitEditing={saveEditing}
            />
            <TouchableOpacity
              style={[styles.pageSaveButton, saving && styles.pageSaveButtonDisabled]}
              onPress={saveEditing}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Text style={styles.pageSaveButtonText}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelEditing} activeOpacity={0.7}>
              <Text style={styles.pageCancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.pageLabel}>{pageLabel}</Text>
            <TouchableOpacity onPress={startEditing} activeOpacity={0.7}>
              <Text style={styles.pageEditLink}>Update page</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      {error && (
        <Text style={styles.pageError}>
          Enter a page between 1 and {book.totalPages || '?'}.
        </Text>
      )}
    </View>
  );
}

export default function ActiveBooksPanel({
  books = [],
  onPressBook,
  onViewLibrary,
  onUpdateBookPage,
}) {
  const activeBooks = useMemo(
    () => books.filter(book => book.status === 'currently_reading'),
    [books]
  );

  return (
    <View style={styles.panel}>
      <View style={styles.panelTitleRow}>
        <Text style={styles.panelTitle}>Currently Reading</Text>
        {onViewLibrary && (
          <TouchableOpacity onPress={onViewLibrary} activeOpacity={0.7}>
            <Text style={styles.viewLibraryLink}>View Library →</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeBooks.length === 0 ? (
          <Text style={styles.emptyHint}>
            Search above to add a book and start reading
          </Text>
        ) : (
          activeBooks.map(book => (
            <BookRow
              key={book.id}
              book={book}
              onPress={onPressBook}
              onUpdatePage={onUpdateBookPage}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    overflow: 'hidden',
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.x2_5,
    paddingTop: theme.spacing.x2_5,
    paddingBottom: theme.spacing.x1_5,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.orangeMuted,
  },
  panelTitle: {
    fontSize: theme.typography.lg,
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  viewLibraryLink: {
    fontSize: theme.typography.sm,
    color: theme.colors.orangeLight,
    fontFamily: 'Inter_500Medium',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.x2,
    gap: theme.spacing.x1_5,
  },
  row: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    padding: theme.spacing.x1_5,
    gap: theme.spacing.x1,
  },
  rowMain: {
    flexDirection: 'row',
    gap: theme.spacing.x2,
    minHeight: 130,
  },
  cover: {
    width: 84,
    height: 126,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderGlass,
  },
  coverPlaceholder: {
    backgroundColor: theme.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  coverPlaceholderText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 6,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.md,
    fontFamily: 'Inter_600SemiBold',
  },
  author: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sm,
    fontFamily: 'Inter_400Regular',
  },
  progressTrack: {
    height: 6,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfaceMuted,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.orange,
  },
  recap: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.xs,
    fontFamily: 'Inter_400Regular',
  },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.x1,
    paddingTop: theme.spacing.x1,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  pageLabel: {
    color: theme.colors.orangeLight,
    fontSize: theme.typography.xs,
    fontFamily: 'Inter_500Medium',
  },
  pageEditLink: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.xs,
    fontFamily: 'Inter_500Medium',
    textDecorationLine: 'underline',
  },
  pageInput: {
    flex: 1,
    maxWidth: 80,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.xs,
    fontFamily: 'Inter_400Regular',
  },
  pageSaveButton: {
    backgroundColor: theme.colors.orange,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pageSaveButtonDisabled: {
    opacity: 0.6,
  },
  pageSaveButtonText: {
    color: '#fff',
    fontSize: theme.typography.xs,
    fontFamily: 'Inter_600SemiBold',
  },
  pageCancelText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.xs,
    fontFamily: 'Inter_500Medium',
  },
  pageError: {
    color: theme.colors.danger,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  emptyHint: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
