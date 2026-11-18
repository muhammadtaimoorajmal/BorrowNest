import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, blobToBase64 } from './backupSchema';

async function serializeCheckpointPhotos(photos = []) {
  if (!Array.isArray(photos)) return [];
  return Promise.all(
    photos.map(async (photo) => {
      let dataUrl = photo.dataUrl;
      if (photo.blob && !dataUrl) {
        dataUrl = await blobToBase64(photo.blob);
      }
      return {
        id: photo.id,
        altText: photo.altText || '',
        mimeType: photo.mimeType || 'image/webp',
        width: photo.width,
        height: photo.height,
        sizeBytes: photo.sizeBytes,
        dataUrl,
      };
    }),
  );
}

/**
 * Serializes all item records, photo Blobs, borrowing requests, and loan lifecycle records
 * into a versioned JSON backup object (DR-03 + DR-04).
 *
 * @param {import('../storage/StorageAdapter').StorageAdapter} storageAdapter
 * @returns {Promise<object>}
 */
export async function generateBackupData(storageAdapter) {
  const items = await storageAdapter.listItems();
  const requests = typeof storageAdapter.listBorrowRequests === 'function'
    ? await storageAdapter.listBorrowRequests()
    : [];
  const loans = typeof storageAdapter.listLoans === 'function'
    ? await storageAdapter.listLoans()
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

  const serializedLoans = await Promise.all(
    loans.map(async (loan) => {
      const collectionCheckpoint = loan.collectionCheckpoint
        ? {
            ...loan.collectionCheckpoint,
            photos: await serializeCheckpointPhotos(loan.collectionCheckpoint.photos),
          }
        : null;

      const returnCheckpoint = loan.returnCheckpoint
        ? {
            ...loan.returnCheckpoint,
            photos: await serializeCheckpointPhotos(loan.returnCheckpoint.photos),
          }
        : null;

      return {
        schemaVersion: loan.schemaVersion || 1,
        requestId: loan.requestId,
        itemId: loan.itemId,
        itemTitleSnapshot: loan.itemTitleSnapshot || '',
        borrowerAlias: loan.borrowerAlias || '',
        collectionDate: loan.collectionDate,
        returnDeadline: loan.returnDeadline,
        status: loan.status,
        reservedAt: loan.reservedAt,
        collectionCheckpoint,
        collectedAt: loan.collectedAt || null,
        returnCheckpoint,
        completedAt: loan.completedAt || null,
        resolution: loan.resolution || null,
        releasedAt: loan.releasedAt || null,
        releaseNote: loan.releaseNote || '',
        provenance: loan.provenance || null,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
      };
    }),
  );

  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    itemCount: serializedItems.length,
    requestCount: serializedRequests.length,
    loanCount: serializedLoans.length,
    items: serializedItems,
    borrowingRequests: serializedRequests,
    loans: serializedLoans,
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
