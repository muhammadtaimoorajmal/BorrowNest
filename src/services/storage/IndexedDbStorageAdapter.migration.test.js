import { describe, it, expect } from 'vitest';
import { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter';
import { STORE_ITEMS, STORE_REQUESTS, STORE_LOANS } from './database';
import { REQUEST_STATUS } from '../../features/borrowing/constants/requestStatus';
import { LOAN_STATUS } from '../../features/borrowing/constants/loanStatus';

describe('IndexedDB Multi-Version Non-Destructive Migrations (DR-03 + DR-04)', () => {
  it('migrates a version 1 database cleanly to version 3', async () => {
    const dbName = `BorrowNest_Migration_V1_V3_${Date.now()}`;

    // 1. Manually simulate opening and initializing a Version 1 database
    await new Promise((resolve, reject) => {
      const openReq = indexedDB.open(dbName, 1);
      openReq.onupgradeneeded = (e) => {
        const db = e.target.result;
        const itemStore = db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
        itemStore.createIndex('status', 'status', { unique: false });
        itemStore.createIndex('category', 'category', { unique: false });
        itemStore.createIndex('createdAt', 'createdAt', { unique: false });
        itemStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      };

      openReq.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(STORE_ITEMS, 'readwrite');
        const store = tx.objectStore(STORE_ITEMS);
        store.put({
          id: 'v1-legacy-item-1',
          title: 'Electric Rotary Hammer Drill',
          description: 'Heavy duty SDS hammer drill preserved from Module 03/04.',
          category: 'TOOLS',
          conditionGrade: 4,
          approximateArea: 'North District',
          availability: 'AVAILABLE',
          status: 'ACTIVE',
          photos: [
            {
              id: 'p1',
              dataUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=',
              altText: 'Rotary hammer drill in carry case',
            },
          ],
          createdAt: '2026-11-15T10:00:00.000Z',
          updatedAt: '2026-11-15T10:00:00.000Z',
        });

        tx.oncomplete = () => {
          db.close();
          resolve(true);
        };
        tx.onerror = (err) => reject(err);
      };
      openReq.onerror = (err) => reject(err);
    });

    // 2. Initialize the Version 3 adapter against the same database name
    const adapter = new IndexedDbStorageAdapter(null, dbName);
    await adapter.initialize();

    // 3. Verify that the legacy item was preserved completely
    const preservedItem = await adapter.getItemById('v1-legacy-item-1');
    expect(preservedItem).toBeDefined();
    expect(preservedItem.title).toBe('Electric Rotary Hammer Drill');
    expect(preservedItem.status).toBe('ACTIVE');
    expect(preservedItem.photos.length).toBe(1);

    // 4. Verify that version 3 schema has all 3 stores
    const db = await adapter._getDb();
    expect(db.version).toBe(3);
    expect(db.objectStoreNames.contains(STORE_ITEMS)).toBe(true);
    expect(db.objectStoreNames.contains(STORE_REQUESTS)).toBe(true);
    expect(db.objectStoreNames.contains(STORE_LOANS)).toBe(true);
  });

  it('migrates a version 2 database with approved requests, backfilling them as RESERVED loans in version 3', async () => {
    const dbName = `BorrowNest_Migration_V2_V3_${Date.now()}`;

    // 1. Manually simulate opening and initializing a Version 2 database
    await new Promise((resolve, reject) => {
      const openReq = indexedDB.open(dbName, 2);
      openReq.onupgradeneeded = (e) => {
        const db = e.target.result;
        const itemStore = db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
        itemStore.createIndex('status', 'status', { unique: false });
        itemStore.createIndex('category', 'category', { unique: false });
        itemStore.createIndex('createdAt', 'createdAt', { unique: false });
        itemStore.createIndex('updatedAt', 'updatedAt', { unique: false });

        const reqStore = db.createObjectStore(STORE_REQUESTS, { keyPath: 'id' });
        reqStore.createIndex('itemId', 'itemId', { unique: false });
        reqStore.createIndex('status', 'status', { unique: false });
        reqStore.createIndex('startDate', 'startDate', { unique: false });
        reqStore.createIndex('endDate', 'endDate', { unique: false });
        reqStore.createIndex('collectionDate', 'collectionDate', { unique: false });
        reqStore.createIndex('returnDeadline', 'returnDeadline', { unique: false });
        reqStore.createIndex('createdAt', 'createdAt', { unique: false });
      };

      openReq.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction([STORE_ITEMS, STORE_REQUESTS], 'readwrite');
        const itemStore = tx.objectStore(STORE_ITEMS);
        const reqStore = tx.objectStore(STORE_REQUESTS);

        itemStore.put({
          id: 'item-v2',
          title: 'Pressure Washer',
          category: 'TOOLS',
          conditionGrade: 5,
          availability: 'AVAILABLE',
          status: 'ACTIVE',
          photos: [],
          createdAt: '2026-11-16T10:00:00.000Z',
          updatedAt: '2026-11-16T10:00:00.000Z',
        });

        // 1 Approved Request (should backfill as RESERVED loan)
        reqStore.put({
          id: 'req-approved-1',
          itemId: 'item-v2',
          itemTitleSnapshot: 'Pressure Washer',
          borrowerAlias: 'Charlie',
          startDate: '2026-12-01',
          endDate: '2026-12-04',
          status: REQUEST_STATUS.APPROVED,
          createdAt: '2026-11-16T11:00:00.000Z',
          updatedAt: '2026-11-16T12:00:00.000Z',
          decidedAt: '2026-11-16T12:00:00.000Z',
        });

        // 1 Pending Request (should NOT create a loan)
        reqStore.put({
          id: 'req-pending-2',
          itemId: 'item-v2',
          itemTitleSnapshot: 'Pressure Washer',
          borrowerAlias: 'Dana',
          startDate: '2026-12-10',
          endDate: '2026-12-12',
          status: REQUEST_STATUS.PENDING,
          createdAt: '2026-11-16T13:00:00.000Z',
          updatedAt: '2026-11-16T13:00:00.000Z',
        });

        // 1 Declined Request (should NOT create a loan)
        reqStore.put({
          id: 'req-declined-3',
          itemId: 'item-v2',
          itemTitleSnapshot: 'Pressure Washer',
          borrowerAlias: 'Evan',
          startDate: '2026-12-15',
          endDate: '2026-12-18',
          status: REQUEST_STATUS.DECLINED,
          createdAt: '2026-11-16T14:00:00.000Z',
          updatedAt: '2026-11-16T15:00:00.000Z',
        });

        tx.oncomplete = () => {
          db.close();
          resolve(true);
        };
        tx.onerror = (err) => reject(err);
      };
      openReq.onerror = (err) => reject(err);
    });

    // 2. Open with version 3 adapter
    const adapter = new IndexedDbStorageAdapter(null, dbName);
    await adapter.initialize();

    // 3. Verify items and requests preserved
    const item = await adapter.getItemById('item-v2');
    expect(item).toBeDefined();
    expect(item.title).toBe('Pressure Washer');

    const requests = await adapter.listBorrowRequests({ itemId: 'item-v2' });
    expect(requests.length).toBe(3);

    // 4. Verify that EXACTLY ONE loan record was created for the APPROVED request
    const loans = await adapter.listLoans({ itemId: 'item-v2' });
    expect(loans.length).toBe(1);

    const backfilledLoan = loans[0];
    expect(backfilledLoan.requestId).toBe('req-approved-1');
    expect(backfilledLoan.itemId).toBe('item-v2');
    expect(backfilledLoan.borrowerAlias).toBe('Charlie');
    expect(backfilledLoan.collectionDate).toBe('2026-12-01');
    expect(backfilledLoan.returnDeadline).toBe('2026-12-04');
    // Invariant: backfilled approved request becomes RESERVED, not assumed ACTIVE
    expect(backfilledLoan.status).toBe(LOAN_STATUS.RESERVED);
    expect(backfilledLoan.collectedAt).toBeNull();
    expect(backfilledLoan.completedAt).toBeNull();
    expect(backfilledLoan.provenance).toBe('MIGRATED_APPROVED_REQUEST_V2');
  });

  it('initializes a fresh version 3 database with all three object stores intact', async () => {
    const dbName = `BorrowNest_Fresh_V3_${Date.now()}`;
    const adapter = new IndexedDbStorageAdapter(null, dbName);
    await adapter.initialize();

    const db = await adapter._getDb();
    expect(db.version).toBe(3);
    expect(db.objectStoreNames.contains(STORE_ITEMS)).toBe(true);
    expect(db.objectStoreNames.contains(STORE_REQUESTS)).toBe(true);
    expect(db.objectStoreNames.contains(STORE_LOANS)).toBe(true);

    const itemCount = await adapter.countItems();
    const reqCount = await adapter.countBorrowRequests();
    const loanList = await adapter.listLoans();
    expect(itemCount).toBe(0);
    expect(reqCount).toBe(0);
    expect(loanList.length).toBe(0);
  });
});
