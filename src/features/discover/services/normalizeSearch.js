/**
/**
 * Search text normalization and tokenization service for local item discovery.
 * Performs Unicode NFKC normalization, case-folding, and whitespace collapsing.
 */

/**
 * Normalizes a raw string for uniform substring and token matching.
 * @param {string} text - Raw input text
 * @returns {string} Normalized lowercase string
 */
export function normalizeSearchText(text) {
  if (typeof text !== 'string') return '';
  return text
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Splits a search query into distinct non-empty search tokens.
 * @param {string} query - Raw search query
 * @returns {Array<string>} Array of clean search tokens
 */
export function tokenizeQuery(query) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}
