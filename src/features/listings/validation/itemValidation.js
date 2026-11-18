/**
 * Item listing schema enums, constraints, and validation logic.
 * Adheres strictly to DR-04 (Condition tiers) and DR-05 (Coarse location privacy).
 */

export const SCHEMA_VERSION = 1;

export const CATEGORIES = Object.freeze({
  TOOLS: { id: 'TOOLS', label: 'Tools', description: 'Hand and power tools, workshop and construction equipment.' },
  GARDENING: { id: 'GARDENING', label: 'Gardening', description: 'Lawn care, pruning, soil prep, and landscaping implements.' },
  HOUSEHOLD: { id: 'HOUSEHOLD', label: 'Household', description: 'Appliances, cleaning equipment, cookware, and domestic gear.' },
  OUTDOOR: { id: 'OUTDOOR', label: 'Outdoor', description: 'Camping, hiking, sporting goods, and recreational gear.' },
  ELECTRONICS: { id: 'ELECTRONICS', label: 'Electronics', description: 'Projectors, audio gear, measuring devices, and tech accessories.' },
});

export const CONDITION_TIERS = Object.freeze({
  5: {
    grade: 5,
    key: 'LIKE_NEW',
    label: 'Like New',
    description: 'Pristine condition. Barely used, no noticeable blemishes, fully functional with all accessories.',
  },
  4: {
    grade: 4,
    key: 'GOOD',
    label: 'Good',
    description: 'Minor cosmetic wear from normal use, fully operational and well maintained.',
  },
  3: {
    grade: 3,
    key: 'FAIR',
    label: 'Fair',
    description: 'Noticeable cosmetic wear, heavy use marks, or minor non-critical defects; primary function sound.',
  },
  2: {
    grade: 2,
    key: 'POOR',
    label: 'Poor',
    description: 'Substantial wear or partial impairment; requires careful handling or imminent maintenance.',
  },
  1: {
    grade: 1,
    key: 'NOT_FUNCTIONAL',
    label: 'Not Functional',
    description: 'Broken, incomplete, or damaged; suitable only for parts, repair, or refurbishment.',
  },
});

export const AVAILABILITY_STATUS = Object.freeze({
  AVAILABLE: { id: 'AVAILABLE', label: 'Available for borrowing' },
  UNAVAILABLE: { id: 'UNAVAILABLE', label: 'Not currently available' },
});

export const LISTING_STATUS = Object.freeze({
  ACTIVE: { id: 'ACTIVE', label: 'Active' },
  ARCHIVED: { id: 'ARCHIVED', label: 'Archived' },
});

export const CONSTRAINTS = Object.freeze({
  TITLE_MIN_LEN: 3,
  TITLE_MAX_LEN: 80,
  DESC_MIN_LEN: 20,
  DESC_MAX_LEN: 1000,
  NOTES_MAX_LEN: 500,
  AREA_MIN_LEN: 2,
  AREA_MAX_LEN: 80,
  ALT_MIN_LEN: 3,
  ALT_MAX_LEN: 200,
  MIN_PHOTOS: 1,
  MAX_PHOTOS: 5,
  MAX_PHOTO_BYTES: 10 * 1024 * 1024, // 10MB raw upload max
});

/**
 * Heuristic privacy check for obvious address patterns, gate codes, or private instructions.
 * Implements DR-05 client-side warning safeguard.
 */
export function checkPrivacyPatterns(text = '') {
  if (!text || typeof text !== 'string') return null;

  const patterns = [
    {
      regex: /\b\d{1,5}\s+[a-zA-Z0-9.\s]{2,20}\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|boulevard|blvd|court|ct|place|pl|terrace|ter)\b/i,
      message: 'Possible street address detected. Please enter only a broad neighborhood or nearby landmark.',
    },
    {
      regex: /\b(apt|apartment|suite|ste|unit|flat|room|rm)\s*#?\s*\d+/i,
      message: 'Apartment or unit number detected. For your safety, do not include specific residential units.',
    },
    {
      regex: /\b(gate|door|lock|box|pin|key)\s*(code|pass|number|combo|combination)?\s*[:#-]?\s*\d{3,6}\b/i,
      message: 'Potential gate, key, or lockbox code detected. Never store private access credentials in item listings.',
    },
    {
      regex: /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b|\b\d{5}(-\d{4})?\b/i,
      message: 'Possible postal code detected. A general neighborhood name is preferred.',
    },
  ];

  for (const { regex, message } of patterns) {
    if (regex.test(text)) {
      return message;
    }
  }

  return null;
}

/**
 * Validates a complete item record payload before persistence or export.
 * @param {object} record
 * @returns {{ isValid: boolean, errors: Record<string, string>, privacyWarning: string | null }}
 */
