/**
 * Backup schema constants and serialization helpers.
 */

export const BACKUP_FORMAT = 'borrownest-backup';
export const BACKUP_SCHEMA_VERSION = 3;
export const SUPPORTED_BACKUP_SCHEMA_VERSIONS = Object.freeze([1, 2, 3]);
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
 * Validates data URL structure and decoding integrity.
 * @param {string} dataUrl
 * @returns {Promise<Blob>}
 */
export async function base64ToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('Invalid dataUrl for Blob conversion: Expected a non-empty string.');
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid dataUrl format: Must be a base64 encoded data URI (data:<mime>;base64,<data>).');
  }

  const mimeType = match[1].toLowerCase();
  const base64Data = match[2].trim();

  let binaryString;
  try {
    binaryString = atob(base64Data);
  } catch (err) {
    throw new Error(`Malformed base64 data payload: ${err.message}`, { cause: err });
  }

  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}
