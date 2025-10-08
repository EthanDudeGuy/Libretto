import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, View } from 'react-native';
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
import BookChat from './src/screens/BookChat';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

function AppContent() {
  const [currentView, setCurrentView] = useState('homepage');
  const [selectedBook, setSelectedBook] = useState(null);
  const [authView, setAuthView] = useState('login');
  const { isAuthenticated, isLoading, user } = useAuth();

  // Debug logging
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

  const navigateToLogin = () => {
    setAuthView('login');
  };

  const navigateToRegister = () => {
    setAuthView('register');
  };

  // Show loading screen while checking authentication
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

  // Show authentication screens if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        {authView === 'login' ? (
          <LoginScreen onNavigateToRegister={navigateToRegister} />
        ) : (
          <RegisterScreen onNavigateToLogin={navigateToLogin} />
        )}
        <StatusBar style='light' />
      </SafeAreaView>
    );
  }

  // Show main app if authenticated
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {currentView === 'homepage' ? (
        <LibraryHomepage onNavigateToChat={navigateToChat} />
      ) : (
        <BookChat book={selectedBook} onBack={navigateToHomepage} />
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
