// Open Library API Service
// Documentation: https://openlibrary.org/dev/docs/api/search

const OPEN_LIBRARY_BASE = 'https://openlibrary.org';

class OpenLibraryAPI {
  constructor() {
    this.baseUrl = OPEN_LIBRARY_BASE;
  }

  /**
   * Search for books using the Open Library Search API
   * @param {string} query - Search query
   * @param {Object} options - Additional search options
   * @param {number} options.limit - Maximum number of results (default: 10, max: 100)
   * @param {number} options.offset - Starting index for pagination (default: 0)
   * @param {string} options.sort - Sort order: 'relevance', 'new', 'old', 'random' (default: 'relevance')
   * @param {string} options.lang - Language preference (ISO 639-1 code, e.g., 'en', 'fr')
   * @param {Array} options.fields - Specific fields to return (default: common fields with page count)
   * @returns {Promise<Object>} Search results
   */
  async searchBooks(query, options = {}) {
    const {
      limit = 10,
      offset = 0,
      sort = 'relevance',
      lang = 'en',
      fields = [
        'key',
        'title',
        'author_name',
        'first_publish_year',
        'edition_count',
        'cover_i',
        'has_fulltext',
        'ia',
        'public_scan_b',
        'number_of_pages_median',
      ],
    } = options;

    // Build query parameters manually for better React Native compatibility
    const queryParams = [
      `q=${encodeURIComponent(query)}`,
      `limit=${limit}`,
      `offset=${offset}`,
      `lang=${lang}`,
      `fields=${fields.join(',')}`,
    ].join('&');

    try {
      const url = `${this.baseUrl}/search.json?${queryParams}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Open Library API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return this.formatSearchResults(data);
    } catch (error) {
      console.error('Error searching books:', error);
      throw error;
    }
  }

  /**
   * Search for books by title
   * @param {string} title - Book title
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchByTitle(title, options = {}) {
    return this.searchBooks(`title:${title}`, options);
  }

  /**
   * Search for books by author
   * @param {string} author - Author name
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchByAuthor(author, options = {}) {
    return this.searchBooks(`author:${author}`, options);
  }

  /**
   * Search for books by ISBN
   * @param {string} isbn - ISBN number
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchByISBN(isbn, options = {}) {
    return this.searchBooks(`isbn:${isbn}`, options);
  }

  /**
   * Search for books by subject
   * @param {string} subject - Subject or category
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchBySubject(subject, options = {}) {
    return this.searchBooks(`subject:${subject}`, options);
  }

  /**
   * Get detailed information about a specific work
   * @param {string} workKey - The Open Library work key (e.g., "OL27448W")
   * @returns {Promise<Object>} Work details
   */
  async getWorkDetails(workKey) {
    try {
      const response = await fetch(`${this.baseUrl}/works/${workKey}.json`);

      if (!response.ok) {
        throw new Error(
          `Open Library API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return this.formatWorkDetails(data);
    } catch (error) {
      console.error('Error getting work details:', error);
      throw error;
    }
  }

