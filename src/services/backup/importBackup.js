import {
  BACKUP_FORMAT,
  SUPPORTED_BACKUP_SCHEMA_VERSIONS,
  base64ToBlob,
  MAX_BACKUP_FILE_BYTES,
} from './backupSchema';
import { validateItemRecord } from '../../features/listings/validation/itemValidation';
import {
  normalizeBorrowRequest,
  validateBorrowRequestRecord,
} from '../../features/borrowing/services/borrowRequestValidation';
import {
  findConflictingReservations,
} from '../../features/borrowing/services/dateRange';
import { REQUEST_STATUS } from '../../features/borrowing/constants/requestStatus';
import {
  LOAN_STATUS,
} from '../../features/borrowing/constants/loanStatus';
import {
  normalizeLoanRecord,
  validateLoanRecord,
} from '../../features/borrowing/services/loanValidation';
import { StorageError } from '../storage/storageErrors';
import {
  processItemImage,
  ALLOWED_INPUT_MIME_TYPES,
} from '../../features/listings/services/processItemImage';

export class BackupValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BackupValidationError';
  }
}

async function rehydrateCheckpointPhotos(photos = [], contextLabel = '') {
  if (!Array.isArray(photos)) return [];
  if (photos.length > 5) {
    throw new BackupValidationError(`${contextLabel} exceeds maximum allowed photos (5).`);
  }
  return Promise.all(
    photos.map(async (photo, pIdx) => {
      if (!photo || typeof photo !== 'object') {
        throw new BackupValidationError(`Photo #${pIdx + 1} in ${contextLabel} is not a valid object.`);
      }
      const altText = (photo.altText || '').trim();
      if (!altText) {
        throw new BackupValidationError(
          `Photo #${pIdx + 1} in ${contextLabel} is missing required accessible description (altText).`,
        );
      }
      let rawBlob = photo.blob;
      if (!rawBlob && photo.dataUrl) {
        try {
          rawBlob = await base64ToBlob(photo.dataUrl);
        } catch (err) {
          throw new BackupValidationError(
            `Failed to decode photo #${pIdx + 1} in ${contextLabel}: ${err.message}`,
          );
        }
      }
      if (!rawBlob || !(rawBlob instanceof Blob)) {
        throw new BackupValidationError(`Photo #${pIdx + 1} in ${contextLabel} has no valid Blob or dataUrl.`);
      }
      const rawMime = (rawBlob.type || '').toLowerCase();
      if (!ALLOWED_INPUT_MIME_TYPES.includes(rawMime)) {
        throw new BackupValidationError(
          `Photo #${pIdx + 1} in ${contextLabel} has unsupported MIME type "${rawMime}". Allowed: JPEG, PNG, WebP.`,
        );
      }
      let processed;
      try {
        processed = await processItemImage(rawBlob);
      } catch (err) {
        throw new BackupValidationError(
          `Failed to process photo #${pIdx + 1} in ${contextLabel}: ${err.message}`,
        );
      }
      return {
        id: photo.id && typeof photo.id === 'string' ? photo.id : `cp-photo-${pIdx}`,
        altText,
        mimeType: processed.mimeType,
        width: processed.width,
        height: processed.height,
        sizeBytes: processed.sizeBytes,
        blob: processed.blob,
      };
    }),
  );
}

/**
 * Validates, parses, and prepares an imported JSON backup file.
 * Supports Version 1 (item-only), Version 2 (items + requests), and Version 3 (items + requests + loans).
 *
 * @param {string | File} input - JSON string or File object
 * @returns {Promise<object>}
 */
