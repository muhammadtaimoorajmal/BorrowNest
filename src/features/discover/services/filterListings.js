import { normalizeSearchText, tokenizeQuery } from './normalizeSearch';
import { CATEGORIES, CONDITION_TIERS } from '../../listings/validation/itemValidation';

/**
 * Predicate-based item listing filter for local BorrowNest catalog discovery.
 * Strictly adheres to DR-01 (Unified Discovery) and local persistence guarantees.
 *
 * @param {Array<object>} items - List of item records from storage
 * @param {object} options
 * @param {string} [options.searchQuery=''] - User-entered search terms
 * @param {string} [options.category='ALL'] - Selected category ID or 'ALL'
 * @param {boolean} [options.availableOnly=false] - Whether to restrict to AVAILABLE items
 * @returns {Array<object>} Filtered array of active items
 */
export function filterListings(items, { searchQuery = '', category = 'ALL', availableOnly = false } = {}) {
  if (!Array.isArray(items)) return [];

  const tokens = tokenizeQuery(searchQuery);

  return items.filter((item) => {
    // 1. Never show archived items in Discover
    if (item.status === 'ARCHIVED') {
      return false;
    }

    // 2. Category filtering
    if (category && category !== 'ALL') {
      if (item.category !== category) {
        return false;
      }
    }

    // 3. Availability filtering
    if (availableOnly) {
      if (item.availability !== 'AVAILABLE') {
        return false;
      }
    }

    // 4. Keyword search matching across title, description, area, category, and condition
    if (tokens.length > 0) {
      const categoryLabel = CATEGORIES[item.category]?.label || '';
      const conditionLabel = CONDITION_TIERS[item.conditionGrade]?.label || '';
      const combinedSearchable = normalizeSearchText(
        `${item.title || ''} ${item.description || ''} ${item.approximateArea || ''} ${item.category || ''} ${categoryLabel} ${conditionLabel}`,
      );

      const matchesAllTokens = tokens.every((token) => combinedSearchable.includes(token));
      if (!matchesAllTokens) {
        return false;
      }
    }

    return true;
  });
}
