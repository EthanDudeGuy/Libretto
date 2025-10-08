// Google Books API Service
// Documentation: https://developers.google.com/books/docs/v1/using

const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1';

// You'll need to get an API key from Google Cloud Console
// https://console.cloud.google.com/apis/credentials
const API_KEY = 'AIzaSyB8GlhJOwWBCcX1HAvazOMCWzSGiZf9W6M';

class GoogleBooksAPI {
  constructor(apiKey = API_KEY) {
    this.apiKey = apiKey;
  }

  /**
   * Search for books using the Google Books API
   * @param {string} query - Search query (e.g., "Harry Potter", "intitle:1984", "inauthor:Stephen King")
   * @param {Object} options - Additional search options
   * @param {number} options.maxResults - Maximum number of results (default: 10, max: 40)
   * @param {number} options.startIndex - Starting index for pagination (default: 0)
   * @param {string} options.orderBy - Sort order: 'relevance' or 'newest' (default: 'relevance')
   * @param {string} options.filter - Filter results: 'partial', 'full', 'free-ebooks', 'paid-ebooks', 'ebooks'
   * @param {string} options.printType - Print type: 'all', 'books', 'magazines' (default: 'all')
   * @param {string} options.projection - Data projection: 'full', 'lite' (default: 'full')
   * @returns {Promise<Object>} Search results
   */
  async searchBooks(query, options = {}) {
    const {
      maxResults = 10,
      startIndex = 0,
      orderBy = 'relevance',
      filter = 'partial',
      printType = 'all',
      projection = 'full',
    } = options;

    const params = new URLSearchParams({
      q: query,
      key: this.apiKey,
      maxResults: maxResults.toString(),
      startIndex: startIndex.toString(),
      orderBy,
      filter,
      printType,
      projection,
    });

    try {
      const response = await fetch(
        `${GOOGLE_BOOKS_API_BASE}/volumes?${params}`
      );

      if (!response.ok) {
        throw new Error(
          `Google Books API error: ${response.status} ${response.statusText}`
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
   * Get detailed information about a specific book
   * @param {string} volumeId - The Google Books volume ID
   * @returns {Promise<Object>} Book details
   */
  async getBookDetails(volumeId) {
    try {
      const response = await fetch(
        `${GOOGLE_BOOKS_API_BASE}/volumes/${volumeId}?key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(
          `Google Books API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return this.formatBookDetails(data);
    } catch (error) {
      console.error('Error getting book details:', error);
      throw error;
    }
  }

  /**
   * Format search results to match your app's book structure
   * @param {Object} apiResponse - Raw API response
   * @returns {Object} Formatted results
   */
  formatSearchResults(apiResponse) {
    const books =
      apiResponse.items?.map(item => this.formatBookData(item)) || [];

    return {
      books,
      totalItems: apiResponse.totalItems || 0,
      hasMore: books.length > 0 && apiResponse.totalItems > books.length,
    };
  }

  /**
   * Format individual book data to match your app's structure
   * @param {Object} volume - Volume data from API
   * @returns {Object} Formatted book data
   */
  formatBookData(volume) {
    const volumeInfo = volume.volumeInfo || {};
    const accessInfo = volume.accessInfo || {};

    return {
      id: volume.id,
      title: volumeInfo.title || 'Unknown Title',
      author: volumeInfo.authors?.join(', ') || 'Unknown Author',
      description: volumeInfo.description || '',
      publishedDate: volumeInfo.publishedDate || '',
      publisher: volumeInfo.publisher || '',
      pageCount: volumeInfo.pageCount || 0,
      categories: volumeInfo.categories || [],
      language: volumeInfo.language || 'en',
      isbn: this.extractISBN(volumeInfo.industryIdentifiers),
      thumbnail:
        volumeInfo.imageLinks?.thumbnail ||
        volumeInfo.imageLinks?.smallThumbnail ||
        null,
      previewLink: volumeInfo.previewLink || null,
      infoLink: volumeInfo.infoLink || null,
      isAvailable: accessInfo.pdf?.isAvailable || false,
      // Additional fields for your app
      currentPage: 0,
      totalPages: volumeInfo.pageCount || 0,
      chapter: 1,
      progress: 0,
      pageChapter: 1,
    };
  }

  /**
   * Format detailed book information
   * @param {Object} volume - Volume data from API
   * @returns {Object} Formatted book details
   */
  formatBookDetails(volume) {
    return this.formatBookData(volume);
  }

  /**
   * Extract ISBN from industry identifiers
   * @param {Array} identifiers - Industry identifiers array
   * @returns {string} ISBN or null
   */
  extractISBN(identifiers) {
    if (!identifiers) return null;

    const isbn = identifiers.find(
      id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    );

    return isbn ? isbn.identifier : null;
  }

  /**
   * Search for books by title
   * @param {string} title - Book title
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchByTitle(title, options = {}) {
    return this.searchBooks(`intitle:${title}`, options);
  }

  /**
   * Search for books by author
   * @param {string} author - Author name
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchByAuthor(author, options = {}) {
    return this.searchBooks(`inauthor:${author}`, options);
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
   * Search for books by subject/category
   * @param {string} subject - Subject or category
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchBySubject(subject, options = {}) {
    return this.searchBooks(`subject:${subject}`, options);
  }
}

// Create a default instance
const googleBooksAPI = new GoogleBooksAPI();

export default googleBooksAPI;
export { GoogleBooksAPI };
