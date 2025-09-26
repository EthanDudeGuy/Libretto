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
import { updateBook } from './BookStorage';
import BookCard from './BookCard';

export default function BookChat({ book, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDuckGreeting, setShowDuckGreeting] = useState(true);
  const [duckAnimationComplete, setDuckAnimationComplete] = useState(false);
  const scrollViewRef = useRef();
  
  // Animation values
  const duckScale = useRef(new Animated.Value(0)).current;
  const duckBounce = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;


  // Generate reading session summary -- Owen to get rid of this filler text... 
  const generateLastSessionSummary = () => {
    const summaries = {
      'The Midnight Library': `Welcome back! In your last session, you read about Nora's exploration of different life paths in the library between life and death. You left off at Chapter ${book.chapter} where she was discovering how her choices shaped alternate realities.`,
      'Atomic Habits': `Great to see you again! Last time, you were diving into Chapter ${book.chapter} about the compound effect of small habits. You were exploring how 1% improvements can lead to remarkable results over time.`,
      'The Seven Husbands of Evelyn Hugo': `Hello again! In your previous reading session, you reached Chapter ${book.chapter} where Evelyn was revealing more secrets about her past relationships and the truth behind her glamorous Hollywood facade.`,
      'Educated': `Welcome back to Tara's powerful memoir! You last read Chapter ${book.chapter}, continuing her journey of self-discovery and education despite her challenging family circumstances.`
    };
    
    return summaries[book.title] || `Welcome back to "${book.title}"! You're currently on page ${book.currentPage} of Chapter ${book.chapter}. Let's continue exploring this wonderful story together!`;
  };


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

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleDismissDuck();
      }, 5000);

      return () => {
        bounceAnimation.stop();
        clearTimeout(timer);
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
        text: `Now that you're caught up, what would you like to discuss about "${book.title}"? I'm here to explore themes, characters, and plot points with you - all while respecting where you are in the story!`,
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }] }>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Navigation Back Arrow */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          {/* Left Column: Book Cover and Facts */}
          <View style={styles.leftColumn}>
            {/* Book Cover using BookCard component */}
            <View style={styles.bookCoverContainer}>
              <BookCard book={book} />
            </View>
            
            {/* Facts Section */}
            <View style={styles.factsContainer}>
              <Text style={styles.factsTitle}>Book Details</Text>
              <View style={styles.factItem}>
                <Text style={styles.factLabel}>Author:</Text>
                <Text style={styles.factValue}>Jane Doe</Text>
              </View>
              <View style={styles.factItem}>
                <Text style={styles.factLabel}>Published:</Text>
                <Text style={styles.factValue}>2023</Text>
              </View>
              <View style={styles.factItem}>
                <Text style={styles.factLabel}>Genre:</Text>
                <Text style={styles.factValue}>Fantasy</Text>
              </View>
            </View>
          </View>

          {/* Right Column: Title, Progress, Chatbox */}
          <View style={styles.rightColumn}>
            {/* Book Title - Centered at top */}
            <View style={styles.titleContainer}>
              <Text style={styles.bookTitle}>{book.title}</Text>
            </View>

            {/* Progress Bar - Under title */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${Math.round((book.currentPage / book.totalPages) * 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {Math.round((book.currentPage / book.totalPages) * 100)}% Complete
              </Text>
            </View>

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
                      {generateLastSessionSummary()}
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
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
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
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
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
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bookTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  progressContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 12,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.blue,
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
    borderColor: theme.colors.borderSubtle,
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
    borderTopColor: theme.colors.borderSubtle,
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
    borderColor: theme.colors.borderStrong,
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