export async function parseAndValidateBackup(input) {
  let jsonString;

  if (typeof input === 'string') {
    jsonString = input;
  } else if (input && typeof input.text === 'function') {
    if (input.size > MAX_BACKUP_FILE_BYTES) {
      throw new BackupValidationError(
        `Backup file is too large (${(input.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 50 MB.`,
      );
    }
    jsonString = await input.text();
  } else {
    throw new BackupValidationError('Invalid input: Expected a JSON string or File object.');
  }

  let data;
  try {
    data = JSON.parse(jsonString);
  } catch (err) {
    throw new BackupValidationError(`Malformed JSON: The uploaded file is not valid JSON (${err.message}).`);
  }

  if (!data || typeof data !== 'object') {
    throw new BackupValidationError('Invalid backup format: root element must be a JSON object.');
  }

  if (data.format !== BACKUP_FORMAT) {
    throw new BackupValidationError(
      `Unrecognized backup format "${data.format}". Expected "${BACKUP_FORMAT}".`,
    );
  }

  if (!SUPPORTED_BACKUP_SCHEMA_VERSIONS.includes(data.schemaVersion)) {
    throw new BackupValidationError(
      `Unsupported backup schema version "${data.schemaVersion}". This version of BorrowNest supports versions ${SUPPORTED_BACKUP_SCHEMA_VERSIONS.join(', ')}.`,
    );
  }

  if (!Array.isArray(data.items)) {
    throw new BackupValidationError('Invalid backup structure: "items" property must be an array.');
  }

  let totalPhotos = 0;
  let activeCount = 0;
  let archivedCount = 0;
  const importedItemIds = new Set();

  // 1. Validate and rehydrate each item record
  const rehydratedItems = await Promise.all(
    data.items.map(async (item, index) => {
      if (!item.id || typeof item.id !== 'string') {
        throw new BackupValidationError(`Item at index ${index} is missing a valid string ID.`);
      }

      if (importedItemIds.has(item.id)) {
        throw new BackupValidationError(`Duplicate item ID "${item.id}" detected in backup payload.`);
      }
      importedItemIds.add(item.id);

      const photos = Array.isArray(item.photos) ? item.photos : [];
      if (photos.length > 5) {
        throw new BackupValidationError(`Item at index ${index} exceeds maximum allowed photos (5).`);
      }
      totalPhotos += photos.length;

      const rehydratedPhotos = await Promise.all(
        photos.map(async (photo, pIdx) => {
          if (!photo || typeof photo !== 'object') {
            throw new BackupValidationError(
              `Photo #${pIdx + 1} for item "${item.title || item.id}" is not a valid object.`,
            );
          }

          const altText = (photo.altText || '').trim();
          if (!altText) {
            throw new BackupValidationError(
              `Photo #${pIdx + 1} for item "${item.title || item.id}" is missing required accessible description (altText).`,
            );
          }

          let rawBlob = photo.blob;
          if (!rawBlob && photo.dataUrl) {
            try {
              rawBlob = await base64ToBlob(photo.dataUrl);
            } catch (err) {
              throw new BackupValidationError(
                `Failed to decode photo #${pIdx + 1} for item "${item.title || item.id}": ${err.message}`,
              );
            }
          }

          if (!rawBlob || !(rawBlob instanceof Blob)) {
            throw new BackupValidationError(
              `Photo #${pIdx + 1} for item "${item.title || item.id}" has no valid Blob or dataUrl.`,
            );
          }

          const rawMime = (rawBlob.type || '').toLowerCase();
          if (!ALLOWED_INPUT_MIME_TYPES.includes(rawMime)) {
            throw new BackupValidationError(
              `Photo #${pIdx + 1} for item "${item.title || item.id}" has unsupported MIME type "${rawMime || 'unknown'}". Only JPEG, PNG, and WebP are permitted.`,
            );
          }

          let processed;
          try {
            processed = await processItemImage(rawBlob);
          } catch (err) {
            throw new BackupValidationError(
              `Failed to process photo #${pIdx + 1} for item "${item.title || item.id}": ${err.message}`,
            );
          }

          return {
            id: photo.id && typeof photo.id === 'string' ? photo.id : `photo-${index}-${pIdx}`,
            altText,
            mimeType: processed.mimeType,
            width: processed.width,
            height: processed.height,
            sizeBytes: processed.sizeBytes,
            blob: processed.blob,
          };
        }),
      );

      const candidateItem = {
        ...item,
        photos: rehydratedPhotos,
      };

      const { isValid, errors } = validateItemRecord(candidateItem);
      if (!isValid) {
        const errorDetails = Object.entries(errors)
          .map(([f, msg]) => `${f}: ${msg}`)
          .join('; ');
        throw new BackupValidationError(
          `Invalid item data in backup at index ${index} ("${item.title || item.id}"): ${errorDetails}`,
        );
      }

      if (candidateItem.status === 'ARCHIVED') {
        archivedCount++;
      } else {
        activeCount++;
      }

      return candidateItem;
    }),
  );

  // 2. Validate borrowing requests (Versions 2 & 3)
  const rawRequests = Array.isArray(data.borrowingRequests)
    ? data.borrowingRequests
    : Array.isArray(data.requests)
      ? data.requests
      : [];

  const validatedRequests = [];
  const requestIds = new Set();
  const approvedRequestMap = new Map();
  const approvedByItem = new Map();
  let pendingRequestCount = 0;
  let approvedRequestCount = 0;

  for (let rIdx = 0; rIdx < rawRequests.length; rIdx++) {
    const rawReq = rawRequests[rIdx];
    // Reject records with missing ID
    if (!rawReq?.id || typeof rawReq.id !== 'string' || !rawReq.id.trim()) {
      throw new BackupValidationError(`Borrowing request at index ${rIdx} is missing a valid string ID.`);
    }

    const normalizedReq = normalizeBorrowRequest(rawReq, { generateId: false });
    const { isValid, errors } = validateBorrowRequestRecord(normalizedReq);
    if (!isValid) {
      const details = Object.entries(errors).map(([f, msg]) => `${f}: ${msg}`).join('; ');
      throw new BackupValidationError(`Invalid borrowing request at index ${rIdx}: ${details}`);
    }

    if (requestIds.has(normalizedReq.id)) {
      throw new BackupValidationError(`Duplicate request ID "${normalizedReq.id}" detected in backup payload.`);
    }
    requestIds.add(normalizedReq.id);

    // Referential integrity check: referenced item MUST exist in the backup's item list
    if (!importedItemIds.has(normalizedReq.itemId)) {
      throw new BackupValidationError(
        `Borrowing request "${normalizedReq.id}" references item "${normalizedReq.itemId}" which does not exist in the backup archive.`,
      );
    }

    // Schedule integrity check for APPROVED reservations
    if (normalizedReq.status === REQUEST_STATUS.APPROVED) {
      const existingApproved = approvedByItem.get(normalizedReq.itemId) || [];
      const conflicts = findConflictingReservations(normalizedReq, existingApproved);
      if (conflicts.length > 0) {
        throw new BackupValidationError(
          `Backup contains internally conflicting approved reservations for item "${normalizedReq.itemId}" (${normalizedReq.startDate} to ${normalizedReq.endDate}).`,
        );
      }
      existingApproved.push(normalizedReq);
      approvedByItem.set(normalizedReq.itemId, existingApproved);
      approvedRequestCount++;
      approvedRequestMap.set(normalizedReq.id, normalizedReq);
    } else if (normalizedReq.status === REQUEST_STATUS.PENDING) {
      pendingRequestCount++;
    }

    validatedRequests.push(normalizedReq);
  }

  // 3. Validate loan lifecycle records (Version 3) or derive them (Version 2)
  const validatedLoans = [];
  const loanRequestIds = new Set();
  let activeLoanCount = 0;
  let completedLoanCount = 0;

  if (data.schemaVersion === 1) {
    // Version 1 has no requests and no loans
  } else if (data.schemaVersion === 2) {
    // Version 2: for every approved request, derive one RESERVED loan record
    for (const [reqId, approvedReq] of approvedRequestMap) {
      const derivedLoan = normalizeLoanRecord({
        requestId: reqId,
        itemId: approvedReq.itemId,
        itemTitleSnapshot: approvedReq.itemTitleSnapshot || '',
        borrowerAlias: approvedReq.borrowerAlias || '',
        collectionDate: approvedReq.startDate,
        returnDeadline: approvedReq.endDate,
        status: LOAN_STATUS.RESERVED,
        reservedAt: approvedReq.decidedAt || approvedReq.decisionAt || approvedReq.updatedAt || approvedReq.createdAt,
        provenance: 'MIGRATED_FROM_V2_BACKUP',
      });
      validatedLoans.push(derivedLoan);
      loanRequestIds.add(reqId);
    }
  } else if (data.schemaVersion === 3) {
    if (!Array.isArray(data.loans)) {
      throw new BackupValidationError('Invalid backup structure: "loans" property must be an array in schema version 3.');
    }

    for (let lIdx = 0; lIdx < data.loans.length; lIdx++) {
      const rawLoan = data.loans[lIdx];
      if (!rawLoan || typeof rawLoan !== 'object') {
        throw new BackupValidationError(`Loan record at index ${lIdx} is not a valid object.`);
      }

      if (!rawLoan.requestId || typeof rawLoan.requestId !== 'string' || !rawLoan.requestId.trim()) {
        throw new BackupValidationError(`Loan at index ${lIdx} is missing a valid string requestId.`);
      }

      if (loanRequestIds.has(rawLoan.requestId)) {
        throw new BackupValidationError(`Duplicate loan requestId "${rawLoan.requestId}" detected in backup payload.`);
      }
      loanRequestIds.add(rawLoan.requestId);

      // Referential check: must reference an approved request in the backup
      const matchedReq = approvedRequestMap.get(rawLoan.requestId);
      if (!matchedReq) {
        throw new BackupValidationError(
          `Loan "${rawLoan.requestId}" does not correspond to an approved borrowing request in the backup payload.`,
        );
      }

      if (rawLoan.itemId !== matchedReq.itemId) {
        throw new BackupValidationError(
          `Loan "${rawLoan.requestId}" references item "${rawLoan.itemId}", which conflicts with request item "${matchedReq.itemId}".`,
        );
      }

      // Rehydrate checkpoint photos
      let collectionCheckpoint = null;
      if (rawLoan.collectionCheckpoint) {
        const rehydratedPhotos = await rehydrateCheckpointPhotos(
          rawLoan.collectionCheckpoint.photos,
          `collection checkpoint for loan "${rawLoan.requestId}"`,
        );
        collectionCheckpoint = {
          ...rawLoan.collectionCheckpoint,
          photos: rehydratedPhotos,
        };
      }

      let returnCheckpoint = null;
      if (rawLoan.returnCheckpoint) {
        const rehydratedPhotos = await rehydrateCheckpointPhotos(
          rawLoan.returnCheckpoint.photos,
          `return checkpoint for loan "${rawLoan.requestId}"`,
        );
        returnCheckpoint = {
          ...rawLoan.returnCheckpoint,
          photos: rehydratedPhotos,
        };
      }

      const candidateLoan = normalizeLoanRecord({
        ...rawLoan,
        collectionCheckpoint,
        returnCheckpoint,
      });

      const { isValid, errors } = validateLoanRecord(candidateLoan);
      if (!isValid) {
        const details = Object.entries(errors).map(([f, msg]) => `${f}: ${msg}`).join('; ');
        throw new BackupValidationError(`Invalid loan record for request "${rawLoan.requestId}": ${details}`);
      }

      if (candidateLoan.status === LOAN_STATUS.ACTIVE) {
        activeLoanCount++;
      } else if (candidateLoan.status === LOAN_STATUS.COMPLETED) {
        completedLoanCount++;
      }

      validatedLoans.push(candidateLoan);
    }

    // Invariant: every approved request MUST have exactly one loan lifecycle record
    for (const [reqId] of approvedRequestMap) {
      if (!loanRequestIds.has(reqId)) {
        throw new BackupValidationError(
          `Approved borrowing request "${reqId}" is missing its corresponding loan lifecycle record in the backup payload.`,
        );
      }
    }
  }

  return {
    preview: {
      schemaVersion: data.schemaVersion,
      exportedAt: data.exportedAt || 'Unknown',
      itemCount: rehydratedItems.length,
      activeCount,
      archivedCount,
      photoCount: totalPhotos,
      requestCount: validatedRequests.length,
      pendingRequestCount,
      approvedRequestCount,
      loanCount: validatedLoans.length,
      activeLoanCount,
      completedLoanCount,
    },
    items: rehydratedItems,
    requests: validatedRequests,
    borrowingRequests: validatedRequests,
    loans: validatedLoans,
  };
}