  /**
   * Get editions for a specific work
   * @param {string} workKey - The Open Library work key
   * @param {Object} options - Options for edition search
   * @returns {Promise<Object>} Editions data
   */
  async getWorkEditions(workKey, options = {}) {
    const { limit = 10, offset = 0 } = options;

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/works/${workKey}/editions.json?${params}`
      );

      if (!response.ok) {
        throw new Error(
          `Open Library API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return this.formatEditionsData(data);
    } catch (error) {
      console.error('Error getting work editions:', error);
      throw error;
    }
  }

  /**
   * Format search results to match your app's book structure
   * @param {Object} apiResponse - Raw API response
   * @returns {Object} Formatted results
   */
  formatSearchResults(apiResponse) {
    const books = apiResponse.docs?.map(doc => this.formatBookData(doc)) || [];

    return {
      books,
      totalItems: apiResponse.numFound || 0,
      hasMore:
        books.length > 0 &&
        apiResponse.numFound > books.length + (apiResponse.start || 0),
    };
  }

  /**
   * Format individual book data to match your app's structure
   * @param {Object} doc - Document data from API
   * @returns {Object} Formatted book data
   */
  formatBookData(doc) {
    return {
      id: doc.key?.replace('/works/', '') || doc.key,
      title: doc.title || 'Unknown Title',
      author: doc.author_name?.join(', ') || 'Unknown Author',
      description: '', // Open Library search doesn't include descriptions
      publishedDate: doc.first_publish_year?.toString() || '',
      publisher: doc.publisher?.[0] || '',
      pageCount: doc.number_of_pages_median || 0, // Use the median page count from Search API
      categories: doc.subject || [],
      language: doc.language?.[0] || 'en',
      isbn: this.extractISBN(doc.isbn),
      thumbnail: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : null,
      previewLink: doc.ia?.[0]
        ? `https://archive.org/details/${doc.ia[0]}`
        : null,
      infoLink: doc.key ? `https://openlibrary.org${doc.key}` : null,
      isAvailable: doc.has_fulltext || false,
      // Additional Open Library specific fields
      editionCount: doc.edition_count || 0,
      publicScan: doc.public_scan_b || false,
      iaIds: doc.ia || [],
      // Additional fields for your app
      currentPage: 0,
      totalPages: doc.number_of_pages_median || 0, // Use the median page count from Search API
      chapter: 1,
      progress: 0,
      pageChapter: 1,
      // Source identifier
      source: 'openlibrary',
    };
  }

  /**
   * Format work details
   * @param {Object} work - Work data from API
   * @returns {Object} Formatted work details
   */
  formatWorkDetails(work) {
    return {
      id: work.key?.replace('/works/', ''),
      title: work.title || 'Unknown Title',
      author:
        work.authors
          ?.map(author => author.author?.key?.replace('/authors/', ''))
          .join(', ') || 'Unknown Author',
      description: work.description || '',
      publishedDate: work.first_publish_date || '',
      subjects: work.subjects || [],
      // Additional work details
      covers: work.covers || [],
      links: work.links || [],
      source: 'openlibrary',
    };
  }

  /**
   * Format editions data
   * @param {Object} editionsResponse - Editions API response
   * @returns {Object} Formatted editions data
   */
  formatEditionsData(editionsResponse) {
    const editions =
      editionsResponse.entries?.map(edition => ({
        id: edition.key?.replace('/books/', ''),
        title: edition.title || 'Unknown Title',
        isbn: this.extractISBN(edition.isbn_13 || edition.isbn_10),
        publishDate: edition.publish_date || '',
        publisher: edition.publishers?.[0] || '',
        pageCount: edition.number_of_pages || 0,
        cover: edition.covers?.[0]
          ? `https://covers.openlibrary.org/b/id/${edition.covers[0]}-M.jpg`
          : null,
        language:
          edition.languages?.[0]?.key?.replace('/languages/', '') || 'en',
      })) || [];

    return {
      editions,
      totalItems: editionsResponse.size || 0,
    };
  }

  /**
   * Extract ISBN from various formats
   * @param {Array|string} isbnData - ISBN data from API
   * @returns {string} ISBN or null
   */
  extractISBN(isbnData) {
    if (!isbnData) return null;

    if (Array.isArray(isbnData)) {
      return isbnData[0] || null;
    }

    return isbnData;
  }

  /**
   * Get cover image URL
   * @param {number} coverId - Cover ID from Open Library
   * @param {string} size - Image size: 'S', 'M', 'L' (default: 'M')
   * @returns {string} Cover image URL
   */
  getCoverUrl(coverId, size = 'M') {
    if (!coverId) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
  }

  /**
   * Get author image URL
   * @param {string} authorKey - Author key from Open Library
   * @param {string} size - Image size: 'S', 'M', 'L' (default: 'M')
   * @returns {string} Author image URL
   */
  getAuthorImageUrl(authorKey, size = 'M') {
    if (!authorKey) return null;
    return `https://covers.openlibrary.org/a/olid/${authorKey}-${size}.jpg`;
  }
}

// Create a default instance
const openLibraryAPI = new OpenLibraryAPI();

// Test function to verify the API implementation
const testPageCountAPI = async () => {
  try {
    console.log('Testing Open Library Search API with Harry Potter...');
    const testUrl =
      'https://openlibrary.org/search.json?q=harry+potter&fields=title,author_name,number_of_pages_median&limit=5';
    console.log('API URL:', testUrl);

    const response = await fetch(testUrl);
    const data = await response.json();

    console.log('API Response:', data);

    if (data.docs && data.docs.length > 0) {
      const firstBook = data.docs[0];
      console.log('First book:', {
        title: firstBook.title,
        author: firstBook.author_name,
        pageCount: firstBook.number_of_pages_median,
      });
    }

    return data;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
};

export default openLibraryAPI;
export { OpenLibraryAPI, testPageCountAPI };
