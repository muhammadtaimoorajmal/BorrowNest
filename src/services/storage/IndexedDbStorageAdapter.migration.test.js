import { describe, it, expect } from 'vitest';
import { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter';
import { STORE_ITEMS, STORE_REQUESTS } from './database';
import { REQUEST_STATUS } from '../../features/borrowing/constants/requestStatus';

describe('IndexedDB Version 1 to Version 2 Non-Destructive Migration', () => {
  it('migrates a version 1 database with existing items and media cleanly to version 2', async () => {
    const dbName = `BorrowNest_Migration_Test_${Date.now()}`;

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
        // Insert an authentic item record into the version 1 store
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

    // 2. Initialize the Version 2 adapter against the same database name
    const adapter = new IndexedDbStorageAdapter(null, dbName);
    await adapter.initialize();

    // 3. Verify that the legacy item was preserved completely
    const preservedItem = await adapter.getItemById('v1-legacy-item-1');
    expect(preservedItem).toBeDefined();
    expect(preservedItem.title).toBe('Electric Rotary Hammer Drill');
    expect(preservedItem.status).toBe('ACTIVE');
    expect(preservedItem.photos.length).toBe(1);
    expect(preservedItem.photos[0].altText).toBe('Rotary hammer drill in carry case');

    // 4. Verify that the new borrowingRequests store and indexes exist
    const db = await adapter._getDb();
    expect(db.version).toBe(2);
    expect(db.objectStoreNames.contains(STORE_ITEMS)).toBe(true);
    expect(db.objectStoreNames.contains(STORE_REQUESTS)).toBe(true);

    const tx = db.transaction(STORE_REQUESTS, 'readonly');
    const reqStore = tx.objectStore(STORE_REQUESTS);
    expect(reqStore.indexNames.contains('itemId')).toBe(true);
    expect(reqStore.indexNames.contains('status')).toBe(true);
    expect(reqStore.indexNames.contains('startDate')).toBe(true);
    expect(reqStore.indexNames.contains('endDate')).toBe(true);
    expect(reqStore.indexNames.contains('createdAt')).toBe(true);

    // 5. Verify that new borrowing requests can be created and persisted in the upgraded database
    const newReq = await adapter.createBorrowRequest({
      itemId: 'v1-legacy-item-1',
      borrowerAlias: 'Morgan R.',
      startDate: '2026-12-10',
      endDate: '2026-12-12',
      requestNote: 'Mounting masonry brackets',
    });

    expect(newReq.id).toBeDefined();
    expect(newReq.status).toBe(REQUEST_STATUS.PENDING);
    expect(newReq.itemTitleSnapshot).toBe('Electric Rotary Hammer Drill');

    const fetchedReq = await adapter.getBorrowRequestById(newReq.id);
    expect(fetchedReq.borrowerAlias).toBe('Morgan R.');
  });

  it('initializes a fresh version 2 database with both object stores intact', async () => {
    const dbName = `BorrowNest_Fresh_V2_${Date.now()}`;
    const adapter = new IndexedDbStorageAdapter(null, dbName);
    await adapter.initialize();

    const db = await adapter._getDb();
    expect(db.version).toBe(2);
    expect(db.objectStoreNames.contains(STORE_ITEMS)).toBe(true);
    expect(db.objectStoreNames.contains(STORE_REQUESTS)).toBe(true);

    const itemCount = await adapter.countItems();
    const reqCount = await adapter.countBorrowRequests();
    expect(itemCount).toBe(0);
    expect(reqCount).toBe(0);
  });
});
