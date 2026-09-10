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
import SettingsScreen from './src/screens/SettingsScreen';
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

function AppContent() {
  const [currentView, setCurrentView] = useState('homepage');
  const [selectedBook, setSelectedBook] = useState(null);
  const [pendingAddBook, setPendingAddBook] = useState(null);
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

  const navigateToSettings = () => {
    setCurrentView('settings');
    setSelectedBook(null);
  };

  const handleSelectBookFromSettings = book => {
    setPendingAddBook(book);
    setCurrentView('homepage');
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
          pendingAddBook={pendingAddBook}
          onConsumePendingAddBook={() => setPendingAddBook(null)}
        />
      ) : currentView === 'settings' ? (
        <SettingsScreen
          onNavigateHome={navigateToHomepage}
          onNavigateSettings={navigateToSettings}
          onSelectBook={handleSelectBookFromSettings}
        />
      ) : (
        <BookChat
          book={selectedBook}
          onBack={navigateToHomepage}
          onNavigateHome={navigateToHomepage}
          onNavigateSettings={navigateToSettings}
          onSelectBook={navigateToChat}
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