/**
 * Restores records by merging: Adds records with novel IDs; preserves existing local records.
 * Requires atomic multi-store merge transaction across items, requests, and loans.
 *
 * @param {object} backupPayload - Prepared payload from parseAndValidateBackup
 * @param {import('../storage/StorageAdapter').StorageAdapter} storageAdapter
 * @returns {Promise<object>}
 */
export async function executeMerge(backupPayload, storageAdapter) {
  const items = Array.isArray(backupPayload) ? backupPayload : (backupPayload?.items || []);
  const requests = Array.isArray(backupPayload?.requests)
    ? backupPayload.requests
    : (backupPayload?.borrowingRequests || []);
  const loans = Array.isArray(backupPayload?.loans) ? backupPayload.loans : [];

  if (typeof storageAdapter.mergeAllData !== 'function') {
    throw new StorageError('Storage adapter does not implement required atomic multi-store mergeAllData method.');
  }

  const res = await storageAdapter.mergeAllData({ items, requests, loans });
  return {
    addedCount: (res.addedItemsCount || 0) + (res.addedRequestsCount || 0) + (res.addedLoansCount || 0),
    skippedCount: (res.skippedItemsCount || 0) + (res.skippedRequestsCount || 0) + (res.skippedLoansCount || 0),
    addedItemsCount: res.addedItemsCount || 0,
    skippedItemsCount: res.skippedItemsCount || 0,
    addedRequestsCount: res.addedRequestsCount || 0,
    skippedRequestsCount: res.skippedRequestsCount || 0,
    addedLoansCount: res.addedLoansCount || 0,
    skippedLoansCount: res.skippedLoansCount || 0,
  };
}

