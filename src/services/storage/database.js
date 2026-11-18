import { DatabaseUnavailableError, StorageError } from './storageErrors';

export const DB_NAME = 'BorrowNest';
export const DB_VERSION = 1;
export const STORE_ITEMS = 'items';

/**
 * Opens or initializes the native BorrowNest IndexedDB instance.
 * @param {IDBFactory} [idbFactory] - Optional factory (defaults to window.indexedDB)
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

      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        const itemStore = db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
        itemStore.createIndex('status', 'status', { unique: false });
        itemStore.createIndex('category', 'category', { unique: false });
        itemStore.createIndex('createdAt', 'createdAt', { unique: false });
        itemStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(new StorageError(`Failed to open IndexedDB "${DB_NAME}": ${event.target.error?.message}`, event.target.error));
    };

    request.onblocked = () => {
      reject(new StorageError(`IndexedDB upgrade blocked by another open tab or session.`));
    };
  });
}
