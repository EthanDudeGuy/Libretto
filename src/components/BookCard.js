import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../constants/theme';

export default function BookCard({ book, onUpdateBookmark, onChat }) {
  const { currentPage, totalPages, chapter, progress, pageChapter } = book;
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleChat = () => {
    if (onChat) onChat(book);
  };



  return (
    <Animated.View style={[
      styles.cardContainer, 
      { 
        transform: [
          { scale: scaleAnim }
        ] 
      }
    ]}>
      <TouchableOpacity
        onPress={handleChat}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        activeOpacity={0.8}
      >
        <View style={styles.card}>

          {/* Content area with padding */}
          <View style={styles.contentArea}>
            {/* Book cover */}
            <View style={styles.coverContainer}>
              {book.thumbnail ? (
                <Image 
                  source={{ uri: book.thumbnail }} 
                  style={styles.bookCover}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Text style={styles.placeholderText}>📖</Text>
                </View>
              )}
              
            </View>
          </View>

          {/* Progress bar at bottom - flush with card edges */}
          <View style={styles.progressSection}>      
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
    marginHorizontal: 2,
  },
  card: {
    width: 140,
    height: 200,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  contentArea: {
    flex: 1,
  },
  coverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCover: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  placeholderText: {
    fontSize: 32,
    color: theme.colors.textMuted,
  },
  progressSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  progressLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Inter_600SemiBold',
  },
  progressPercentage: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    fontFamily: 'Inter_600SemiBold',
  },
  progressContainer: {
    margin: 0,
  },
  progressBar: {
    height: 12,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 0,
  },
  progressFill: {
    height: '100%',
    borderRadius: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: theme.colors.blue,
  },
});