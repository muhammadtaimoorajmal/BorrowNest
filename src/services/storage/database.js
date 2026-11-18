import { DatabaseUnavailableError, StorageError } from './storageErrors';

export const DB_NAME = 'BorrowNest';
export const DB_VERSION = 3;
export const STORE_ITEMS = 'items';
export const STORE_REQUESTS = 'borrowingRequests';
export const STORE_LOANS = 'loans';

/**
 * Opens or initializes the native BorrowNest IndexedDB instance.
 * Supports safe non-destructive migration across versions 1, 2, and 3.
 *
 * @param {IDBFactory} [idbFactory] - Optional factory (defaults to window.indexedDB)
 * @param {string} [dbName=DB_NAME] - Database name
 * @returns {Promise<IDBDatabase>}
 */
export function openDatabase(idbFactory, dbName = DB_NAME) {
  const factory = idbFactory || (typeof window !== 'undefined' ? window.indexedDB : null) || (typeof globalThis !== 'undefined' ? globalThis.indexedDB : null);
  return new Promise((resolve, reject) => {
    if (!factory) {
      return reject(new DatabaseUnavailableError());
    }

    const request = factory.open(dbName, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const tx = event.target.transaction;

      // 1. Ensure items store exists (Version 1 baseline)
      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        const itemStore = db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
        itemStore.createIndex('status', 'status', { unique: false });
        itemStore.createIndex('category', 'category', { unique: false });
        itemStore.createIndex('createdAt', 'createdAt', { unique: false });
        itemStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // 2. Ensure borrowingRequests store exists (Version 2 upgrade)
      if (!db.objectStoreNames.contains(STORE_REQUESTS)) {
        const reqStore = db.createObjectStore(STORE_REQUESTS, { keyPath: 'id' });
        reqStore.createIndex('itemId', 'itemId', { unique: false });
        reqStore.createIndex('status', 'status', { unique: false });
        reqStore.createIndex('startDate', 'startDate', { unique: false });
        reqStore.createIndex('endDate', 'endDate', { unique: false });
        reqStore.createIndex('collectionDate', 'collectionDate', { unique: false });
        reqStore.createIndex('returnDeadline', 'returnDeadline', { unique: false });
        reqStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 3. Ensure loans store exists (Version 3 upgrade - DR-04)
      if (!db.objectStoreNames.contains(STORE_LOANS)) {
        const loanStore = db.createObjectStore(STORE_LOANS, { keyPath: 'requestId' });
        loanStore.createIndex('itemId', 'itemId', { unique: false });
        loanStore.createIndex('status', 'status', { unique: false });
        loanStore.createIndex('collectionDate', 'collectionDate', { unique: false });
        loanStore.createIndex('returnDeadline', 'returnDeadline', { unique: false });
        loanStore.createIndex('createdAt', 'createdAt', { unique: false });
        loanStore.createIndex('collectedAt', 'collectedAt', { unique: false });
        loanStore.createIndex('completedAt', 'completedAt', { unique: false });

        // Non-destructive backfill for existing version 2 databases:
        // For every existing request with status === 'APPROVED', backfill exactly one RESERVED loan record.
        if (db.objectStoreNames.contains(STORE_REQUESTS)) {
          const reqStore = tx.objectStore(STORE_REQUESTS);
          const cursorReq = reqStore.openCursor();
          cursorReq.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
              const req = cursor.value;
              if (req && req.status === 'APPROVED') {
                const loan = {
                  schemaVersion: 1,
                  requestId: req.id,
                  itemId: req.itemId,
                  itemTitleSnapshot: req.itemTitleSnapshot || '',
                  borrowerAlias: req.borrowerAlias || req.requestedBy || '',
                  collectionDate: req.startDate || req.collectionDate || '',
                  returnDeadline: req.endDate || req.returnDeadline || '',
                  status: 'RESERVED',
                  reservedAt: req.decidedAt || req.decisionAt || req.updatedAt || req.createdAt || new Date().toISOString(),
                  collectedAt: null,
                  completedAt: null,
                  collectionCheckpoint: null,
                  returnCheckpoint: null,
                  resolution: null,
                  releasedAt: null,
                  releaseNote: '',
                  provenance: 'MIGRATED_APPROVED_REQUEST_V2',
                  createdAt: req.createdAt || new Date().toISOString(),
                  updatedAt: req.updatedAt || req.createdAt || new Date().toISOString(),
                };
                loanStore.put(loan);
              }
              cursor.continue();
            }
          };
        }
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      // Close database connection when an upgrade is requested elsewhere to prevent blocked transitions
      db.onversionchange = () => {
        db.close();
      };
      resolve(db);
    };

    request.onerror = (event) => {
      reject(new StorageError(`Failed to open IndexedDB "${dbName}": ${event.target.error?.message}`, event.target.error));
    };

    request.onblocked = () => {
      reject(new StorageError(`IndexedDB upgrade blocked by another open tab or session.`));
    };
  });
}
