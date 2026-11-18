import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { storageAdapter } from '../../../services/storage/IndexedDbStorageAdapter';
import { validateItemRecord, SCHEMA_VERSION } from '../validation/itemValidation';

/**
 * Custom hook providing reactive item listing state and transactional operations.
 * @param {import('../../../services/storage/StorageAdapter').StorageAdapter} [adapter] - Optional adapter override (for tests)
 */
export function useListings(adapter = storageAdapter) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshCounter = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++refreshCounter.current;
    setLoading(true);
    try {
      await adapter.initialize();
      const allItems = await adapter.listItems();
      if (requestId === refreshCounter.current) {
        setItems(allItems);
        setError(null);
      }
    } catch (err) {
      if (requestId === refreshCounter.current) {
        setError(err);
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
        const allItems = await adapter.listItems();
        if (!ignore) {
          setItems(allItems);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err);
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

  const activeItems = useMemo(
    () => items.filter((item) => item.status === 'ACTIVE'),
    [items],
  );

  const archivedItems = useMemo(
    () => items.filter((item) => item.status === 'ARCHIVED'),
    [items],
  );

  const stats = useMemo(() => {
    const total = items.length;
    const active = activeItems.length;
    const archived = archivedItems.length;
    const available = activeItems.filter((i) => i.availability === 'AVAILABLE').length;
    const unavailable = activeItems.filter((i) => i.availability === 'UNAVAILABLE').length;
    return { total, active, archived, available, unavailable };
  }, [items, activeItems, archivedItems]);

  const createListing = useCallback(
    async (rawItemData) => {
      const now = new Date().toISOString();
      const id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const candidate = {
        schemaVersion: SCHEMA_VERSION,
        id,
        title: (rawItemData.title || '').trim(),
        description: (rawItemData.description || '').trim(),
        category: rawItemData.category,
        conditionGrade: Number(rawItemData.conditionGrade),
        conditionNotes: (rawItemData.conditionNotes || '').trim(),
        approximateArea: (rawItemData.approximateArea || '').trim(),
        availability: rawItemData.availability || 'AVAILABLE',
        status: 'ACTIVE',
        photoAttestation: rawItemData.photoAttestation === true,
        photos: rawItemData.photos || [],
        createdAt: now,
        updatedAt: now,
      };

      const { isValid, errors } = validateItemRecord(candidate);
      if (!isValid) {
        const error = new Error('Validation failed');
        error.validationErrors = errors;
        throw error;
      }

      await adapter.createItem(candidate);
      await refresh();
      return candidate;
    },
    [adapter, refresh],
  );

  const updateListing = useCallback(
    async (id, updates) => {
      const existing = await adapter.getItemById(id);
      const now = new Date().toISOString();

      const candidate = {
        ...existing,
        ...updates,
        id, // immutable
        createdAt: existing.createdAt, // immutable
        updatedAt: now,
      };

      if (updates.conditionGrade !== undefined) {
        candidate.conditionGrade = Number(updates.conditionGrade);
      }
      if (updates.title !== undefined) candidate.title = updates.title.trim();
      if (updates.description !== undefined) candidate.description = updates.description.trim();
      if (updates.approximateArea !== undefined) candidate.approximateArea = updates.approximateArea.trim();
      if (updates.conditionNotes !== undefined) candidate.conditionNotes = updates.conditionNotes.trim();

      const { isValid, errors } = validateItemRecord(candidate);
      if (!isValid) {
        const error = new Error('Validation failed');
        error.validationErrors = errors;
        throw error;
      }

      const updated = await adapter.updateItem(candidate);
      await refresh();
      return updated;
    },
    [adapter, refresh],
  );

  const toggleAvailability = useCallback(
    async (id) => {
      const existing = await adapter.getItemById(id);
      const nextAvailability =
        existing.availability === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
      return updateListing(id, { availability: nextAvailability });
    },
    [adapter, updateListing],
  );

  const archiveListing = useCallback(
    async (id) => {
      const result = await adapter.archiveItem(id);
      await refresh();
      return result;
    },
    [adapter, refresh],
  );

  const restoreListing = useCallback(
    async (id) => {
      const result = await adapter.restoreItem(id);
      await refresh();
      return result;
    },
    [adapter, refresh],
  );

  const deleteListing = useCallback(
    async (id) => {
      const result = await adapter.deleteItem(id);
      await refresh();
      return result;
    },
    [adapter, refresh],
  );

  return {
    items,
    activeItems,
    archivedItems,
    stats,
    loading,
    error,
    refresh,
    createListing,
    updateListing,
    toggleAvailability,
    archiveListing,
    restoreListing,
    deleteListing,
  };
}
