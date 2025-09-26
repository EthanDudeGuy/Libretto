import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, View } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import theme from './theme';
import LibraryHomepage from './LibraryHomepage';
import BookChat from './BookChat';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [currentView, setCurrentView] = useState('homepage');
  const [selectedBook, setSelectedBook] = useState(null);

  const navigateToChat = (book) => {
    setSelectedBook(book);
    setCurrentView('chat');
  };

  const navigateToHomepage = () => {
    setCurrentView('homepage');
    setSelectedBook(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {currentView === 'homepage' ? (
        <LibraryHomepage onNavigateToChat={navigateToChat} />
      ) : (
        <BookChat book={selectedBook} onBack={navigateToHomepage} />
      )}
      <StatusBar style="light" />
    </SafeAreaView>
  );
}
