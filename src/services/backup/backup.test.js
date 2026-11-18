import { describe, it, expect, beforeEach } from 'vitest';
import { generateBackupData } from './exportBackup';
import {
  parseAndValidateBackup,
  executeMerge,
  executeReplace,
  BackupValidationError,
} from './importBackup';
import { IndexedDbStorageAdapter } from '../storage/IndexedDbStorageAdapter';
import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION } from './backupSchema';
import { REQUEST_STATUS } from '../../features/borrowing/constants/requestStatus';

describe('Backup and Restore Subsystem (Schema V1 & V2)', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new IndexedDbStorageAdapter(null, `BorrowNest_Backup_Test_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    await adapter.initialize();
    await adapter.clearAllItems();
  });

  const validItemFixture = {
    schemaVersion: 1,
    id: 'backup-item-1',
    title: 'Pressure Washer 2000 PSI',
    description: 'Electric pressure washer with soap cannon and turbo nozzle attachments.',
    category: 'TOOLS',
    conditionGrade: 4,
    conditionNotes: 'Works great, hose has light scuffing.',
    approximateArea: 'North Hills / Near Water Tower',
    availability: 'AVAILABLE',
    status: 'ACTIVE',
    photoAttestation: true,
    photos: [
      {
        id: 'photo-1',
        dataUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=',
        altText: 'Front angle of yellow electric pressure washer',
        mimeType: 'image/webp',
        width: 800,
        height: 600,
        sizeBytes: 1200,
      },
    ],
    createdAt: '2026-11-18T09:00:00.000Z',
    updatedAt: '2026-11-18T09:00:00.000Z',
  };

  const validRequestFixture = {
    id: 'backup-req-1',
    itemId: 'backup-item-1',
    borrowerAlias: 'Alex Green',
    startDate: '2026-12-01',
    endDate: '2026-12-05',
    requestNote: 'Need for weekend patio cleaning',
    status: REQUEST_STATUS.APPROVED,
    createdAt: '2026-11-18T10:00:00.000Z',
    updatedAt: '2026-11-18T10:15:00.000Z',
    decidedAt: '2026-11-18T10:15:00.000Z',
  };

  const validBackupFixtureV2 = {
    format: BACKUP_FORMAT,
    schemaVersion: 2,
    exportedAt: '2026-11-18T11:00:00.000Z',
    itemCount: 1,
    requestCount: 1,
    items: [validItemFixture],
    borrowingRequests: [validRequestFixture],
  };

  const validBackupFixtureV1 = {
    format: BACKUP_FORMAT,
    schemaVersion: 1,
    exportedAt: '2026-11-18T10:00:00.000Z',
    itemCount: 1,
    items: [validItemFixture],
  };

  it('generates valid backup JSON schema v2 from storage adapter', async () => {
    const backupData = await generateBackupData(adapter);
    expect(backupData.format).toBe(BACKUP_FORMAT);
    expect(backupData.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(backupData.itemCount).toBe(0);
    expect(backupData.requestCount).toBe(0);
    expect(backupData.items).toEqual([]);
    expect(backupData.borrowingRequests).toEqual([]);
  });

  it('parses and previews valid v2 backup data correctly', async () => {
    const jsonStr = JSON.stringify(validBackupFixtureV2);
    const { preview, items, requests } = await parseAndValidateBackup(jsonStr);

    expect(preview.schemaVersion).toBe(2);
    expect(preview.itemCount).toBe(1);
    expect(preview.activeCount).toBe(1);
    expect(preview.photoCount).toBe(1);
    expect(preview.requestCount).toBe(1);
    expect(preview.approvedRequestCount).toBe(1);
    expect(preview.pendingRequestCount).toBe(0);
    expect(items.length).toBe(1);
    expect(items[0].id).toBe('backup-item-1');
    expect(requests.length).toBe(1);
    expect(requests[0].id).toBe('backup-req-1');
  });

  it('parses and previews legacy v1 backup data with 0 requests for backward compatibility', async () => {
    const jsonStr = JSON.stringify(validBackupFixtureV1);
    const { preview, items, requests } = await parseAndValidateBackup(jsonStr);

    expect(preview.schemaVersion).toBe(1);
    expect(preview.itemCount).toBe(1);
    expect(preview.activeCount).toBe(1);
    expect(preview.requestCount).toBe(0);
    expect(items.length).toBe(1);
    expect(requests).toEqual([]);
  });

  it('rejects malformed JSON strings', async () => {
    await expect(parseAndValidateBackup('not a json string {')).rejects.toThrow(
      BackupValidationError,
    );
  });

  it('rejects backup with invalid format identifier', async () => {
    const invalidFormat = { ...validBackupFixtureV2, format: 'unknown-format' };
    await expect(parseAndValidateBackup(JSON.stringify(invalidFormat))).rejects.toThrow(
      /Unrecognized backup format/i,
    );
  });

  it('rejects backup with unsupported schema version', async () => {
    const invalidVer = { ...validBackupFixtureV2, schemaVersion: 99 };
    await expect(parseAndValidateBackup(JSON.stringify(invalidVer))).rejects.toThrow(
      /Unsupported backup schema version/i,
    );
  });

  it('rejects backup containing corrupted or invalid item records', async () => {
    const corrupted = {
      ...validBackupFixtureV2,
      items: [
        {
          id: 'corrupted-item',
          title: 'Hi',
          description: 'Too short',
          category: 'INVALID_CATEGORY',
        },
      ],
    };
    await expect(parseAndValidateBackup(JSON.stringify(corrupted))).rejects.toThrow(
      /Invalid item data in backup/i,
    );
  });

  it('rejects backup when request references non-existent item in backup archive', async () => {
    const orphanRequestBackup = {
      ...validBackupFixtureV2,
      borrowingRequests: [
        {
          ...validRequestFixture,
          itemId: 'non-existent-item-999',
        },
      ],
    };
    await expect(parseAndValidateBackup(JSON.stringify(orphanRequestBackup))).rejects.toThrow(
      /references item "non-existent-item-999" which does not exist/i,
    );
  });

  it('rejects backup with invalid request status', async () => {
    const invalidStatusBackup = {
      ...validBackupFixtureV2,
      borrowingRequests: [
        {
          ...validRequestFixture,
          status: 'COMPLETED_EARLY_INVALID',
        },
      ],
    };
    await expect(parseAndValidateBackup(JSON.stringify(invalidStatusBackup))).rejects.toThrow(
      /Invalid borrowing request at index 0/i,
    );
  });

  it('rejects backup with duplicate request IDs', async () => {
    const duplicateReqBackup = {
      ...validBackupFixtureV2,
      borrowingRequests: [
        validRequestFixture,
        {
          ...validRequestFixture,
          startDate: '2026-12-10',
          endDate: '2026-12-15',
        },
      ],
    };
    await expect(parseAndValidateBackup(JSON.stringify(duplicateReqBackup))).rejects.toThrow(
      /Duplicate request ID "backup-req-1"/i,
    );
  });

  it('rejects backup with invalid date range in request', async () => {
    const invalidDatesBackup = {
      ...validBackupFixtureV2,
      borrowingRequests: [
        {
          ...validRequestFixture,
          startDate: '2026-12-10',
          endDate: '2026-12-05', // End before start!
        },
      ],
    };
    await expect(parseAndValidateBackup(JSON.stringify(invalidDatesBackup))).rejects.toThrow(
      /Invalid borrowing request/i,
    );
  });

  it('rejects backup containing internally conflicting approved requests for the same item', async () => {
    const conflictingApprovedBackup = {
      ...validBackupFixtureV2,
      borrowingRequests: [
        {
          ...validRequestFixture,
          id: 'req-a',
          startDate: '2026-12-01',
          endDate: '2026-12-05',
          status: REQUEST_STATUS.APPROVED,
        },
        {
          ...validRequestFixture,
          id: 'req-b',
          startDate: '2026-12-03', // Overlaps with req-a!
          endDate: '2026-12-08',
          status: REQUEST_STATUS.APPROVED,
        },
      ],
    };
    await expect(parseAndValidateBackup(JSON.stringify(conflictingApprovedBackup))).rejects.toThrow(
      /internally conflicting approved reservations/i,
    );
  });

  it('permits backup containing overlapping PENDING requests', async () => {
    const overlappingPendingBackup = {
      ...validBackupFixtureV2,
      borrowingRequests: [
        {
          ...validRequestFixture,
          id: 'pending-a',
          startDate: '2026-12-01',
          endDate: '2026-12-05',
          status: REQUEST_STATUS.PENDING,
        },
        {
          ...validRequestFixture,
          id: 'pending-b',
          startDate: '2026-12-03',
          endDate: '2026-12-08',
          status: REQUEST_STATUS.PENDING,
        },
      ],
    };
    const parsed = await parseAndValidateBackup(JSON.stringify(overlappingPendingBackup));
    expect(parsed.preview.pendingRequestCount).toBe(2);
    expect(parsed.requests.length).toBe(2);
  });

  it('executes MERGE by adding novel items and requests and skipping duplicates', async () => {
    const parsed = await parseAndValidateBackup(JSON.stringify(validBackupFixtureV2));

    // First merge
    const result1 = await executeMerge(parsed, adapter);
    expect(result1.addedItemsCount).toBe(1);
    expect(result1.addedRequestsCount).toBe(1);
    expect(await adapter.countItems()).toBe(1);
    expect((await adapter.listBorrowRequests()).length).toBe(1);

    // Second merge with same items and requests
    const result2 = await executeMerge(parsed, adapter);
    expect(result2.addedItemsCount).toBe(0);
    expect(result2.addedRequestsCount).toBe(0);
    expect(result2.skippedItemsCount).toBe(1);
    expect(result2.skippedRequestsCount).toBe(1);
    expect(await adapter.countItems()).toBe(1);
    expect((await adapter.listBorrowRequests()).length).toBe(1);
  });

  it('executes MERGE with v1 payload while preserving existing requests in storage', async () => {
    // Seed an item and request first
    await adapter.createItem({
      ...validItemFixture,
      id: 'existing-item-1',
      photos: [],
    });
    await adapter.createBorrowRequest({
      itemId: 'existing-item-1',
      borrowerAlias: 'Existing Borrower',
      startDate: '2026-12-20',
      endDate: '2026-12-25',
    });

    expect(await adapter.countItems()).toBe(1);
    expect((await adapter.listBorrowRequests()).length).toBe(1);

    // Now merge v1 backup containing a different item
    const v1Backup = {
      ...validBackupFixtureV1,
      items: [
        {
          ...validItemFixture,
          id: 'v1-novel-item',
        },
      ],
    };
    const parsedV1 = await parseAndValidateBackup(JSON.stringify(v1Backup));
    const mergeResult = await executeMerge(parsedV1, adapter);

    expect(mergeResult.addedItemsCount).toBe(1);
    expect(mergeResult.addedRequestsCount).toBe(0);
    // Crucial check: existing request is preserved
    expect(await adapter.countItems()).toBe(2);
    const currentRequests = await adapter.listBorrowRequests();
    expect(currentRequests.length).toBe(1);
    expect(currentRequests[0].borrowerAlias).toBe('Existing Borrower');
  });

  it('executes REPLACE by atomically clearing and replacing both items and requests', async () => {
    // Add existing dummy item and request
    await adapter.createItem({
      id: 'existing-local-item',
      title: 'Old Lawn Mower',
      description: 'Existing lawn mower in local database before replacement.',
      category: 'GARDENING',
      conditionGrade: 3,
      approximateArea: 'East Park',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photoAttestation: true,
      photos: [{ id: 'p', altText: 'Old lawn mower', blob: new Blob(['x']) }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await adapter.createBorrowRequest({
      id: 'old-req',
      itemId: 'existing-local-item',
      borrowerAlias: 'Old Borrower',
      startDate: '2026-12-10',
      endDate: '2026-12-15',
    });

    expect(await adapter.countItems()).toBe(1);
    expect((await adapter.listBorrowRequests()).length).toBe(1);

    const parsed = await parseAndValidateBackup(JSON.stringify(validBackupFixtureV2));
    const { replacedItemsCount, replacedRequestsCount } = await executeReplace(parsed, adapter);

    expect(replacedItemsCount).toBe(1);
    expect(replacedRequestsCount).toBe(1);
    expect(await adapter.countItems()).toBe(1);
    expect((await adapter.listBorrowRequests()).length).toBe(1);

    const retrievedItem = await adapter.getItemById('backup-item-1');
    expect(retrievedItem.title).toBe('Pressure Washer 2000 PSI');
    const retrievedReq = await adapter.getBorrowRequestById('backup-req-1');
    expect(retrievedReq.borrowerAlias).toBe('Alex Green');
  });

  it('executes REPLACE with v1 payload clearing existing requests and replacing items', async () => {
    await adapter.createItem({
      id: 'old-item',
      title: 'Old Item',
      description: 'Will be replaced by v1 backup',
      category: 'TOOLS',
      conditionGrade: 3,
      approximateArea: 'Central',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photoAttestation: true,
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await adapter.createBorrowRequest({
      id: 'old-req',
      itemId: 'old-item',
      borrowerAlias: 'Old User',
      startDate: '2026-12-10',
      endDate: '2026-12-15',
    });

    const parsedV1 = await parseAndValidateBackup(JSON.stringify(validBackupFixtureV1));
    const result = await executeReplace(parsedV1, adapter);

    expect(result.replacedItemsCount).toBe(1);
    expect(result.replacedRequestsCount).toBe(0);
    expect(await adapter.countItems()).toBe(1);
    expect((await adapter.listBorrowRequests()).length).toBe(0); // Requests cleared cleanly
  });

  it('executes empty backup replacement cleanly', async () => {
    const emptyBackup = {
      format: BACKUP_FORMAT,
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      itemCount: 0,
      requestCount: 0,
      items: [],
      borrowingRequests: [],
    };
    const parsed = await parseAndValidateBackup(JSON.stringify(emptyBackup));
    const result = await executeReplace(parsed, adapter);
    expect(result.replacedItemsCount).toBe(0);
    expect(result.replacedRequestsCount).toBe(0);
    expect(await adapter.countItems()).toBe(0);
    expect((await adapter.listBorrowRequests()).length).toBe(0);
  });

  it('merge conflict aborts without partial import', async () => {
    // Create an item and approved reservation in DB
    await adapter.createItem({
      ...validItemFixture,
      id: 'item-conflict-test',
      photos: [],
    });
    const existingReq = await adapter.createBorrowRequest({
      itemId: 'item-conflict-test',
      borrowerAlias: 'Existing User',
      startDate: '2026-12-05',
      endDate: '2026-12-10',
    });
    await adapter.approveBorrowRequest(existingReq.id);

    // Attempt to merge a backup with a novel approved reservation that overlaps with existing one
    const conflictingBackup = {
      format: BACKUP_FORMAT,
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      itemCount: 1,
      requestCount: 1,
      items: [
        {
          ...validItemFixture,
          id: 'item-conflict-test',
        },
      ],
      borrowingRequests: [
        {
          id: 'new-overlapping-req',
          itemId: 'item-conflict-test',
          borrowerAlias: 'Novel User',
          startDate: '2026-12-08', // Overlaps with 2026-12-05 - 2026-12-10!
          endDate: '2026-12-12',
          status: REQUEST_STATUS.APPROVED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    const parsed = await parseAndValidateBackup(JSON.stringify(conflictingBackup));
    await expect(executeMerge(parsed, adapter)).rejects.toThrow(/conflict/i);

    // Ensure no partial state was written
    const reqsAfter = await adapter.listBorrowRequests();
    expect(reqsAfter.length).toBe(1);
    expect(reqsAfter[0].id).toBe(existingReq.id);
  });

  describe('Robust Merge Error Handling', () => {
    it('propagates unexpected storage errors without silently swallowing them', async () => {
      const failingAdapter = {
        mergeAllData: () => {
          throw new Error('Unexpected fatal database corruption');
        },
      };

      const items = [{ id: 'test-item-x', title: 'Sample' }];
      await expect(executeMerge(items, failingAdapter)).rejects.toThrow(
        /Unexpected fatal database corruption/i,
      );
    });

    it('rejects merging items with missing or invalid IDs', async () => {
      const invalidItems = [{ title: 'No ID item' }];
      await expect(executeMerge(invalidItems, adapter)).rejects.toThrow(/missing id/i);
    });
  });

  describe('Photo Validation in Backup Import', () => {
    it('rejects backup with unsupported image MIME type (e.g. SVG or GIF)', async () => {
      const unsupportedPhotoBackup = {
        ...validBackupFixtureV2,
        items: [
          {
            ...validBackupFixtureV2.items[0],
            photos: [
              {
                id: 'p-svg',
                altText: 'Vector illustration',
                dataUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
              },
            ],
          },
        ],
      };

      await expect(parseAndValidateBackup(JSON.stringify(unsupportedPhotoBackup))).rejects.toThrow(
        /unsupported MIME type/i,
      );
    });

    it('rejects backup with malformed base64 image payload', async () => {
      const malformedPhotoBackup = {
        ...validBackupFixtureV2,
        items: [
          {
            ...validBackupFixtureV2.items[0],
            photos: [
              {
                id: 'p-corrupt',
                altText: 'Corrupted image',
                dataUrl: 'data:image/webp;base64,!!!NotBase64Data!!!',
              },
            ],
          },
        ],
      };

      await expect(parseAndValidateBackup(JSON.stringify(malformedPhotoBackup))).rejects.toThrow(
        /Failed to decode photo/i,
      );
    });

    it('rejects photo missing required accessible altText description', async () => {
      const noAltBackup = {
        ...validBackupFixtureV2,
        items: [
          {
            ...validBackupFixtureV2.items[0],
            photos: [
              {
                id: 'p-no-alt',
                altText: '   ',
                dataUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=',
              },
            ],
          },
        ],
      };

      await expect(parseAndValidateBackup(JSON.stringify(noAltBackup))).rejects.toThrow(
        /missing required accessible description/i,
      );
    });

    it('reprocesses accepted photo into a clean WebP/JPEG Blob stripping original metadata', async () => {
      const { items } = await parseAndValidateBackup(JSON.stringify(validBackupFixtureV2));
      expect(items[0].photos.length).toBe(1);
      const processedPhoto = items[0].photos[0];

      expect(processedPhoto.blob).toBeInstanceOf(Blob);
      expect(['image/webp', 'image/jpeg']).toContain(processedPhoto.mimeType);
      expect(processedPhoto.altText).toBe('Front angle of yellow electric pressure washer');
      expect(processedPhoto.width).toBeLessThanOrEqual(1600);
      expect(processedPhoto.height).toBeLessThanOrEqual(1600);
    });
  });

  describe('Schema Version 3 & Loan Lifecycle Backup/Restore (DR-04)', () => {
    const validBackupFixtureV3 = {
      format: BACKUP_FORMAT,
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      itemCount: 1,
      requestCount: 1,
      loanCount: 1,
      items: [
        {
          ...validItemFixture,
          id: 'item-v3',
        },
      ],
      borrowingRequests: [
        {
          id: 'req-v3-approved',
          itemId: 'item-v3',
          borrowerAlias: 'Morgan Reed',
          startDate: '2026-12-01',
          endDate: '2026-12-04',
          status: REQUEST_STATUS.APPROVED,
          createdAt: '2026-11-18T10:00:00.000Z',
          updatedAt: '2026-11-18T11:00:00.000Z',
          decidedAt: '2026-11-18T11:00:00.000Z',
        },
      ],
      loans: [
        {
          schemaVersion: 1,
          requestId: 'req-v3-approved',
          itemId: 'item-v3',
          borrowerAlias: 'Morgan Reed',
          collectionDate: '2026-12-01',
          returnDeadline: '2026-12-04',
          status: 'ACTIVE',
          reservedAt: '2026-11-18T11:00:00.000Z',
          collectedAt: '2026-12-01T10:00:00.000Z',
          collectionCheckpoint: {
            conditionGrade: 4,
            conditionLabel: 'Good',
            notes: 'Handover complete and clean',
            ownerRecordedAt: '2026-12-01T09:50:00.000Z',
            borrowerReviewedAt: '2026-12-01T10:00:00.000Z',
            borrowerObservation: 'Confirmed',
            photos: [
              {
                id: 'cp-photo-1',
                altText: 'Collection handover photo of pressure washer',
                dataUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=',
              },
            ],
          },
          createdAt: '2026-11-18T11:00:00.000Z',
          updatedAt: '2026-12-01T10:00:00.000Z',
        },
      ],
    };

    it('generates valid schema v3 backup including loans and checkpoint photos', async () => {
      await adapter.createItem({ ...validItemFixture, id: 'item-export-test' });
      const req = await adapter.createBorrowRequest({
        itemId: 'item-export-test',
        borrowerAlias: 'Riley Quinn',
        startDate: '2026-12-20',
        endDate: '2026-12-23',
      });
      await adapter.approveBorrowRequest(req.id);

      const backup = await generateBackupData(adapter);
      expect(backup.schemaVersion).toBe(3);
      expect(backup.format).toBe(BACKUP_FORMAT);
      expect(backup.loanCount).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(backup.loans)).toBe(true);

      const exportedLoan = backup.loans.find((l) => l.requestId === req.id);
      expect(exportedLoan).toBeDefined();
      expect(exportedLoan.status).toBe('RESERVED');
    });

    it('parses and previews valid v3 backup with active loans', async () => {
      const parsed = await parseAndValidateBackup(JSON.stringify(validBackupFixtureV3));
      expect(parsed.preview.schemaVersion).toBe(3);
      expect(parsed.preview.loanCount).toBe(1);
      expect(parsed.preview.activeLoanCount).toBe(1);
      expect(parsed.loans.length).toBe(1);

      const loan = parsed.loans[0];
      expect(loan.requestId).toBe('req-v3-approved');
      expect(loan.status).toBe('ACTIVE');
      expect(loan.collectionCheckpoint.photos.length).toBe(1);
      expect(loan.collectionCheckpoint.photos[0].blob).toBeInstanceOf(Blob);
    });

    it('derives RESERVED loans when importing v2 backup archives', async () => {
      const parsed = await parseAndValidateBackup(JSON.stringify(validBackupFixtureV2));
      expect(parsed.preview.schemaVersion).toBe(2);
      expect(parsed.loans.length).toBe(1);
      expect(parsed.loans[0].status).toBe('RESERVED');
      expect(parsed.loans[0].provenance).toBe('MIGRATED_FROM_V2_BACKUP');
    });

    it('rejects v3 backup when approved request is missing its corresponding loan', async () => {
      const missingLoanBackup = {
        ...validBackupFixtureV3,
        loans: [], // Empty loans array despite having an approved request
      };

      await expect(parseAndValidateBackup(JSON.stringify(missingLoanBackup))).rejects.toThrow(
        /missing its corresponding loan lifecycle record/i,
      );
    });

    it('rejects v3 backup when loan references a non-existent or unapproved request', async () => {
      const orphanedLoanBackup = {
        ...validBackupFixtureV3,
        loans: [
          {
            ...validBackupFixtureV3.loans[0],
            requestId: 'non-existent-req-id',
          },
        ],
      };

      await expect(parseAndValidateBackup(JSON.stringify(orphanedLoanBackup))).rejects.toThrow(
        /does not correspond to an approved borrowing request/i,
      );
    });

    it('executes atomic three-store REPLACE and MERGE restoring items, requests, and loans', async () => {
      const parsed = await parseAndValidateBackup(JSON.stringify(validBackupFixtureV3));

      // Replace
      const replaceRes = await executeReplace(parsed, adapter);
      expect(replaceRes.replacedItemsCount).toBe(1);
      expect(replaceRes.replacedRequestsCount).toBe(1);
      expect(replaceRes.replacedLoansCount).toBe(1);

      const items = await adapter.listItems();
      const requests = await adapter.listBorrowRequests();
      const loans = await adapter.listLoans();
      expect(items.length).toBe(1);
      expect(requests.length).toBe(1);
      expect(loans.length).toBe(1);
      expect(loans[0].status).toBe('ACTIVE');

      // Merge another novel payload
      const mergePayload = {
        items: [{ ...validItemFixture, id: 'item-merge-v3' }],
        requests: [
          {
            id: 'req-merge-v3',
            itemId: 'item-merge-v3',
            borrowerAlias: 'Novel Merger',
            startDate: '2026-12-25',
            endDate: '2026-12-28',
            status: REQUEST_STATUS.PENDING,
          },
        ],
        loans: [],
      };

      const mergeRes = await executeMerge(mergePayload, adapter);
      expect(mergeRes.addedItemsCount).toBe(1);
      expect(mergeRes.addedRequestsCount).toBe(1);

      expect((await adapter.listItems()).length).toBe(2);
      expect((await adapter.listBorrowRequests()).length).toBe(2);
      expect((await adapter.listLoans()).length).toBe(1);
    });
  });
});
