import { BACKEND_BASE_URL } from './backendConfig';

const CATALOG_BOOKS_ENDPOINT = `${BACKEND_BASE_URL}/api/catalog/books`;

// Look up the shared catalog record for a book by title (case-insensitive,
// exact match). This is a stand-in for real linking (ISBN / google_books_id)
// until the ingestion pipeline writes that association directly onto a
// user's library book — returns null if nothing matches or the book just
// hasn't been researched yet, which is a normal, expected outcome here.
export const loadCatalogBookByTitle = async title => {
  try {
    const response = await fetch(
      `${CATALOG_BOOKS_ENDPOINT}/by-title/${encodeURIComponent(title)}`
    );
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Backend API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error loading catalog book:', error);
    return null;
  }
};

// Adaptations, articles, podcasts, etc. for a catalog book, grouped by type.
export const loadRelatedContent = async catalogBookId => {
  try {
    const response = await fetch(`${CATALOG_BOOKS_ENDPOINT}/${catalogBookId}/related-content`);
    if (!response.ok) throw new Error(`Backend API error: ${response.status}`);
    const data = await response.json();
    return data.relatedContent || {};
  } catch (error) {
    console.error('Error loading related content:', error);
    return {};
  }
};
