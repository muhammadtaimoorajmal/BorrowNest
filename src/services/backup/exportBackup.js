import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, blobToBase64 } from './backupSchema';

/**
 * Serializes all item records and photo Blobs into a versioned JSON backup object.
 * @param {import('../storage/StorageAdapter').StorageAdapter} storageAdapter
 * @returns {Promise<object>}
 */
export async function generateBackupData(storageAdapter) {
  const items = await storageAdapter.listItems();

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

  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    itemCount: serializedItems.length,
    items: serializedItems,
  };
}

/**
 * Triggers browser download of the generated backup payload as a JSON file.
 * @param {object} backupData
 */
export function downloadBackupFile(backupData) {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `borrownest-backup-${dateStr}.json`;
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
