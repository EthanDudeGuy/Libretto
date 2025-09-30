import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  PanResponder
} from 'react-native';
import theme from './theme';
import { updateBook, calculateProgress } from './BookStorage';
import SimpleBookImage from './SimpleBookImage';
import { sendMessageToClaude, generateBookSummary } from './ClaudeAPI';

export default function BookChat({ book, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDuckGreeting, setShowDuckGreeting] = useState(true);
  const [duckAnimationComplete, setDuckAnimationComplete] = useState(false);
  const [sessionSummary, setSessionSummary] = useState('');
  const [draggedLineIndex, setDraggedLineIndex] = useState(null);
  const [currentBook, setCurrentBook] = useState(book);
  const scrollViewRef = useRef();
  
  // Animation values
  const duckScale = useRef(new Animated.Value(0)).current;
  const duckBounce = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const pageFadeAnim = useRef(new Animated.Value(0)).current;


  // AI Summary Generation Framework
  // TODO: Replace with actual AI service integration
  const generateAISummary = async (bookData) => {
    // This is where you'll integrate with your AI service
    // Example structure:
    // const aiResponse = await fetch('/api/generate-summary', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     bookTitle: bookData.title,
    //     currentPage: bookData.currentPage,
    //     chapter: bookData.chapter,
    //     previousSessionData: bookData.sessionHistory,
    //     userNotes: bookData.notes
    //   })
    // });
    // return await aiResponse.json();
    
    // For now, return null to use placeholder
    return null;
  };

  // Dynamic summary generator using Google Books data
  const generatePlaceholderSummary = () => {
    const progress = currentBook.progress || 0;
    const currentPage = currentBook.currentPage || 1;
    const totalPages = currentBook.totalPages || 1;
    
    if (progress === 0) {
      return `Welcome to "${currentBook.title}"! Ready to start reading?`;
    } else {
      return `Welcome back to "${currentBook.title}"! You're on page ${currentPage} of ${totalPages}. What would you like to discuss?`;
    }
  };

  // Main summary generation function
  const generateLastSessionSummary = async () => {
    try {
      // Try to get AI-generated summary from Claude first
      const claudeSummary = await generateBookSummary(currentBook);
      
      if (claudeSummary.success) {
        return claudeSummary.summary;
      } else {
        throw new Error(`Claude summary failed: ${claudeSummary.error}`);
      }
    } catch (error) {
      console.error('Summary generation failed:', error);
      throw error; // Re-throw to let the calling function handle it
    }
  };


  // Update local book state when prop changes
  useEffect(() => {
    setCurrentBook(book);
  }, [book]);

  // Page fade-in animation when component mounts
  useEffect(() => {
    Animated.timing(pageFadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [pageFadeAnim]);

  // Load session summary when component mounts
  useEffect(() => {
    const loadSummary = async () => {
      try {
        const summary = await generateLastSessionSummary();
        setSessionSummary(summary);
      } catch (error) {
        console.error('Failed to load summary:', error);
        // Use a simple fallback message
        setSessionSummary(`Welcome to "${currentBook.title}"! What would you like to discuss?`);
      }
    };
    loadSummary();
  }, []);

  // Duck animation sequence
  useEffect(() => {
    if (showDuckGreeting) {
      // Duck entrance animation
      Animated.sequence([
        Animated.spring(duckScale, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous bouncing animation
      const bounceAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(duckBounce, {
            toValue: -10,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(duckBounce, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      bounceAnimation.start();

      return () => {
        bounceAnimation.stop();
      };
    }
  }, [showDuckGreeting]);

  const handleDismissDuck = () => {
    Animated.parallel([
      Animated.timing(duckScale, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowDuckGreeting(false);
      setDuckAnimationComplete(true);
      // Add the initial AI message after duck greeting
      setMessages([{
        id: '1',
        text: `Now that you're caught up, what would you like to discuss about "${currentBook.title}"? I'm here to explore themes, characters, and plot points with you`,
        isUser: false,
        timestamp: new Date(),
      }]);
    });
  };

  useEffect(() => {
    if (duckAnimationComplete) {
      scrollToBottom();
    }
  }, [messages, duckAnimationComplete]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const generateAIResponse = async (userMessage) => {
    try {
      // Use Claude API for smart responses
      const claudeResponse = await sendMessageToClaude(userMessage, currentBook, messages);
      
      if (claudeResponse.success) {
        return claudeResponse.message;
      } else {
        throw new Error(`Claude API failed: ${claudeResponse.error}`);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error; // Re-throw to let the calling function handle it
    }
  };

  const handlePageChange = async (direction) => {
    const newPage = currentBook.currentPage + direction;
    if (newPage >= 1 && newPage <= currentBook.totalPages) {
      try {
        const newProgress = calculateProgress(newPage, currentBook.totalPages);
        await updateBook(currentBook.id, { 
          currentPage: newPage,
          progress: newProgress
        });
        // Update the local book state for immediate UI update
        setCurrentBook(prev => ({
          ...prev,
          currentPage: newPage,
          progress: newProgress
        }));
      } catch (error) {
        console.error('Error updating page:', error);
      }
    }
  };

  // Create PanResponder for line dragging
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: (event) => {
      // Calculate which line was touched
      const touchX = event.nativeEvent.locationX;
      const lineWidth = 3; // Width of each line
      const lineSpacing = 2; // Space between lines
      const totalWidth = lineWidth + lineSpacing;
      const lineIndex = Math.floor(touchX / totalWidth);
      setDraggedLineIndex(lineIndex);
    },
    
    onPanResponderMove: (event) => {
      // Update which line is being dragged during movement
      const touchX = event.nativeEvent.locationX;
      const lineWidth = 3;
      const lineSpacing = 2;
      const totalWidth = lineWidth + lineSpacing;
      const lineIndex = Math.floor(touchX / totalWidth);
      setDraggedLineIndex(lineIndex);
    },
    
    onPanResponderRelease: async (event) => {
      const touchX = event.nativeEvent.locationX;
      const lineWidth = 3;
      const lineSpacing = 2;
      const totalWidth = lineWidth + lineSpacing;
      const lineIndex = Math.floor(touchX / totalWidth);
      
      // Convert line index to page number (assuming lines represent pages)
      const maxLines = Math.min(currentBook.totalPages, 50); // Limit to 50 lines max
      const newPage = Math.max(1, Math.min(currentBook.totalPages, Math.round((lineIndex / maxLines) * currentBook.totalPages) + 1));
      
      if (newPage !== currentBook.currentPage) {
        try {
          const newProgress = calculateProgress(newPage, currentBook.totalPages);
          await updateBook(currentBook.id, { 
            currentPage: newPage,
            progress: newProgress
          });
          // Update the local book state for immediate UI update
          setCurrentBook(prev => ({
            ...prev,
            currentPage: newPage,
            progress: newProgress
          }));
        } catch (error) {
          console.error('Error updating page:', error);
        }
      }
      
      setDraggedLineIndex(null);
    },
    
    onPanResponderTerminate: () => {
      setDraggedLineIndex(null);
    }
  });


  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      // Generate AI response from Claude
      const aiResponseText = await generateAIResponse(currentInput);
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Show specific error message about API configuration
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting to the AI service. Please check that your Claude API key is valid and try again. If the problem persists, the API key may need to be updated.",
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };



  const renderPageLines = () => {
    const maxLines = Math.min(currentBook.totalPages, 50); // Limit to 50 lines for performance
    const lines = [];
    
    for (let i = 0; i < maxLines; i++) {
      const isCurrentPage = Math.round((i / maxLines) * currentBook.totalPages) + 1 === currentBook.currentPage;
      const isDragged = draggedLineIndex === i;
      const isCompleted = Math.round((i / maxLines) * currentBook.totalPages) + 1 < currentBook.currentPage;
      
      // All lines have the same height - no bell curve variation (20% bigger)
      const baseHeight = 19.2; // 16 * 1.2 (20% increase)
      
      // Slightly taller if being dragged or is current page
      const finalHeight = isDragged ? baseHeight * 1.5 : (isCurrentPage ? baseHeight * 1.25 : baseHeight);
      
      lines.push(
        <View
          key={i}
          style={[
            styles.pageLine,
            {
              height: finalHeight,
              backgroundColor: isCompleted 
                ? theme.colors.blue 
                : isCurrentPage 
                  ? theme.colors.blueMuted 
                  : theme.colors.surfaceElevated,
              borderColor: isCurrentPage ? theme.colors.blue : theme.colors.borderSubtle,
              transform: [{ scaleY: isDragged ? 1.2 : 1 }]
            }
          ]}
        />
      );
    }
    
    return lines;
  };

  const renderMessage = (message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.aiBubble
        ]}
      >
        {!message.isUser && (
          <View style={styles.aiLogoContainer}>
            <Image 
              source={require('./assets/duckbill.png')} 
              style={styles.aiLogo}
              resizeMode="contain"
            />
          </View>
        )}
        <Text style={[
          styles.messageText,
          message.isUser ? styles.userText : styles.aiText
        ]}>
          {message.text}
        </Text>
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { 
      backgroundColor: theme.colors.surface,
      opacity: pageFadeAnim
    }]}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header Section with Back Button and Book Title */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButtonModal} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerBookTitle}>{currentBook.title}</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <TouchableOpacity 
                style={[styles.progressArrow, currentBook.currentPage <= 1 && styles.progressArrowDisabled]}
                onPress={() => handlePageChange(-1)}
                disabled={currentBook.currentPage <= 1}
              >
                <Text style={[styles.progressArrowText, currentBook.currentPage <= 1 && styles.progressArrowTextDisabled]}>‹</Text>
              </TouchableOpacity>
              
              <View style={styles.pageLinesContainer} {...panResponder.panHandlers}>
                {renderPageLines()}
              </View>
              
              <TouchableOpacity 
                style={[styles.progressArrow, currentBook.currentPage >= currentBook.totalPages && styles.progressArrowDisabled]}
                onPress={() => handlePageChange(1)}
                disabled={currentBook.currentPage >= currentBook.totalPages}
              >
                <Text style={[styles.progressArrowText, currentBook.currentPage >= currentBook.totalPages && styles.progressArrowTextDisabled]}>›</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.progressText}>
              Page {currentBook.currentPage} of {currentBook.totalPages} ({currentBook.progress}%)
            </Text>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Left Column: Book Cover and Facts */}
          <View style={styles.leftColumn}>
            {/* Book Cover using SimpleBookImage component */}
            <View style={styles.bookCoverContainer}>
              <SimpleBookImage book={currentBook} />
            </View>
            
            {/* Book Info Section */}
            <View style={styles.bookInfoContainer}>
              <View style={styles.infoContent}>
                <View style={styles.infoRow}>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Author</Text>
                    <Text style={styles.infoValue} numberOfLines={2}>{currentBook.author || 'Unknown'}</Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Published</Text>
                    <Text style={styles.infoValue}>{currentBook.publishedDate || 'Unknown'}</Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Pages</Text>
                    <Text style={styles.infoValue}>{currentBook.totalPages || 'Unknown'}</Text>
                  </View>
                </View>

                {currentBook.categories && currentBook.categories.length > 0 && (
                  <>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Genre</Text>
                        <Text style={styles.infoValue} numberOfLines={2}>{currentBook.categories[0]}</Text>
                      </View>
                    </View>
                  </>
                )}

                {currentBook.publisher && (
                  <>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Publisher</Text>
                        <Text style={styles.infoValue} numberOfLines={2}>{currentBook.publisher}</Text>
                      </View>
                    </View>
                  </>
                )}

                {currentBook.isbn && (
                  <>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>ISBN</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>{currentBook.isbn}</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Right Column: Chatbox */}
          <View style={styles.rightColumn}>
            {/* Chatbox - Large box on right side */}
            <View style={styles.chatContainer}>
              {/* Duck Greeting Overlay */}
              {showDuckGreeting && (
                <View style={styles.duckGreetingOverlay}>
                  <Animated.View 
                    style={[
                      styles.duckContainer,
                      {
                        transform: [
                          { scale: duckScale },
                          { translateY: duckBounce }
                        ]
                      }
                    ]}
                  >
                    <Image 
                      source={require('./assets/duckbill.png')} 
                      style={styles.duckLogo}
                      resizeMode="contain"
                    />
                  </Animated.View>
                  <Animated.View 
                    style={[
                      styles.duckMessageContainer,
                      { opacity: textOpacity }
                    ]}
                  >
                    <Text style={styles.duckGreetingText}>
                      {sessionSummary || 'Loading your reading summary...'}
                    </Text>
                    <TouchableOpacity 
                      style={styles.continueButton}
                      onPress={handleDismissDuck}
                    >
                      <Text style={styles.continueButtonText}>Continue discussion</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              )}

              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
              >
                {messages.map(renderMessage)}
                
                {isTyping && (
                  <View style={[styles.messageContainer, styles.aiMessage]}>
                    <View style={[styles.messageBubble, styles.aiBubble]}>
                      <View style={styles.aiLogoContainer}>
                        <Image 
                          source={require('./assets/duckbill.png')} 
                          style={styles.aiLogo}
                          resizeMode="contain"
                        />
                      </View>
                      <Text style={styles.typingText}>Waddle is thinking...</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask about themes, characters, plot..."
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                  onPress={handleSendMessage}
                  disabled={!inputText.trim() || isTyping}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 22,
    paddingRight: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButtonModal: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  headerTitleContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBookTitle: {
    color: theme.colors.textPrimary,
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  // Left Column Styles
  leftColumn: {
    width: 200,
    backgroundColor: theme.colors.surface,
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderSubtle,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  bookCoverContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bookInfoContainer: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  infoHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoTitleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: theme.colors.blue,
    borderRadius: 2,
  },
  infoContent: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  infoTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    lineHeight: 16,
  },
  infoValue: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 20,
  },
  infoDivider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  // Right Column Styles
  rightColumn: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 12,
  },
  pageLinesContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Changed from 'flex-end' to 'center' for proper alignment
    justifyContent: 'center',
    height: 38.4, // Increased by 20% (32 * 1.2)
    gap: 2,
    paddingHorizontal: 8,
  },
  pageLine: {
    width: 4,
    borderRadius: 8, // Much more rounded for pill shape
    borderWidth: 1,
    transition: 'all 0.2s ease',
  },
  progressArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignSelf: 'center', // Ensure arrows align with center of progress bar
  },
  progressArrowDisabled: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    opacity: 0.5,
  },
  progressArrowText: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  progressArrowTextDisabled: {
    color: theme.colors.textMuted,
  },
  progressText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  chatContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    overflow: 'hidden',
  },
  duckGreetingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 20, 25, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 24,
  },
  duckContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  duckLogo: {
    width: 80,
    height: 80,
  },
  duckMessageContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  duckGreetingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: 'Inter_500Medium',
  },
  continueButton: {
    backgroundColor: theme.colors.blue,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: theme.colors.blueMuted,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  aiBubble: {
    backgroundColor: theme.colors.surfaceElevated,
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  aiLogoContainer: {
    marginRight: 8,
    marginTop: 2,
  },
  aiLogo: {
    width: 24,
    height: 24,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
    fontFamily: 'Inter_400Regular',
  },
  userText: {
    color: theme.colors.textPrimary,
  },
  aiText: {
    color: theme.colors.textSecondary,
  },
  typingText: {
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderStrong,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    color: theme.colors.textPrimary,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  sendButton: {
    backgroundColor: theme.colors.blue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(66, 133, 244, 0.4)',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});