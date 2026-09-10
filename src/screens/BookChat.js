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
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import theme from '../constants/theme';
import SimpleBookImage from '../components/SimpleBookImage';
import AppHeader from '../components/AppHeader';
import { sendMessageToClaude, getCommunityResources } from '../services/ClaudeAPI';
import { useAuth } from '../context/AuthContext';
import { handleAPIError, logError } from '../utils/ErrorHandler';
import ImageColors from 'react-native-image-colors';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const BANNER_HEIGHT = Math.max(160, WINDOW_HEIGHT * 0.2);

const TABS = [
  { key: 'chat', label: 'Chat' },
  { key: 'community', label: 'Community' },
  { key: 'access', label: 'Access' },
  { key: 'information', label: 'Information' },
  { key: 'history', label: 'History' },
];

// Placeholder copy for tabs with no backing data/feature yet — shell only,
// content comes in a later pass.
const TAB_PLACEHOLDER_COPY = {
  access: {
    title: 'Access',
    body: 'Ways to read or buy this book will show up here.',
  },
  information: {
    title: 'Information',
    body: 'Extended details about this book will show up here.',
  },
  history: {
    title: 'History',
    body: 'Your reading activity and past sessions will show up here.',
  },
};

// Community tab: category and spoiler-level display metadata. The actual
// sources come from the backend's /api/community endpoint (real web search
// results), never hardcoded here — this is purely presentation.
const COMMUNITY_CATEGORY_ORDER = ['discussion', 'reference', 'deep_dive'];
const COMMUNITY_CATEGORY_META = {
  discussion: { icon: '💬', label: 'Discussions', cta: 'Open discussion' },
  reference: { icon: '📚', label: 'Reference', cta: 'View reference' },
  deep_dive: { icon: '🔎', label: 'Deep Dives', cta: 'Read analysis' },
};
const COMMUNITY_SPOILER_META = {
  spoiler_free: { label: 'Spoiler-free', color: theme.colors.success },
  may_contain_spoilers: { label: 'May contain spoilers', color: theme.colors.warning },
  full_book_spoilers: { label: 'Full-book spoilers', color: theme.colors.danger },
};
const COMMUNITY_RELEVANCE_RANK = { high: 0, medium: 1, low: 2 };

function groupCommunitySources(sources) {
  return COMMUNITY_CATEGORY_ORDER
    .map(category => ({
      category,
      meta: COMMUNITY_CATEGORY_META[category],
      items: sources
        .filter(source => source.category === category)
        .sort(
          (a, b) =>
            (COMMUNITY_RELEVANCE_RANK[a.relevance] ?? 3) -
            (COMMUNITY_RELEVANCE_RANK[b.relevance] ?? 3)
        ),
    }))
    .filter(group => group.items.length > 0);
}

// Compact radial indicator used to merge "progress" and "reading time" into
// one glanceable widget instead of two separate text rows.
function ProgressRing({ percent, size = 52, strokeWidth = 5 }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.surfaceElevated}
          strokeWidth={strokeWidth}
          fill='none'
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.orange}
          strokeWidth={strokeWidth}
          fill='none'
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap='round'
          rotation='-90'
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text
        style={{
          position: 'absolute',
          fontSize: 12,
          fontFamily: 'Inter_600SemiBold',
          color: theme.colors.textPrimary,
        }}
      >
        {Math.round(clamped)}%
      </Text>
    </View>
  );
}

