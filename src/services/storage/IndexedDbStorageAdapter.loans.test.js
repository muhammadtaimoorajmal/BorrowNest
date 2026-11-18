import { describe, it, expect, beforeEach } from 'vitest';
import { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter';
import {
  LoanNotFoundError,
  LoanStateTransitionError,
  CollectionDateNotReachedError,
  ReservationExpiredError,
  CollectionAlreadyRecordedError,
  BorrowerReceiptRequiredError,
  ReturnNotMarkedError,
  LoanAlreadyCompletedError,
  UncollectedReleaseNotAllowedError,
  ConditionValidationError,
  ItemHasActiveReservationError,
  ItemHasRequestHistoryError,
  ReservationConflictError,
} from './storageErrors';
import { LOAN_STATUS } from '../../features/borrowing/constants/loanStatus';
import { REQUEST_STATUS } from '../../features/borrowing/constants/requestStatus';
import { getLocalToday } from '../../features/borrowing/services/dateRange';

describe('Storage Adapter: Loan Lifecycle Operations (DR-04)', () => {
  let adapter;
  const dbName = 'BorrowNest_Loans_Test';
  const today = getLocalToday();

  // Helper date offset
  const addDays = (baseDate, days) => {
    const d = new Date(baseDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const testItem = {
    id: 'item-lawnmower',
    title: 'Honda Self-Propelled Gas Lawnmower',
    description: 'Clean lawnmower with bagger and mulching blade.',
    category: 'GARDENING',
    conditionGrade: 4,
    approximateArea: 'Greenwood / Pine Street',
    availability: 'AVAILABLE',
    status: 'ACTIVE',
    photos: [],
    createdAt: '2026-11-18T10:00:00.000Z',
    updatedAt: '2026-11-18T10:00:00.000Z',
  };

  beforeEach(async () => {
    adapter = new IndexedDbStorageAdapter(null, dbName);
    await adapter.initialize();
    await adapter.clearAllBorrowRequests();
    await adapter.clearAllItems();
  });

  it('creates exactly one RESERVED loan record when a request is approved', async () => {
    await adapter.createItem(testItem);

    const req = await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'Jordan Lee',
      startDate: addDays(today, 1),
      endDate: addDays(today, 4),
    });

    const approved = await adapter.approveBorrowRequest(req.id);
    expect(approved.status).toBe(REQUEST_STATUS.APPROVED);

    const loan = await adapter.getLoanByRequestId(req.id);
    expect(loan).toBeDefined();
    expect(loan.requestId).toBe(req.id);
    expect(loan.itemId).toBe(testItem.id);
    expect(loan.status).toBe(LOAN_STATUS.RESERVED);
    expect(loan.collectionDate).toBe(addDays(today, 1));
    expect(loan.returnDeadline).toBe(addDays(today, 4));
    expect(loan.collectedAt).toBeNull();
    expect(loan.completedAt).toBeNull();
  });

  it('records owner collection handover, keeping loan in RESERVED until borrower confirms receipt', async () => {
    await adapter.createItem(testItem);

    // Create loan starting today so collection is permitted
    const req = await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'Alex P.',
      startDate: today,
      endDate: addDays(today, 3),
    });
    await adapter.approveBorrowRequest(req.id);

    // 1. Owner records handover
    const checkpoint = {
      conditionGrade: 4,
      notes: 'Clean blade, full oil, full tank.',
      photos: [
        {
          id: 'p1',
          altText: 'Lawnmower deck and controls',
          mimeType: 'image/webp',
        },
      ],
    };

    const updated = await adapter.recordCollectionHandover(req.id, checkpoint);
    expect(updated.status).toBe(LOAN_STATUS.RESERVED);
    expect(updated.collectionCheckpoint).toBeDefined();
    expect(updated.collectionCheckpoint.ownerRecordedAt).toBeDefined();
    expect(updated.collectionCheckpoint.conditionGrade).toBe(4);
    expect(updated.collectionCheckpoint.conditionLabel).toBe('Good');
    expect(updated.collectedAt).toBeNull();

    // 2. Reject duplicate collection recording
    await expect(
      adapter.recordCollectionHandover(req.id, checkpoint),
    ).rejects.toThrow(CollectionAlreadyRecordedError);

    // 3. Borrower confirms receipt
    const activated = await adapter.confirmCollectionReceipt(req.id, {
      observation: 'Confirmed full tank and clean blade.',
    });
    expect(activated.status).toBe(LOAN_STATUS.ACTIVE);
    expect(activated.collectedAt).toBeDefined();
    expect(activated.collectionCheckpoint.borrowerReviewedAt).toBeDefined();
    expect(activated.collectionCheckpoint.borrowerObservation).toBe('Confirmed full tank and clean blade.');
  });

  it('rejects collection handover before collection date arrives', async () => {
    await adapter.createItem(testItem);

    const req = await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'Sam K.',
      startDate: addDays(today, 2), // 2 days in future
      endDate: addDays(today, 5),
    });
    await adapter.approveBorrowRequest(req.id);

    await expect(
      adapter.recordCollectionHandover(req.id, {
        conditionGrade: 4,
        notes: 'Handed over early',
      }),
    ).rejects.toThrow(CollectionDateNotReachedError);
  });

  it('coordinates return marking and owner return inspection to complete loan', async () => {
    await adapter.createItem(testItem);

    const req = await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'Taylor M.',
      startDate: today,
      endDate: addDays(today, 2),
    });
    await adapter.approveBorrowRequest(req.id);

    // Handover and receipt
    await adapter.recordCollectionHandover(req.id, {
      conditionGrade: 4,
      notes: 'Initial handover',
    });
    await adapter.confirmCollectionReceipt(req.id);

    // Borrower marks return
    const marked = await adapter.markLoanReturned(req.id);
    expect(marked.returnCheckpoint.borrowerReturnMarkedAt).toBeDefined();
    expect(marked.status).toBe(LOAN_STATUS.ACTIVE);

    // Owner completes inspection
    const completed = await adapter.completeReturnInspection(req.id, {
      conditionGrade: 4,
      notes: 'Returned in clean operational order.',
      photos: [
        {
          id: 'ret-p1',
          altText: 'Lawnmower returned clean',
          mimeType: 'image/webp',
        },
      ],
    });

    expect(completed.status).toBe(LOAN_STATUS.COMPLETED);
    expect(completed.completedAt).toBeDefined();
    expect(completed.returnCheckpoint.conditionGrade).toBe(4);
    expect(completed.returnCheckpoint.ownerInspectedAt).toBeDefined();

    // Verify completed loan is immutable (no reopening)
    await expect(
      adapter.completeReturnInspection(req.id, { conditionGrade: 4 }),
    ).rejects.toThrow();
  });

  it('strictly rejects owner inspection without borrower return marking and enforces idempotence (B1)', async () => {
    await adapter.createItem(testItem);

    const req = await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'Morgan R.',
      startDate: today,
      endDate: addDays(today, 3),
    });
    await adapter.approveBorrowRequest(req.id);
    await adapter.recordCollectionHandover(req.id, { conditionGrade: 4 });
    await adapter.confirmCollectionReceipt(req.id);

    // 1. Attempt inspection BEFORE borrower marks return -> MUST REJECT
    await expect(
      adapter.completeReturnInspection(req.id, { conditionGrade: 4, notes: 'Trying early inspection' }),
    ).rejects.toThrow(ReturnNotMarkedError);

    // 2. Verify state was NOT mutated
    const activeLoan = await adapter.getLoanByRequestId(req.id);
    expect(activeLoan.status).toBe(LOAN_STATUS.ACTIVE);
    expect(activeLoan.completedAt).toBeNull();
    expect(activeLoan.returnCheckpoint).toBeNull();

    // 3. Borrower marks return
    const markedLoan = await adapter.markLoanReturned(req.id);
    expect(markedLoan.status).toBe(LOAN_STATUS.ACTIVE);
    const firstMarkedAt = markedLoan.returnCheckpoint.borrowerReturnMarkedAt;
    expect(firstMarkedAt).toBeDefined();

    // 4. Repeated mark return is safe idempotent no-op without timestamp mutation
    const repeatMarked = await adapter.markLoanReturned(req.id);
    expect(repeatMarked.returnCheckpoint.borrowerReturnMarkedAt).toBe(firstMarkedAt);

    // 5. Owner completes return inspection -> SUCCEEDS
    const completedLoan = await adapter.completeReturnInspection(req.id, {
      conditionGrade: 4,
      notes: 'Item returned in expected condition.',
    });
    expect(completedLoan.status).toBe(LOAN_STATUS.COMPLETED);
    expect(completedLoan.completedAt).toBeDefined();
    expect(completedLoan.returnCheckpoint.borrowerReturnMarkedAt).toBe(firstMarkedAt);
    expect(completedLoan.returnCheckpoint.ownerInspectedAt).toBeDefined();

    // 6. Attempting further inspection on completed loan rejects with LoanAlreadyCompletedError
    await expect(
      adapter.completeReturnInspection(req.id, { conditionGrade: 4 }),
    ).rejects.toThrow(LoanAlreadyCompletedError);
  });

  it('enforces collection receipt confirmation window [collectionDate, returnDeadline] (B2)', async () => {
    await adapter.createItem(testItem);

    // Case A: Future collection date (today < collectionDate)
    const futureReqId = 'req-future-collection';
    await adapter.mergeAllData({
      items: [testItem],
      requests: [
        {
          id: futureReqId,
          itemId: testItem.id,
          borrowerAlias: 'Future Borrower',
          startDate: addDays(today, 3),
          endDate: addDays(today, 6),
          status: REQUEST_STATUS.APPROVED,
        },
      ],
      loans: [
        {
          requestId: futureReqId,
          itemId: testItem.id,
          borrowerAlias: 'Future Borrower',
          collectionDate: addDays(today, 3),
          returnDeadline: addDays(today, 6),
          status: LOAN_STATUS.RESERVED,
          collectionCheckpoint: {
            conditionGrade: 4,
            ownerRecordedAt: '2026-11-18T10:00:00.000Z',
          },
        },
      ],
    });

    await expect(adapter.confirmCollectionReceipt(futureReqId)).rejects.toThrow(
      CollectionDateNotReachedError,
    );

    // Case B: Expired return deadline (today > returnDeadline)
    const expiredReqId = 'req-expired-collection';
    await adapter.mergeAllData({
      items: [testItem],
      requests: [
        {
          id: expiredReqId,
          itemId: testItem.id,
          borrowerAlias: 'Late Borrower',
          startDate: addDays(today, -5),
          endDate: addDays(today, -1),
          status: REQUEST_STATUS.APPROVED,
        },
      ],
      loans: [
        {
          requestId: expiredReqId,
          itemId: testItem.id,
          borrowerAlias: 'Late Borrower',
          collectionDate: addDays(today, -5),
          returnDeadline: addDays(today, -1),
          status: LOAN_STATUS.RESERVED,
          collectionCheckpoint: {
            conditionGrade: 4,
            ownerRecordedAt: '2026-11-18T10:00:00.000Z',
          },
        },
      ],
    });

    await expect(adapter.confirmCollectionReceipt(expiredReqId)).rejects.toThrow(
      ReservationExpiredError,
    );
  });

  it('completed loan no longer blocks new reservations for the same dates', async () => {
    await adapter.createItem(testItem);

    const req1 = await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'User 1',
      startDate: today,
      endDate: addDays(today, 2),
    });
    await adapter.approveBorrowRequest(req1.id);
    await adapter.recordCollectionHandover(req1.id, { conditionGrade: 4, notes: 'OK' });
    await adapter.confirmCollectionReceipt(req1.id);
    await adapter.markLoanReturned(req1.id);
    await adapter.completeReturnInspection(req1.id, { conditionGrade: 4, notes: 'Completed' });

    // New request covering the SAME dates should now be permitted because loan is COMPLETED!
    const req2 = await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'User 2',
      startDate: today,
      endDate: addDays(today, 2),
    });
    expect(req2.id).toBeDefined();
    expect(req2.status).toBe(REQUEST_STATUS.PENDING);
  });

  it('permits releasing an uncollected reservation after its return deadline has passed', async () => {
    await adapter.createItem(testItem);

    // Seed an uncollected reservation with past dates directly via mergeAllData
    const pastStart = addDays(today, -10);
    const pastEnd = addDays(today, -2);
    const reqId = 'req-uncollected-past';

    await adapter.mergeAllData({
      items: [testItem],
      requests: [
        {
          id: reqId,
          itemId: testItem.id,
          borrowerAlias: 'Ghost Requester',
          startDate: pastStart,
          endDate: pastEnd,
          status: REQUEST_STATUS.APPROVED,
        },
      ],
      loans: [
        {
          requestId: reqId,
          itemId: testItem.id,
          borrowerAlias: 'Ghost Requester',
          collectionDate: pastStart,
          returnDeadline: pastEnd,
          status: LOAN_STATUS.RESERVED,
        },
      ],
    });

    const released = await adapter.releaseUncollectedReservation(reqId, {
      releaseNote: 'Borrower did not arrive for scheduled collection.',
    });

    expect(released.status).toBe(LOAN_STATUS.RELEASED_NOT_COLLECTED);
    expect(released.resolution).toBe('RELEASED_NOT_COLLECTED');
    expect(released.releasedAt).toBeDefined();
    expect(released.releaseNote).toContain('Borrower did not arrive');

    // Released reservations no longer block future dates or safety holds
    const newReq = await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'New Requester',
      startDate: today,
      endDate: addDays(today, 2),
    });
    expect(newReq.id).toBeDefined();
  });

  it('rejects releasing an uncollected reservation if its return deadline has NOT passed yet', async () => {
    await adapter.createItem(testItem);

    const req = await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'Active Reserved',
      startDate: today,
      endDate: addDays(today, 3),
    });
    await adapter.approveBorrowRequest(req.id);

    await expect(
      adapter.releaseUncollectedReservation(req.id, { releaseNote: 'Trying early release' }),
    ).rejects.toThrow(UncollectedReleaseNotAllowedError);
  });

  it('safeguards archiving: blocked for RESERVED or ACTIVE loans, allowed after COMPLETED', async () => {
    await adapter.createItem(testItem);

    const req = await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'Holder',
      startDate: today,
      endDate: addDays(today, 2),
    });
    await adapter.approveBorrowRequest(req.id);

    // Archiving blocked while RESERVED
    await expect(adapter.archiveItem(testItem.id)).rejects.toThrow(ItemHasActiveReservationError);

    // Complete the loan
    await adapter.recordCollectionHandover(req.id, { conditionGrade: 4 });
    await adapter.confirmCollectionReceipt(req.id);

    // Archiving blocked while ACTIVE
    await expect(adapter.archiveItem(testItem.id)).rejects.toThrow(ItemHasActiveReservationError);

    // Complete return
    await adapter.markLoanReturned(req.id);
    await adapter.completeReturnInspection(req.id, { conditionGrade: 4 });

    // Archiving now SUCCEEDS because loan is COMPLETED!
    const archived = await adapter.archiveItem(testItem.id);
    expect(archived.status).toBe('ARCHIVED');
  });

  it('safeguards deletion: permanently blocked when borrowing request or loan history exists', async () => {
    await adapter.createItem(testItem);

    await adapter.createBorrowRequest({
      itemId: testItem.id,
      borrowerAlias: 'Borrower',
      startDate: today,
      endDate: addDays(today, 2),
    });

    // Deletion blocked even when request is only PENDING
    await expect(adapter.deleteItem(testItem.id)).rejects.toThrow(ItemHasRequestHistoryError);
  });
});
