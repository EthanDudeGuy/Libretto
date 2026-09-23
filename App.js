import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, View, Alert } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import theme from './src/constants/theme';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LibraryHomepage from './src/screens/LibraryHomepage';
import LibraryScreen from './src/screens/LibraryScreen';
import BookChat from './src/screens/BookChat';
import SettingsScreen from './src/screens/SettingsScreen';
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { loadBooks, addBook } from './src/utils/BookStorage';

function AppContent() {
  const [currentView, setCurrentView] = useState('homepage');
  const [selectedBook, setSelectedBook] = useState(null);
  const [authView, setAuthView] = useState('landing');
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log(
    'AppContent render - isAuthenticated:',
    isAuthenticated,
    'isLoading:',
    isLoading,
    'user:',
    user
  );

  const navigateToChat = book => {
    setSelectedBook(book);
    setCurrentView('chat');
  };

  const navigateToHomepage = () => {
    setCurrentView('homepage');
    setSelectedBook(null);
  };

  const navigateToLibrary = () => {
    setCurrentView('library');
    setSelectedBook(null);
  };

  const navigateToSettings = () => {
    setCurrentView('settings');
    setSelectedBook(null);
  };

  // Selecting a book from the header search: if it's already in the
  // library, just open it; otherwise add it (as "want to read", no page
  // prompt) and open its Information tab. Shared by every screen's header
  // search so the behavior is consistent no matter where you search from.
  const handleSelectSearchBook = async searchBook => {
    try {
      const libraryBooks = await loadBooks(user.id);
      const existingBook = libraryBooks.find(
        libraryBook =>
          libraryBook.googleBooksId && libraryBook.googleBooksId === searchBook.id
      );

      if (existingBook) {
        navigateToChat(existingBook);
        return;
      }

      const newBook = {
        title: searchBook.title,
        author: searchBook.author,
        totalPages: searchBook.pageCount || null,
        currentPage: null,
        chapter: null,
        progress: 0,
        status: 'want_to_read',
        googleBooksId: searchBook.id || null,
        thumbnail: searchBook.thumbnail || null,
        description: searchBook.description || '',
        publishedDate: searchBook.publishedDate || '',
        isbn: searchBook.isbn || null,
        categories: searchBook.categories || [],
        publisher: searchBook.publisher || '',
      };

      const addedBook = await addBook(newBook, user.id);
      navigateToChat(addedBook);
    } catch (error) {
      console.error('Error adding book from search:', error);
      Alert.alert('Error', 'Failed to add book to your library');
    }
  };

  const navigateToLogin = () => {
    setAuthView('login');
  };

  const navigateToRegister = () => {
    setAuthView('register');
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <StatusBar style='light' />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        {authView === 'landing' ? (
          <LandingScreen
            onGetStarted={navigateToRegister}
            onLogin={navigateToLogin}
          />
        ) : authView === 'login' ? (
          <LoginScreen onNavigateToRegister={navigateToRegister} />
        ) : (
          <RegisterScreen onNavigateToLogin={navigateToLogin} />
        )}
        <StatusBar style='light' />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {currentView === 'homepage' ? (
        <LibraryHomepage
          onNavigateToChat={navigateToChat}
          onNavigateToSettings={navigateToSettings}
          onNavigateHome={navigateToHomepage}
          onNavigateToLibrary={navigateToLibrary}
          onSelectBook={handleSelectSearchBook}
        />
      ) : currentView === 'library' ? (
        <LibraryScreen
          onBack={navigateToHomepage}
          onNavigateHome={navigateToHomepage}
          onNavigateSettings={navigateToSettings}
          onNavigateToLibrary={navigateToLibrary}
          onSelectBook={navigateToChat}
          onSelectSearchBook={handleSelectSearchBook}
        />
      ) : currentView === 'settings' ? (
        <SettingsScreen
          onNavigateHome={navigateToHomepage}
          onNavigateSettings={navigateToSettings}
          onNavigateToLibrary={navigateToLibrary}
          onSelectBook={handleSelectSearchBook}
        />
      ) : (
        <BookChat
          book={selectedBook}
          onBack={navigateToHomepage}
          onNavigateHome={navigateToHomepage}
          onNavigateSettings={navigateToSettings}
          onNavigateToLibrary={navigateToLibrary}
          onSelectBook={handleSelectSearchBook}
        />
      )}
      <StatusBar style='light' />
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
