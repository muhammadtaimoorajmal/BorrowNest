/**
 * Client-Side Genuine Photo Processing Pipeline.
 *
 * Enforces:
 * - Allowed MIME types (JPEG, PNG, WebP)
 * - Raw file size limits (max 10MB)
 * - Proportional downscaling (longest dimension <= 1600px)
 * - Complete EXIF metadata and GPS coordinate stripping via fresh Canvas re-encoding
 * - Local storage optimization (WebP/JPEG compression, max 2.5MB output Blob)
 */

export const ALLOWED_INPUT_MIME_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const MAX_ORIGINAL_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_PROCESSED_BYTES = 2.5 * 1024 * 1024; // 2.5MB
export const MAX_DIMENSION_PX = 1600;
export const TARGET_QUALITY = 0.85;

export class ImageProcessingError extends Error {
  constructor(message, code = 'IMAGE_PROCESSING_FAILED', cause = null) {
    super(message);
    this.name = 'ImageProcessingError';
    this.code = code;
    this.cause = cause;
  }
}

/**
 * Calculates proportionally scaled dimensions bounded by maxDimension.
 */
export function calculateBoundedDimensions(width, height, maxDimension = MAX_DIMENSION_PX) {
  if (width <= 0 || height <= 0) {
    throw new ImageProcessingError('Invalid image dimensions (zero or negative).', 'INVALID_DIMENSIONS');
  }

  if (width <= maxDimension && height <= maxDimension) {
    return { width: Math.round(width), height: Math.round(height) };
  }

  const ratio = width / height;
  if (width > height) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / ratio),
    };
  } else {
    return {
      width: Math.round(maxDimension * ratio),
      height: maxDimension,
    };
  }
}

/**
 * Loads an image from a Blob/File into an HTMLImageElement safely.
 */
function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new ImageProcessingError('Failed to decode image data. File may be corrupted or unreadable.', 'DECODE_FAILED', err));
    };

    img.src = objectUrl;
  });
}

/**
 * Re-encodes canvas contents to a Blob, preferring WebP with JPEG fallback.
 */
function canvasToBlob(canvas, targetMime = 'image/webp', quality = TARGET_QUALITY) {
  return new Promise((resolve, reject) => {
    if (!canvas || typeof canvas.toBlob !== 'function') {
      return reject(new ImageProcessingError('Canvas.toBlob is not supported in this environment.', 'CANVAS_UNSUPPORTED'));
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          // If webp fails, try image/jpeg
          if (targetMime === 'image/webp') {
            canvas.toBlob(
              (fallbackBlob) => {
                if (!fallbackBlob) {
                  return reject(new ImageProcessingError('Failed to encode image from canvas.', 'ENCODE_FAILED'));
                }
                resolve({ blob: fallbackBlob, mimeType: 'image/jpeg' });
              },
              'image/jpeg',
              quality,
            );
          } else {
            return reject(new ImageProcessingError('Failed to encode image from canvas.', 'ENCODE_FAILED'));
          }
        } else {
          resolve({ blob, mimeType: targetMime });
        }
      },
      targetMime,
      quality,
    );
  });
}

/**
 * Processes a genuine user photograph through the privacy and scaling pipeline.
 *
 * @param {File | Blob} file - The raw input file from input[type="file"]
 * @returns {Promise<{
 *   blob: Blob,
 *   width: number,
 *   height: number,
 *   mimeType: string,
 *   sizeBytes: number
 * }>}
 */
export async function processItemImage(file) {
  if (!file) {
    throw new ImageProcessingError('No image file provided.', 'NO_FILE');
  }

  // 1. Check MIME type
  const mimeType = (file.type || '').toLowerCase();
  if (!ALLOWED_INPUT_MIME_TYPES.includes(mimeType)) {
    throw new ImageProcessingError(
      `Unsupported format: "${mimeType || 'unknown'}". Only genuine JPEG, PNG, and WebP images are permitted. SVG, GIF, and executable files are rejected.`,
      'UNSUPPORTED_MIME_TYPE',
    );
  }

  // 2. Validate file size
  if (file.size > MAX_ORIGINAL_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new ImageProcessingError(
      `The selected photo is too large (${sizeMb} MB). Original photographs must be 10 MB or smaller.`,
      'FILE_TOO_LARGE',
    );
  }

  if (file.size === 0) {
    throw new ImageProcessingError('The selected image file is empty (0 bytes).', 'EMPTY_FILE');
  }

  // 3. Decode image
  const img = await loadImageElement(file);

  // 4. Calculate bounded dimensions
  const { width: targetWidth, height: targetHeight } = calculateBoundedDimensions(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    MAX_DIMENSION_PX,
  );

  // 5. Render to canvas (completely separates pixel data from original EXIF/GPS segments)
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new ImageProcessingError('Could not initialize 2D canvas context for image processing.', 'CANVAS_CONTEXT_FAILED');
  }

  // Draw image pixels
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // 6. Encode to new clean Blob
  const { blob, mimeType: finalMime } = await canvasToBlob(canvas, 'image/webp', TARGET_QUALITY);

  // 7. Verify output constraints
  if (blob.size > MAX_PROCESSED_BYTES) {
    // If output is still slightly over, try encoding again at lower quality
    const secondPass = await canvasToBlob(canvas, 'image/jpeg', 0.70);
    if (secondPass.blob.size > MAX_PROCESSED_BYTES) {
      throw new ImageProcessingError(
        'Processed image exceeds local storage quota. Please choose a photo with less visual noise.',
        'COMPRESSION_EXCEEDED',
      );
    }
    return {
      blob: secondPass.blob,
      width: targetWidth,
      height: targetHeight,
      mimeType: secondPass.mimeType,
      sizeBytes: secondPass.blob.size,
    };
  }

  return {
    blob,
    width: targetWidth,
    height: targetHeight,
    mimeType: finalMime,
    sizeBytes: blob.size,
  };
}
