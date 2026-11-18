/**
 * Condition Checkpoint Validation & Comparison Services (DR-04).
 * Supports standardized 5-tier evaluation across Listing Baseline, Collection Handover, and Return Inspection.
 */

import { CONDITION_TIERS } from '../../listings/validation/itemValidation';
import { ALLOWED_INPUT_MIME_TYPES } from '../../listings/services/processItemImage';

export const MAX_CHECKPOINT_NOTES_LENGTH = 500;
export const MAX_CHECKPOINT_PHOTOS = 5;

export const CONDITION_DISCLAIMER =
  'Condition records are informational observations for transparency. They are not legal signatures or automated liability decisions.';

/**
 * Validates a condition checkpoint payload (collection handover or return inspection).
 *
 * @param {object} checkpoint
 * @param {object} options
 * @param {'collection'|'return'} [options.type='collection']
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateConditionCheckpoint(checkpoint, { _type = 'collection' } = {}) {
  const errors = {};

  if (!checkpoint || typeof checkpoint !== 'object') {
    return {
      isValid: false,
      errors: { checkpoint: 'Condition checkpoint data is required.' },
    };
  }

  // 1. Condition Grade
  const grade = Number(checkpoint.conditionGrade);
  if (!Number.isInteger(grade) || grade < 1 || grade > 5) {
    errors.conditionGrade = 'Please select a valid condition grade (1 to 5).';
  } else if (!CONDITION_TIERS[grade]) {
    errors.conditionGrade = `Unknown condition grade "${grade}".`;
  }

  // 2. Condition Notes
  const notes = (checkpoint.notes || '').trim();
  if (notes.length > MAX_CHECKPOINT_NOTES_LENGTH) {
    errors.notes = `Condition notes cannot exceed ${MAX_CHECKPOINT_NOTES_LENGTH} characters (currently ${notes.length}).`;
  }

  // 3. Borrower Observation (discrepancy notes on collection)
  if (checkpoint.borrowerObservation) {
    const obs = checkpoint.borrowerObservation.trim();
    if (obs.length > MAX_CHECKPOINT_NOTES_LENGTH) {
      errors.borrowerObservation = `Observation notes cannot exceed ${MAX_CHECKPOINT_NOTES_LENGTH} characters.`;
    }
  }

  // 4. Photos validation
  const photos = Array.isArray(checkpoint.photos) ? checkpoint.photos : [];
  if (photos.length > MAX_CHECKPOINT_PHOTOS) {
    errors.photos = `A maximum of ${MAX_CHECKPOINT_PHOTOS} photos may be attached per checkpoint.`;
  } else {
    for (let idx = 0; idx < photos.length; idx++) {
      const p = photos[idx];
      if (!p || typeof p !== 'object') {
        errors[`photo_${idx}`] = `Photo #${idx + 1} is invalid.`;
        continue;
      }
      const altText = (p.altText || '').trim();
      if (!altText) {
        errors[`photo_${idx}_altText`] = `Photo #${idx + 1} requires an accessible text description (alt text).`;
      }
      const mime = (p.mimeType || (p.blob && p.blob.type) || '').toLowerCase();
      if (mime && !ALLOWED_INPUT_MIME_TYPES.includes(mime)) {
        errors[`photo_${idx}_mimeType`] = `Photo #${idx + 1} has unsupported format "${mime}". Allowed: JPEG, PNG, WebP.`;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Compares two condition grades and returns an accessible text summary of change.
 * Avoids inferring legal liability or assigning fault.
 *
 * @param {number|null} gradeA - Starting grade (1-5)
 * @param {number|null} gradeB - Ending grade (1-5)
 * @param {string} [stageA='Baseline']
 * @param {string} [stageB='Return']
 * @returns {{
 *   delta: number|null,
 *   direction: 'same'|'improved'|'degraded'|'unavailable',
 *   label: string,
 *   summary: string
 * }}
 */
export function compareConditionGrades(gradeA, gradeB, stageA = 'Baseline', stageB = 'Return') {
  if (gradeA == null || gradeB == null) {
    return {
      delta: null,
      direction: 'unavailable',
      label: 'Comparison unavailable',
      summary: `Insufficient checkpoint data to compare ${stageA} and ${stageB}.`,
    };
  }

  const tierA = CONDITION_TIERS[gradeA];
  const tierB = CONDITION_TIERS[gradeB];
  const labelA = tierA ? tierA.label : `Grade ${gradeA}`;
  const labelB = tierB ? tierB.label : `Grade ${gradeB}`;

  const delta = gradeB - gradeA;

  if (delta === 0) {
    return {
      delta: 0,
      direction: 'same',
      label: 'Condition rating unchanged',
      summary: `Recorded condition remained at ${labelA} (${gradeA}/5) between ${stageA} and ${stageB}.`,
    };
  }

  if (delta < 0) {
    return {
      delta,
      direction: 'degraded',
      label: `Recorded rating changed from ${labelA} to ${labelB}`,
      summary: `Condition changed from ${labelA} (${gradeA}/5) at ${stageA} to ${labelB} (${gradeB}/5) at ${stageB}.`,
    };
  }

  return {
    delta,
    direction: 'improved',
    label: `Recorded rating changed from ${labelA} to ${labelB}`,
    summary: `Condition changed from ${labelA} (${gradeA}/5) at ${stageA} to ${labelB} (${gradeB}/5) at ${stageB}.`,
  };
}
