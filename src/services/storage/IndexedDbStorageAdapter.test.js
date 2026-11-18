import { describe, it, expect, beforeEach } from 'vitest';
import { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter';
import { RecordNotFoundError, DuplicateKeyError } from './storageErrors';

describe('Storage Layer: IndexedDbStorageAdapter', () => {
  let adapter;

  beforeEach(async () => {
    // In Vitest, window.indexedDB is provided by fake-indexeddb/auto
    adapter = new IndexedDbStorageAdapter(null, 'BorrowNest_StorageAdapter_Test');
    await adapter.initialize();
    await adapter.clearAllItems();
  });

  const sampleItem = {
    id: 'test-item-1',
    title: 'Hedge Trimmer',
    description: 'Cordless 22-inch electric hedge trimmer for shrub maintenance.',
    category: 'GARDENING',
    conditionGrade: 4,
    conditionNotes: '',
    approximateArea: 'Greenwood District',
    availability: 'AVAILABLE',
    status: 'ACTIVE',
    photoAttestation: true,
    photos: [
      {
        id: 'p1',
        altText: 'Side view of hedge trimmer',
        mimeType: 'image/webp',
        width: 1000,
        height: 750,
        sizeBytes: 80000,
      },
    ],
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  };

  it('initializes and reports zero items in fresh store', async () => {
    const count = await adapter.countItems();
    expect(count).toBe(0);

    const items = await adapter.listItems();
    expect(items).toEqual([]);
  });

  it('creates and retrieves a new item record', async () => {
    const created = await adapter.createItem(sampleItem);
    expect(created.id).toBe('test-item-1');

    const retrieved = await adapter.getItemById('test-item-1');
    expect(retrieved.title).toBe('Hedge Trimmer');
    expect(retrieved.category).toBe('GARDENING');
  });

  it('rejects creating an item with duplicate ID', async () => {
    await adapter.createItem(sampleItem);
    await expect(adapter.createItem(sampleItem)).rejects.toThrow(DuplicateKeyError);
  });

  it('throws RecordNotFoundError when retrieving a non-existent item', async () => {
    await expect(adapter.getItemById('non-existent-id')).rejects.toThrow(RecordNotFoundError);
  });

  it('updates an existing item record and refreshes updatedAt', async () => {
    await adapter.createItem(sampleItem);
    const updated = await adapter.updateItem({
      id: 'test-item-1',
      title: 'Heavy Duty Hedge Trimmer Pro',
      availability: 'UNAVAILABLE',
    });

    expect(updated.title).toBe('Heavy Duty Hedge Trimmer Pro');
    expect(updated.availability).toBe('UNAVAILABLE');
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(sampleItem.updatedAt).getTime(),
    );
  });

  it('archives and restores an item cleanly', async () => {
    await adapter.createItem(sampleItem);

    // Archive
    await adapter.archiveItem('test-item-1');
    const archived = await adapter.getItemById('test-item-1');
    expect(archived.status).toBe('ARCHIVED');

    const activeList = await adapter.listItems({ status: 'ACTIVE' });
    expect(activeList.length).toBe(0);

    const archivedList = await adapter.listItems({ status: 'ARCHIVED' });
    expect(archivedList.length).toBe(1);

    // Restore
    await adapter.restoreItem('test-item-1');
    const restored = await adapter.getItemById('test-item-1');
    expect(restored.status).toBe('ACTIVE');

    const activeCount = await adapter.countItems({ status: 'ACTIVE' });
    expect(activeCount).toBe(1);
  });

  it('deletes an item permanently and confirms removal', async () => {
    await adapter.createItem(sampleItem);
    await adapter.deleteItem('test-item-1');

    await expect(adapter.getItemById('test-item-1')).rejects.toThrow(RecordNotFoundError);
    const count = await adapter.countItems();
    expect(count).toBe(0);
  });

  it('supports bulkCreateItems and clearAllItems', async () => {
    const itemA = { ...sampleItem, id: 'item-a', title: 'Item A' };
    const itemB = { ...sampleItem, id: 'item-b', title: 'Item B' };

    await adapter.bulkCreateItems([itemA, itemB]);
    expect(await adapter.countItems()).toBe(2);

    await adapter.clearAllItems();
    expect(await adapter.countItems()).toBe(0);
  });

  describe('Atomic replaceAllItems', () => {
    it('atomically clears existing items and inserts replacement records in one transaction', async () => {
      // Seed two original items
      await adapter.bulkCreateItems([
        { ...sampleItem, id: 'orig-1', title: 'Original 1' },
        { ...sampleItem, id: 'orig-2', title: 'Original 2' },
      ]);
      expect(await adapter.countItems()).toBe(2);

      // Replace with new items
      const replacement = [
        { ...sampleItem, id: 'rep-1', title: 'Replacement 1' },
        { ...sampleItem, id: 'rep-2', title: 'Replacement 2' },
        { ...sampleItem, id: 'rep-3', title: 'Replacement 3' },
      ];

      const result = await adapter.replaceAllItems(replacement);
      expect(result.replacedCount).toBe(3);

      const currentItems = await adapter.listItems();
      expect(currentItems.length).toBe(3);
      expect(currentItems.map((i) => i.id).sort()).toEqual(['rep-1', 'rep-2', 'rep-3']);
      await expect(adapter.getItemById('orig-1')).rejects.toThrow(RecordNotFoundError);
    });

    it('atomically clears all items when given an empty replacement array', async () => {
      await adapter.createItem(sampleItem);
      expect(await adapter.countItems()).toBe(1);

      const result = await adapter.replaceAllItems([]);
      expect(result.replacedCount).toBe(0);
      expect(await adapter.countItems()).toBe(0);
    });

    it('aborts transaction and preserves original records if an invalid item is encountered', async () => {
      // Seed original records
      await adapter.bulkCreateItems([
        { ...sampleItem, id: 'safe-1', title: 'Preserved Item 1' },
        { ...sampleItem, id: 'safe-2', title: 'Preserved Item 2' },
      ]);
      expect(await adapter.countItems()).toBe(2);

      // Attempt replace with invalid item missing id
      const malformedBatch = [
        { ...sampleItem, id: 'valid-new-1' },
        { title: 'Invalid item missing id' }, // Missing id!
      ];

      await expect(adapter.replaceAllItems(malformedBatch)).rejects.toThrow();

      // Verify original records remain completely intact after abort
      const itemsAfterAbort = await adapter.listItems();
      expect(itemsAfterAbort.length).toBe(2);
      expect(itemsAfterAbort.map((i) => i.id).sort()).toEqual(['safe-1', 'safe-2']);
      expect((await adapter.getItemById('safe-1')).title).toBe('Preserved Item 1');
    });
  });
});
