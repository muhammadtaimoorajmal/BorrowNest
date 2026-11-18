import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, blobToBase64 } from './backupSchema';

/**
 * Serializes all item records, photo Blobs, and borrowing request records into a versioned JSON backup object.
 * Version 2 introduces persistent borrowing request records alongside genuine item records.
 *
 * @param {import('../storage/StorageAdapter').StorageAdapter} storageAdapter
 * @returns {Promise<object>}
 */
export async function generateBackupData(storageAdapter) {
  const items = await storageAdapter.listItems();
  const requests = typeof storageAdapter.listBorrowRequests === 'function'
    ? await storageAdapter.listBorrowRequests()
    : [];

  const serializedItems = await Promise.all(
    items.map(async (item) => {
      const serializedPhotos = await Promise.all(
        (item.photos || []).map(async (photo) => {
          let dataUrl = photo.dataUrl;
          if (photo.blob && !dataUrl) {
            dataUrl = await blobToBase64(photo.blob);
          }
          return {
            id: photo.id,
            altText: photo.altText,
            mimeType: photo.mimeType || 'image/webp',
            width: photo.width,
            height: photo.height,
            sizeBytes: photo.sizeBytes,
            dataUrl,
          };
        }),
      );

      return {
        schemaVersion: item.schemaVersion || 1,
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        conditionGrade: item.conditionGrade,
        conditionNotes: item.conditionNotes || '',
        approximateArea: item.approximateArea,
        availability: item.availability,
        status: item.status,
        photoAttestation: item.photoAttestation,
        photos: serializedPhotos,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    }),
  );

  const serializedRequests = requests.map((req) => ({
    schemaVersion: req.schemaVersion || 1,
    id: req.id,
    itemId: req.itemId,
    itemTitleSnapshot: req.itemTitleSnapshot || '',
    borrowerAlias: req.borrowerAlias || req.requestedBy || '',
    requestedBy: req.requestedBy || req.borrowerAlias || '',
    startDate: req.startDate || req.collectionDate || '',
    collectionDate: req.collectionDate || req.startDate || '',
    endDate: req.endDate || req.returnDeadline || '',
    returnDeadline: req.returnDeadline || req.endDate || '',
    requestNote: req.requestNote || req.note || '',
    note: req.note || req.requestNote || '',
    status: req.status,
    createdAt: req.createdAt,
    updatedAt: req.updatedAt,
    decidedAt: req.decidedAt || req.decisionAt || null,
    decisionAt: req.decisionAt || req.decidedAt || null,
  }));

  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    itemCount: serializedItems.length,
    requestCount: serializedRequests.length,
    items: serializedItems,
    borrowingRequests: serializedRequests,
  };
}

/**
 * Triggers browser download of the generated backup payload as a JSON file.
 * @param {object} backupData - Generated backup JSON object
 */
export function downloadBackupFile(backupData) {
  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `borrownest-backup-v${backupData.schemaVersion}-${timestamp}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
