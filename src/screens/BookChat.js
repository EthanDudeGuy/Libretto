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
import {
  updateBook,
  calculateProgress,
  loadMessages,
  saveMessage,
} from '../utils/BookStorage';
import SimpleBookImage from '../components/SimpleBookImage';
import AppHeader from '../components/AppHeader';
import { sendMessageToClaude, getCommunityResources } from '../services/ClaudeAPI';
import { loadCatalogBookByTitle, loadRelatedContent } from '../services/CatalogAPI';
import { loadBookInfo } from '../services/BookInfoAPI';
import { useAuth } from '../context/AuthContext';
import { handleAPIError, logError } from '../utils/ErrorHandler';
import ImageColors from 'react-native-image-colors';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const BANNER_HEIGHT = Math.max(160, WINDOW_HEIGHT * 0.2);

const TABS = [
  { key: 'information', label: 'Information' },
  { key: 'chat', label: 'Chat' },
  { key: 'community', label: 'Community' },
  { key: 'access', label: 'Access' },
  { key: 'reviews', label: 'Reviews' },
];

// Placeholder copy for tabs with no backing data/feature yet — shell only,
// content comes in a later pass.
const TAB_PLACEHOLDER_COPY = {
  access: {
    title: 'Access',
    body: 'Ways to read or buy this book will show up here.',
  },
  reviews: {
    title: 'Reviews',
    body: 'Reviews for this book will show up here.',
  },
};

// Information tab: narrative sections in display order, each keyed by its
// content_status field name and the matching field on the catalog book.
const NARRATIVE_SECTIONS = [
  { statusKey: 'how_it_was_written', field: 'howItWasWritten', title: 'How It Was Written' },
  {
    statusKey: 'historical_context',
    field: 'historicalContext',
    title: 'Historical & Cultural Context',
  },
  {
    statusKey: 'reception_and_legacy',
    field: 'receptionAndLegacy',
    title: 'Reception & Legacy',
  },
];

// Jump-to nav shown at the top of the Information tab, Wikipedia
// table-of-contents style — tapping one scrolls straight to that section.
const INFO_JUMP_NAV = [
  { key: 'synopsis', label: 'Synopsis' },
  { key: 'details', label: 'Details' },
  { key: 'how_it_was_written', label: 'How It Was Written' },
  { key: 'historical_context', label: 'Historical & Cultural Context' },
  { key: 'reception_and_legacy', label: 'Reception & Legacy' },
  { key: 'related', label: 'Related Content' },
];

const CONTENT_STATUS_META = {
  pending: { label: 'Not yet researched', color: theme.colors.textMuted },
  researching: { label: 'Researching…', color: theme.colors.warning },
  ready: { label: 'Ready', color: theme.colors.success },
};

// Related-content types grouped for display — adaptations surface first,
// per spec, then everything else grouped loosely by medium.
const RELATED_CONTENT_GROUPS = [
  {
    key: 'adaptations',
    label: 'Adaptations',
    icon: '🎬',
    types: ['adaptation_film', 'adaptation_tv', 'adaptation_stage'],
  },
  {
    key: 'watch',
    label: 'Documentaries & Video',
    icon: '📺',
    types: ['documentary', 'video'],
  },
  {
    key: 'read_listen',
    label: 'Articles & Podcasts',
    icon: '🎙️',
    types: ['podcast', 'article', 'essay', 'academic', 'interview'],
  },
];

function groupRelatedContent(relatedContent) {
  if (!relatedContent) return [];
  return RELATED_CONTENT_GROUPS.map(group => ({
    ...group,
    items: group.types.flatMap(type => relatedContent[type] || []),
  })).filter(group => group.items.length > 0);
}

// Star size for the rating row — tapping the left/right half of a star
// sets a half or whole rating (e.g. 3.5 vs 4).
const STAR_SIZE = 20;

// Reading status: a manually-set shelf, independent of page tracking. A
// freshly added book has no status until the reader picks one — it isn't
// implied by having a current page.
const STATUS_OPTIONS = [
  { value: null, key: 'none', label: 'No status' },
  { value: 'want_to_read', key: 'want_to_read', label: 'Want to Read' },
  { value: 'currently_reading', key: 'currently_reading', label: 'Currently Reading' },
  { value: 'read', key: 'read', label: 'Read' },
];

