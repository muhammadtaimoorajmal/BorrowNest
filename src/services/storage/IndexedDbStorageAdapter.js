import { StorageAdapter } from './StorageAdapter';
import { openDatabase, STORE_ITEMS, STORE_REQUESTS } from './database';
import {
  StorageError,
  RecordNotFoundError,
  DuplicateKeyError,
  QuotaExceededError,
  ReservationConflictError,
  InvalidStateTransitionError,
  ItemUnavailableError,
  ItemHasRequestHistoryError,
  ItemHasActiveReservationError,
} from './storageErrors';
import {
  normalizeBorrowRequest,
  validateBorrowRequestPayload,
} from '../../features/borrowing/services/borrowRequestValidation';
import {
  findConflictingReservations,
} from '../../features/borrowing/services/dateRange';
import { REQUEST_STATUS } from '../../features/borrowing/constants/requestStatus';

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
    if (error instanceof StorageError) {
      return error;
    }
    if (error?.name === 'QuotaExceededError') {
      return new QuotaExceededError(undefined, error);
    }
    if (error?.name === 'ConstraintError') {
      return new DuplicateKeyError('duplicate', undefined, error);
    }
    return new StorageError(`${defaultMsg}: ${error?.message || error}`, error);
  }

  // ==========================================
  // Item Operations (Modules 03 & 04)
  // ==========================================

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

  async getAllItems() {
    return this.listItems();
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

  /**
   * Safely archives an item listing.
   * Protects active commitments: if the item has an APPROVED reservation, archiving is blocked.
   */
  async archiveItem(id) {
    if (!id) {
      throw new StorageError('archiveItem requires a valid ID');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS, STORE_REQUESTS], 'readwrite');
      const itemStore = tx.objectStore(STORE_ITEMS);
      const reqStore = tx.objectStore(STORE_REQUESTS);

      const itemReq = itemStore.get(id);
      itemReq.onsuccess = () => {
        if (!itemReq.result) {
          return reject(new RecordNotFoundError(id));
        }

        // Check for active or approved reservations
        const reqIndex = reqStore.index('itemId');
        const reqQuery = reqIndex.getAll(id);

        reqQuery.onsuccess = () => {
          const requests = reqQuery.result || [];
          const hasApproved = requests.some((r) => r.status === REQUEST_STATUS.APPROVED);
          if (hasApproved) {
            tx.abort();
            return reject(new ItemHasActiveReservationError(id));
          }

          const updated = {
            ...itemReq.result,
            status: 'ARCHIVED',
            updatedAt: new Date().toISOString(),
          };

          const putReq = itemStore.put(updated);
          putReq.onerror = (e) => {
            reject(this._handleError(e.target.error, `Failed to archive item "${id}"`));
          };
        };

        reqQuery.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to inspect item reservations for "${id}"`));
        };
      };

      itemReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to retrieve item "${id}"`));
      };

      tx.oncomplete = () => {
        resolve({ id, status: 'ARCHIVED' });
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target?.error || e, `Transaction failed archiving item "${id}"`));
      };
    });
  }

  async restoreItem(id) {
    return this.updateItem({ id, status: 'ACTIVE' });
  }

  /**
   * Safely deletes an item listing.
   * Relational integrity safeguard: items with associated borrowing request history CANNOT be deleted.
   */
  async deleteItem(id) {
    if (!id) {
      throw new StorageError('deleteItem requires a valid ID');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS, STORE_REQUESTS], 'readwrite');
      const itemStore = tx.objectStore(STORE_ITEMS);
      const reqStore = tx.objectStore(STORE_REQUESTS);

      const itemReq = itemStore.get(id);
      itemReq.onsuccess = () => {
        if (!itemReq.result) {
          return reject(new RecordNotFoundError(id));
        }

        // Verify absence of borrowing request history
        const reqIndex = reqStore.index('itemId');
        const reqQuery = reqIndex.count(id);

        reqQuery.onsuccess = () => {
          const count = reqQuery.result || 0;
          if (count > 0) {
            tx.abort();
            return reject(new ItemHasRequestHistoryError(id, count));
          }

          const delReq = itemStore.delete(id);
          delReq.onerror = (e) => {
            reject(this._handleError(e.target.error, `Failed to delete item "${id}"`));
          };
        };

        reqQuery.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to verify request history for item "${id}"`));
        };
      };

      itemReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to check item for deletion "${id}"`));
      };

      tx.oncomplete = () => {
        resolve({ id, deleted: true });
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target?.error || e, `Transaction failed deleting item "${id}"`));
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

  async replaceAllItems(items = []) {
    return this.replaceAllData({ items, requests: [] });
  }

  // ==========================================
  // Borrowing Request Operations (Module 05)
  // ==========================================

  /**
   * Creates and persists a new borrowing request record in IndexedDB.
   * Atomically verifies that the referenced item exists, is ACTIVE, is AVAILABLE,
   * and that candidate dates do not conflict with any existing APPROVED reservation.
   *
   * @param {object} requestData
   * @returns {Promise<object>} Persisted normalized request record
   */
  async createBorrowRequest(requestData) {
    const normalized = normalizeBorrowRequest(requestData);
    if (!normalized) {
      throw new StorageError('createBorrowRequest requires a valid request object');
    }

    const { isValid, errors } = validateBorrowRequestPayload(normalized);
    if (!isValid) {
      const errMsgs = Object.values(errors).join(' ');
      throw new StorageError(`Invalid request payload: ${errMsgs}`);
    }

    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS, STORE_REQUESTS], 'readwrite');
      const itemStore = tx.objectStore(STORE_ITEMS);
      const reqStore = tx.objectStore(STORE_REQUESTS);

      // 1. Verify item existence and availability
      const itemReq = itemStore.get(normalized.itemId);
      itemReq.onsuccess = () => {
        const item = itemReq.result;
        if (!item) {
          tx.abort();
          return reject(new RecordNotFoundError(normalized.itemId, `Target item "${normalized.itemId}" not found.`));
        }

        if (item.status !== 'ACTIVE') {
          tx.abort();
          return reject(new ItemUnavailableError(normalized.itemId, 'item is archived'));
        }

        if (item.availability !== 'AVAILABLE') {
          tx.abort();
          return reject(new ItemUnavailableError(normalized.itemId, 'item is not available for borrowing'));
        }

        // Attach item title snapshot if not already present
        if (!normalized.itemTitleSnapshot) {
          normalized.itemTitleSnapshot = item.title || '';
        }

        // 2. Check for conflicting APPROVED reservations for this item
        const reqIndex = reqStore.index('itemId');
        const listReq = reqIndex.getAll(normalized.itemId);

        listReq.onsuccess = () => {
          const existingRequests = listReq.result || [];
          const conflicts = findConflictingReservations(normalized, existingRequests);

          if (conflicts.length > 0) {
            tx.abort();
            return reject(new ReservationConflictError(conflicts));
          }

          // 3. Put normalized request record
          const addReq = reqStore.put(normalized);
          addReq.onerror = (e) => {
            reject(this._handleError(e.target.error, `Failed to persist borrowing request "${normalized.id}"`));
          };
        };

        listReq.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to query existing reservations for "${normalized.itemId}"`));
        };
      };

      itemReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to retrieve item "${normalized.itemId}"`));
      };

      tx.oncomplete = () => {
        resolve(normalized);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target?.error || e, `Transaction failed creating request "${normalized.id}"`));
      };
    });
  }

  async getBorrowRequestById(id) {
    if (!id) {
      throw new StorageError('getBorrowRequestById requires a valid ID');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REQUESTS, 'readonly');
      const store = tx.objectStore(STORE_REQUESTS);
      const request = store.get(id);

      request.onsuccess = () => {
        if (!request.result) {
          reject(new RecordNotFoundError(id, `Borrowing request "${id}" not found.`));
        } else {
          resolve(normalizeBorrowRequest(request.result));
        }
      };

      request.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to get borrowing request "${id}"`));
      };
    });
  }

  async listBorrowRequests(options = {}) {
    const db = await this._getDb();
    const { itemId, status } = options;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REQUESTS, 'readonly');
      const store = tx.objectStore(STORE_REQUESTS);

      let req;
      if (itemId) {
        const index = store.index('itemId');
        req = index.getAll(itemId);
      } else if (status) {
        const index = store.index('status');
        req = index.getAll(status);
      } else {
        req = store.getAll();
      }

      req.onsuccess = () => {
        let results = (req.result || []).map(normalizeBorrowRequest);

        // Secondary filtering if both options provided
        if (itemId && status) {
          results = results.filter((r) => r.status === status);
        }

        // Sort descending by createdAt
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };

      req.onerror = (e) => {
        reject(this._handleError(e.target.error, 'Failed to list borrowing requests'));
      };
    });
  }

  /**
   * Atomically approves a pending borrowing request.
   * Executes within a single 'readwrite' transaction covering both items and requests.
   * Enforces all approval-time invariants:
   * - Request is still PENDING
   * - Item is still ACTIVE and AVAILABLE
   * - Re-validates inclusive date range overlap against other APPROVED reservations
   * - Serializes competing approvals so only one can succeed
   */
  async approveBorrowRequest(id) {
    if (!id) {
      throw new StorageError('approveBorrowRequest requires a valid ID');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS, STORE_REQUESTS], 'readwrite');
      const itemStore = tx.objectStore(STORE_ITEMS);
      const reqStore = tx.objectStore(STORE_REQUESTS);
      let approvedRecord = null;

      // 1. Retrieve the target request
      const targetReq = reqStore.get(id);
      targetReq.onsuccess = () => {
        const request = targetReq.result;
        if (!request) {
          tx.abort();
          return reject(new RecordNotFoundError(id, `Borrowing request "${id}" not found.`));
        }

        if (request.status !== REQUEST_STATUS.PENDING) {
          tx.abort();
          return reject(new InvalidStateTransitionError(request.status, REQUEST_STATUS.APPROVED));
        }

        // 2. Retrieve linked item and verify state
        const itemReq = itemStore.get(request.itemId);
        itemReq.onsuccess = () => {
          const item = itemReq.result;
          if (!item) {
            tx.abort();
            return reject(new RecordNotFoundError(request.itemId, `Target item "${request.itemId}" not found.`));
          }

          if (item.status !== 'ACTIVE') {
            tx.abort();
            return reject(new ItemUnavailableError(request.itemId, 'item is archived'));
          }

          if (item.availability !== 'AVAILABLE') {
            tx.abort();
            return reject(new ItemUnavailableError(request.itemId, 'item is marked unavailable'));
          }

          // 3. Query all other requests for this item to re-verify schedule conflict
          const reqIndex = reqStore.index('itemId');
          const allReqs = reqIndex.getAll(request.itemId);

          allReqs.onsuccess = () => {
            const requests = allReqs.result || [];
            const conflicts = findConflictingReservations(request, requests, id);

            if (conflicts.length > 0) {
              tx.abort();
              return reject(new ReservationConflictError(conflicts));
            }

            // 4. Update request to APPROVED
            const now = new Date().toISOString();
            approvedRecord = normalizeBorrowRequest({
              ...request,
              status: REQUEST_STATUS.APPROVED,
              updatedAt: now,
              decidedAt: now,
              decisionAt: now,
            });

            const putReq = reqStore.put(approvedRecord);
            putReq.onerror = (e) => {
              reject(this._handleError(e.target.error, `Failed to update approved request "${id}"`));
            };
          };

          allReqs.onerror = (e) => {
            reject(this._handleError(e.target.error, `Failed to query existing requests for item "${request.itemId}"`));
          };
        };

        itemReq.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to retrieve item "${request.itemId}"`));
        };
      };

      targetReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to retrieve request "${id}"`));
      };

      tx.oncomplete = () => {
        resolve(approvedRecord);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target?.error || e, `Transaction failed approving request "${id}"`));
      };
    });
  }

  /**
   * Atomically declines a pending borrowing request (PENDING -> DECLINED).
   */
  async declineBorrowRequest(id) {
    if (!id) {
      throw new StorageError('declineBorrowRequest requires a valid ID');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REQUESTS, 'readwrite');
      const store = tx.objectStore(STORE_REQUESTS);
      let declinedRecord = null;

      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const request = getReq.result;
        if (!request) {
          tx.abort();
          return reject(new RecordNotFoundError(id, `Borrowing request "${id}" not found.`));
        }

        if (request.status !== REQUEST_STATUS.PENDING) {
          tx.abort();
          return reject(new InvalidStateTransitionError(request.status, REQUEST_STATUS.DECLINED));
        }

        const now = new Date().toISOString();
        declinedRecord = normalizeBorrowRequest({
          ...request,
          status: REQUEST_STATUS.DECLINED,
          updatedAt: now,
          decidedAt: now,
          decisionAt: now,
        });

        const putReq = store.put(declinedRecord);
        putReq.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to update declined request "${id}"`));
        };
      };

      getReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to retrieve request "${id}"`));
      };

      tx.oncomplete = () => {
        resolve(declinedRecord);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target?.error || e, `Transaction failed declining request "${id}"`));
      };
    });
  }

  /**
   * Atomically cancels a pending borrowing request (PENDING -> CANCELLED).
   */
  async cancelBorrowRequest(id) {
    if (!id) {
      throw new StorageError('cancelBorrowRequest requires a valid ID');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REQUESTS, 'readwrite');
      const store = tx.objectStore(STORE_REQUESTS);
      let cancelledRecord = null;

      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const request = getReq.result;
        if (!request) {
          tx.abort();
          return reject(new RecordNotFoundError(id, `Borrowing request "${id}" not found.`));
        }

        if (request.status !== REQUEST_STATUS.PENDING) {
          tx.abort();
          return reject(new InvalidStateTransitionError(request.status, REQUEST_STATUS.CANCELLED));
        }

        const now = new Date().toISOString();
        cancelledRecord = normalizeBorrowRequest({
          ...request,
          status: REQUEST_STATUS.CANCELLED,
          updatedAt: now,
        });

        const putReq = store.put(cancelledRecord);
        putReq.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to update cancelled request "${id}"`));
        };
      };

      getReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to retrieve request "${id}"`));
      };

      tx.oncomplete = () => {
        resolve(cancelledRecord);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target?.error || e, `Transaction failed cancelling request "${id}"`));
      };
    });
  }

  async countBorrowRequests(options = {}) {
    const db = await this._getDb();
    const { status } = options;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REQUESTS, 'readonly');
      const store = tx.objectStore(STORE_REQUESTS);

      let req;
      if (status) {
        const index = store.index('status');
        req = index.count(status);
      } else {
        req = store.count();
      }

      req.onsuccess = () => {
        resolve(req.result);
      };
      req.onerror = (e) => {
        reject(this._handleError(e.target.error, 'Failed to count borrowing requests'));
      };
    });
  }

  async clearAllBorrowRequests() {
    const db = await this._getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REQUESTS, 'readwrite');
      const store = tx.objectStore(STORE_REQUESTS);
      const req = store.clear();

      req.onerror = (e) => {
        reject(this._handleError(e.target.error, 'Failed to clear borrowing requests'));
      };

      tx.oncomplete = () => {
        resolve(true);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target.error, 'Transaction failed clearing borrowing requests'));
      };
    });
  }

  // ==========================================
  // Unified Backup / Restore Transactions (Module 05)
  // ==========================================

  /**
   * Atomically clears and replaces both items and borrowing requests within ONE single transaction.
   * On any failure or aborted operation, prior contents of both stores are completely preserved.
   */
  async replaceAllData({ items = [], requests = [] } = {}) {
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS, STORE_REQUESTS], 'readwrite');
      const itemStore = tx.objectStore(STORE_ITEMS);
      const reqStore = tx.objectStore(STORE_REQUESTS);

      // 1. Clear both stores
      itemStore.clear();
      reqStore.clear();

      // 2. Insert items
      let replacedItemsCount = 0;
      for (const item of items) {
        if (!item || !item.id) {
          tx.abort();
          return reject(new StorageError('Atomic replace rejected: item record is missing valid id'));
        }
        itemStore.put(item);
        replacedItemsCount++;
      }

      // 3. Insert requests
      let replacedRequestsCount = 0;
      for (const req of requests) {
        const normalized = normalizeBorrowRequest(req);
        if (!normalized || !normalized.id) {
          tx.abort();
          return reject(new StorageError('Atomic replace rejected: borrowing request record is missing valid id'));
        }
        reqStore.put(normalized);
        replacedRequestsCount++;
      }

      tx.oncomplete = () => {
        resolve({
          replacedCount: replacedItemsCount,
          replacedItemsCount,
          replacedRequestsCount,
        });
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target?.error || e, 'Atomic replace all data transaction failed'));
      };

      tx.onabort = () => {
        reject(new StorageError('Atomic replace transaction was aborted; prior database contents preserved'));
      };
    });
  }

  /**
   * Atomically merges imported items and borrowing requests into existing stores within ONE single transaction.
   * Preserves existing records by ID, adds novel records, validates referential integrity and schedule invariants.
   */
  async mergeAllData({ items = [], requests = [] } = {}) {
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS, STORE_REQUESTS], 'readwrite');
      const itemStore = tx.objectStore(STORE_ITEMS);
      const reqStore = tx.objectStore(STORE_REQUESTS);

      let addedItemsCount = 0;
      let skippedItemsCount = 0;
      let addedRequestsCount = 0;
      let skippedRequestsCount = 0;

      // 1. Retrieve all existing items and requests to perform in-transaction conflict checks
      const existingItemsReq = itemStore.getAll();
      existingItemsReq.onsuccess = () => {
        const existingItems = existingItemsReq.result || [];
        const existingItemIds = new Set(existingItems.map((i) => i.id));

        // Merge Items
        for (const item of items) {
          if (!item?.id) {
            tx.abort();
            return reject(new StorageError('Cannot merge item record missing id'));
          }
          if (existingItemIds.has(item.id)) {
            skippedItemsCount++;
          } else {
            itemStore.put(item);
            existingItemIds.add(item.id);
            addedItemsCount++;
          }
        }

        // Merge Requests
        const existingReqsReq = reqStore.getAll();
        existingReqsReq.onsuccess = () => {
          const existingRequests = existingReqsReq.result || [];
          const existingReqIds = new Set(existingRequests.map((r) => r.id));

          // Group existing approved requests by itemId for conflict checking
          const approvedByItem = new Map();
          for (const r of existingRequests) {
            if (r.status === REQUEST_STATUS.APPROVED) {
              const list = approvedByItem.get(r.itemId) || [];
              list.push(r);
              approvedByItem.set(r.itemId, list);
            }
          }

          for (const req of requests) {
            const normalized = normalizeBorrowRequest(req);
            if (!normalized?.id) {
              tx.abort();
              return reject(new StorageError('Cannot merge borrowing request record missing id'));
            }

            // Referential integrity check: referenced item must exist in resulting database
            if (!existingItemIds.has(normalized.itemId)) {
              tx.abort();
              return reject(new StorageError(`Cannot merge request "${normalized.id}": referenced item "${normalized.itemId}" does not exist.`));
            }

            if (existingReqIds.has(normalized.id)) {
              skippedRequestsCount++;
            } else {
              // If incoming request is APPROVED, verify it does not conflict with existing or previously merged approved requests
              if (normalized.status === REQUEST_STATUS.APPROVED) {
                const itemApproved = approvedByItem.get(normalized.itemId) || [];
                const conflicts = findConflictingReservations(normalized, itemApproved);
                if (conflicts.length > 0) {
                  tx.abort();
                  return reject(new ReservationConflictError(conflicts, `Cannot merge approved request "${normalized.id}": conflicts with an existing approved reservation.`));
                }
                itemApproved.push(normalized);
                approvedByItem.set(normalized.itemId, itemApproved);
              }

              reqStore.put(normalized);
              existingReqIds.add(normalized.id);
              addedRequestsCount++;
            }
          }
        };

        existingReqsReq.onerror = (e) => {
          reject(this._handleError(e.target.error, 'Failed to inspect existing requests during merge'));
        };
      };

      existingItemsReq.onerror = (e) => {
        reject(this._handleError(e.target.error, 'Failed to inspect existing items during merge'));
      };

      tx.oncomplete = () => {
        resolve({
          addedItemsCount,
          skippedItemsCount,
          addedRequestsCount,
          skippedRequestsCount,
        });
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target?.error || e, 'Merge all data transaction failed'));
      };

      tx.onabort = () => {
        reject(new StorageError('Merge all data transaction was aborted; database state preserved'));
      };
    });
  }
}

// Default singleton instance for browser application runtime
export const storageAdapter = new IndexedDbStorageAdapter();
