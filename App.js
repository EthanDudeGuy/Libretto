import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import Homepage from './Homepage';
import BookChat from './BookChat';

export default function App() {
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
    <>
      {currentView === 'homepage' ? (
        <Homepage onNavigateToChat={navigateToChat} />
      ) : (
        <BookChat book={selectedBook} onBack={navigateToHomepage} />
      )}
      <StatusBar style="light" />
    </>
  );
}
