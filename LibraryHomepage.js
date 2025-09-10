import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BookCard from './BookCard';

const initialBooks = [
  {
    id: '1',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    currentPage: 156,
    totalPages: 288,
    chapter: 8,
    progress: 65,
  },
  {
    id: '2',
    title: 'Atomic Habits',
    author: 'James Clear',
    currentPage: 135,
    totalPages: 320,
    chapter: 12,
    progress: 45,
  },
  {
    id: '3',
    title: 'The Seven Husbands of Evelyn Hugo',
    author: 'Taylor Jenkins Reid',
    currentPage: 234,
    totalPages: 400,
    chapter: 15,
    progress: 78,
  },
  {
    id: '4',
    title: 'Educated',
    author: 'Tara Westover',
    currentPage: 92,
    totalPages: 334,
    chapter: 6,
    progress: 23,
  },
];

export default function Homepage({ onNavigateToChat }) {
  const [books, setBooks] = useState(initialBooks);
  const [showSettings, setShowSettings] = useState(false);

  const updateBookmark = (bookId, newPage, chapter) => {
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === bookId 
          ? { 
              ...book, 
              currentPage: newPage, 
              chapter,
              progress: Math.round((newPage / book.totalPages) * 100)
            }
          : book
      )
    );
  };

  const deleteBook = (bookId) => {
    Alert.alert(
      "Delete Book",
      "Are you sure you want to remove this book from your library?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId))
        }
      ]
    );
  };

  const handleChatWithBook = (book) => {
    onNavigateToChat(book);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: () => {
            setShowSettings(false);
            // Handle logout logic here
          }
        }
      ]
    );
  };

  const renderBook = ({ item }) => (
    <View style={styles.bookCardContainer}>
      <BookCard 
        book={item} 
        onUpdateBookmark={updateBookmark}
        onDelete={deleteBook}
        onChat={handleChatWithBook}
      />
    </View>
  );

  return (
    <LinearGradient
      colors={['#6A1B9A', '#8E24AA', '#AB47BC']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Literary Journey</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Currently Reading</Text>
      
      <FlatList
        data={books}
        renderItem={renderBook}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showSettings}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModal}>
            <Text style={styles.settingsTitle}>Settings</Text>
            
            <TouchableOpacity style={styles.settingsOption} onPress={handleLogout}>
              <Text style={styles.settingsOptionText}>🚪 Logout</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingsIcon: {
    fontSize: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  bookCardContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  settingsOption: {
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.2)',
  },
  settingsOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A1B9A',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
});