import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function BookCard({ book, onUpdateBookmark, onDelete, onChat }) {
  const { id, title, author, currentPage, totalPages, chapter, progress } = book;

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onUpdateBookmark(id, currentPage - 1, chapter);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onUpdateBookmark(id, currentPage + 1, chapter);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.bookInfo}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          <Text style={styles.author} numberOfLines={1}>{author}</Text>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(id)}>
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bookmarkContainer}>
        <Text style={styles.bookmarkText}>
          Page {currentPage} of {totalPages}
          {chapter && ` • Chapter ${chapter}`}
        </Text>
        <View style={styles.bookmarkControls}>
          <TouchableOpacity 
            style={[styles.arrowButton, currentPage <= 1 && styles.disabledButton]} 
            onPress={handlePreviousPage}
            disabled={currentPage <= 1}
          >
            <Text style={styles.arrowText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.arrowButton, currentPage >= totalPages && styles.disabledButton]} 
            onPress={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${progress}%` }]} 
          />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>

      <TouchableOpacity style={styles.chatButton} onPress={() => onChat(book)}>
        <Text style={styles.chatButtonText}>💬 Discuss this book</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookmarkContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  bookmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  bookmarkControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  arrowText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9C27B0',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  chatButton: {
    backgroundColor: 'rgba(156, 39, 176, 0.3)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.5)',
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});