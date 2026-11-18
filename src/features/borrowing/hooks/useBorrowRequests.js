import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for querying and managing borrowing requests and loan lifecycles from the storage adapter.
 * Uses monotonic request sequencing to prevent older asynchronous queries from overwriting newer state (B7).
 *
 * @param {object} adapter - Storage adapter instance
 * @returns {object} Hook state and mutation handlers
 */
export function useBorrowRequests(adapter) {
  const [requests, setRequests] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loansMap, setLoansMap] = useState(new Map());
  const [itemsMap, setItemsMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshCounter = useRef(0);

  const loadData = useCallback(async () => {
    if (!adapter) {
      setLoading(false);
      return;
    }

    const currentReqId = ++refreshCounter.current;
    setLoading(true);
    setError(null);

    try {
      const [fetchedRequests, fetchedItems, fetchedLoans] = await Promise.all([
        adapter.listBorrowRequests(),
        typeof adapter.listItems === 'function'
          ? adapter.listItems({ status: 'ALL' })
          : typeof adapter.getAllItems === 'function'
            ? adapter.getAllItems()
            : [],
        typeof adapter.listLoans === 'function' ? adapter.listLoans() : [],
      ]);

      // Guard against out-of-order resolution
      if (currentReqId !== refreshCounter.current) {
        return;
      }

      // Create item map for quick lookup
      const newItemsMap = new Map();
      for (const it of fetchedItems) {
        newItemsMap.set(it.id, it);
      }

      // Create loan map keyed by requestId
      const newLoansMap = new Map();
      for (const l of fetchedLoans) {
        newLoansMap.set(l.requestId, l);
      }

      // Sort requests descending by creation date
      const sortedRequests = [...fetchedRequests].sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      // Sort loans descending by creation date
      const sortedLoans = [...fetchedLoans].sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setRequests(sortedRequests);
      setLoans(sortedLoans);
      setLoansMap(newLoansMap);
      setItemsMap(newItemsMap);
    } catch (err) {
      if (currentReqId === refreshCounter.current) {
        setError(err.message || 'Failed to load borrowing records.');
      }
    } finally {
      if (currentReqId === refreshCounter.current) {
        setLoading(false);
      }
    }
  }, [adapter]);

  useEffect(() => {
    let isCancelled = false;
    const currentReqId = ++refreshCounter.current;

    async function fetchInitial() {
      if (!adapter) {
        setLoading(false);
        return;
      }
      try {
        const [fetchedRequests, fetchedItems, fetchedLoans] = await Promise.all([
          adapter.listBorrowRequests(),
          typeof adapter.listItems === 'function'
            ? adapter.listItems({ status: 'ALL' })
            : typeof adapter.getAllItems === 'function'
              ? adapter.getAllItems()
              : [],
          typeof adapter.listLoans === 'function' ? adapter.listLoans() : [],
        ]);

        if (isCancelled || currentReqId !== refreshCounter.current) return;

        const newItemsMap = new Map();
        for (const it of fetchedItems) {
          newItemsMap.set(it.id, it);
        }

        const newLoansMap = new Map();
        for (const l of fetchedLoans) {
          newLoansMap.set(l.requestId, l);
        }

        const sortedRequests = [...fetchedRequests].sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        const sortedLoans = [...fetchedLoans].sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        setRequests(sortedRequests);
        setLoans(sortedLoans);
        setLoansMap(newLoansMap);
        setItemsMap(newItemsMap);
        setError(null);
      } catch (err) {
        if (!isCancelled && currentReqId === refreshCounter.current) {
          setError(err.message || 'Failed to load borrowing records.');
        }
      } finally {
        if (!isCancelled && currentReqId === refreshCounter.current) {
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

  const recordCollectionHandover = useCallback(
    async (requestId, checkpoint) => {
      if (!adapter) return;
      const res = await adapter.recordCollectionHandover(requestId, checkpoint);
      await loadData();
      return res;
    },
    [adapter, loadData],
  );

  const confirmCollectionReceipt = useCallback(
    async (requestId, observation) => {
      if (!adapter) return;
      const res = await adapter.confirmCollectionReceipt(requestId, { observation });
      await loadData();
      return res;
    },
    [adapter, loadData],
  );

  const markLoanReturned = useCallback(
    async (requestId) => {
      if (!adapter) return;
      const res = await adapter.markLoanReturned(requestId);
      await loadData();
      return res;
    },
    [adapter, loadData],
  );

  const completeReturnInspection = useCallback(
    async (requestId, checkpoint) => {
      if (!adapter) return;
      const res = await adapter.completeReturnInspection(requestId, checkpoint);
      await loadData();
      return res;
    },
    [adapter, loadData],
  );

  const releaseUncollectedReservation = useCallback(
    async (requestId, releaseNote) => {
      if (!adapter) return;
      const res = await adapter.releaseUncollectedReservation(requestId, { releaseNote });
      await loadData();
      return res;
    },
    [adapter, loadData],
  );

  return {
    requests,
    loans,
    loansMap,
    itemsMap,
    loading,
    error,
    refresh: loadData,
    approveRequest,
    declineRequest,
    cancelRequest,
    recordCollectionHandover,
    confirmCollectionReceipt,
    markLoanReturned,
    completeReturnInspection,
    releaseUncollectedReservation,
  };
}

export default useBorrowRequests;