export default function BookChat({
  book,
  onBack,
  onNavigateHome,
  onNavigateSettings,
  onSelectBook,
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentBook, setCurrentBook] = useState(book);
  const [activeTab, setActiveTab] = useState('chat');
  const [isWelcomeTyping, setIsWelcomeTyping] = useState(false);
  const [welcomeMessageText, setWelcomeMessageText] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(theme.colors.surface);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  // status: 'idle' | 'loading' | 'success' | 'error'
  const [communityState, setCommunityState] = useState({
    status: 'idle',
    sources: [],
    error: null,
    bookId: null,
  });
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

  // Short, plain opening line — no random one-liners, no name repetition.
  // This is client-generated (Claude never "said" it), so it's kept purely
  // functional rather than trying to sound like part of the conversation.
  const buildWelcomeMessage = () => {
    const progress = currentBook.progress || 0;
    const currentPage = currentBook.currentPage || 1;
    const totalPages = currentBook.totalPages;

    if (progress === 0) {
      return `Starting "${currentBook.title}" — ask me anything as you go, themes, characters, whatever's on your mind.`;
    }

    const pageInfo = totalPages ? `page ${currentPage} of ${totalPages}` : `page ${currentPage}`;
    return `Back in "${currentBook.title}", ${pageInfo}. What's on your mind?`;
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
    const initialMessage = buildWelcomeMessage();
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

  // Returns { text, isError } so the message bubble can be styled
  // differently when the request failed, instead of looking like a normal reply.
  const generateAIResponse = async userMessage => {
    try {
      const claudeResponse = await sendMessageToClaude(
        userMessage,
        currentBook,
        messages,
        user
      );

      if (claudeResponse.success) {
        return { text: claudeResponse.message, isError: false };
      }

      logError(
        new Error(claudeResponse.error || 'Chat request failed'),
        'AI Response Generation'
      );
      return {
        text:
          claudeResponse.message ||
          handleAPIError(new Error(claudeResponse.error), 'AI Response'),
        isError: true,
      };
    } catch (error) {
      logError(error, 'AI Response Generation');
      return { text: handleAPIError(error, 'AI Response Generation'), isError: true };
    }
  };

  const handleSendMessage = async () => {
    // Guards against duplicate sends: an empty box, and mashing enter/send
    // again while a request is already in flight.
    if (!inputText.trim() || isTyping) return;

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
      const { text: aiResponseText, isError } = await generateAIResponse(currentInput);

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
        isError,
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      // generateAIResponse already catches its own errors, so this is a
      // last-resort net for something truly unexpected.
      console.error('Error generating AI response:', error);

      const errorResponse = {
        id: (Date.now() + 1).toString(),
        text: 'Something went wrong on my end. Please try again.',
        isUser: false,
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleBack = () => {
    onBack();
  };

  const loadCommunityResources = async () => {
    setCommunityState({ status: 'loading', sources: [], error: null, bookId: currentBook.id });
    const result = await getCommunityResources(currentBook);
    if (result.success) {
      setCommunityState({ status: 'success', sources: result.sources, error: null, bookId: currentBook.id });
    } else {
      setCommunityState({ status: 'error', sources: [], error: result.error, bookId: currentBook.id });
    }
  };

  // Fetch once per book, the first time the Community tab is opened — not
  // on mount, since most sessions never visit it and it's a paid search call.
  useEffect(() => {
    if (activeTab !== 'community') return;
    if (communityState.bookId === currentBook.id && communityState.status !== 'idle') return;
    loadCommunityResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentBook.id]);

  // Minimal markdown for Claude's replies: **bold** spans and "- " bullet
  // lines. Deliberately not a full markdown parser — just enough to keep
  // Claude's occasional formatting from showing up as literal asterisks.
  const renderFormattedText = (text, textStyle) => {
    const renderInline = line =>
      line
        .split(/(\*\*[^*]+\*\*)/g)
        .filter(part => part.length > 0)
        .map((part, i) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <Text key={i} style={styles.boldText}>
              {part.slice(2, -2)}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        );

    return text.split('\n').map((line, i) => {
      if (line.trim().length === 0) {
        return <View key={i} style={styles.blankLine} />;
      }

      const bulletMatch = line.match(/^\s*[-*]\s+(.*)/);
      if (bulletMatch) {
        return (
          <View key={i} style={styles.bulletLine}>
            <Text style={[textStyle, styles.bulletDot]}>{'•'}</Text>
            <Text style={[textStyle, styles.bulletTextContent]}>
              {renderInline(bulletMatch[1])}
            </Text>
          </View>
        );
      }

      return (
        <Text key={i} style={textStyle}>
          {renderInline(line)}
        </Text>
      );
    });
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
          message.isError && styles.errorBubble,
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
        <View style={styles.messageContent}>
          {message.isUser || message.isWelcomeMessage ? (
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
                    { opacity: cursorBlinkAnim },
                  ]}
                >
                  |
                </Animated.Text>
              )}
            </Text>
          ) : (
            renderFormattedText(message.text, [styles.messageText, styles.aiText])
          )}
        </View>
      </View>
    </View>
  );

  // Remaining reading time, replacing the old flat "Progress: X% Complete"
  // sidebar row — paired with the radial ring instead of repeating the
  // percentage the ring already shows.
  const readingTimeLabel = (() => {
    if (!currentBook.totalPages) return 'Reading time unknown';
    const remainingPages = Math.max(currentBook.totalPages - (currentBook.currentPage || 0), 0);
    if (remainingPages <= 0) return 'Finished';
    return `~${Math.max(1, Math.ceil(remainingPages / 2))} min left`;
  })();

  // Secondary metadata, only the fields that are actually present — shown
  // behind the "More details" toggle rather than as equal-weight rows.
  const moreDetailsRows = [];
  if (currentBook.categories && currentBook.categories.length > 0) {
    moreDetailsRows.push({ label: 'Genre', value: currentBook.categories[0] });
  }
  if (currentBook.publisher) {
    moreDetailsRows.push({ label: 'Publisher', value: currentBook.publisher });
  }
  if (currentBook.isbn) {
    moreDetailsRows.push({ label: 'ISBN', value: currentBook.isbn, numberOfLines: 1 });
  }
  if (currentBook.description) {
    moreDetailsRows.push({ label: 'Description', value: currentBook.description, numberOfLines: 4 });
  }
  if (currentBook.averageRating) {
    moreDetailsRows.push({ label: 'Rating', value: `${currentBook.averageRating}/5 ⭐` });
  }
  if (currentBook.pageCount && currentBook.pageCount !== currentBook.totalPages) {
    moreDetailsRows.push({ label: 'Page Count', value: String(currentBook.pageCount) });
  }

  const groupedCommunitySources = groupCommunitySources(communityState.sources);

  return (
    <View style={styles.container}>
      {/* Banner: book-cover color, confined to a strip at the top of the screen */}
      <View style={styles.banner} pointerEvents='none'>
        <LinearGradient
          colors={[backgroundColor, backgroundColor + 'CC', theme.colors.background]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      <AppHeader
        onSelectBook={onSelectBook}
        onNavigateHome={onNavigateHome ?? onBack}
        onNavigateSettings={onNavigateSettings}
      />

      <Animated.View
        style={[
          styles.pageContent,
          {
            opacity: pageFadeAnim,
          },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        {/* Top Bar: Back Button, Book Title/Author, and Progress — always visible, sits on the banner */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity
              style={styles.backButtonModal}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>← Library</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {currentBook.title}
            </Text>
            <Text style={styles.topBarAuthor} numberOfLines={1}>
              {currentBook.author || 'Unknown'}
            </Text>
          </View>

        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Left Column: Book Cover and Facts */}
          <ScrollView
            style={styles.leftColumn}
            contentContainerStyle={styles.leftColumnContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Book Cover using SimpleBookImage component */}
            <View style={styles.bookCoverContainer}>
              <SimpleBookImage book={currentBook} />
            </View>

            {/* Compact byline: Author / Published / Pages / Language as one
                de-emphasized block instead of four equal-weight rows. */}
            <View style={styles.bylineBlock}>
              <Text style={styles.bylineAuthor} numberOfLines={2}>
                {currentBook.author || 'Unknown author'}
              </Text>
              <Text style={styles.bylineMeta} numberOfLines={2}>
                {[
                  currentBook.publishedDate,
                  currentBook.totalPages ? `${currentBook.totalPages} pages` : null,
                  currentBook.language || 'English',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>

            {/* Progress + reading time, merged into one compact radial widget */}
            <View style={styles.statsCard}>
              <ProgressRing percent={currentBook.progress || 0} />
              <View style={styles.statsTextBlock}>
                <Text style={styles.statsLabel}>Progress</Text>
                <Text style={styles.statsValue}>{readingTimeLabel}</Text>
              </View>
            </View>

            {/* Everything else is secondary — tucked behind a toggle so it
                doesn't compete visually with the cover, byline, and progress. */}
            {moreDetailsRows.length > 0 && (
              <View style={styles.moreDetailsSection}>
                <TouchableOpacity
                  style={styles.moreDetailsToggle}
                  onPress={() => setShowMoreDetails(prev => !prev)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moreDetailsToggleText}>More details</Text>
                  <Text style={styles.moreDetailsChevron}>
                    {showMoreDetails ? '︿' : '﹀'}
                  </Text>
                </TouchableOpacity>

                {showMoreDetails && (
                  <View style={styles.bookInfoContainer}>
                    <View style={styles.infoContent}>
                      {moreDetailsRows.map((row, index) => (
                        <React.Fragment key={row.label}>
                          {index > 0 && <View style={styles.infoDivider} />}
                          <View style={styles.infoRow}>
                            <View style={styles.infoTextContainer}>
                              <Text style={styles.infoLabel}>{row.label}</Text>
                              <Text
                                style={styles.infoValue}
                                numberOfLines={row.numberOfLines || 2}
                              >
                                {row.value}
                              </Text>
                            </View>
                          </View>
                        </React.Fragment>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Right Column: Tabs + Chatbox */}
          <View style={styles.rightColumn}>
            <View style={styles.tabBar}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === tab.key && styles.tabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  <View
                    style={[
                      styles.tabIndicator,
                      activeTab === tab.key && styles.tabIndicatorActive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === 'community' ? (
              <View style={styles.chatContainer}>
                {communityState.status === 'loading' ? (
                  <View style={styles.communityStatusContainer}>
                    <ActivityIndicator color={theme.colors.orange} size='small' />
                    <Text style={styles.communityStatusText}>
                      Searching the web for places to talk about "{currentBook.title}"...
                    </Text>
                  </View>
                ) : communityState.status === 'error' ? (
                  <View style={styles.communityStatusContainer}>
                    <Text style={styles.communityStatusTitle}>Couldn't load communities</Text>
                    <Text style={styles.communityStatusText}>
                      {communityState.error || 'Something went wrong. Please try again.'}
                    </Text>
                    <TouchableOpacity
                      style={styles.communityRetryButton}
                      onPress={loadCommunityResources}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.communityRetryText}>Try again</Text>
                    </TouchableOpacity>
                  </View>
                ) : groupedCommunitySources.length === 0 ? (
                  <View style={styles.communityStatusContainer}>
                    <Text style={styles.communityStatusTitle}>No communities found yet</Text>
                    <Text style={styles.communityStatusText}>
                      "{currentBook.title}" might be too new, obscure, or without much of an
                      online following right now.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    contentContainerStyle={styles.communityContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={styles.communityIntro}>
                      See where readers are talking about and exploring "{currentBook.title}"
                      across the web.
                    </Text>
                    {groupedCommunitySources.map(group => (
                      <View key={group.category} style={styles.communityCategoryBlock}>
                        <Text style={styles.communityCategoryHeader}>
                          {group.meta.icon} {group.meta.label}
                        </Text>
                        {group.items.map((source, index) => {
                          const spoilerMeta =
                            COMMUNITY_SPOILER_META[source.spoiler_level] ||
                            COMMUNITY_SPOILER_META.may_contain_spoilers;
                          return (
                            <TouchableOpacity
                              key={`${source.url}-${index}`}
                              style={styles.communityCard}
                              onPress={() => Linking.openURL(source.url)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.communityCardTopRow}>
                                <Text style={styles.communityName} numberOfLines={1}>
                                  {source.platform} — {source.title}
                                </Text>
                                <View
                                  style={[
                                    styles.spoilerBadge,
                                    { borderColor: spoilerMeta.color },
                                  ]}
                                >
                                  <Text style={[styles.spoilerBadgeText, { color: spoilerMeta.color }]}>
                                    {spoilerMeta.label}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.communityDescription}>
                                {source.description}
                              </Text>
                              <Text style={styles.communityCta}>
                                {group.meta.cta} →
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : activeTab !== 'chat' ? (
              <View style={styles.chatContainer}>
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderTitle}>
                    {TAB_PLACEHOLDER_COPY[activeTab].title}
                  </Text>
                  <Text style={styles.placeholderText}>
                    {TAB_PLACEHOLDER_COPY[activeTab].body}
                  </Text>
                </View>
              </View>
            ) : (
            <View style={styles.chatContainer}>
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() =>
                  scrollViewRef.current?.scrollToEnd({ animated: true })
                }
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
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
  },
  pageContent: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 8,
    paddingBottom: 16,
    gap: 16,
  },
  topBarLeft: {
    alignItems: 'flex-start',
  },
  topBarCenter: {
    flex: 1,
    minWidth: 0,
  },
  topBarTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
  },
  topBarAuthor: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
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
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 0,
  },
  // Left Column Styles
  leftColumn: {
    width: 148,
    flexGrow: 0,
    flexShrink: 0,
  },
  leftColumnContent: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    paddingBottom: 24,
  },
  bookCoverContainer: {
    alignItems: 'center',
    marginBottom: 10,
    boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.35)',
  },
  bylineBlock: {
    paddingHorizontal: 4,
    marginBottom: 10,
    gap: 2,
  },
  bylineAuthor: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 17,
  },
  bylineMeta: {
    color: 'rgba(201, 209, 217, 0.85)',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 15,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    padding: 10,
    marginBottom: 10,
  },
  statsTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  statsLabel: {
    color: 'rgba(201, 209, 217, 0.85)',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  statsValue: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  moreDetailsSection: {
    marginTop: 2,
  },
  moreDetailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  moreDetailsToggleText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  moreDetailsChevron: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  bookInfoContainer: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
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
    color: 'rgba(201, 209, 217, 0.85)',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    marginBottom: 12,
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingTop: 10,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.textMuted,
  },
  tabLabelActive: {
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  tabIndicator: {
    height: 2,
    alignSelf: 'stretch',
    marginTop: 10,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    backgroundColor: theme.colors.orange,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  placeholderTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.textPrimary,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  communityContent: {
    padding: 20,
    gap: 4,
  },
  communityIntro: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: theme.colors.textMuted,
    lineHeight: 17,
    marginBottom: 14,
  },
  communityCategoryBlock: {
    marginBottom: 18,
    gap: 10,
  },
  communityCategoryHeader: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.textSecondary,
  },
  communityCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    padding: 14,
    gap: 6,
  },
  communityCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  communityName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.textPrimary,
  },
  communityDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: theme.colors.textMuted,
    lineHeight: 17,
  },
  communityCta: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.orange,
    marginTop: 2,
  },
  spoilerBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  spoilerBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  communityStatusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  communityStatusTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.textPrimary,
  },
  communityStatusText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 18,
  },
  communityRetryButton: {
    marginTop: 4,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  communityRetryText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.textPrimary,
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
  errorBubble: {
    borderColor: theme.colors.danger,
  },
  aiLogoContainer: {
    marginRight: 8,
    marginTop: 2,
  },
  aiLogo: {
    width: 24,
    height: 24,
  },
  messageContent: {
    flex: 1,
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
  boldText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  bulletLine: {
    flexDirection: 'row',
    marginTop: 2,
  },
  bulletDot: {
    flex: 0,
    marginRight: 8,
  },
  bulletTextContent: {
    flex: 1,
  },
  blankLine: {
    height: 8,
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
