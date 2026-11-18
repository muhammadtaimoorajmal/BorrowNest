import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, base64ToBlob, MAX_BACKUP_FILE_BYTES } from './backupSchema';
import { validateItemRecord } from '../../features/listings/validation/itemValidation';
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
 * Reprocesses accepted photos through the client-side pipeline to strip EXIF and enforce constraints.
 * @param {string | File} input - JSON string or File object
 * @returns {Promise<{
 *   preview: {
 *     exportedAt: string,
 *     itemCount: number,
 *     activeCount: number,
 *     archivedCount: number,
 *     photoCount: number
 *   },
 *   items: Array<object>
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

  if (data.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new BackupValidationError(
      `Unsupported backup schema version "${data.schemaVersion}". This version of BorrowNest supports version ${BACKUP_SCHEMA_VERSION}.`,
    );
  }

  if (!Array.isArray(data.items)) {
    throw new BackupValidationError('Invalid backup structure: "items" property must be an array.');
  }

  let totalPhotos = 0;
  let activeCount = 0;
  let archivedCount = 0;

  // Validate each item record
  const rehydratedItems = await Promise.all(
    data.items.map(async (item, index) => {
      if (!item.id || typeof item.id !== 'string') {
        throw new BackupValidationError(`Item at index ${index} is missing a valid string ID.`);
      }

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

  return {
    preview: {
      exportedAt: data.exportedAt || 'Unknown',
      itemCount: rehydratedItems.length,
      activeCount,
      archivedCount,
      photoCount: totalPhotos,
    },
    items: rehydratedItems,
  };
}

/**
 * Restores records by merging: Adds items with novel IDs; preserves existing local records.
 * Propagates unexpected database errors without silently swallowing them.
 * @param {Array<object>} importedItems
 * @param {import('../storage/StorageAdapter').StorageAdapter} storageAdapter
 * @returns {Promise<{ addedCount: number, skippedCount: number }>}
 */
export async function executeMerge(importedItems, storageAdapter) {
  let addedCount = 0;
  let skippedCount = 0;

  for (const item of importedItems) {
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
 * Restores records atomically: Clears all local items and replaces them with backup contents in a single transaction.
 * @param {Array<object>} importedItems
 * @param {import('../storage/StorageAdapter').StorageAdapter} storageAdapter
 * @returns {Promise<{ replacedCount: number }>}
 */
export async function executeReplace(importedItems, storageAdapter) {
  if (typeof storageAdapter.replaceAllItems === 'function') {
    const { replacedCount } = await storageAdapter.replaceAllItems(importedItems);
    return { replacedCount };
  }

  // Fallback for storage adapters that do not support atomic replacement
  await storageAdapter.clearAllItems();
  const { insertedCount } = await storageAdapter.bulkCreateItems(importedItems);
  return { replacedCount: insertedCount };
}
