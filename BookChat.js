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
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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

  // Generate sample chapters for directory
  const generateChapterDirectory = () => {
    const chapters = [];
    for (let i = 1; i <= Math.min(book.chapter + 3, 20); i++) {
      const startPage = Math.floor(((i - 1) / 20) * book.totalPages) + 1;
      const endPage = Math.floor((i / 20) * book.totalPages);
      chapters.push({
        number: i,
        title: `Chapter ${i}`,
        startPage,
        endPage,
        isRead: i <= book.chapter,
        isCurrent: i === book.chapter,
      });
    }
    return chapters;
  };

  const chapters = generateChapterDirectory();

  // Generate reading session summary
  const generateLastSessionSummary = () => {
    const summaries = {
      'The Midnight Library': `Welcome back! In your last session, you read about Nora's exploration of different life paths in the library between life and death. You left off at Chapter ${book.chapter} where she was discovering how her choices shaped alternate realities.`,
      'Atomic Habits': `Great to see you again! Last time, you were diving into Chapter ${book.chapter} about the compound effect of small habits. You were exploring how 1% improvements can lead to remarkable results over time.`,
      'The Seven Husbands of Evelyn Hugo': `Hello again! In your previous reading session, you reached Chapter ${book.chapter} where Evelyn was revealing more secrets about her past relationships and the truth behind her glamorous Hollywood facade.`,
      'Educated': `Welcome back to Tara's powerful memoir! You last read Chapter ${book.chapter}, continuing her journey of self-discovery and education despite her challenging family circumstances.`
    };
    
    return summaries[book.title] || `Welcome back to "${book.title}"! You're currently on page ${book.currentPage} of Chapter ${book.chapter}. Let's continue exploring this wonderful story together! 🦆`;
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
    <LinearGradient
      colors={['#6A1B9A', '#8E24AA', '#AB47BC']}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>{book.title}</Text>
            <Text style={styles.bookProgress}>
              Page {book.currentPage} • Chapter {book.chapter}
            </Text>
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* Left Directory Column */}
          <View style={styles.directoryContainer}>
            <Text style={styles.directoryTitle}>Directory</Text>
            <ScrollView style={styles.directoryScroll} showsVerticalScrollIndicator={false}>
              {chapters.map((chapter) => (
                <View 
                  key={chapter.number}
                  style={[
                    styles.chapterItem,
                    chapter.isCurrent && styles.currentChapter,
                    !chapter.isRead && styles.unreadChapter
                  ]}
                >
                  <Text style={[
                    styles.chapterNumber,
                    chapter.isCurrent && styles.currentChapterText,
                    !chapter.isRead && styles.unreadChapterText
                  ]}>
                    {chapter.number}
                  </Text>
                  <View style={styles.chapterInfo}>
                    <Text style={[
                      styles.chapterTitle,
                      chapter.isCurrent && styles.currentChapterText,
                      !chapter.isRead && styles.unreadChapterText
                    ]}>
                      {chapter.title}
                    </Text>
                    <Text style={[
                      styles.chapterPages,
                      chapter.isCurrent && styles.currentChapterText,
                      !chapter.isRead && styles.unreadChapterText
                    ]}>
                      p. {chapter.startPage}-{chapter.endPage}
                    </Text>
                  </View>
                  {chapter.isCurrent && <Text style={styles.currentIndicator}>📖</Text>}
                  {!chapter.isRead && <Text style={styles.lockIndicator}>🔒</Text>}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Right Chat Area */}
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
                  <Text style={styles.duckEmoji}>🦆</Text>
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
                    <Text style={styles.continueButtonText}>Continue Reading Discussion</Text>
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
                    <Text style={styles.typingText}>AI is thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>

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
      </KeyboardAvoidingView>
    </LinearGradient>
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
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bookInfo: {
    alignItems: 'center',
  },
  bookTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  bookProgress: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  directoryContainer: {
    width: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
  },
  directoryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  directoryScroll: {
    flex: 1,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  currentChapter: {
    backgroundColor: 'rgba(156, 39, 176, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.5)',
  },
  unreadChapter: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  chapterNumber: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: 'bold',
    width: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  chapterPages: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginTop: 2,
  },
  currentChapterText: {
    color: '#fff',
  },
  unreadChapterText: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  currentIndicator: {
    fontSize: 12,
  },
  lockIndicator: {
    fontSize: 10,
  },
  chatContainer: {
    flex: 1,
    position: 'relative',
  },
  duckGreetingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(106, 27, 154, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 24,
  },
  duckContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  duckEmoji: {
    fontSize: 80,
    textAlign: 'center',
  },
  duckMessageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  duckGreetingText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#9C27B0',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#333',
  },
  typingText: {
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sendButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(156, 39, 176, 0.3)',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});