import AsyncStorage from '@react-native-async-storage/async-storage';
import openLibraryAPI from './OpenLibraryAPI';

// Book facts for the Information tab, pulled from public book APIs: Google
// Books first, Open Library as the fallback and to fill gaps Google leaves
// (notably series names, which Google doesn't return). Only real API data —
// any field the APIs don't have is simply left empty so the UI can hide it.

const GOOGLE_BOOKS_ENDPOINT = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_BASE = 'https://openlibrary.org';
const GOOGLE_BOOKS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

const CACHE_PREFIX = 'bookInfo:v1:';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Per-session cache of in-flight and finished lookups, keyed like the
// persistent cache, so reopening a book never refetches.
const memoryCache = new Map();

const normalize = value => (value || '').trim().toLowerCase();

const cacheKeyFor = book =>
  CACHE_PREFIX + (book.isbn ? normalize(book.isbn) : `${normalize(book.title)}|${normalize(book.author)}`);

// Google descriptions can contain light HTML (<p>, <br>, <i>) and entities.
const cleanDescription = text => {
  if (!text) return null;
  const cleaned = String(text)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
  return cleaned || null;
};

const uniqueStrings = values => [...new Set(values.map(v => v.trim()).filter(Boolean))];

// Prefer an exact (case-insensitive) title match, otherwise the top result.
const pickBestMatch = (items, title, getTitle) =>
  items.find(item => normalize(getTitle(item)) === normalize(title)) || items[0] || null;

const fetchJson = async url => {
  const response = await fetch(url);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Book API error: ${response.status}`);
  return response.json();
};

const fromGoogleBooks = async book => {
  const query = book.isbn
    ? `isbn:${book.isbn}`
    : [`intitle:"${book.title}"`, book.author && book.author !== 'Unknown Author' ? `inauthor:"${book.author}"` : null]
        .filter(Boolean)
        .join(' ');
  const params = [
    `q=${encodeURIComponent(query)}`,
    'maxResults=5',
    'printType=books',
    GOOGLE_BOOKS_API_KEY ? `key=${GOOGLE_BOOKS_API_KEY}` : null,
  ]
    .filter(Boolean)
    .join('&');

  const data = await fetchJson(`${GOOGLE_BOOKS_ENDPOINT}?${params}`);
  const item = pickBestMatch(data?.items || [], book.title, entry => entry.volumeInfo?.title);
  if (!item) return null;

  const info = item.volumeInfo || {};
  const identifiers = info.industryIdentifiers || [];
  const isbn =
    identifiers.find(id => id.type === 'ISBN_13')?.identifier ||
    identifiers.find(id => id.type === 'ISBN_10')?.identifier ||
    null;
  const thumbnail = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;

  return {
    title: info.subtitle ? `${info.title}: ${info.subtitle}` : info.title || null,
    authors: info.authors || [],
    publicationDate: info.publishedDate || null,
    publisher: info.publisher || null,
    description: cleanDescription(info.description),
    genres: uniqueStrings((info.categories || []).flatMap(category => category.split(' / '))),
    isbn,
    pageCount: info.pageCount || null,
    series: null,
    cover: thumbnail ? thumbnail.replace(/^http:/, 'https:').replace('&edge=curl', '') : null,
    language: info.language || null,
  };
};

// Open Library work descriptions are markdown: drop emphasis markers, keep
// link text, and cut the trailing "----" block of source links.
const cleanMarkdown = text =>
  text &&
  text
    .split(/\n-{3,}/)[0]
    .replace(/\[([^\]]+)\]\[\d+\]|\[([^\]]+)\]\([^)]*\)/g, '$1$2')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1');

const fromOpenLibrarySearch = async book => {
  const query = book.author && book.author !== 'Unknown Author' ? `${book.title} ${book.author}` : book.title;
  // `editions.*` asks Open Library for the single edition that best matches
  // the query and language, so ISBN and publisher describe one real edition
  // instead of an arbitrary mix across all of them.
  const fields = [
    'key',
    'title',
    'author_name',
    'first_publish_year',
    'cover_i',
    'number_of_pages_median',
    'subject',
    'editions',
    'editions.isbn',
    'editions.publisher',
  ].join(',');
  const data = await fetchJson(
    `${OPEN_LIBRARY_BASE}/search.json?q=${encodeURIComponent(query)}&limit=5&lang=en&fields=${fields}`
  );
  const match = pickBestMatch(data?.docs || [], book.title, entry => entry.title);
  if (!match) return null;
  const edition = match.editions?.docs?.[0] || {};

  let description = null;
  try {
    const work = await openLibraryAPI.getWorkDetails(match.key.replace('/works/', ''));
    description = cleanDescription(
      cleanMarkdown(typeof work.description === 'string' ? work.description : work.description?.value)
    );
  } catch {
    // Description is optional — the rest of the record is still useful.
  }

  return {
    title: match.title,
    authors: match.author_name || [],
    publicationDate: match.first_publish_year ? String(match.first_publish_year) : null,
    publisher: edition.publisher?.[0] || null,
    description,
    // Subjects include machine tags like "series:Harry_Potter" — skip those.
    genres: uniqueStrings((match.subject || []).filter(subject => !/[:_]/.test(subject))).slice(0, 5),
    isbn: edition.isbn?.find(isbn => isbn.length === 13) || edition.isbn?.[0] || null,
    pageCount: match.number_of_pages_median || null,
    series: null,
    cover: openLibraryAPI.getCoverUrl(match.cover_i, 'L'),
    language: null,
  };
};

// Open Library edition records carry series names and fill gaps in
// publisher/page count. Best effort only.
const fillFromOpenLibraryEdition = async info => {
  if (!info.isbn) return info;
  try {
    const edition = await fetchJson(`${OPEN_LIBRARY_BASE}/isbn/${info.isbn}.json`);
    if (!edition) return info;
    return {
      ...info,
      series: info.series || edition.series?.[0] || null,
      publisher: info.publisher || edition.publishers?.[0] || null,
      pageCount: info.pageCount || edition.number_of_pages || null,
    };
  } catch {
    return info;
  }
};

const readPersistentCache = async key => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { savedAt, data } = JSON.parse(raw);
    return Date.now() - savedAt < CACHE_TTL_MS ? data : null;
  } catch {
    return null;
  }
};

const writePersistentCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Caching is an optimization; a failed write just means a refetch later.
  }
};

const fetchBookInfo = async (book, key) => {
  const cached = await readPersistentCache(key);
  if (cached) return cached;

  let info = null;
  let googleFailed = false;
  try {
    info = await fromGoogleBooks(book);
  } catch (error) {
    googleFailed = true;
    console.warn('Google Books lookup failed, falling back to Open Library:', error.message);
  }
  if (!info) info = await fromOpenLibrarySearch(book);
  if (!info) return null;

  info = await fillFromOpenLibraryEdition(info);
  // If Google errored (e.g. rate-limited) rather than just not knowing the
  // book, keep the fallback for this session only so Google is retried later.
  if (!googleFailed) await writePersistentCache(key, info);
  return info;
};

// Real published details for a library book, or null if neither API knows
// it. Network failures resolve to null too, but aren't cached, so the next
// open retries.
export const loadBookInfo = book => {
  if (!book?.title) return Promise.resolve(null);
  const key = cacheKeyFor(book);
  if (memoryCache.has(key)) return memoryCache.get(key);

  const request = fetchBookInfo(book, key).catch(error => {
    console.error('Error loading book info:', error);
    memoryCache.delete(key);
    return null;
  });
  memoryCache.set(key, request);
  return request;
};
