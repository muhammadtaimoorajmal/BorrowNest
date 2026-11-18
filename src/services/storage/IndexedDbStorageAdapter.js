import { StorageAdapter } from './StorageAdapter';
import { openDatabase, STORE_ITEMS } from './database';
import {
  StorageError,
  RecordNotFoundError,
  DuplicateKeyError,
  QuotaExceededError,
} from './storageErrors';

export class IndexedDbStorageAdapter extends StorageAdapter {
  constructor(idbFactory = null, dbName = undefined) {
    super();
    this.idbFactory = idbFactory;
    this.dbName = dbName;
    this._db = null;
  }

  async initialize() {
    if (!this._db) {
      this._db = await openDatabase(this.idbFactory, this.dbName);
    }
    return this;
  }

  async _getDb() {
    if (!this._db) {
      await this.initialize();
    }
    return this._db;
  }

  _handleError(error, defaultMsg) {
    if (error?.name === 'QuotaExceededError') {
      return new QuotaExceededError(undefined, error);
    }
    if (error?.name === 'ConstraintError') {
      return new DuplicateKeyError('duplicate', undefined, error);
    }
    return new StorageError(`${defaultMsg}: ${error?.message || error}`, error);
  }

  async listItems(options = {}) {
    const db = await this._getDb();
    const { status } = options;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readonly');
      const store = tx.objectStore(STORE_ITEMS);

      let request;
      if (status) {
        const index = store.index('status');
        request = index.getAll(status);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const items = request.result || [];
        // Sort descending by createdAt
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(items);
      };

      request.onerror = (e) => {
        reject(this._handleError(e.target.error, 'Failed to list items'));
      };
    });
  }

  async getItemById(id) {
    if (!id) {
      throw new StorageError('getItemById requires a valid ID');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readonly');
      const store = tx.objectStore(STORE_ITEMS);
      const request = store.get(id);

      request.onsuccess = () => {
        if (!request.result) {
          reject(new RecordNotFoundError(id));
        } else {
          resolve(request.result);
        }
      };

      request.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to get item "${id}"`));
      };
    });
  }

  async createItem(item) {
    if (!item?.id) {
      throw new StorageError('createItem requires an item record with a valid id');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);

      // Check for duplicate key first
      const checkReq = store.get(item.id);
      checkReq.onsuccess = () => {
        if (checkReq.result) {
          return reject(new DuplicateKeyError(item.id));
        }

        const addReq = store.add(item);
        addReq.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to create item "${item.id}"`));
        };
      };

      checkReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to verify item id "${item.id}"`));
      };

      tx.oncomplete = () => {
        resolve(item);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target.error, `Transaction failed creating item "${item.id}"`));
      };
    });
  }

  async updateItem(item) {
    if (!item?.id) {
      throw new StorageError('updateItem requires an item record with a valid id');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);
      let updatedRecord = null;

      const checkReq = store.get(item.id);
      checkReq.onsuccess = () => {
        if (!checkReq.result) {
          return reject(new RecordNotFoundError(item.id));
        }

        updatedRecord = {
          ...checkReq.result,
          ...item,
          updatedAt: new Date().toISOString(),
        };

        const putReq = store.put(updatedRecord);
        putReq.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to update item "${item.id}"`));
        };
      };

      checkReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to retrieve existing item "${item.id}"`));
      };

      tx.oncomplete = () => {
        resolve(updatedRecord);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target.error, `Transaction failed updating item "${item.id}"`));
      };
    });
  }

  async archiveItem(id) {
    return this.updateItem({ id, status: 'ARCHIVED' });
  }

  async restoreItem(id) {
    return this.updateItem({ id, status: 'ACTIVE' });
  }

  async deleteItem(id) {
    if (!id) {
      throw new StorageError('deleteItem requires a valid ID');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);

      const checkReq = store.get(id);
      checkReq.onsuccess = () => {
        if (!checkReq.result) {
          return reject(new RecordNotFoundError(id));
        }

        const delReq = store.delete(id);
        delReq.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to delete item "${id}"`));
        };
      };

      checkReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to check item for deletion "${id}"`));
      };

      tx.oncomplete = () => {
        resolve({ id, deleted: true });
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target.error, `Transaction failed deleting item "${id}"`));
      };
    });
  }

  async countItems(options = {}) {
    const db = await this._getDb();
    const { status } = options;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readonly');
      const store = tx.objectStore(STORE_ITEMS);

      let request;
      if (status) {
        const index = store.index('status');
        request = index.count(status);
      } else {
        request = store.count();
      }

      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = (e) => {
        reject(this._handleError(e.target.error, 'Failed to count items'));
      };
    });
  }

  async clearAllItems() {
    const db = await this._getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);
      const req = store.clear();

      req.onerror = (e) => {
        reject(this._handleError(e.target.error, 'Failed to clear items'));
      };

      tx.oncomplete = () => {
        resolve(true);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target.error, 'Transaction failed clearing items'));
      };
    });
  }

  async bulkCreateItems(items = []) {
    if (!items.length) return { insertedCount: 0 };
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);

      let insertedCount = 0;
      for (const item of items) {
        store.put(item);
        insertedCount++;
      }

      tx.oncomplete = () => {
        resolve({ insertedCount });
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target.error, 'Bulk insert transaction failed'));
      };
    });
  }
}

// Default singleton instance for browser application runtime
export const storageAdapter = new IndexedDbStorageAdapter();
