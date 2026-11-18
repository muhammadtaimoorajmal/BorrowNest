import {
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION,
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
import { RecordNotFoundError, StorageError } from '../storage/storageErrors';
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

/**
 * Validates, parses, and prepares an imported JSON backup file.
 * Supports both Version 1 (item-only) and Version 2 (items + borrowing requests) archives.
 * Reprocesses accepted photos through client-side pipeline to strip EXIF and enforce boundaries.
 *
 * @param {string | File} input - JSON string or File object
 * @returns {Promise<{
 *   preview: {
 *     schemaVersion: number,
 *     exportedAt: string,
 *     itemCount: number,
 *     activeCount: number,
 *     archivedCount: number,
 *     photoCount: number,
 *     requestCount: number,
 *     pendingRequestCount: number,
 *     approvedRequestCount: number,
 *   },
 *   items: Array<object>,
 *   requests: Array<object>,
 *   borrowingRequests: Array<object>
 * }>}
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

      // Rehydrate photos: validate and reprocess through established image pipeline
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

          // Reprocess accepted image Blob through the established pipeline to enforce dimensions, strip EXIF, and re-compress
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

  // 2. Validate borrowing requests (Version 2 backups) or default to empty array (Version 1 backups)
  const rawRequests = Array.isArray(data.borrowingRequests)
    ? data.borrowingRequests
    : Array.isArray(data.requests)
      ? data.requests
      : [];

  const validatedRequests = [];
  const requestIds = new Set();
  const approvedByItem = new Map();
  let pendingRequestCount = 0;
  let approvedRequestCount = 0;

  for (let rIdx = 0; rIdx < rawRequests.length; rIdx++) {
    const rawReq = rawRequests[rIdx];
    const normalizedReq = normalizeBorrowRequest(rawReq);

    if (!normalizedReq) {
      throw new BackupValidationError(`Borrowing request at index ${rIdx} is not a valid object.`);
    }

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

    // Schedule integrity check: verify no internally conflicting APPROVED reservations for the same item
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
    } else if (normalizedReq.status === REQUEST_STATUS.PENDING) {
      pendingRequestCount++;
    }

    validatedRequests.push(normalizedReq);
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
    },
    items: rehydratedItems,
    requests: validatedRequests,
    borrowingRequests: validatedRequests,
  };
}

/**
 * Restores records by merging: Adds records with novel IDs; preserves existing local records.
 * Uses atomic multi-store merge transaction when supported by storageAdapter.
 *
 * @param {Array<object> | { items: Array<object>, requests?: Array<object> }} backupPayload
 * @param {import('../storage/StorageAdapter').StorageAdapter} storageAdapter
 * @returns {Promise<{ addedCount: number, skippedCount: number, addedItemsCount?: number, addedRequestsCount?: number }>}
 */
export async function executeMerge(backupPayload, storageAdapter) {
  const items = Array.isArray(backupPayload) ? backupPayload : (backupPayload?.items || []);
  const requests = Array.isArray(backupPayload?.requests)
    ? backupPayload.requests
    : (backupPayload?.borrowingRequests || []);

  if (typeof storageAdapter.mergeAllData === 'function') {
    const res = await storageAdapter.mergeAllData({ items, requests });
    return {
      addedCount: (res.addedItemsCount || 0) + (res.addedRequestsCount || 0),
      skippedCount: (res.skippedItemsCount || 0) + (res.skippedRequestsCount || 0),
      addedItemsCount: res.addedItemsCount,
      skippedItemsCount: res.skippedItemsCount,
      addedRequestsCount: res.addedRequestsCount,
      skippedRequestsCount: res.skippedRequestsCount,
    };
  }

  // Fallback for item-only legacy operations
  let addedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    if (!item?.id) {
      throw new StorageError('Cannot merge item record missing id');
    }

    let exists = false;
    try {
      await storageAdapter.getItemById(item.id);
      exists = true;
    } catch (err) {
      if (!(err instanceof RecordNotFoundError || err.name === 'RecordNotFoundError')) {
        throw err;
      }
    }

    if (exists) {
      skippedCount++;
      continue;
    }

    await storageAdapter.createItem(item);
    addedCount++;
  }

  return { addedCount, skippedCount };
}

/**
 * Restores records atomically: Clears local stores and replaces with backup contents in a single transaction.
 * @param {Array<object> | { items: Array<object>, requests?: Array<object> }} backupPayload
 * @param {import('../storage/StorageAdapter').StorageAdapter} storageAdapter
 * @returns {Promise<{ replacedCount: number, replacedItemsCount?: number, replacedRequestsCount?: number }>}
 */
export async function executeReplace(backupPayload, storageAdapter) {
  const items = Array.isArray(backupPayload) ? backupPayload : (backupPayload?.items || []);
  const requests = Array.isArray(backupPayload?.requests)
    ? backupPayload.requests
    : (backupPayload?.borrowingRequests || []);

  if (typeof storageAdapter.replaceAllData === 'function') {
    const res = await storageAdapter.replaceAllData({ items, requests });
    return {
      replacedCount: (res.replacedItemsCount !== undefined ? res.replacedItemsCount : res.replacedCount) || 0,
      replacedItemsCount: res.replacedItemsCount,
      replacedRequestsCount: res.replacedRequestsCount,
    };
  }

  if (typeof storageAdapter.replaceAllItems === 'function') {
    const { replacedCount } = await storageAdapter.replaceAllItems(items);
    return { replacedCount };
  }

  // Fallback for storage adapters that do not support atomic replacement
  await storageAdapter.clearAllItems();
  const { insertedCount } = await storageAdapter.bulkCreateItems(items);
  return { replacedCount: insertedCount };
}