export function validateItemRecord(record) {
  const errors = {};
  let privacyWarning = null;

  if (!record || typeof record !== 'object') {
    return { isValid: false, errors: { record: 'Item record must be an object' }, privacyWarning: null };
  }

  // Title validation
  const title = (record.title || '').trim();
  if (!title) {
    errors.title = 'Item title is required.';
  } else if (title.length < CONSTRAINTS.TITLE_MIN_LEN) {
    errors.title = `Title must be at least ${CONSTRAINTS.TITLE_MIN_LEN} characters.`;
  } else if (title.length > CONSTRAINTS.TITLE_MAX_LEN) {
    errors.title = `Title must not exceed ${CONSTRAINTS.TITLE_MAX_LEN} characters.`;
  }

  // Description validation
  const description = (record.description || '').trim();
  if (!description) {
    errors.description = 'Item description is required.';
  } else if (description.length < CONSTRAINTS.DESC_MIN_LEN) {
    errors.description = `Description must be at least ${CONSTRAINTS.DESC_MIN_LEN} characters.`;
  } else if (description.length > CONSTRAINTS.DESC_MAX_LEN) {
    errors.description = `Description must not exceed ${CONSTRAINTS.DESC_MAX_LEN} characters.`;
  }

  // Category validation
  if (!record.category || !CATEGORIES[record.category]) {
    errors.category = 'Please select a valid item category.';
  }

  // Condition grade validation
  const grade = Number(record.conditionGrade);
  if (!grade || !CONDITION_TIERS[grade]) {
    errors.conditionGrade = 'Please select a standardized condition tier (1 to 5).';
  }

  // Condition notes (optional)
  if (record.conditionNotes && record.conditionNotes.length > CONSTRAINTS.NOTES_MAX_LEN) {
    errors.conditionNotes = `Condition notes must not exceed ${CONSTRAINTS.NOTES_MAX_LEN} characters.`;
  }

  // Approximate Area validation (DR-05)
  const area = (record.approximateArea || '').trim();
  if (!area) {
    errors.approximateArea = 'General pickup area is required (e.g. neighborhood or nearby landmark).';
  } else if (area.length < CONSTRAINTS.AREA_MIN_LEN) {
    errors.approximateArea = `General area must be at least ${CONSTRAINTS.AREA_MIN_LEN} characters.`;
  } else if (area.length > CONSTRAINTS.AREA_MAX_LEN) {
    errors.approximateArea = `General area must not exceed ${CONSTRAINTS.AREA_MAX_LEN} characters.`;
  } else {
    // Check privacy warnings
    const warning = checkPrivacyPatterns(area);
    if (warning) {
      privacyWarning = warning;
    }
  }

  // Availability validation
  if (!record.availability || !AVAILABILITY_STATUS[record.availability]) {
    errors.availability = 'Availability must be either AVAILABLE or UNAVAILABLE.';
  }

  // Status validation
  if (!record.status || !LISTING_STATUS[record.status]) {
    errors.status = 'Status must be either ACTIVE or ARCHIVED.';
  }

  // Photos validation
  const photos = Array.isArray(record.photos) ? record.photos : [];
  if (photos.length < CONSTRAINTS.MIN_PHOTOS) {
    errors.photos = 'At least one genuine photograph of the actual item is required.';
  } else if (photos.length > CONSTRAINTS.MAX_PHOTOS) {
    errors.photos = `A listing may contain at most ${CONSTRAINTS.MAX_PHOTOS} photographs.`;
  } else {
    photos.forEach((photo, idx) => {
      if (!photo || typeof photo !== 'object') {
        errors[`photo_${idx}`] = `Photo #${idx + 1} is invalid.`;
        return;
      }
      if (!photo.blob && !photo.dataUrl) {
        errors[`photo_${idx}_blob`] = `Photo #${idx + 1} is missing image data.`;
      }
      const alt = (photo.altText || '').trim();
      if (!alt || alt.length < CONSTRAINTS.ALT_MIN_LEN) {
        errors[`photo_${idx}_alt`] = `Photo #${idx + 1} requires an accessible description (alt text) of at least ${CONSTRAINTS.ALT_MIN_LEN} characters.`;
      } else if (alt.length > CONSTRAINTS.ALT_MAX_LEN) {
        errors[`photo_${idx}_alt`] = `Photo #${idx + 1} alt text must not exceed ${CONSTRAINTS.ALT_MAX_LEN} characters.`;
      }
    });
  }

  // Photo attestation
  if (record.photoAttestation !== true) {
    errors.photoAttestation = 'You must confirm that uploaded photographs genuinely represent the actual item being listed.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    privacyWarning,
  };
}
