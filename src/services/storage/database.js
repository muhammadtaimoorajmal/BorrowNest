import { DatabaseUnavailableError, StorageError } from './storageErrors';

export const DB_NAME = 'BorrowNest';
export const DB_VERSION = 2;
export const STORE_ITEMS = 'items';
export const STORE_REQUESTS = 'borrowingRequests';

/**
 * Opens or initializes the native BorrowNest IndexedDB instance.
 * Supports safe non-destructive migration from version 1 to version 2.
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
