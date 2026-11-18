/**
 * Backup schema constants and serialization helpers.
 */

export const BACKUP_FORMAT = 'borrownest-backup';
export const BACKUP_SCHEMA_VERSION = 1;
export const MAX_BACKUP_FILE_BYTES = 50 * 1024 * 1024; // 50MB max backup upload

/**
 * Converts a Blob to a base64 Data URL string for JSON packaging.
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    if (!blob) return resolve('');
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a base64 Data URL string back into a Blob.
 * @param {string} dataUrl
 * @returns {Promise<Blob>}
 */
export async function base64ToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('Invalid dataUrl for Blob conversion');
  }
  const response = await fetch(dataUrl);
  return response.blob();
}