const getStatusOption = status =>
  STATUS_OPTIONS.find(option => option.value === (status || null)) || STATUS_OPTIONS[0];

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
    <View style={[styles.progressRingContainer, { width: size, height: size }]}>
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
      <Text style={styles.progressRingText}>{Math.round(clamped)}%</Text>
    </View>
  );
}

export default function BookChat({
  book,
  onBack,
  onNavigateHome,
  onNavigateSettings,
  onNavigateToLibrary,
  onSelectBook,
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentBook, setCurrentBook] = useState(book);
  const [activeTab, setActiveTab] = useState('information');
  const [backgroundColor, setBackgroundColor] = useState(theme.colors.surface);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  // status: 'idle' | 'loading' | 'success' | 'error'
  const [communityState, setCommunityState] = useState({
    status: 'idle',
    sources: [],
    error: null,
    bookId: null,
  });
  // status: 'idle' | 'loading' | 'success' | 'not_found'
  const [informationState, setInformationState] = useState({
    status: 'idle',
    bookInfo: null,
    catalogBook: null,
    relatedContent: {},
    bookId: null,
  });
  const [pageInput, setPageInput] = useState(String(book.currentPage || 1));
  const [pageUpdateStatus, setPageUpdateStatus] = useState('idle'); // idle | saving | error
  const [statusMenuLayout, setStatusMenuLayout] = useState(null);
  const statusPillRef = useRef(null);
  const scrollViewRef = useRef();
  const informationScrollRef = useRef();
  const infoSectionOffsets = useRef({});
  const { user } = useAuth();

  // Animation values
  const pageFadeAnim = useRef(new Animated.Value(0)).current;

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
    setPageInput(String(book.currentPage || 1));
  }, [book]);

  // Backfill startedAt for books added before reading-tracking existed, so
  // the History tab always has a start date to show instead of "unknown."
  useEffect(() => {
    if (currentBook.startedAt) return;
    const startedAt = new Date().toISOString();
    setCurrentBook(prev => ({ ...prev, startedAt }));
    updateBook(currentBook.id, { startedAt }).catch(error => {
      logError(error, 'Backfilling startedAt');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBook.id]);

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
          logError(error, 'Extracting cover colors');
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

  // Load this book's chat history on mount (and whenever the reader switches
  // to a different book — BookChat doesn't remount for that, just gets new
  // props). Only show the synthetic typed "welcome" opener when there's no
  // real history yet; once a book has an actual conversation, reopening it
  // should show that conversation, not a fresh greeting on top of it.
  useEffect(() => {
    let cancelled = false;

    const initializeMessages = async () => {
      const history = await loadMessages(currentBook.id);
      if (cancelled) return;

      if (history.length > 0) {
        setMessages(history);
        return;
      }

      const initialMessage = buildWelcomeMessage();

      setMessages([
        {
          id: 'welcome',
          text: initialMessage,
          isUser: false,
          timestamp: new Date(),
          isWelcomeMessage: true,
        },
      ]);
    };

    initializeMessages();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBook.id]);

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

  // Fire-and-forget: a failed save shouldn't block the chat UI, just get logged.
  const persistMessage = message => {
    saveMessage(currentBook.id, user?.id, message).catch(error => {
      logError(error, 'Saving message');
    });
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
    persistMessage(userMessage);
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
      persistMessage(aiResponse);
    } catch (error) {
      // generateAIResponse already catches its own errors, so this is a
      // last-resort net for something truly unexpected.
      logError(error, 'AI Response Generation (outer)');

      const errorResponse = {
        id: (Date.now() + 1).toString(),
        text: 'Something went wrong on my end. Please try again.',
        isUser: false,
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorResponse]);
      persistMessage(errorResponse);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectStatus = async statusValue => {
    try {
      const updated = await updateBook(currentBook.id, { status: statusValue });
      setCurrentBook(updated);
      if (statusValue === 'currently_reading') {
        // Keep the menu open so the reader can drop straight into setting
        // their current page instead of having to reopen it.
        setPageInput(String(updated.currentPage || 1));
        setPageUpdateStatus('idle');
      } else {
        setShowStatusMenu(false);
      }
    } catch (error) {
      logError(error, 'Updating book status');
    }
  };

  const handleSetRating = async rating => {
    // Tapping the currently-set star again clears the rating.
    const newRating = currentBook.rating === rating ? null : rating;
    try {
      const updated = await updateBook(currentBook.id, { rating: newRating });
      setCurrentBook(updated);
    } catch (error) {
      logError(error, 'Updating book rating');
    }
  };

  const handleUpdateCurrentPage = async () => {
    const newPage = parseInt(pageInput, 10);
    const totalPages = currentBook.totalPages;

    if (!Number.isFinite(newPage) || newPage < 1 || (totalPages && newPage > totalPages)) {
      setPageUpdateStatus('error');
      return;
    }

    setPageUpdateStatus('saving');
    try {
      const updated = await updateBook(currentBook.id, { currentPage: newPage });
      setCurrentBook(updated);
      setPageInput(String(updated.currentPage));
      setPageUpdateStatus('idle');
      setShowStatusMenu(false);
    } catch (error) {
      logError(error, 'Updating current page');
      setPageUpdateStatus('error');
    }
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

  const loadInformation = async () => {
    setInformationState({
      status: 'loading',
      bookInfo: null,
      catalogBook: null,
      relatedContent: {},
      bookId: currentBook.id,
    });
    // Published facts come from Google Books / Open Library (cached); the
    // catalog only adds its stored narrative sections and related content.
    const [bookInfo, catalogBook] = await Promise.all([
      loadBookInfo(currentBook),
      loadCatalogBookByTitle(currentBook.title),
    ]);
    if (!bookInfo && !catalogBook) {
      setInformationState({
        status: 'not_found',
        bookInfo: null,
        catalogBook: null,
        relatedContent: {},
        bookId: currentBook.id,
      });
      return;
    }
    const relatedContent = catalogBook ? await loadRelatedContent(catalogBook.id) : {};
    setInformationState({
      status: 'success',
      bookInfo,
      catalogBook,
      relatedContent,
      bookId: currentBook.id,
    });
  };

  // Same once-per-book pattern as Community: the Information tab reads from
  // book APIs and the catalog, never triggers an LLM call itself.
  useEffect(() => {
    if (activeTab !== 'information') return;
    if (informationState.bookId === currentBook.id && informationState.status !== 'idle') return;
    loadInformation();
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
            </Text>
          ) : (
            renderFormattedText(message.text, [styles.messageText, styles.aiText])
          )}
        </View>
      </View>
    </View>
  );

  // Records each section's vertical offset as it lays out, so the jump nav
  // can scroll straight to it — the Information tab's table of contents.
  const registerInfoSection = key => event => {
    infoSectionOffsets.current[key] = event.nativeEvent.layout.y;
  };

  const scrollToInfoSection = key => {
    const y = infoSectionOffsets.current[key];
    if (typeof y === 'number') {
      informationScrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
    }
  };

  // One narrative section of the Information tab (How It Was Written, etc.)
  // — hidden entirely unless there's real content for it.
  // Headers use a bottom rule (Wikipedia's h2 treatment) so sections read as
  // distinct entries in one continuous article rather than separate cards.
  const renderNarrativeSection = (sectionKey, title, content, status) => {
    if (!content?.summary) return null;
    const statusMeta = CONTENT_STATUS_META[status] || CONTENT_STATUS_META.pending;
    return (
      <View key={sectionKey} style={styles.infoSectionBlock} onLayout={registerInfoSection(sectionKey)}>
        <View style={styles.infoSectionHeaderRow}>
          <Text style={styles.infoSectionTitle}>{title}</Text>
          {status !== 'ready' && (
            <Text style={[styles.infoSectionStatus, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
          )}
        </View>
        <Text style={styles.infoSectionBody}>{content.summary}</Text>
        {content.sources?.length > 0 && (
          <View style={styles.sourceList}>
            <Text style={styles.sourceListLabel}>References</Text>
            {content.sources.map((source, index) => (
              <TouchableOpacity
                key={`${source.url}-${index}`}
                onPress={() => source.url && Linking.openURL(source.url)}
                activeOpacity={0.7}
                style={styles.sourceLinkRow}
              >
                <Text style={styles.sourceLinkIndex}>{index + 1}.</Text>
                <Text style={styles.sourceLink} numberOfLines={1}>
                  {source.title}
                  {source.publisher ? ` — ${source.publisher}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Information tab facts: book-API data first, catalog as the fallback.
  // Every field may be empty — rows and sections only render when present.
  const infoFacts = (() => {
    const info = informationState.bookInfo || {};
    const catalog = informationState.catalogBook || {};
    const catalogSeries = catalog.series
      ? `${catalog.series.name}${
          catalog.seriesPosition && catalog.series.bookIds?.length
            ? ` (Book ${catalog.seriesPosition} of ${catalog.series.bookIds.length})`
            : ''
        }`
      : null;
    return {
      synopsis: info.description || catalog.synopsis?.summary || null,
      author: info.authors?.length ? info.authors.join(', ') : catalog.author?.name || null,
      series: catalogSeries || info.series || null,
      publicationDate: info.publicationDate || catalog.publicationDate || null,
      publisher: info.publisher || null,
      isbn: info.isbn || null,
      pageCount: info.pageCount || null,
      originalLanguage: catalog.originalLanguage || null,
      genres: info.genres?.length ? info.genres : catalog.genres || [],
    };
  })();

  // Remaining reading time, replacing the old flat "Progress: X% Complete"
  // sidebar row — paired with the radial ring instead of repeating the
  // percentage the ring already shows.
  const readingTimeLabel = (() => {
    if (!currentBook.totalPages) return 'Reading time unknown';
    const remainingPages = Math.max(currentBook.totalPages - (currentBook.currentPage || 0), 0);
    if (remainingPages <= 0) return 'Done';
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
  const groupedRelatedContent = groupRelatedContent(informationState.relatedContent);

  // Jump nav only lists sections that will actually render.
  const narrativeSections = NARRATIVE_SECTIONS.filter(
    section => informationState.catalogBook?.[section.field]?.summary
  );
  const infoJumpNav = INFO_JUMP_NAV.filter(item => {
    if (item.key === 'synopsis') return !!infoFacts.synopsis;
    if (item.key === 'details') return true;
    if (item.key === 'related') return groupedRelatedContent.length > 0;
    return narrativeSections.some(section => section.statusKey === item.key);
  });

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
        onNavigateLibrary={onNavigateToLibrary}
        onBack={onBack}
      />

      {/* Rendered as a top-level sibling (not nested inside pageContent,
          which animates `opacity` and so creates its own stacking context)
          so the menu's zIndex isn't trapped below this backdrop. Position is
          measured from the status pill via measureInWindow, since the menu
          no longer lives next to its trigger in the tree. */}
      {showStatusMenu && statusMenuLayout && (
        <>
          <TouchableOpacity
            style={styles.statusMenuBackdrop}
            activeOpacity={1}
            onPress={() => setShowStatusMenu(false)}
          />
          <View
            style={[
              styles.statusMenu,
              {
                top: statusMenuLayout.top,
                left: statusMenuLayout.left,
                width: statusMenuLayout.width,
              },
            ]}
          >
            {STATUS_OPTIONS.map(option => {
              const isActive = (currentBook.status || null) === option.value;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={styles.statusOption}
                  onPress={() => handleSelectStatus(option.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      isActive && styles.statusOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isActive && <Text style={styles.statusCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}

            {currentBook.status === 'currently_reading' && (
              <>
                <View style={styles.statusMenuDivider} />

                <Text style={styles.ratingLabel}>Current page</Text>
                <View style={styles.statusMenuPageRow}>
                  <TextInput
                    style={styles.statusMenuPageInput}
                    value={pageInput}
                    onChangeText={text => {
                      setPageInput(text.replace(/[^0-9]/g, ''));
                      if (pageUpdateStatus === 'error') setPageUpdateStatus('idle');
                    }}
                    keyboardType='number-pad'
                    placeholder='Page'
                    placeholderTextColor={theme.colors.textMuted}
                    maxLength={6}
                    onSubmitEditing={handleUpdateCurrentPage}
                  />
                  <TouchableOpacity
                    style={[
                      styles.statusMenuPageButton,
                      pageUpdateStatus === 'saving' &&
                        styles.statusMenuPageButtonDisabled,
                    ]}
                    onPress={handleUpdateCurrentPage}
                    disabled={pageUpdateStatus === 'saving'}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.statusMenuPageButtonText}>
                      {pageUpdateStatus === 'saving' ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {pageUpdateStatus === 'error' && (
                  <Text style={styles.statusMenuPageError}>
                    Enter a page between 1 and {currentBook.totalPages || '?'}.
                  </Text>
                )}
              </>
            )}

            <View style={styles.statusMenuDivider} />

            <Text style={styles.ratingLabel}>
              Your rating{currentBook.rating ? ` · ${currentBook.rating}` : ''}
            </Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map(starIndex => {
                const fillRatio = Math.max(
                  0,
                  Math.min(1, (currentBook.rating || 0) - (starIndex - 1))
                );
                const setValue = value => {
                  handleSetRating(currentBook.rating === value ? null : value);
                };
                return (
                  <View key={starIndex} style={styles.starSlot}>
                    <Text style={styles.star}>★</Text>
                    {fillRatio > 0 && (
                      <View
                        style={[
                          styles.starFillMask,
                          { width: STAR_SIZE * fillRatio },
                        ]}
                      >
                        <Text style={[styles.star, styles.starFilled]}>★</Text>
                      </View>
                    )}
                    {/* Two stacked half-width touch targets — more reliable
                        than reading tap x-position off the press event. */}
                    <TouchableOpacity
                      style={styles.starHalfLeft}
                      activeOpacity={0.7}
                      hitSlop={{ top: 6, bottom: 6 }}
                      onPress={() => setValue(starIndex - 0.5)}
                    />
                    <TouchableOpacity
                      style={styles.starHalfRight}
                      activeOpacity={0.7}
                      hitSlop={{ top: 6, bottom: 6 }}
                      onPress={() => setValue(starIndex)}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}

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
        {/* Top Bar: Book Title/Author and Progress — always visible, sits on the banner */}
        <View style={styles.topBar}>
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
              <SimpleBookImage
                book={
                  !currentBook.thumbnail && informationState.bookInfo?.cover
                    ? { ...currentBook, thumbnail: informationState.bookInfo.cover }
                    : currentBook
                }
              />
            </View>

            {/* Reading status + rating — a manually-set shelf, shown right
                under the cover so it's the first thing you can act on. */}
            <View style={styles.statusSection}>
              <TouchableOpacity
                ref={statusPillRef}
                style={styles.statusPill}
                onPress={() => {
                  if (showStatusMenu) {
                    setShowStatusMenu(false);
                    return;
                  }
                  setPageInput(String(currentBook.currentPage || 1));
                  setPageUpdateStatus('idle');
                  statusPillRef.current?.measureInWindow((x, y, width, height) => {
                    setStatusMenuLayout({ top: y + height + 6, left: x, width });
                    setShowStatusMenu(true);
                  });
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.statusDot,
                    currentBook.status && styles.statusDotActive,
                  ]}
                />
                <Text style={styles.statusPillText}>
                  {getStatusOption(currentBook.status).label}
                </Text>
                <Text style={styles.statusChevron}>
                  {showStatusMenu ? '︿' : '﹀'}
                </Text>
              </TouchableOpacity>
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
                doesn't compete visually with the cover and progress. */}
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
            ) : activeTab === 'information' ? (
              <View style={styles.informationContainer}>
                {informationState.status === 'loading' ? (
                  <View style={styles.communityStatusContainer}>
                    <ActivityIndicator color={theme.colors.orange} size='small' />
                    <Text style={styles.communityStatusText}>Loading information...</Text>
                  </View>
                ) : informationState.status === 'not_found' ? (
                  <View style={styles.communityStatusContainer}>
                    <Text style={styles.communityStatusTitle}>Nothing here yet</Text>
                    <Text style={styles.communityStatusText}>
                      We couldn't find published details for "{currentBook.title}".
                    </Text>
                  </View>
                ) : informationState.status === 'success' ? (
                  <>
                    {/* Jump nav — Wikipedia-style table of contents for this article */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.infoJumpNav}
                      contentContainerStyle={styles.infoJumpNavContent}
                    >
                      {infoJumpNav.map(item => (
                        <TouchableOpacity
                          key={item.key}
                          style={styles.infoJumpNavPill}
                          onPress={() => scrollToInfoSection(item.key)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.infoJumpNavPillText}>{item.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <ScrollView
                      ref={informationScrollRef}
                      contentContainerStyle={styles.informationContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {/* Hero row: lead paragraph on the left, quick-facts infobox
                          docked to the right — wraps to a stacked layout on narrow
                          screens since the two columns simply flow with flexWrap. */}
                      <View style={styles.infoHeroRow}>
                        {/* Synopsis — the article's lead paragraph, unboxed and set
                            larger than the sections below it */}
                        {infoFacts.synopsis && (
                          <View
                            style={styles.infoLeadBlock}
                            onLayout={registerInfoSection('synopsis')}
                          >
                            <Text style={styles.infoLeadText}>{infoFacts.synopsis}</Text>
                          </View>
                        )}

                        {/* Details — an infobox in the Wikipedia sense: a compact,
                            docked table of quick facts set apart from the prose */}
                        <View
                          style={styles.infoBox}
                          onLayout={registerInfoSection('details')}
                        >
                          <Text style={styles.infoBoxEyebrow}>Quick Facts</Text>
                          {[
                            { label: 'Author', value: infoFacts.author },
                            { label: 'Series', value: infoFacts.series },
                            { label: 'Published', value: infoFacts.publicationDate },
                            { label: 'Publisher', value: infoFacts.publisher },
                            { label: 'Pages', value: infoFacts.pageCount && String(infoFacts.pageCount) },
                            { label: 'ISBN', value: infoFacts.isbn },
                            { label: 'Original language', value: infoFacts.originalLanguage },
                          ]
                            .filter(row => row.value)
                            .map((row, index) => (
                              <View
                                key={row.label}
                                style={[
                                  styles.pubFactRow,
                                  styles.pubFactRowBordered,
                                  index === 0 && styles.pubFactRowFirst,
                                ]}
                              >
                                <Text style={styles.pubFactLabel}>{row.label}</Text>
                                <Text style={styles.pubFactValue}>{row.value}</Text>
                              </View>
                            ))}
                          {infoFacts.genres.length > 0 && (
                            <View style={styles.genreChipRow}>
                              {infoFacts.genres.map(genre => (
                                <View key={genre} style={styles.genreChip}>
                                  <Text style={styles.genreChipText}>{genre}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>

                      {/* How It Was Written / Historical Context / Reception & Legacy */}
                      {narrativeSections.map(section =>
                        renderNarrativeSection(
                          section.statusKey,
                          section.title,
                          informationState.catalogBook[section.field],
                          (informationState.catalogBook.contentStatus || {})[section.statusKey]
                        )
                      )}

                      {/* Related Content — visually separated from the narrative sections above */}
                      {groupedRelatedContent.length > 0 && (
                        <View
                          style={styles.relatedContentSection}
                          onLayout={registerInfoSection('related')}
                        >
                        <Text style={styles.relatedContentHeader}>Related Content</Text>
                        {groupedRelatedContent.map(group => (
                          <View key={group.key} style={styles.communityCategoryBlock}>
                            <Text style={styles.communityCategoryHeader}>
                              {group.icon} {group.label}
                            </Text>
                            {group.items.map(item => (
                              <TouchableOpacity
                                key={item.id}
                                style={styles.communityCard}
                                onPress={() => item.url && Linking.openURL(item.url)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.communityName} numberOfLines={1}>
                                  {item.title}
                                </Text>
                                {item.description && (
                                  <Text style={styles.communityDescription}>
                                    {item.description}
                                  </Text>
                                )}
                                <Text style={styles.communityCta}>
                                  {[item.source, item.publicationDate].filter(Boolean).join(' · ')}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ))}
                        </View>
                      )}

                    </ScrollView>
                  </>
                ) : (
                  <View style={styles.communityStatusContainer}>
                    <ActivityIndicator color={theme.colors.orange} size='small' />
                  </View>
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
                      <View style={styles.aiLogoContainer}>
                        <Image
                          source={require('../../assets/duckbill.png')}
                          style={styles.aiLogo}
                          resizeMode='contain'
                        />
                      </View>
                      <View style={styles.typingContainer}>
                        <Text style={styles.typingText}>
                          Waddle is thinking
                        </Text>
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
  progressRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingText: {
    position: 'absolute',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.textPrimary,
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
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingLeft: 18,
    paddingRight: 18,
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
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 0,
  },
  // Left Column Styles
  leftColumn: {
    width: 180,
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
  statusSection: {
    marginBottom: 10,
  },
  statusMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 4,
    backgroundColor: theme.colors.textMuted,
  },
  statusDotActive: {
    backgroundColor: theme.colors.orange,
  },
  statusPillText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.textPrimary,
    lineHeight: 16,
  },
  statusChevron: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  statusMenu: {
    position: 'absolute',
    zIndex: 1001,
    ...theme.components.dropdown.card,
    ...theme.components.dropdown.card.shadow,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.components.dropdown.item,
  },
  statusOptionText: {
    ...theme.components.dropdown.itemText,
    color: theme.colors.textSecondary,
  },
  statusOptionTextActive: {
    color: theme.colors.orange,
    fontFamily: 'Inter_600SemiBold',
  },
  statusCheck: {
    fontSize: 13,
    color: theme.colors.orange,
    fontFamily: 'Inter_600SemiBold',
  },
  statusMenuDivider: {
    height: StyleSheet.hairlineWidth,
    ...theme.components.dropdown.divider,
  },
  ratingLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(201, 209, 217, 0.85)',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  star: {
    fontSize: 20,
    color: theme.colors.borderStrong,
  },
  starFilled: {
    color: theme.colors.orange,
  },
  starSlot: {
    width: STAR_SIZE,
    height: 22,
    justifyContent: 'center',
    position: 'relative',
  },
  starFillMask: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    overflow: 'hidden',
  },
  starHalfLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: STAR_SIZE / 2,
  },
  starHalfRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: STAR_SIZE / 2,
  },
  statusMenuPageRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  statusMenuPageInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    outlineStyle: 'none',
  },
  statusMenuPageButton: {
    flexShrink: 0,
    backgroundColor: theme.colors.orange,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  statusMenuPageButtonDisabled: {
    opacity: 0.6,
  },
  statusMenuPageButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  statusMenuPageError: {
    paddingHorizontal: 8,
    marginTop: 2,
    marginBottom: 4,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: theme.colors.danger,
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
  informationContainer: {
    flex: 1,
    position: 'relative',
    minHeight: 400,
  },
  infoJumpNav: {
    flexGrow: 0,
    flexShrink: 0,
    height: 46,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  infoJumpNavContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  infoJumpNavPill: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  infoJumpNavPillText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.textSecondary,
  },
  informationContent: {
    padding: 20,
    gap: 4,
    width: '100%',
  },
  infoHeroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    marginBottom: 26,
    width: '100%',
  },
  infoLeadBlock: {
    flex: 1,
    flexBasis: 260,
    minWidth: 0,
  },
  infoLeadText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: theme.colors.textPrimary,
    lineHeight: 25,
  },
  infoBox: {
    width: 260,
    flexShrink: 0,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 14,
    padding: 16,
  },
  infoBoxEyebrow: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  infoSectionBlock: {
    marginBottom: 26,
  },
  infoSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.textPrimary,
  },
  infoSectionStatus: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  infoSectionBody: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  infoSectionEmptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    color: theme.colors.textMuted,
  },
  sourceList: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    gap: 5,
  },
  sourceListLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sourceLinkRow: {
    flexDirection: 'row',
    gap: 5,
  },
  sourceLinkIndex: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.textMuted,
  },
  sourceLink: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.sageLight,
  },
  pubFactRow: {
    flexDirection: 'column',
    paddingVertical: 8,
    gap: 2,
  },
  pubFactRowBordered: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  pubFactRowFirst: {
    borderTopWidth: 0,
    paddingTop: 2,
  },
  pubFactLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pubFactValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: theme.colors.textPrimary,
  },
  genreChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  genreChip: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  genreChipText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: theme.colors.textSecondary,
  },
  relatedContentSection: {
    marginTop: 6,
    marginBottom: 26,
  },
  relatedContentHeader: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.textPrimary,
    marginBottom: 14,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  pageUpdateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  pageUpdateInput: {
    width: 90,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  pageUpdateButton: {
    backgroundColor: theme.colors.orange,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  pageUpdateButtonDisabled: {
    opacity: 0.6,
  },
  pageUpdateButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  pageUpdateError: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: theme.colors.danger,
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
    backgroundColor: theme.colors.sage,
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
    backgroundColor: theme.colors.sage,
    width: 54,
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.sageMuted,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