/**
 * Restores records atomically: Clears local stores and replaces with backup contents
 * in a single atomic multi-store transaction.
 *
 * @param {object} backupPayload - Prepared payload from parseAndValidateBackup
 * @param {import('../storage/StorageAdapter').StorageAdapter} storageAdapter
 * @returns {Promise<object>}
 */
export async function executeReplace(backupPayload, storageAdapter) {
  const items = Array.isArray(backupPayload) ? backupPayload : (backupPayload?.items || []);
  const requests = Array.isArray(backupPayload?.requests)
    ? backupPayload.requests
    : (backupPayload?.borrowingRequests || []);
  const loans = Array.isArray(backupPayload?.loans) ? backupPayload.loans : [];

  if (typeof storageAdapter.replaceAllData !== 'function') {
    throw new StorageError('Storage adapter does not implement required atomic multi-store replaceAllData method.');
  }

  const res = await storageAdapter.replaceAllData({ items, requests, loans });
  return {
    replacedCount: res.replacedItemsCount !== undefined ? res.replacedItemsCount : res.replacedCount || 0,
    replacedItemsCount: res.replacedItemsCount || 0,
    replacedRequestsCount: res.replacedRequestsCount || 0,
    replacedLoansCount: res.replacedLoansCount || 0,
  };
}
