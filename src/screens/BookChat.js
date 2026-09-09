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
  PanResponder,
  Modal,
} from 'react-native';
import theme from '../constants/theme';
import { updateBook, calculateProgress } from '../utils/BookStorage';
import SimpleBookImage from '../components/SimpleBookImage';
import DeleteBookModal from '../components/DeleteBookModal';
import { sendMessageToClaude } from '../services/ClaudeAPI';
import { useAuth } from '../context/AuthContext';
import { deleteBook as deleteBookFromStorage } from '../utils/BookStorage';
import { handleAPIError, logError } from '../utils/ErrorHandler';
import ImageColors from 'react-native-image-colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function BookChat({ book, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [draggedLineIndex, setDraggedLineIndex] = useState(null);
  const [currentBook, setCurrentBook] = useState(book);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isWelcomeTyping, setIsWelcomeTyping] = useState(false);
  const [welcomeMessageText, setWelcomeMessageText] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(theme.colors.surface);
  const scrollViewRef = useRef();
  const { user } = useAuth();

  // Animation values
  const pageFadeAnim = useRef(new Animated.Value(0)).current;
  const logoPulseAnim = useRef(new Animated.Value(1)).current;
  const dotsAnim1 = useRef(new Animated.Value(0)).current;
  const dotsAnim2 = useRef(new Animated.Value(0)).current;
  const dotsAnim3 = useRef(new Animated.Value(0)).current;
  const cursorBlinkAnim = useRef(new Animated.Value(1)).current;

  // Custom hook for typing animation
  const useTypingAnimation = (text, speed = 30) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
      if (!text) return;

      let index = 0;
      setDisplayedText('');
      setIsComplete(false);

      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, speed);

      return () => clearInterval(interval);
    }, [text, speed]);

    return { displayedText, isComplete };
  };

  // Dynamic summary generator with personalized witty comments
  const generatePlaceholderSummary = () => {
    const progress = currentBook.progress || 0;
    const currentPage = currentBook.currentPage || 1;
    const totalPages = currentBook.totalPages || 1;
    const userName = user?.name || user?.email?.split('@')[0] || 'bookworm';

    // Witty comments based on reading progress
    const getWittyComment = (progress, currentPage, totalPages) => {
      const wittyComments = {
        justStarted: [
          "Time to crack open this literary treasure!",
          "The adventure begins... are you ready?",
          "First page jitters are totally normal!",
          "Every great reader starts with a single page."
        ],
        early: [
          "You're just getting warmed up!",
          "The plot is thickening... or is that your curiosity?",
          "Already hooked? I can tell!",
          "Building momentum like a literary locomotive!"
        ],
        middle: [
          "You're in the sweet spot of the story!",
          "The plot twists are coming... I can feel it!",
          "Halfway through and still turning pages? That's commitment!",
          "You're officially past the point of no return!"
        ],
        almostDone: [
          "The finish line is in sight!",
          "You're so close to that satisfying 'The End' feeling!",
          "Almost there... but don't rush the climax!",
          "The final chapters await your eager eyes!"
        ],
        finished: [
          "Congratulations on completing this literary journey!",
          "You did it! Time for that post-book glow!",
          "Another book conquered! What's next on your list?",
          "The satisfaction of finishing a good book is unmatched!"
        ]
      };

      if (progress === 0) {
        return wittyComments.justStarted[Math.floor(Math.random() * wittyComments.justStarted.length)];
      } else if (progress < 25) {
        return wittyComments.early[Math.floor(Math.random() * wittyComments.early.length)];
      } else if (progress < 75) {
        return wittyComments.middle[Math.floor(Math.random() * wittyComments.middle.length)];
      } else if (progress < 95) {
        return wittyComments.almostDone[Math.floor(Math.random() * wittyComments.almostDone.length)];
      } else {
        return wittyComments.finished[Math.floor(Math.random() * wittyComments.finished.length)];
      }
    };

    const wittyComment = getWittyComment(progress, currentPage, totalPages);

    if (progress === 0) {
      return `Welcome back, ${userName}! ${wittyComment} Ready to dive into "${currentBook.title}"?`;
    } else {
      return `Welcome back, ${userName}! ${wittyComment} You're on page ${currentPage} of ${totalPages} in "${currentBook.title}". What would you like to discuss?`;
    }
  };

  // Update local book state when prop changes
  useEffect(() => {
    setCurrentBook(book);
  }, [book]);

  useEffect(() => {
    const extractColors = async () => {
      if (currentBook.thumbnail) {
        try {
          const result = await ImageColors.getColors(currentBook.thumbnail, {
            fallback: theme.colors.surface,
            cache: true,
            key: currentBook.id,
          });

          let dominantColor = theme.colors.surface;

          if (result.platform === 'ios') {
            dominantColor = result.background || result.primary || theme.colors.surface;
          } else if (result.platform === 'android') {
            dominantColor = result.dominant || result.vibrant || theme.colors.surface;
          } else if (result.platform === 'web') {
            dominantColor = result.dominant || result.vibrant || theme.colors.surface;
          }

          setBackgroundColor(dominantColor);
        } catch (error) {
          console.log('Error extracting colors:', error);
          setBackgroundColor(theme.colors.surface);
        }
      } else {
        setBackgroundColor(theme.colors.surface);
      }
    };

    extractColors();
  }, [currentBook.id, currentBook.thumbnail]);

  // Page fade-in animation when component mounts
  useEffect(() => {
    Animated.timing(pageFadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pageFadeAnim]);

  // Animation for thinking state
  useEffect(() => {
    if (isTyping) {
      // Start logo pulsing animation
      const logoPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(logoPulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(logoPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      );

      // Start dots animation with staggered timing
      const dotsAnimation = Animated.loop(
        Animated.stagger(200, [
          Animated.sequence([
            Animated.timing(dotsAnim1, {
              toValue: 1,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(dotsAnim1, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(dotsAnim2, {
              toValue: 1,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(dotsAnim2, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(dotsAnim3, {
              toValue: 1,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(dotsAnim3, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }),
          ]),
        ])
      );

      logoPulse.start();
      dotsAnimation.start();

      return () => {
        logoPulse.stop();
        dotsAnimation.stop();
      };
    } else {
      // Reset animations when not typing
      logoPulseAnim.setValue(1);
      dotsAnim1.setValue(0);
      dotsAnim2.setValue(0);
      dotsAnim3.setValue(0);
    }
  }, [isTyping]);

  // Add initial AI message when component mounts
  useEffect(() => {
    const initialMessage = generatePlaceholderSummary();
    setWelcomeMessageText(initialMessage);
    setIsWelcomeTyping(true);
    
    // Start with an empty welcome message that will be animated
    setMessages([
      {
        id: '1',
        text: '',
        isUser: false,
        timestamp: new Date(),
        isWelcomeMessage: true,
      },
    ]);
  }, []);

  // Typing animation for welcome message
  const { displayedText, isComplete } = useTypingAnimation(welcomeMessageText, 40);

  // Update welcome message as it types
  useEffect(() => {
    if (displayedText && isWelcomeTyping) {
      setMessages(prev => prev.map(msg => 
        msg.isWelcomeMessage 
          ? { ...msg, text: displayedText }
          : msg
      ));
    }
    
    if (isComplete && isWelcomeTyping) {
      setIsWelcomeTyping(false);
    }
  }, [displayedText, isComplete, isWelcomeTyping]);

  // Cursor blinking animation for typing
  useEffect(() => {
    if (isWelcomeTyping) {
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorBlinkAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(cursorBlinkAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      );
      blinkAnimation.start();
      return () => blinkAnimation.stop();
    } else {
      cursorBlinkAnim.setValue(1);
    }
  }, [isWelcomeTyping, cursorBlinkAnim]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const generateAIResponse = async userMessage => {
    try {
      // Use Claude API for smart responses
      const claudeResponse = await sendMessageToClaude(
        userMessage,
        currentBook,
        messages,
        user
      );

      if (claudeResponse.success) {
        return claudeResponse.message;
      } else {
        // Use the error handling utility for consistent error messages
        logError(new Error(claudeResponse.error), 'AI Response Generation');
        return (
          claudeResponse.message ||
          handleAPIError(new Error(claudeResponse.error), 'AI Response')
        );
      }
    } catch (error) {
      logError(error, 'AI Response Generation');
      return handleAPIError(error, 'AI Response Generation');
    }
  };

  const handlePageChange = async direction => {
    const newPage = currentBook.currentPage + direction;
    if (newPage >= 1 && newPage <= currentBook.totalPages) {
      try {
        const newProgress = calculateProgress(newPage, currentBook.totalPages);
        await updateBook(currentBook.id, {
          currentPage: newPage,
          progress: newProgress,
        });
        // Update the local book state for immediate UI update
        setCurrentBook(prev => ({
          ...prev,
          currentPage: newPage,
          progress: newProgress,
        }));
      } catch (error) {
        console.error('Error updating page:', error);
      }
    }
  };

  // Create PanResponder for pixelated block dragging
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: event => {
      // Calculate which block was touched
      const touchX = event.nativeEvent.locationX;
      const blockWidth = 8; // Width of each pixelated block
      const blockSpacing = 3; // Space between blocks
      const totalWidth = blockWidth + blockSpacing;
      const blockIndex = Math.floor(touchX / totalWidth);
      setDraggedLineIndex(blockIndex);
    },

    onPanResponderMove: event => {
      // Update which block is being dragged during movement
      const touchX = event.nativeEvent.locationX;
      const blockWidth = 8;
      const blockSpacing = 3;
      const totalWidth = blockWidth + blockSpacing;
      const blockIndex = Math.floor(touchX / totalWidth);
      setDraggedLineIndex(blockIndex);
    },

    onPanResponderRelease: async event => {
      const touchX = event.nativeEvent.locationX;
      const blockWidth = 8;
      const blockSpacing = 3;
      const totalWidth = blockWidth + blockSpacing;
      const blockIndex = Math.floor(touchX / totalWidth);

      // Convert block index to page number based on total blocks
      const totalBlocks = 32;
      const clampedBlockIndex = Math.max(0, Math.min(blockIndex, totalBlocks - 1));
      const progressPercentage = (clampedBlockIndex / (totalBlocks - 1)) * 100;
      const newPage = Math.max(
        1,
        Math.min(
          currentBook.totalPages,
          Math.round((progressPercentage / 100) * currentBook.totalPages)
        )
      );

      if (newPage !== currentBook.currentPage) {
        try {
          const newProgress = calculateProgress(
            newPage,
            currentBook.totalPages
          );
          await updateBook(currentBook.id, {
            currentPage: newPage,
            progress: newProgress,
          });
          // Update the local book state for immediate UI update
          setCurrentBook(prev => ({
            ...prev,
            currentPage: newPage,
            progress: newProgress,
          }));
        } catch (error) {
          console.error('Error updating page:', error);
        }
      }

      setDraggedLineIndex(null);
    },

    onPanResponderTerminate: () => {
      setDraggedLineIndex(null);
    },
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

  const handleBack = () => {
    onBack();
  };

  const handleDeleteBook = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteBookFromStorage(currentBook.id);
      // Navigate back to library after successful deletion
      onBack();
    } catch (error) {
      console.error('Error deleting book:', error);
      // You might want to show an error message here
    }
  };

  const renderPageLines = () => {
    // Create pixelated progress bar with fixed number of blocks
    const totalBlocks = 32; // Fixed number of pixelated blocks
    const progressPercentage = currentBook.progress || 0;
    const filledBlocks = Math.floor((progressPercentage / 100) * totalBlocks);
    const blocks = [];

    for (let i = 0; i < totalBlocks; i++) {
      const isFilled = i < filledBlocks;
      const isCurrentBlock = i === filledBlocks - 1 && progressPercentage > 0;
      const isDragged = draggedLineIndex === i;

      blocks.push(
        <View
          key={i}
          style={[
            styles.pixelatedBlock,
            {
              backgroundColor: isFilled
                ? theme.colors.blue
                : theme.colors.surfaceElevated,
              borderColor: isFilled
                ? theme.colors.blue
                : theme.colors.borderSubtle,
              transform: [{ scale: isDragged ? 1.1 : isCurrentBlock ? 1.05 : 1 }],
              opacity: isFilled ? 1 : 0.6,
            },
          ]}
        />
      );
    }

    return blocks;
  };

  const renderMessage = message => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        {!message.isUser && (
          <View style={styles.aiLogoContainer}>
            <Image
              source={require('../../assets/duckbill.png')}
              style={styles.aiLogo}
              resizeMode='contain'
            />
          </View>
        )}
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userText : styles.aiText,
          ]}
        >
          {message.text}
          {message.isWelcomeMessage && isWelcomeTyping && (
            <Animated.Text 
              style={[
                styles.typingCursor,
                { opacity: cursorBlinkAnim }
              ]}
            >
              |
            </Animated.Text>
          )}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          backgroundColor + 'DD',
          backgroundColor + '88',
          theme.colors.surface + 'EE',
        ]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: 'transparent',
            opacity: pageFadeAnim,
          },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        {/* Header Section with Back Button and Progress Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButtonModal}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>← Library</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            {/* Progress Bar Section - Aligned with right column (chatbox) */}
            <View style={styles.progressSection}>
              <View style={styles.pageScrollContainer}>
                <TouchableOpacity
                  style={[
                    styles.progressArrow,
                    currentBook.currentPage <= 1 &&
                      styles.progressArrowDisabled,
                  ]}
                  onPress={() => handlePageChange(-1)}
                  disabled={currentBook.currentPage <= 1}
                >
                  <Text
                    style={[
                      styles.progressArrowText,
                      currentBook.currentPage <= 1 &&
                        styles.progressArrowTextDisabled,
                    ]}
                  >
                    ‹
                  </Text>
                </TouchableOpacity>

                <View
                  style={styles.pageLinesContainer}
                  {...panResponder.panHandlers}
                >
                  {renderPageLines()}
                </View>

                <TouchableOpacity
                  style={[
                    styles.progressArrow,
                    currentBook.currentPage >= currentBook.totalPages &&
                      styles.progressArrowDisabled,
                  ]}
                  onPress={() => handlePageChange(1)}
                  disabled={currentBook.currentPage >= currentBook.totalPages}
                >
                  <Text
                    style={[
                      styles.progressArrowText,
                      currentBook.currentPage >= currentBook.totalPages &&
                        styles.progressArrowTextDisabled,
                    ]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Page Number Display - Positioned under the progress bar */}
              <View style={styles.pageNumberContainer}>
                <Text style={styles.pageNumberText}>
                  {String(currentBook.currentPage)} / {String(currentBook.totalPages)}
                </Text>
              </View>
            </View>
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
                    <Text style={styles.infoValue} numberOfLines={2}>
                      {currentBook.author || 'Unknown'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Published</Text>
                    <Text style={styles.infoValue}>
                      {currentBook.publishedDate || 'Unknown'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Pages</Text>
                    <Text style={styles.infoValue}>
                      {String(currentBook.totalPages || 'Unknown')}
                    </Text>
                  </View>
                </View>

                {currentBook.categories &&
                  currentBook.categories.length > 0 ? (
                    <>
                      <View style={styles.infoDivider} />
                      <View style={styles.infoRow}>
                        <View style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>Genre</Text>
                          <Text style={styles.infoValue} numberOfLines={2}>
                            {currentBook.categories[0]}
                          </Text>
                        </View>
                      </View>
                    </>
                  ) : null}

                {currentBook.publisher ? (
                  <>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Publisher</Text>
                        <Text style={styles.infoValue} numberOfLines={2}>
                          {currentBook.publisher}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : null}

                {currentBook.isbn ? (
                  <>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>ISBN</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                          {currentBook.isbn}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : null}

                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Language</Text>
                    <Text style={styles.infoValue}>
                      {currentBook.language || 'English'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Reading Time</Text>
                    <Text style={styles.infoValue}>
                      {currentBook.totalPages
                        ? String(Math.ceil(currentBook.totalPages / 2)) + ' min'
                        : 'Unknown'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Progress</Text>
                    <Text style={styles.infoValue}>
                      {String(currentBook.progress || 0)}% Complete
                    </Text>
                  </View>
                </View>

                {currentBook.description ? (
                  <>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Description</Text>
                        <Text style={styles.infoValue} numberOfLines={3}>
                          {currentBook.description}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : null}

                {currentBook.averageRating ? (
                  <>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Rating</Text>
                        <Text style={styles.infoValue}>
                          {String(currentBook.averageRating)}/5 ⭐
                        </Text>
                      </View>
                    </View>
                  </>
                ) : null}

                {currentBook.pageCount &&
                  currentBook.pageCount !== currentBook.totalPages ? (
                    <>
                      <View style={styles.infoDivider} />
                      <View style={styles.infoRow}>
                        <View style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>Page Count</Text>
                          <Text style={styles.infoValue}>
                            {String(currentBook.pageCount)}
                          </Text>
                        </View>
                      </View>
                    </>
                  ) : null}
              </View>
            </View>
          </View>

          {/* Right Column: Header and Chatbox */}
          <View style={styles.rightColumn}>
            {/* Right Column Header with Book Title and Author */}
            <View style={styles.rightColumnHeader}>
              {/* Book Title and Author Section */}
              <View style={styles.headerTopRow}>
                <View style={styles.bookTitleAuthorContainer}>
                  <Text style={styles.rightColumnBookTitle}>
                    {currentBook.title}
                  </Text>
                  <Text style={styles.rightColumnAuthor}>
                    {currentBook.author || 'Unknown'}
                  </Text>
                </View>

                <View style={styles.directoryIconContainer}>
                  <TouchableOpacity
                    style={styles.directoryIcon}
                    onPress={() => setShowActionMenu(!showActionMenu)}
                  >
                    <Text style={styles.directoryIconText}>⋮</Text>
                  </TouchableOpacity>

                  {/* Action Menu Modal */}
                  <Modal
                    visible={showActionMenu}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowActionMenu(false)}
                  >
                    <TouchableOpacity
                      style={styles.actionMenuBackdrop}
                      activeOpacity={1}
                      onPress={() => setShowActionMenu(false)}
                    >
                      <View style={styles.actionMenuWrapper}>
                        <View style={styles.actionMenuContainer}>
                          <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={() => {
                              setShowActionMenu(false);
                              handleDeleteBook();
                            }}
                          >
                            <Text style={styles.actionMenuIcon}>🗑️</Text>
                            <Text style={styles.actionMenuText}>Delete Book</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Modal>
                </View>
              </View>
            </View>

            {/* Main Chat Area */}
            <View style={styles.chatContainer}>
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
                      <Animated.View
                        style={[
                          styles.aiLogoContainer,
                          {
                            transform: [{ scale: logoPulseAnim }],
                          },
                        ]}
                      >
                        <Image
                          source={require('../../assets/duckbill.png')}
                          style={styles.aiLogo}
                          resizeMode='contain'
                        />
                      </Animated.View>
                      <View style={styles.typingContainer}>
                        <Text style={styles.typingText}>
                          Waddle is thinking
                        </Text>
                        <View style={styles.dotsContainer}>
                          <Animated.View
                            style={[
                              styles.thinkingDot,
                              {
                                opacity: dotsAnim1,
                                transform: [{ scale: dotsAnim1 }],
                              },
                            ]}
                          />
                          <Animated.View
                            style={[
                              styles.thinkingDot,
                              {
                                opacity: dotsAnim2,
                                transform: [{ scale: dotsAnim2 }],
                              },
                            ]}
                          />
                          <Animated.View
                            style={[
                              styles.thinkingDot,
                              {
                                opacity: dotsAnim3,
                                transform: [{ scale: dotsAnim3 }],
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder='Ask about themes, characters, plot...'
                  placeholderTextColor='rgba(255, 255, 255, 0.6)'
                  maxLength={500}
                  onSubmitEditing={handleSendMessage}
                  blurOnSubmit={false}
                  returnKeyType='send'
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !inputText.trim() && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendMessage}
                  disabled={!inputText.trim() || isTyping}
                >
                  <Text style={styles.sendButtonText}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Delete Book Modal */}
      <DeleteBookModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        book={currentBook}
      />
      </Animated.View>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    width: 200,
    alignItems: 'flex-start',
    paddingHorizontal: 12,
  },
  headerRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backButtonModal: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
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
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  directoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  directoryIconText: {
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  progressSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 0,
  },
  // Left Column Styles
  leftColumn: {
    width: 200,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bookCoverContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  bookInfoContainer: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
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
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  infoTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    lineHeight: 14,
  },
  infoValue: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 18,
  },
  infoDivider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  // Right Column Styles
  rightColumn: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  rightColumnHeader: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookTitleAuthorContainer: {
    flex: 1,
  },
  rightColumnBookTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  rightColumnAuthor: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  pageScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 8,
  },
  directoryIconContainer: {
    alignItems: 'flex-end',
    position: 'relative',
  },
  actionMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  actionMenuWrapper: {
    position: 'absolute',
    top: 120,
    right: 40,
  },
  actionMenuContainer: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 8,
    minWidth: 160,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  actionMenuIcon: {
    fontSize: 18,
  },
  actionMenuText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
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
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    gap: 2,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    minWidth: 300,
  },
  pixelatedBlock: {
    width: 10,
    height: 22,
    borderRadius: 2, // Small radius for pixelated look
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
  pageNumberContainer: {
    alignItems: 'center',
  },
  pageNumberText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    overflow: 'hidden',
    minHeight: 400,
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
    backgroundColor: theme.colors.orange,
    borderBottomRightRadius: 4,
    borderWidth: 0,
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
  typingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.textMuted,
  },
  typingCursor: {
    color: theme.colors.blue,
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderStrong,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginRight: 12,
    color: theme.colors.textPrimary,
    fontSize: 16,
    height: 54,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: theme.colors.blue,
    width: 54,
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(66, 133, 244, 0.4)',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
