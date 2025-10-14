import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import theme from '../constants/theme';

export default function HorizontalBookCard({ book, onUpdateBookmark, onChat }) {
  const { currentPage, totalPages, chapter, progress, pageChapter } = book;
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
  };

  const handleChat = () => {
    if (onChat) onChat(book);
  };

  const getProgressText = () => {
    if (pageChapter && pageChapter.includes('Chapter')) {
      return pageChapter;
    }
    if (currentPage && totalPages) {
      return `Page ${currentPage} of ${totalPages}`;
    }
    return 'Ready to start';
  };

  const getProgressPercentage = () => {
    if (progress !== undefined) {
      return Math.round(progress);
    }
    if (currentPage && totalPages) {
      return Math.round((currentPage / totalPages) * 100);
    }
    return 0;
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleChat}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.card}
      >
        {/* Book Cover */}
        <View style={styles.coverContainer}>
          {book.thumbnail ? (
            <Image
              source={{ uri: book.thumbnail }}
              style={styles.bookCover}
              resizeMode='cover'
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.placeholderText}>📖</Text>
            </View>
          )}
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={styles.author} numberOfLines={2}>
              {book.author}
            </Text>
          </View>

          {/* Progress Section */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {getProgressText()}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getProgressPercentage()}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressPercentage}>
                {getProgressPercentage()}%
              </Text>
            </View>
          </View>
        </View>

        {/* Chat Action Button */}
        <View style={styles.actionContainer}>
          <View style={styles.chatButton}>
            <Text style={styles.chatButtonText}>Chat</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: theme.spacing.x3,
    marginHorizontal: theme.spacing.x3,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.x2,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    alignItems: 'center',
    minHeight: 150,
  },
  coverContainer: {
    marginRight: theme.spacing.x2,
  },
  bookCover: {
    width: 90,
    height: 120,
    borderRadius: theme.radii.sm,
  },
  coverPlaceholder: {
    width: 90,
    height: 120,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  placeholderText: {
    fontSize: 36,
    color: theme.colors.textMuted,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'space-between',
    height: 120,
    paddingVertical: theme.spacing.x1,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.typography.xl,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamilySemibold,
    marginBottom: theme.spacing.x1,
  },
  author: {
    fontSize: theme.typography.md,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    lineHeight: 22,
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  progressText: {
    fontSize: theme.typography.sm,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.x0_5,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.pill,
    marginRight: theme.spacing.x1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.orange,
    borderRadius: theme.radii.pill,
  },
  progressPercentage: {
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamilySemibold,
    minWidth: 35,
    textAlign: 'right',
  },
  actionContainer: {
    marginLeft: theme.spacing.x1,
  },
  chatButton: {
    backgroundColor: theme.colors.orange,
    paddingHorizontal: theme.spacing.x2,
    paddingVertical: theme.spacing.x1_5,
    borderRadius: theme.radii.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: theme.typography.md,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamilySemibold,
    textAlign: 'center',
  },
});
