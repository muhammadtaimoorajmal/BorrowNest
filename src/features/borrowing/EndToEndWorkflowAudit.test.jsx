import { describe, it, expect, beforeEach } from 'vitest';
import { IndexedDbStorageAdapter } from '../../services/storage/IndexedDbStorageAdapter';
import { REQUEST_STATUS } from './constants/requestStatus';
import { LOAN_STATUS } from './constants/loanStatus';
import { getLocalToday } from './services/dateRange';
import {
  generateBackupData,
} from '../../services/backup/exportBackup';
import {
  parseAndValidateBackup,
  executeReplace,
} from '../../services/backup/importBackup';
import {
  ReservationConflictError,
  ItemHasActiveReservationError,
  ItemHasRequestHistoryError,
  BorrowerReceiptRequiredError,
  ReturnNotMarkedError,
  LoanAlreadyCompletedError,
} from '../../services/storage/storageErrors';

describe('Module 09: End-to-End Functional Integration & Lifecycle Audit', () => {
  let adapter;
  const dbName = `BorrowNest_E2E_Audit_${Date.now()}`;
  const today = getLocalToday();

  const addDays = (baseDate, days) => {
    const [y, m, d] = baseDate.split('-').map(Number);
    const date = new Date(y, m - 1, d + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  beforeEach(async () => {
    adapter = new IndexedDbStorageAdapter(null, dbName);
    await adapter.initialize();
    await adapter.clearAllBorrowRequests();
    await adapter.clearAllItems();
  });

  it('executes full end-to-end user journey: listing -> request -> approval -> handover -> return -> backup -> restore', async () => {
    // 1. Initial State: Zero records in local IndexedDB
    expect(await adapter.countItems()).toBe(0);
    const initialRequests = await adapter.listBorrowRequests();
    expect(initialRequests.length).toBe(0);
    const initialLoans = await adapter.listLoans();
    expect(initialLoans.length).toBe(0);

    // 2. Listing Creation: Owner lists an authentic tool
    const createdItem = await adapter.createItem({
      id: 'e2e-saw-01',
      title: 'DeWalt 20V Cordless Circular Saw',
      description: 'Clean circular saw with carbide blade, rip fence, and 4Ah battery.',
      category: 'TOOLS',
      conditionGrade: 4,
      conditionNotes: 'Light scuffs on shoe plate; motor runs smoothly with no sparking.',
      approximateArea: 'Greenwood / 85th St area',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photoAttestation: true,
      ownershipAttestation: true,
      photos: [
        {
          id: 'saw-photo-1',
          altText: 'DeWalt 20V Circular saw blade guard and battery handle',
          mimeType: 'image/jpeg',
          width: 600,
          height: 450,
          sizeBytes: 25000,
          dataUrl: 'data:image/jpeg;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=',
        },
      ],
    });

    expect(createdItem.id).toBeDefined();
    expect(createdItem.title).toBe('DeWalt 20V Cordless Circular Saw');
    expect(createdItem.availability).toBe('AVAILABLE');
    expect(await adapter.countItems()).toBe(1);

    // 3. Item Editing & Availability Toggling
    const updatedItem = await adapter.updateItem({
      ...createdItem,
      conditionNotes: 'Updated: includes blade wrench and extra framing blade.',
      availability: 'UNAVAILABLE',
    });
    expect(updatedItem.availability).toBe('UNAVAILABLE');
    expect(updatedItem.conditionNotes).toContain('extra framing blade');

    // Toggle back to available for borrowing
    await adapter.updateItem({
      ...updatedItem,
      availability: 'AVAILABLE',
    });

    // 4. Request Submission (Borrower Journey)
    const req1Start = today;
    const req1End = addDays(today, 3);
    const req1 = await adapter.createBorrowRequest({
      itemId: createdItem.id,
      borrowerAlias: 'Jordan Miller',
      startDate: req1Start,
      endDate: req1End,
      note: 'Building raised redwood planters this weekend.',
    });

    expect(req1.id).toBeDefined();
    expect(req1.status).toBe(REQUEST_STATUS.PENDING);
    expect(req1.itemId).toBe(createdItem.id);

    // 5. Owner Decision Workflow: Approve Request 1
    const approvedReq = await adapter.approveBorrowRequest(req1.id);
    expect(approvedReq.status).toBe(REQUEST_STATUS.APPROVED);

    // Verify corresponding loan was atomically initialized in RESERVED state
    const loan1 = await adapter.getLoanByRequestId(req1.id);
    expect(loan1).toBeDefined();
    expect(loan1.status).toBe(LOAN_STATUS.RESERVED);
    expect(loan1.collectionDate).toBe(req1Start);
    expect(loan1.returnDeadline).toBe(req1End);
    expect(loan1.collectedAt).toBeNull();

    // 6. Date Conflict Prevention (DR-03): Attempt overlapping request submission
    await expect(
      adapter.createBorrowRequest({
        itemId: createdItem.id,
        borrowerAlias: 'Casey Wood',
        startDate: addDays(today, 1), // Overlaps with req1 [today..today+3]
        endDate: addDays(today, 4),
      }),
    ).rejects.toThrow(ReservationConflictError);

    // 7. Forbidden Lifecycle Transition: Borrower receipt BEFORE owner handover
    await expect(adapter.confirmCollectionReceipt(req1.id)).rejects.toThrow(
      BorrowerReceiptRequiredError,
    );

    // 8. Physical Collection Handover (DR-04 Handshake Step 1)
    const handoverCheckpoint = {
      conditionGrade: 4,
      notes: 'Carbide blade clean, battery fully charged at handover.',
      photos: [
        {
          id: 'handover-p1',
          altText: 'Circular saw motor and blade condition at handover',
          mimeType: 'image/jpeg',
          dataUrl: 'data:image/jpeg;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=',
        },
      ],
    };
    const loanAfterHandover = await adapter.recordCollectionHandover(req1.id, handoverCheckpoint);
    expect(loanAfterHandover.status).toBe(LOAN_STATUS.RESERVED);
    expect(loanAfterHandover.collectionCheckpoint.ownerRecordedAt).toBeDefined();
    expect(loanAfterHandover.collectedAt).toBeNull();

    // 9. Physical Collection Receipt (DR-04 Handshake Step 2)
    const activatedLoan = await adapter.confirmCollectionReceipt(req1.id, {
      observation: 'Confirmed battery charged and blade sharp.',
    });
    expect(activatedLoan.status).toBe(LOAN_STATUS.ACTIVE);
    expect(activatedLoan.collectedAt).toBeDefined();

    // 10. Relational Safeguard: Archiving blocked while loan is ACTIVE
    await expect(adapter.archiveItem(createdItem.id)).rejects.toThrow(
      ItemHasActiveReservationError,
    );

    // 11. Forbidden Lifecycle Transition: Owner inspects return BEFORE borrower marks return
    await expect(
      adapter.completeReturnInspection(req1.id, { conditionGrade: 4, notes: 'Early inspection attempt' }),
    ).rejects.toThrow(ReturnNotMarkedError);

    // 12. Physical Return Handshake: Borrower marks item returned
    const markedLoan = await adapter.markLoanReturned(req1.id);
    expect(markedLoan.returnCheckpoint.borrowerReturnMarkedAt).toBeDefined();
    expect(markedLoan.status).toBe(LOAN_STATUS.ACTIVE);

    // 13. Owner Return Condition Inspection (DR-04 Step 3)
    const returnCheckpoint = {
      conditionGrade: 4,
      notes: 'Returned in clean condition, blade intact, battery charger returned.',
      photos: [
        {
          id: 'return-p1',
          altText: 'Circular saw upon physical return to owner',
          mimeType: 'image/jpeg',
          dataUrl: 'data:image/jpeg;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=',
        },
      ],
    };
    const completedLoan = await adapter.completeReturnInspection(req1.id, returnCheckpoint);
    expect(completedLoan.status).toBe(LOAN_STATUS.COMPLETED);
    expect(completedLoan.completedAt).toBeDefined();

    // 14. Forbidden Transition: Re-inspecting already completed loan
    await expect(
      adapter.completeReturnInspection(req1.id, { conditionGrade: 4 }),
    ).rejects.toThrow(LoanAlreadyCompletedError);

    // 15. Calendar Date Unblocking: New request for previously reserved dates now succeeds
    const reuseDateReq = await adapter.createBorrowRequest({
      itemId: createdItem.id,
      borrowerAlias: 'Taylor Next',
      startDate: req1Start,
      endDate: req1End,
    });
    const approvedReuse = await adapter.approveBorrowRequest(reuseDateReq.id);
    expect(approvedReuse.status).toBe(REQUEST_STATUS.APPROVED);

    // 16. Permanent Deletion Safeguard: Blocked even after loans complete
    await expect(adapter.deleteItem(createdItem.id)).rejects.toThrow(
      ItemHasRequestHistoryError,
    );

    // 17. Backup Export: Generate validated full archive
    const backupData = await generateBackupData(adapter);
    expect(backupData.format).toBe('borrownest-backup');
    expect(backupData.schemaVersion).toBe(3);
    expect(backupData.itemCount).toBe(1);
    expect(backupData.requestCount).toBe(2); // req1, reuseDateReq
    expect(backupData.loanCount).toBe(2); // loan1 (COMPLETED), reuseLoan (RESERVED)
    expect(backupData.items[0].photos.length).toBe(1);
    expect(backupData.items[0].photos[0].dataUrl).toMatch(/^data:image\/jpeg;base64,/);

    // 18. Complete Database Destruction & Restoration Audit
    await adapter.clearAllBorrowRequests();
    await adapter.clearAllItems();
    expect(await adapter.countItems()).toBe(0);
    expect((await adapter.listBorrowRequests()).length).toBe(0);
    expect((await adapter.listLoans()).length).toBe(0);

    // Parse, validate, and restore via replace
    const parsedBackup = await parseAndValidateBackup(JSON.stringify(backupData));
    expect(parsedBackup.preview.itemCount).toBe(1);
    expect(parsedBackup.preview.loanCount).toBe(2);

    const restoreResult = await executeReplace(parsedBackup, adapter);
    expect(restoreResult.replacedCount).toBe(1);
    expect(restoreResult.replacedRequestsCount).toBe(2);
    expect(restoreResult.replacedLoansCount).toBe(2);

    // Verify all records and photos are restored intact in IndexedDB
    expect(await adapter.countItems()).toBe(1);
    const restoredItem = await adapter.getItemById(createdItem.id);
    expect(restoredItem.title).toBe('DeWalt 20V Cordless Circular Saw');
    expect(restoredItem.photos.length).toBe(1);
    expect(restoredItem.photos[0].altText).toBe('DeWalt 20V Circular saw blade guard and battery handle');
    expect(restoredItem.photos[0].sizeBytes).toBeGreaterThan(0);
    expect(restoredItem.photos[0].mimeType).toBe('image/webp');

    const restoredLoans = await adapter.listLoans();
    expect(restoredLoans.length).toBe(2);
    const restoredCompletedLoan = restoredLoans.find((l) => l.requestId === req1.id);
    expect(restoredCompletedLoan.status).toBe(LOAN_STATUS.COMPLETED);
    expect(restoredCompletedLoan.collectionCheckpoint.conditionGrade).toBe(4);
    expect(restoredCompletedLoan.returnCheckpoint.conditionGrade).toBe(4);
  });
});
