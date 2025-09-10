import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import LibraryHomepage from './LibraryHomepage';
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
        <LibraryHomepage onNavigateToChat={navigateToChat} />
      ) : (
        <BookChat book={selectedBook} onBack={navigateToHomepage} />
      )}
      <StatusBar style="light" />
    </>
  );
}
