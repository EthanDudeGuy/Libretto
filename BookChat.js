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
  Image
} from 'react-native';
import theme from './theme';
import { updateBook, calculateProgress, getReadingStatus } from './BookStorage';
import SimpleBookImage from './SimpleBookImage';

export default function BookChat({ book, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDuckGreeting, setShowDuckGreeting] = useState(true);
  const [duckAnimationComplete, setDuckAnimationComplete] = useState(false);
  const [sessionSummary, setSessionSummary] = useState('');
  const scrollViewRef = useRef();
  
  // Animation values
  const duckScale = useRef(new Animated.Value(0)).current;
  const duckBounce = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;


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
    const progress = book.progress || 0;
    const currentPage = book.currentPage || 1;
    const totalPages = book.totalPages || 1;
    const author = book.author || 'the author';
    const publishedDate = book.publishedDate || '';
    const categories = book.categories || [];
    const description = book.description || '';
    
    // Determine reading status
    let readingStatus = '';
    if (progress === 0) readingStatus = "You're just starting this journey";
    else if (progress < 25) readingStatus = "You're getting into the story";
    else if (progress < 50) readingStatus = "You're making good progress";
    else if (progress < 75) readingStatus = "You're well into the book";
    else if (progress < 90) readingStatus = "You're almost at the end";
    else if (progress < 100) readingStatus = "You're nearly finished";
    else readingStatus = "You've completed this book";
    
    // Get genre information
    const genre = categories.length > 0 ? categories[0] : 'this book';
    
    // Create personalized greeting
    const greeting = progress === 0 ? "Welcome to" : "Welcome back to";
    
    // Build the summary
    let summary = `${greeting} "${book.title}" by ${author}! `;
    
    if (progress === 0) {
      summary += `You're about to start reading ${genre.toLowerCase()}. `;
      if (description) {
        const shortDesc = description.length > 150 ? description.substring(0, 150) + '...' : description;
        summary += `Here's what it's about: ${shortDesc} `;
      }
      summary += `You'll be reading ${totalPages} pages of ${author}'s work. Ready to dive in?`;
    } else {
      summary += `${readingStatus} - you're on page ${currentPage} of ${totalPages} (${progress}%). `;
      
      if (progress < 25) {
        summary += `You're in the early chapters where ${author} is setting up the story. `;
      } else if (progress < 50) {
        summary += `You're getting into the heart of the story where the plot is developing. `;
      } else if (progress < 75) {
        summary += `You're in the middle section where the story is really unfolding. `;
      } else if (progress < 90) {
        summary += `You're approaching the climax and resolution of the story. `;
      } else if (progress < 100) {
        summary += `You're in the final pages - the conclusion is near! `;
      }
      
      summary += `What would you like to discuss about "${book.title}"?`;
    }
    
    return summary;
  };

  // Main summary generation function
  const generateLastSessionSummary = async () => {
    try {
      // Try to get AI-generated summary first
      const aiSummary = await generateAISummary(book);
      
      if (aiSummary && aiSummary.summary) {
        return aiSummary.summary;
      }
    } catch (error) {
      console.log('AI summary generation failed, using placeholder:', error);
    }
    
    // Fallback to placeholder content
    return generatePlaceholderSummary();
  };


  // Load session summary when component mounts
  useEffect(() => {
    const loadSummary = async () => {
      const summary = await generateLastSessionSummary();
      setSessionSummary(summary);
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
        text: `Now that you're caught up, what would you like to discuss about "${book.title}"? I'm here to explore themes, characters, and plot points with you`,
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

  const generateAIResponse = (userMessage) => {
    // Simulate AI response based on book context
    const responses = [
      `That's a fascinating point about the themes in "${book.title}". Based on what you've read so far (up to page ${book.currentPage}), the author seems to be exploring...`,
      `Great question! In the chapters you've completed, we can see how the character development has been building towards...`,
      `I love that observation! The literary techniques ${book.author} uses in these early chapters really set up...`,
      `That's an insightful analysis. Without spoiling anything beyond page ${book.currentPage}, I can say that the symbolism you've noticed...`,
      `Excellent point about the narrative structure! What you've read so far shows how ${book.author} is crafting...`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handlePageChange = async (direction) => {
    const newPage = book.currentPage + direction;
    if (newPage >= 1 && newPage <= book.totalPages) {
      try {
        const newProgress = calculateProgress(newPage, book.totalPages);
        await updateBook(book.id, { 
          currentPage: newPage,
          progress: newProgress
        });
        // Update the book object locally for immediate UI update
        book.currentPage = newPage;
        book.progress = newProgress;
      } catch (error) {
        console.error('Error updating page:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputText),
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
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
    <View style={[styles.container, { backgroundColor: theme.colors.surface }] }>
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
            <Text style={styles.headerBookTitle}>{book.title}</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <TouchableOpacity 
                  style={[styles.progressArrow, book.currentPage <= 1 && styles.progressArrowDisabled]}
                  onPress={() => handlePageChange(-1)}
                  disabled={book.currentPage <= 1}
                >
                  <Text style={[styles.progressArrowText, book.currentPage <= 1 && styles.progressArrowTextDisabled]}>‹</Text>
                </TouchableOpacity>
                
                <View style={styles.dottedProgressContainer}>
                  {Array.from({ length: Math.min(book.totalPages, 20) }, (_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.progressDot,
                        index < book.currentPage && styles.progressDotFilled
                      ]}
                    />
                  ))}
                  {book.totalPages > 20 && (
                    <Text style={styles.progressDotText}>...</Text>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={[styles.progressArrow, book.currentPage >= book.totalPages && styles.progressArrowDisabled]}
                  onPress={() => handlePageChange(1)}
                  disabled={book.currentPage >= book.totalPages}
                >
                  <Text style={[styles.progressArrowText, book.currentPage >= book.totalPages && styles.progressArrowTextDisabled]}>›</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.progressText}>
                Page {book.currentPage} of {book.totalPages} ({book.progress}%)
              </Text>
              <Text style={styles.readingStatusText}>
                {getReadingStatus(book.progress)}
              </Text>
            </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Left Column: Book Cover and Facts */}
          <View style={styles.leftColumn}>
            {/* Book Cover using SimpleBookImage component */}
            <View style={styles.bookCoverContainer}>
              <SimpleBookImage book={book} />
            </View>
            
            {/* Facts Section */}
            <View style={styles.factsContainer}>
              <Text style={styles.factsTitle}>Book Details</Text>
              <View style={styles.factItem}>
                <Text style={styles.factLabel}>Author:</Text>
                <Text style={styles.factValue}>{book.author || 'Unknown'}</Text>
              </View>
              <View style={styles.factItem}>
                <Text style={styles.factLabel}>Published:</Text>
                <Text style={styles.factValue}>{book.publishedDate || 'Unknown'}</Text>
              </View>
              <View style={styles.factItem}>
                <Text style={styles.factLabel}>Pages:</Text>
                <Text style={styles.factValue}>{book.totalPages || 'Unknown'}</Text>
              </View>
              {book.categories && book.categories.length > 0 && (
                <View style={styles.factItem}>
                  <Text style={styles.factLabel}>Genre:</Text>
                  <Text style={styles.factValue}>{book.categories[0]}</Text>
                </View>
              )}
              {book.publisher && (
                <View style={styles.factItem}>
                  <Text style={styles.factLabel}>Publisher:</Text>
                  <Text style={styles.factValue}>{book.publisher}</Text>
                </View>
              )}
              {book.isbn && (
                <View style={styles.factItem}>
                  <Text style={styles.factLabel}>ISBN:</Text>
                  <Text style={styles.factValue}>{book.isbn}</Text>
                </View>
              )}
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
    </View>
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
    fontSize: 20,
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
  factsContainer: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  factsTitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  factItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  factLabel: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  factValue: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
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
  progressArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
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
  dottedProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 200,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  progressDotFilled: {
    backgroundColor: theme.colors.blue,
    borderColor: theme.colors.blue,
  },
  progressDotText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginLeft: 4,
  },
  progressText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  readingStatusText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
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