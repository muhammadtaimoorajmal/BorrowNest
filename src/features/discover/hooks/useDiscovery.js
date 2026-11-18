import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { storageAdapter as defaultAdapter } from '../../../services/storage/IndexedDbStorageAdapter';
import { filterListings } from '../services/filterListings';

/**
 * Custom React hook for unified local item discovery and reactive filtering.
 * Adheres strictly to DR-01 (Unified Discovery) and local persistence guarantees.
 *
 * @param {object} [adapter=defaultAdapter] - Storage adapter instance
 * @returns {object} Discovery state and control handlers
 */
export function useDiscovery(adapter = defaultAdapter) {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [availableOnly, setAvailableOnly] = useState(false);

  const refreshCounter = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++refreshCounter.current;
    try {
      setLoading(true);
      await adapter.initialize();
      const records = await adapter.listItems();
      if (requestId === refreshCounter.current) {
        setAllItems(records || []);
        setError(null);
      }
    } catch (err) {
      if (requestId === refreshCounter.current) {
        setError(err.message || 'Failed to load local listings from database.');
      }
    } finally {
      if (requestId === refreshCounter.current) {
        setLoading(false);
      }
    }
  }, [adapter]);

  useEffect(() => {
    let ignore = false;

    async function loadInitial() {
      try {
        await adapter.initialize();
        const records = await adapter.listItems();
        if (!ignore) {
          setAllItems(records || []);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load local listings from database.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      ignore = true;
    };
  }, [adapter]);

  // Active (non-archived) listings in local library
  const activeItems = useMemo(() => {
    return allItems.filter((item) => item.status !== 'ARCHIVED');
  }, [allItems]);

  // Derived filtered items based on current active filters
  const filteredItems = useMemo(() => {
    return filterListings(activeItems, {
      searchQuery,
      category: selectedCategory,
      availableOnly,
    });
  }, [activeItems, searchQuery, selectedCategory, availableOnly]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchQuery.trim() !== '' ||
        (selectedCategory && selectedCategory !== 'ALL') ||
        availableOnly,
    );
  }, [searchQuery, selectedCategory, availableOnly]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setAvailableOnly(false);
  }, []);

  return {
    items: filteredItems,
    allActiveItems: activeItems,
    totalActiveCount: activeItems.length,
    resultCount: filteredItems.length,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    availableOnly,
    setAvailableOnly,
    hasActiveFilters,
    resetFilters,
    loading,
    error,
    refresh,
  };
}
