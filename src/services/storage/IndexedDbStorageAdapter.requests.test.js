import { describe, it, expect, beforeEach } from 'vitest';
import { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter';
import {
  ReservationConflictError,
  InvalidStateTransitionError,
  ItemUnavailableError,
  ItemHasRequestHistoryError,
  ItemHasActiveReservationError,
  ItemHasPendingRequestsError,
} from './storageErrors';
import { REQUEST_STATUS } from '../../features/borrowing/constants/requestStatus';

describe('Storage Adapter: Borrowing Requests, Approval & Integrity (DR-02, DR-03)', () => {
  let adapter;
  const dbName = 'BorrowNest_Requests_Test';

  beforeEach(async () => {
    adapter = new IndexedDbStorageAdapter(null, dbName);
    await adapter.initialize();
    await adapter.clearAllBorrowRequests();
    await adapter.clearAllItems();
  });

  const testItem = {
    id: 'item-cordless-drill',
    title: 'DeWalt 20V Cordless Hammer Drill',
    description: 'Powerful hammer drill with 2 batteries and charger.',
    category: 'TOOLS',
    conditionGrade: 4,
    approximateArea: 'Greenwood / Pine Street',
    availability: 'AVAILABLE',
    status: 'ACTIVE',
    photos: [],
    createdAt: '2026-11-18T10:00:00.000Z',
    updatedAt: '2026-11-18T10:00:00.000Z',
  };

  describe('createBorrowRequest', () => {
    it('creates and persists a valid borrowing request record', async () => {
      await adapter.createItem(testItem);

      const request = await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Sam K.',
        startDate: '2026-12-01',
        endDate: '2026-12-03',
        requestNote: 'Assembling living room shelving',
      });

      expect(request.id).toBeDefined();
      expect(request.itemId).toBe(testItem.id);
      expect(request.borrowerAlias).toBe('Sam K.');
      expect(request.requestedBy).toBe('Sam K.');
      expect(request.startDate).toBe('2026-12-01');
      expect(request.endDate).toBe('2026-12-03');
      expect(request.status).toBe(REQUEST_STATUS.PENDING);
      expect(request.itemTitleSnapshot).toBe(testItem.title);

      const count = await adapter.countBorrowRequests();
      expect(count).toBe(1);
    });

    it('rejects creating request for non-existent item', async () => {
      await expect(
        adapter.createBorrowRequest({
          itemId: 'non-existent-item',
          borrowerAlias: 'Jordan',
          startDate: '2026-12-01',
          endDate: '2026-12-02',
        }),
      ).rejects.toThrow(/not found/i);
    });

    it('rejects creating request for an archived item', async () => {
      await adapter.createItem({ ...testItem, status: 'ARCHIVED' });

      await expect(
        adapter.createBorrowRequest({
          itemId: testItem.id,
          borrowerAlias: 'Jordan',
          startDate: '2026-12-01',
          endDate: '2026-12-02',
        }),
      ).rejects.toThrow(ItemUnavailableError);
    });

    it('rejects creating request for an unavailable item', async () => {
      await adapter.createItem({ ...testItem, availability: 'UNAVAILABLE' });

      await expect(
        adapter.createBorrowRequest({
          itemId: testItem.id,
          borrowerAlias: 'Jordan',
          startDate: '2026-12-01',
          endDate: '2026-12-02',
        }),
      ).rejects.toThrow(ItemUnavailableError);
    });

    it('permits multiple overlapping PENDING requests (DR-03 invariant)', async () => {
      await adapter.createItem(testItem);

      // Pending Request 1
      const req1 = await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Borrower One',
        startDate: '2026-12-01',
        endDate: '2026-12-05',
      });

      // Pending Request 2 covering overlapping dates
      const req2 = await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Borrower Two',
        startDate: '2026-12-03',
        endDate: '2026-12-07',
      });

      expect(req1.status).toBe(REQUEST_STATUS.PENDING);
      expect(req2.status).toBe(REQUEST_STATUS.PENDING);
      expect(await adapter.countBorrowRequests()).toBe(2);
    });

    it('rejects creating request that overlaps an existing APPROVED reservation', async () => {
      await adapter.createItem(testItem);

      // 1. Create and approve reservation 1
      const req1 = await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Borrower One',
        startDate: '2026-12-01',
        endDate: '2026-12-05',
      });
      await adapter.approveBorrowRequest(req1.id);

      // 2. Attempt to create request overlapping boundary
      await expect(
        adapter.createBorrowRequest({
          itemId: testItem.id,
          borrowerAlias: 'Borrower Two',
          startDate: '2026-12-05', // Shared boundary day
          endDate: '2026-12-08',
        }),
      ).rejects.toThrow(ReservationConflictError);
    });
  });

  describe('approveBorrowRequest and Atomic Concurrency', () => {
    it('approves a pending request and sets decision timestamps', async () => {
      await adapter.createItem(testItem);
      const req = await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Taylor',
        startDate: '2026-12-10',
        endDate: '2026-12-14',
      });

      const approved = await adapter.approveBorrowRequest(req.id);
      expect(approved.status).toBe(REQUEST_STATUS.APPROVED);
      expect(approved.decidedAt).toBeDefined();
      expect(approved.decisionAt).toBe(approved.decidedAt);

      const fetched = await adapter.getBorrowRequestById(req.id);
      expect(fetched.status).toBe(REQUEST_STATUS.APPROVED);
    });

    it('rejects approving non-pending requests (idempotency & terminal state invariant)', async () => {
      await adapter.createItem(testItem);
      const req = await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Taylor',
        startDate: '2026-12-10',
        endDate: '2026-12-14',
      });
      await adapter.approveBorrowRequest(req.id);

      // Second approval attempt on already approved request
      await expect(adapter.approveBorrowRequest(req.id)).rejects.toThrow(InvalidStateTransitionError);
    });

    it('rejects approval when item availability has been turned off', async () => {
      await adapter.createItem(testItem);
      const req = await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Taylor',
        startDate: '2026-12-10',
        endDate: '2026-12-14',
      });

      // Owner turns item unavailable
      await adapter.updateItem({ id: testItem.id, availability: 'UNAVAILABLE' });

      await expect(adapter.approveBorrowRequest(req.id)).rejects.toThrow(ItemUnavailableError);
    });

    it('CRITICAL CONCURRENCY TEST: exactly one approval succeeds when competing approvals overlap', async () => {
      await adapter.createItem(testItem);

      // Create two competing pending requests covering overlapping dates
      const reqA = await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Borrower A',
        startDate: '2026-12-05',
        endDate: '2026-12-10',
      });

      const reqB = await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Borrower B',
        startDate: '2026-12-08',
        endDate: '2026-12-12',
      });

      // Create two separate adapter instances pointing to the same database
      const adapter1 = new IndexedDbStorageAdapter(null, dbName);
      const adapter2 = new IndexedDbStorageAdapter(null, dbName);
      await Promise.all([adapter1.initialize(), adapter2.initialize()]);

      // Fire concurrent approval attempts
      const results = await Promise.allSettled([
        adapter1.approveBorrowRequest(reqA.id),
        adapter2.approveBorrowRequest(reqB.id),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly ONE approval must succeed
      expect(fulfilled.length).toBe(1);
      // Exactly ONE approval must fail with ReservationConflictError
      expect(rejected.length).toBe(1);
      expect(rejected[0].reason).toBeInstanceOf(ReservationConflictError);

      // Verify that database has exactly one APPROVED request and one PENDING request
      const reqs = await adapter.listBorrowRequests({ itemId: testItem.id });
      const approvedCount = reqs.filter((r) => r.status === REQUEST_STATUS.APPROVED).length;
      const pendingCount = reqs.filter((r) => r.status === REQUEST_STATUS.PENDING).length;

      expect(approvedCount).toBe(1);
      expect(pendingCount).toBe(1);
    });
  });

  describe('declineBorrowRequest and cancelBorrowRequest', () => {
    it('declines a pending request', async () => {
      await adapter.createItem(testItem);
      const req = await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Casey',
        startDate: '2026-12-15',
        endDate: '2026-12-18',
      });

      const declined = await adapter.declineBorrowRequest(req.id);
      expect(declined.status).toBe(REQUEST_STATUS.DECLINED);
      expect(declined.decidedAt).toBeDefined();

      // Declined requests do not block future overlapping requests
      const newReq = await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Riley',
        startDate: '2026-12-15',
        endDate: '2026-12-18',
      });
      expect(newReq.id).toBeDefined();
    });

    it('cancels a pending request', async () => {
      await adapter.createItem(testItem);
      const req = await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Casey',
        startDate: '2026-12-15',
        endDate: '2026-12-18',
      });

      const cancelled = await adapter.cancelBorrowRequest(req.id);
      expect(cancelled.status).toBe(REQUEST_STATUS.CANCELLED);

      // Cannot decline or approve a cancelled request
      await expect(adapter.declineBorrowRequest(req.id)).rejects.toThrow(InvalidStateTransitionError);
      await expect(adapter.approveBorrowRequest(req.id)).rejects.toThrow(InvalidStateTransitionError);
    });
  });

  describe('Relational Invariants: Item Deletion and Archiving Protection', () => {
    it('blocks permanent deletion of an item when borrowing request history exists', async () => {
      await adapter.createItem(testItem);
      await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Chris',
        startDate: '2026-12-20',
        endDate: '2026-12-22',
      });

      await expect(adapter.deleteItem(testItem.id)).rejects.toThrow(ItemHasRequestHistoryError);

      // Verify item was not deleted
      const item = await adapter.getItemById(testItem.id);
      expect(item).toBeDefined();
    });

    it('permits deletion of an item when no request history exists', async () => {
      await adapter.createItem(testItem);
      const res = await adapter.deleteItem(testItem.id);
      expect(res.deleted).toBe(true);
      await expect(adapter.getItemById(testItem.id)).rejects.toThrow(/not found/i);
    });

    it('blocks archiving an item if it has an APPROVED reservation', async () => {
      await adapter.createItem(testItem);
      const req = await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Chris',
        startDate: '2026-12-20',
        endDate: '2026-12-22',
      });
      await adapter.approveBorrowRequest(req.id);

      await expect(adapter.archiveItem(testItem.id)).rejects.toThrow(ItemHasActiveReservationError);
    });

    it('blocks archiving an item if it has PENDING requests (Defect 06)', async () => {
      await adapter.createItem(testItem);
      await adapter.createBorrowRequest({
        itemId: testItem.id,
        borrowerAlias: 'Chris',
        startDate: '2026-12-20',
        endDate: '2026-12-22',
      });

      await expect(adapter.archiveItem(testItem.id)).rejects.toThrow(ItemHasPendingRequestsError);
    });
  });
});
