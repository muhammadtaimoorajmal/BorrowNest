import { StorageAdapter } from './StorageAdapter';
import { openDatabase, STORE_ITEMS, STORE_REQUESTS, STORE_LOANS } from './database';
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
  LoanNotFoundError,
  LoanStateTransitionError,
  CollectionDateNotReachedError,
  ReservationExpiredError,
  CollectionAlreadyRecordedError,
  BorrowerReceiptRequiredError,
  ReturnNotMarkedError,
  ReturnInspectionRequiredError,
  LoanAlreadyCompletedError,
  UncollectedReleaseNotAllowedError,
  ConditionValidationError,
} from './storageErrors';
import {
  normalizeBorrowRequest,
  validateBorrowRequestPayload,
} from '../../features/borrowing/services/borrowRequestValidation';
import {
  findConflictingReservations,
  getLocalToday,
} from '../../features/borrowing/services/dateRange';
import { REQUEST_STATUS } from '../../features/borrowing/constants/requestStatus';
import {
  LOAN_STATUS,
} from '../../features/borrowing/constants/loanStatus';
import {
  normalizeLoanRecord,
} from '../../features/borrowing/services/loanValidation';
import {
  validateConditionCheckpoint,
} from '../../features/borrowing/services/conditionValidation';
import { CONDITION_TIERS } from '../../features/listings/validation/itemValidation';

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
      this._db.onversionchange = () => {
        if (this._db) {
          this._db.close();
          this._db = null;
        }
      };
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
   * Safely archives an item listing (DR-03 + DR-04).
   * Archiving is blocked while the item has an active reservation in RESERVED or ACTIVE status.
   * Archiving is permitted when all associated loans are COMPLETED or RELEASED_NOT_COLLECTED (or no loans exist).
   */
  async archiveItem(id) {
    if (!id) {
      throw new StorageError('archiveItem requires a valid ID');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS, STORE_LOANS], 'readwrite');
      const itemStore = tx.objectStore(STORE_ITEMS);
      const loanStore = tx.objectStore(STORE_LOANS);
      let updatedItem = null;

      const itemReq = itemStore.get(id);
      itemReq.onsuccess = () => {
        if (!itemReq.result) {
          tx.abort();
          return reject(new RecordNotFoundError(id));
        }

        // Check for active or reserved loans
        const loanIndex = loanStore.index('itemId');
        const loanQuery = loanIndex.getAll(id);

        loanQuery.onsuccess = () => {
          const loans = loanQuery.result || [];
          const hasActiveReservation = loans.some(
            (l) => l.status === LOAN_STATUS.RESERVED || l.status === LOAN_STATUS.ACTIVE,
          );
          if (hasActiveReservation) {
            tx.abort();
            return reject(new ItemHasActiveReservationError(id));
          }

          updatedItem = {
            ...itemReq.result,
            status: 'ARCHIVED',
            updatedAt: new Date().toISOString(),
          };

          const putReq = itemStore.put(updatedItem);
          putReq.onerror = (e) => {
            reject(this._handleError(e.target.error, `Failed to archive item "${id}"`));
          };
        };

        loanQuery.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to inspect item loans for "${id}"`));
        };
      };

      itemReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to retrieve item "${id}"`));
      };

      tx.oncomplete = () => {
        resolve(updatedItem);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target?.error || e, `Transaction failed archiving item "${id}"`));
      };
    });
  }

  async restoreItem(id) {
    if (!id) {
      throw new StorageError('restoreItem requires a valid ID');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);
      let updatedRecord = null;

      const checkReq = store.get(id);
      checkReq.onsuccess = () => {
        if (!checkReq.result) {
          return reject(new RecordNotFoundError(id));
        }

        updatedRecord = {
          ...checkReq.result,
          status: 'ACTIVE',
          updatedAt: new Date().toISOString(),
        };

        const putReq = store.put(updatedRecord);
        putReq.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to restore item "${id}"`));
        };
      };

      checkReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to retrieve existing item "${id}"`));
      };

      tx.oncomplete = () => {
        resolve(updatedRecord);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target.error, `Transaction failed restoring item "${id}"`));
      };
    });
  }

  /**
   * Safely deletes an item listing.
   * Enforces relational integrity: deletion is permanently BLOCKED if any borrowing request
   * or loan lifecycle record references the item.
   */
  async deleteItem(id) {
    if (!id) {
      throw new StorageError('deleteItem requires a valid ID');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS, STORE_REQUESTS, STORE_LOANS], 'readwrite');
      const itemStore = tx.objectStore(STORE_ITEMS);
      const reqStore = tx.objectStore(STORE_REQUESTS);
      const loanStore = tx.objectStore(STORE_LOANS);

      const itemReq = itemStore.get(id);
      itemReq.onsuccess = () => {
        if (!itemReq.result) {
          tx.abort();
          return reject(new RecordNotFoundError(id));
        }

        // Verify absence of borrowing request history
        const reqIndex = reqStore.index('itemId');
        const reqQuery = reqIndex.count(id);

        reqQuery.onsuccess = () => {
          const reqCount = reqQuery.result || 0;
          if (reqCount > 0) {
            tx.abort();
            return reject(new ItemHasRequestHistoryError(id, reqCount));
          }

          // Verify absence of loan history
          const loanIndex = loanStore.index('itemId');
          const loanQuery = loanIndex.count(id);

          loanQuery.onsuccess = () => {
            const loanCount = loanQuery.result || 0;
            if (loanCount > 0) {
              tx.abort();
              return reject(new ItemHasRequestHistoryError(id, loanCount));
            }

            const delReq = itemStore.delete(id);
            delReq.onerror = (e) => {
              reject(this._handleError(e.target.error, `Failed to delete item "${id}"`));
            };
          };

          loanQuery.onerror = (e) => {
            reject(this._handleError(e.target.error, `Failed to verify loan history for item "${id}"`));
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
    return this.replaceAllData({ items, requests: [], loans: [] });
  }

  // ==========================================
  // Borrowing Request Operations (Module 05)
  // ==========================================

  /**
   * Creates and persists a new borrowing request record in IndexedDB.
   * Atomically verifies that the referenced item exists, is ACTIVE, is AVAILABLE,
   * and that candidate dates do not conflict with any existing RESERVED or ACTIVE loan.
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
      const tx = db.transaction([STORE_ITEMS, STORE_REQUESTS, STORE_LOANS], 'readwrite');
      const itemStore = tx.objectStore(STORE_ITEMS);
      const reqStore = tx.objectStore(STORE_REQUESTS);
      const loanStore = tx.objectStore(STORE_LOANS);

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

        if (!normalized.itemTitleSnapshot) {
          normalized.itemTitleSnapshot = item.title || '';
        }

        // 2. Check for conflicting reservations in STORE_LOANS (and fallback to STORE_REQUESTS)
        const loanIndex = loanStore.index('itemId');
        const listLoansReq = loanIndex.getAll(normalized.itemId);

        listLoansReq.onsuccess = () => {
          const existingLoans = listLoansReq.result || [];
          const loanConflicts = findConflictingReservations(normalized, existingLoans);

          if (loanConflicts.length > 0) {
            tx.abort();
            return reject(new ReservationConflictError(loanConflicts));
          }

          // Also check requests in case of legacy records without loans
          const reqIndex = reqStore.index('itemId');
          const listReq = reqIndex.getAll(normalized.itemId);

          listReq.onsuccess = () => {
            const existingRequests = listReq.result || [];
            if (existingLoans.length === 0) {
              const conflicts = findConflictingReservations(normalized, existingRequests);
              if (conflicts.length > 0) {
                tx.abort();
                return reject(new ReservationConflictError(conflicts));
              }
            }

            // 3. Put normalized request record
            const addReq = reqStore.put(normalized);
            addReq.onerror = (e) => {
              reject(this._handleError(e.target.error, `Failed to persist borrowing request "${normalized.id}"`));
            };
          };

          listReq.onerror = (e) => {
            reject(this._handleError(e.target.error, `Failed to query existing requests for "${normalized.itemId}"`));
          };
        };

        listLoansReq.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to query existing loans for "${normalized.itemId}"`));
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
   * Atomically approves a pending borrowing request (DR-02 + DR-04).
   * Executes within a single 'readwrite' transaction covering items, requests, and loans.
   * Enforces all approval-time invariants:
   * - Request is still PENDING
   * - Item is still ACTIVE and AVAILABLE
   * - Re-validates inclusive date range overlap against RESERVED and ACTIVE loans
   * - Serializes competing approvals so only one can succeed
   * - Creates exactly one RESERVED loan lifecycle record in STORE_LOANS
   */
  async approveBorrowRequest(id) {
    if (!id) {
      throw new StorageError('approveBorrowRequest requires a valid ID');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS, STORE_REQUESTS, STORE_LOANS], 'readwrite');
      const itemStore = tx.objectStore(STORE_ITEMS);
      const reqStore = tx.objectStore(STORE_REQUESTS);
      const loanStore = tx.objectStore(STORE_LOANS);
      let approvedRecord = null;
      let createdLoan = null;

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

          // 3. Query all loans for this item to re-verify schedule conflict
          const loanIndex = loanStore.index('itemId');
          const allLoansReq = loanIndex.getAll(request.itemId);

          allLoansReq.onsuccess = () => {
            const existingLoans = allLoansReq.result || [];
            const loanConflicts = findConflictingReservations(request, existingLoans, id);

            if (loanConflicts.length > 0) {
              tx.abort();
              return reject(new ReservationConflictError(loanConflicts));
            }

            // Also check requests in case of legacy records without loans
            const reqIndex = reqStore.index('itemId');
            const allReqs = reqIndex.getAll(request.itemId);

            allReqs.onsuccess = () => {
              const requests = allReqs.result || [];
              if (existingLoans.length === 0) {
                const conflicts = findConflictingReservations(request, requests, id);
                if (conflicts.length > 0) {
                  tx.abort();
                  return reject(new ReservationConflictError(conflicts));
                }
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

              reqStore.put(approvedRecord);

              // 5. Create corresponding RESERVED loan lifecycle record (DR-04)
              createdLoan = normalizeLoanRecord({
                requestId: request.id,
                itemId: request.itemId,
                itemTitleSnapshot: request.itemTitleSnapshot || item.title || '',
                borrowerAlias: request.borrowerAlias || request.requestedBy || '',
                collectionDate: request.startDate || request.collectionDate,
                returnDeadline: request.endDate || request.returnDeadline,
                status: LOAN_STATUS.RESERVED,
                reservedAt: now,
                createdAt: now,
                updatedAt: now,
              });

              loanStore.put(createdLoan);
            };

            allReqs.onerror = (e) => {
              reject(this._handleError(e.target.error, `Failed to query existing requests for item "${request.itemId}"`));
            };
          };

          allLoansReq.onerror = (e) => {
            reject(this._handleError(e.target.error, `Failed to query existing loans for item "${request.itemId}"`));
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
        approvedRecord.loan = createdLoan;
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
      const tx = db.transaction([STORE_REQUESTS, STORE_LOANS], 'readwrite');
      const reqStore = tx.objectStore(STORE_REQUESTS);
      const loanStore = tx.objectStore(STORE_LOANS);
      reqStore.clear();
      loanStore.clear();

      tx.oncomplete = () => {
        resolve(true);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target.error, 'Transaction failed clearing borrowing requests'));
      };
    });
  }

  async clearAllLoans() {
    const db = await this._getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOANS, 'readwrite');
      const store = tx.objectStore(STORE_LOANS);
      store.clear();

      tx.oncomplete = () => {
        resolve(true);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target.error, 'Transaction failed clearing loans'));
      };
    });
  }

  // ==========================================
  // Module 06: Loan Lifecycle Operations (DR-04)
  // ==========================================

  async getLoanByRequestId(requestId) {
    if (!requestId) {
      throw new StorageError('getLoanByRequestId requires a valid requestId');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOANS, 'readonly');
      const store = tx.objectStore(STORE_LOANS);
      const req = store.get(requestId);

      req.onsuccess = () => {
        if (!req.result) {
          reject(new LoanNotFoundError(requestId));
        } else {
          resolve(normalizeLoanRecord(req.result));
        }
      };

      req.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to get loan for request "${requestId}"`));
      };
    });
  }

  async listLoans(options = {}) {
    const db = await this._getDb();
    const { itemId, status } = options;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOANS, 'readonly');
      const store = tx.objectStore(STORE_LOANS);

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
        let results = (req.result || []).map(normalizeLoanRecord);

        if (itemId && status) {
          results = results.filter((l) => l.status === status);
        }

        // Sort descending by createdAt
        results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        resolve(results);
      };

      req.onerror = (e) => {
        reject(this._handleError(e.target.error, 'Failed to list loans'));
      };
    });
  }

  async listLoansByItem(itemId) {
    return this.listLoans({ itemId });
  }

  /**
   * Records owner-side physical handover condition checkpoint (DR-04).
   * Loan remains RESERVED until borrower confirms physical receipt.
   */
  async recordCollectionHandover(requestId, checkpoint) {
    if (!requestId) {
      throw new StorageError('recordCollectionHandover requires a valid requestId');
    }
    const { isValid, errors } = validateConditionCheckpoint(checkpoint, { type: 'collection' });
    if (!isValid) {
      throw new ConditionValidationError(errors);
    }

    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOANS, 'readwrite');
      const store = tx.objectStore(STORE_LOANS);
      let updatedLoan = null;

      const getReq = store.get(requestId);
      getReq.onsuccess = () => {
        const loan = getReq.result;
        if (!loan) {
          tx.abort();
          return reject(new LoanNotFoundError(requestId));
        }

        if (loan.status !== LOAN_STATUS.RESERVED) {
          tx.abort();
          return reject(new LoanStateTransitionError(loan.status, 'COLLECTION_RECORDED', `Cannot record collection for loan with status "${loan.status}". Only RESERVED loans can be collected.`));
        }

        if (loan.collectionCheckpoint?.ownerRecordedAt) {
          tx.abort();
          return reject(new CollectionAlreadyRecordedError(requestId));
        }

        const today = getLocalToday();
        const start = loan.collectionDate;
        const end = loan.returnDeadline;

        if (today < start) {
          tx.abort();
          return reject(new CollectionDateNotReachedError(start, today));
        }

        if (today > end) {
          tx.abort();
          return reject(new ReservationExpiredError(end, today));
        }

        const now = new Date().toISOString();
        const tier = CONDITION_TIERS[checkpoint.conditionGrade];
        const collectionCheckpoint = {
          recordedAt: now,
          ownerRecordedAt: now,
          conditionGrade: Number(checkpoint.conditionGrade),
          conditionLabel: tier ? tier.label : `Grade ${checkpoint.conditionGrade}`,
          notes: (checkpoint.notes || '').trim(),
          photos: Array.isArray(checkpoint.photos) ? checkpoint.photos : [],
          borrowerReviewedAt: null,
          borrowerObservation: '',
        };

        updatedLoan = normalizeLoanRecord({
          ...loan,
          collectionCheckpoint,
          updatedAt: now,
        });

        const putReq = store.put(updatedLoan);
        putReq.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to record collection handover for "${requestId}"`));
        };
      };

      getReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to retrieve loan "${requestId}"`));
      };

      tx.oncomplete = () => {
        resolve(updatedLoan);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target?.error || e, `Transaction failed recording collection handover for "${requestId}"`));
      };
    });
  }

  /**
   * Confirms borrower physical receipt and transitions loan RESERVED -> ACTIVE (DR-04).
   */
  async confirmCollectionReceipt(requestId, { observation } = {}) {
    if (!requestId) {
      throw new StorageError('confirmCollectionReceipt requires a valid requestId');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOANS, 'readwrite');
      const store = tx.objectStore(STORE_LOANS);
      let updatedLoan = null;

      const getReq = store.get(requestId);
      getReq.onsuccess = () => {
        const loan = getReq.result;
        if (!loan) {
          tx.abort();
          return reject(new LoanNotFoundError(requestId));
        }

        if (loan.status !== LOAN_STATUS.RESERVED) {
          tx.abort();
          return reject(new LoanStateTransitionError(loan.status, LOAN_STATUS.ACTIVE, `Cannot confirm receipt for loan with status "${loan.status}".`));
        }

        if (!loan.collectionCheckpoint?.ownerRecordedAt) {
          tx.abort();
          return reject(new BorrowerReceiptRequiredError(requestId, 'Owner handover must be recorded before borrower receipt can be confirmed.'));
        }

        if (loan.collectedAt) {
          tx.abort();
          return reject(new CollectionAlreadyRecordedError(requestId, 'Physical receipt has already been confirmed.'));
        }

        const now = new Date().toISOString();
        const collectionCheckpoint = {
          ...loan.collectionCheckpoint,
          borrowerReviewedAt: now,
          borrowerObservation: observation ? observation.trim() : (loan.collectionCheckpoint.borrowerObservation || ''),
        };

        updatedLoan = normalizeLoanRecord({
          ...loan,
          status: LOAN_STATUS.ACTIVE,
          collectedAt: now,
          collectionCheckpoint,
          updatedAt: now,
        });

        const putReq = store.put(updatedLoan);
        putReq.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to confirm receipt for "${requestId}"`));
        };
      };

      getReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to retrieve loan "${requestId}"`));
      };

      tx.oncomplete = () => {
        resolve(updatedLoan);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target?.error || e, `Transaction failed confirming receipt for "${requestId}"`));
      };
    });
  }

  /**
   * Records borrower marking that the item has physically been returned.
   */
  async markLoanReturned(requestId) {
    if (!requestId) {
      throw new StorageError('markLoanReturned requires a valid requestId');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOANS, 'readwrite');
      const store = tx.objectStore(STORE_LOANS);
      let updatedLoan = null;

      const getReq = store.get(requestId);
      getReq.onsuccess = () => {
        const loan = getReq.result;
        if (!loan) {
          tx.abort();
          return reject(new LoanNotFoundError(requestId));
        }

        if (loan.status !== LOAN_STATUS.ACTIVE) {
          tx.abort();
          return reject(new LoanStateTransitionError(loan.status, 'RETURN_MARKED', `Only ACTIVE loans can be marked returned. Current status is "${loan.status}".`));
        }

        const now = new Date().toISOString();
        const returnCheckpoint = {
          ...(loan.returnCheckpoint || {}),
          borrowerReturnMarkedAt: now,
        };

        updatedLoan = normalizeLoanRecord({
          ...loan,
          returnCheckpoint,
          updatedAt: now,
        });

        const putReq = store.put(updatedLoan);
        putReq.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to mark return for "${requestId}"`));
        };
      };

      getReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to retrieve loan "${requestId}"`));
      };

      tx.oncomplete = () => {
        resolve(updatedLoan);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target?.error || e, `Transaction failed marking return for "${requestId}"`));
      };
    });
  }

  /**
   * Records owner return condition inspection and completes the loan ACTIVE -> COMPLETED (DR-04).
   * The completed loan releases its reservation window without overriding the owner's item availability setting.
   */
  async completeReturnInspection(requestId, checkpoint) {
    if (!requestId) {
      throw new StorageError('completeReturnInspection requires a valid requestId');
    }
    const { isValid, errors } = validateConditionCheckpoint(checkpoint, { type: 'return' });
    if (!isValid) {
      throw new ConditionValidationError(errors);
    }

    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOANS, 'readwrite');
      const store = tx.objectStore(STORE_LOANS);
      let updatedLoan = null;

      const getReq = store.get(requestId);
      getReq.onsuccess = () => {
        const loan = getReq.result;
        if (!loan) {
          tx.abort();
          return reject(new LoanNotFoundError(requestId));
        }

        if (loan.status === LOAN_STATUS.COMPLETED) {
          tx.abort();
          return reject(new LoanAlreadyCompletedError(requestId));
        }

        if (loan.status !== LOAN_STATUS.ACTIVE) {
          tx.abort();
          return reject(new LoanStateTransitionError(loan.status, LOAN_STATUS.COMPLETED, `Cannot complete return inspection for loan with status "${loan.status}". Loan must be ACTIVE.`));
        }

        const now = new Date().toISOString();
        const tier = CONDITION_TIERS[checkpoint.conditionGrade];
        const returnCheckpoint = {
          recordedAt: now,
          ownerInspectedAt: now,
          borrowerReturnMarkedAt: loan.returnCheckpoint?.borrowerReturnMarkedAt || now,
          conditionGrade: Number(checkpoint.conditionGrade),
          conditionLabel: tier ? tier.label : `Grade ${checkpoint.conditionGrade}`,
          notes: (checkpoint.notes || '').trim(),
          photos: Array.isArray(checkpoint.photos) ? checkpoint.photos : [],
        };

        updatedLoan = normalizeLoanRecord({
          ...loan,
          status: LOAN_STATUS.COMPLETED,
          completedAt: now,
          returnCheckpoint,
          updatedAt: now,
        });

        const putReq = store.put(updatedLoan);
        putReq.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to complete return inspection for "${requestId}"`));
        };
      };

      getReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to retrieve loan "${requestId}"`));
      };

      tx.oncomplete = () => {
        resolve(updatedLoan);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target?.error || e, `Transaction failed completing return inspection for "${requestId}"`));
      };
    });
  }

  /**
   * Explicitly releases an uncollected reservation whose agreed period elapsed without physical collection.
   * RESERVED -> RELEASED_NOT_COLLECTED. Releases calendar reservation without falsely claiming return.
   */
  async releaseUncollectedReservation(requestId, { releaseNote } = {}) {
    if (!requestId) {
      throw new StorageError('releaseUncollectedReservation requires a valid requestId');
    }
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOANS, 'readwrite');
      const store = tx.objectStore(STORE_LOANS);
      let updatedLoan = null;

      const getReq = store.get(requestId);
      getReq.onsuccess = () => {
        const loan = getReq.result;
        if (!loan) {
          tx.abort();
          return reject(new LoanNotFoundError(requestId));
        }

        if (loan.status !== LOAN_STATUS.RESERVED) {
          tx.abort();
          return reject(new UncollectedReleaseNotAllowedError(requestId, `only RESERVED loans can be released (current status: ${loan.status})`));
        }

        const today = getLocalToday();
        if (today <= loan.returnDeadline) {
          tx.abort();
          return reject(new UncollectedReleaseNotAllowedError(requestId, `reservation return deadline (${loan.returnDeadline}) has not passed yet (today is ${today})`));
        }

        const now = new Date().toISOString();
        updatedLoan = normalizeLoanRecord({
          ...loan,
          status: LOAN_STATUS.RELEASED_NOT_COLLECTED,
          resolution: 'RELEASED_NOT_COLLECTED',
          releasedAt: now,
          releaseNote: (releaseNote || '').trim(),
          updatedAt: now,
        });

        const putReq = store.put(updatedLoan);
        putReq.onerror = (e) => {
          reject(this._handleError(e.target.error, `Failed to release uncollected reservation "${requestId}"`));
        };
      };

      getReq.onerror = (e) => {
        reject(this._handleError(e.target.error, `Failed to retrieve loan "${requestId}"`));
      };

      tx.oncomplete = () => {
        resolve(updatedLoan);
      };

      tx.onerror = (e) => {
        reject(this._handleError(e.target?.error || e, `Transaction failed releasing uncollected reservation "${requestId}"`));
      };
    });
  }

  // ==========================================
  // Unified Backup / Restore Transactions (Module 06)
  // ==========================================

  /**
   * Atomically clears and replaces items, borrowing requests, and loan lifecycles
   * within ONE single transaction across all three object stores.
   * On any failure or aborted operation, prior contents of all three stores are completely preserved.
   */
  async replaceAllData({ items = [], requests = [], loans = [] } = {}) {
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS, STORE_REQUESTS, STORE_LOANS], 'readwrite');
      const itemStore = tx.objectStore(STORE_ITEMS);
      const reqStore = tx.objectStore(STORE_REQUESTS);
      const loanStore = tx.objectStore(STORE_LOANS);

      // 1. Clear all three stores
      itemStore.clear();
      reqStore.clear();
      loanStore.clear();

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
        const normalized = normalizeBorrowRequest(req, { generateId: false });
        if (!normalized || !normalized.id) {
          tx.abort();
          return reject(new StorageError('Atomic replace rejected: borrowing request record is missing valid id'));
        }
        reqStore.put(normalized);
        replacedRequestsCount++;
      }

      // 4. Insert loans
      let replacedLoansCount = 0;
      for (const loan of loans) {
        const normalized = normalizeLoanRecord(loan);
        if (!normalized || !normalized.requestId) {
          tx.abort();
          return reject(new StorageError('Atomic replace rejected: loan record is missing valid requestId'));
        }
        loanStore.put(normalized);
        replacedLoansCount++;
      }

      tx.oncomplete = () => {
        resolve({
          replacedCount: replacedItemsCount,
          replacedItemsCount,
          replacedRequestsCount,
          replacedLoansCount,
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
   * Atomically merges imported items, borrowing requests, and loan lifecycles into existing stores
   * within ONE single transaction.
   */
  async mergeAllData({ items = [], requests = [], loans = [] } = {}) {
    const db = await this._getDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ITEMS, STORE_REQUESTS, STORE_LOANS], 'readwrite');
      const itemStore = tx.objectStore(STORE_ITEMS);
      const reqStore = tx.objectStore(STORE_REQUESTS);
      const loanStore = tx.objectStore(STORE_LOANS);

      let addedItemsCount = 0;
      let skippedItemsCount = 0;
      let addedRequestsCount = 0;
      let skippedRequestsCount = 0;
      let addedLoansCount = 0;
      let skippedLoansCount = 0;

      // 1. Existing items
      const existingItemsReq = itemStore.getAll();
      existingItemsReq.onsuccess = () => {
        const existingItems = existingItemsReq.result || [];
        const existingItemIds = new Set(existingItems.map((i) => i.id));

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

        // 2. Existing requests
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
            const normalized = normalizeBorrowRequest(req, { generateId: false });
            if (!normalized?.id) {
              tx.abort();
              return reject(new StorageError('Cannot merge borrowing request record missing id'));
            }

            if (!existingItemIds.has(normalized.itemId)) {
              tx.abort();
              return reject(new StorageError(`Cannot merge request "${normalized.id}": referenced item "${normalized.itemId}" does not exist.`));
            }

            if (existingReqIds.has(normalized.id)) {
              skippedRequestsCount++;
            } else {
              // If incoming request is APPROVED, verify it does not conflict with existing approved reservations
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

          // 3. Existing loans
          const existingLoansReq = loanStore.getAll();
          existingLoansReq.onsuccess = () => {
            const existingLoans = existingLoansReq.result || [];
            const existingLoanMap = new Map(existingLoans.map((l) => [l.requestId, l]));

            // If an approved request exists without a corresponding loan, derive its RESERVED record
            const incomingLoanMap = new Map(loans.map((l) => [l.requestId || l.id, l]));

            for (const req of [...existingRequests, ...requests]) {
              const reqId = req.id || req.requestId;
              if (req.status === REQUEST_STATUS.APPROVED) {
                if (!existingLoanMap.has(reqId) && !incomingLoanMap.has(reqId)) {
                  const derived = normalizeLoanRecord({
                    requestId: reqId,
                    itemId: req.itemId,
                    itemTitleSnapshot: req.itemTitleSnapshot || '',
                    borrowerAlias: req.borrowerAlias || req.requestedBy || '',
                    collectionDate: req.startDate || req.collectionDate,
                    returnDeadline: req.endDate || req.returnDeadline,
                    status: LOAN_STATUS.RESERVED,
                    reservedAt: req.decidedAt || req.decisionAt || req.updatedAt || req.createdAt || new Date().toISOString(),
                    provenance: 'DERIVED_FROM_APPROVED_REQUEST',
                  });
                  incomingLoanMap.set(reqId, derived);
                }
              }
            }

            for (const [, loanData] of incomingLoanMap) {
              const normalizedLoan = normalizeLoanRecord(loanData);
              if (!normalizedLoan?.requestId) {
                tx.abort();
                return reject(new StorageError('Cannot merge loan record missing requestId'));
              }

              if (existingLoanMap.has(normalizedLoan.requestId)) {
                skippedLoansCount++;
              } else {
                loanStore.put(normalizedLoan);
                existingLoanMap.set(normalizedLoan.requestId, normalizedLoan);
                addedLoansCount++;
              }
            }
          };

          existingLoansReq.onerror = (e) => {
            reject(this._handleError(e.target.error, 'Failed to inspect existing loans during merge'));
          };
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
          addedLoansCount,
          skippedLoansCount,
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
