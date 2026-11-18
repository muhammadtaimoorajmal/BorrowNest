import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for querying and managing borrowing requests from the storage adapter.
 *
 * @param {object} adapter - Storage adapter instance
 * @returns {object} Hook state and mutation handlers
 */
export function useBorrowRequests(adapter) {
  const [requests, setRequests] = useState([]);
  const [itemsMap, setItemsMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!adapter) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [fetchedRequests, fetchedItems] = await Promise.all([
        adapter.listBorrowRequests(),
        typeof adapter.listItems === 'function'
          ? adapter.listItems({ status: 'ALL' })
          : typeof adapter.getAllItems === 'function'
            ? adapter.getAllItems()
            : [],
      ]);

      // Create item map for quick lookup
      const newItemsMap = new Map();
      for (const it of fetchedItems) {
        newItemsMap.set(it.id, it);
      }

      // Sort requests descending by creation date
      const sortedRequests = [...fetchedRequests].sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setRequests(sortedRequests);
      setItemsMap(newItemsMap);
    } catch (err) {
      setError(err.message || 'Failed to load borrowing requests.');
    } finally {
      setLoading(false);
    }
  }, [adapter]);

  useEffect(() => {
    let isCancelled = false;

    async function fetchInitial() {
      if (!adapter) {
        setLoading(false);
        return;
      }
      try {
        const [fetchedRequests, fetchedItems] = await Promise.all([
          adapter.listBorrowRequests(),
          typeof adapter.listItems === 'function'
            ? adapter.listItems({ status: 'ALL' })
            : typeof adapter.getAllItems === 'function'
              ? adapter.getAllItems()
              : [],
        ]);

        if (isCancelled) return;

        const newItemsMap = new Map();
        for (const it of fetchedItems) {
          newItemsMap.set(it.id, it);
        }

        const sortedRequests = [...fetchedRequests].sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        setRequests(sortedRequests);
        setItemsMap(newItemsMap);
        setError(null);
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load borrowing requests.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchInitial();

    return () => {
      isCancelled = true;
    };
  }, [adapter]);

  const approveRequest = useCallback(
    async (requestId) => {
      if (!adapter) return;
      await adapter.approveBorrowRequest(requestId);
      await loadData();
    },
    [adapter, loadData],
  );

  const declineRequest = useCallback(
    async (requestId) => {
      if (!adapter) return;
      await adapter.declineBorrowRequest(requestId);
      await loadData();
    },
    [adapter, loadData],
  );

  const cancelRequest = useCallback(
    async (requestId) => {
      if (!adapter) return;
      await adapter.cancelBorrowRequest(requestId);
      await loadData();
    },
    [adapter, loadData],
  );

  return {
    requests,
    itemsMap,
    loading,
    error,
    refresh: loadData,
    approveRequest,
    declineRequest,
    cancelRequest,
  };
}

export default useBorrowRequests;
