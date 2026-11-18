import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, base64ToBlob, MAX_BACKUP_FILE_BYTES } from './backupSchema';
import { validateItemRecord } from '../../features/listings/validation/itemValidation';

export class BackupValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BackupValidationError';
  }
}

/**
 * Validates, parses, and prepares an imported JSON backup file.
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

      // Rehydrate photos: convert base64 dataUrl back to Blobs
      const photos = Array.isArray(item.photos) ? item.photos : [];
      totalPhotos += photos.length;

      const rehydratedPhotos = await Promise.all(
        photos.map(async (photo, pIdx) => {
          let blob = photo.blob;
          if (!blob && photo.dataUrl) {
            try {
              blob = await base64ToBlob(photo.dataUrl);
            } catch (err) {
              throw new BackupValidationError(
                `Failed to decode photo #${pIdx + 1} for item "${item.title || item.id}": ${err.message}`,
              );
            }
          }
          return {
            id: photo.id || `photo-${index}-${pIdx}`,
            altText: photo.altText || 'Item photograph',
            mimeType: photo.mimeType || 'image/webp',
            width: photo.width || 800,
            height: photo.height || 600,
            sizeBytes: blob?.size || photo.sizeBytes || 0,
            blob,
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
 * @param {Array<object>} importedItems
 * @param {import('../storage/StorageAdapter').StorageAdapter} storageAdapter
 * @returns {Promise<{ addedCount: number, skippedCount: number }>}
 */
export async function executeMerge(importedItems, storageAdapter) {
  let addedCount = 0;
  let skippedCount = 0;

  for (const item of importedItems) {
    try {
      const existing = await storageAdapter.getItemById(item.id);
      if (existing) {
        skippedCount++;
        continue;
      }
    } catch {
      // RecordNotFoundError -> proceed to create
    }

    await storageAdapter.createItem(item);
    addedCount++;
  }

  return { addedCount, skippedCount };
}

/**
 * Restores records by replacing: Clears all local items and replaces them with backup contents.
 * @param {Array<object>} importedItems
 * @param {import('../storage/StorageAdapter').StorageAdapter} storageAdapter
 * @returns {Promise<{ replacedCount: number }>}
 */
export async function executeReplace(importedItems, storageAdapter) {
  await storageAdapter.clearAllItems();
  const { insertedCount } = await storageAdapter.bulkCreateItems(importedItems);
  return { replacedCount: insertedCount };
}
