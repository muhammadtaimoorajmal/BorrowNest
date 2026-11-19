import { REQUEST_STATUS } from '../constants/requestStatus';
import { validateDateRange, isValidDateOnly, getLocalToday } from './dateRange';

export const REQUEST_SCHEMA_VERSION = 1;

export const CONSTRAINTS = Object.freeze({
  BORROWER_ALIAS_MIN_LEN: 2,
  BORROWER_ALIAS_MAX_LEN: 50,
  REQUEST_NOTE_MAX_LEN: 500,
});

/**
 * Generates a unique borrowing request ID.
 * @returns {string}
 */
export function generateBorrowRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Normalizes a borrowing request object to provide dual canonical and alias field access.
 * Guarantees schemaVersion, timestamps, and both naming conventions:
 * - borrowerAlias & requestedBy
 * - startDate & collectionDate
 * - endDate & returnDeadline
 * - requestNote & note
 * - decidedAt & decisionAt
 *
 * @param {object} raw - Input request object
 * @param {object} [options]
 * @param {boolean} [options.generateId=true] - Whether to generate an ID if missing (false for import validation)
 * @returns {object|null} Normalized borrowing request record
 */
export function normalizeBorrowRequest(raw, { generateId = true } = {}) {
  if (!raw || typeof raw !== 'object') return null;

  let id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id && generateId) {
    id = generateBorrowRequestId();
  }

  const itemId = typeof raw.itemId === 'string' ? raw.itemId.trim() : '';
  const itemTitleSnapshot = (raw.itemTitleSnapshot || raw.itemTitle || '').trim();

  const alias = (raw.borrowerAlias || raw.requestedBy || '').trim();
  const start = (raw.startDate || raw.collectionDate || '').trim();
  const end = (raw.endDate || raw.returnDeadline || '').trim();
  const note = (raw.requestNote || raw.note || '').trim();

  const status = raw.status || REQUEST_STATUS.PENDING;
  const createdAt = raw.createdAt || new Date().toISOString();
  const updatedAt = raw.updatedAt || createdAt;
  const decisionAt = raw.decidedAt || raw.decisionAt || null;

  return {
    schemaVersion: raw.schemaVersion || REQUEST_SCHEMA_VERSION,
    id,
    itemId,
    itemTitleSnapshot,
    // Dual properties for robust consumer compatibility
    borrowerAlias: alias,
    requestedBy: alias,
    startDate: start,
    collectionDate: start,
    endDate: end,
    returnDeadline: end,
    requestNote: note,
    note,
    status,
    borrowerProfileId: raw.borrowerProfileId || (alias === 'Demo Borrower' ? 'demo-borrower' : null),
    ownerProfileId: raw.ownerProfileId || null,
    ownerDisplayName: raw.ownerDisplayName || null,
    isDemoRequest: Boolean(raw.isDemoRequest || (itemId && itemId.startsWith('demo-'))),
    createdAt,
    updatedAt,
    decidedAt: decisionAt,
    decisionAt,
  };
}

/**
 * Validates a user-submitted borrow request payload from the UI form.
 *
 * @param {object} payload - Normalized payload
 * @param {object} options
 * @param {string} [options.today=getLocalToday()] - Baseline date string
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateBorrowRequestPayload(payload, { today = getLocalToday() } = {}) {
  const errors = {};

  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      errors: { form: 'Request payload is required.' },
    };
  }

  // 1. Target Item ID
  if (!payload.itemId || !payload.itemId.trim()) {
    errors.itemId = 'Target item ID is required.';
  }

  // 2. Borrower Alias
  const alias = (payload.borrowerAlias || payload.requestedBy || '').trim();
  if (!alias) {
    errors.borrowerAlias = 'Please enter a borrower display name.';
  } else if (alias.length < CONSTRAINTS.BORROWER_ALIAS_MIN_LEN) {
    errors.borrowerAlias = `Borrower name must be at least ${CONSTRAINTS.BORROWER_ALIAS_MIN_LEN} characters.`;
  } else if (alias.length > CONSTRAINTS.BORROWER_ALIAS_MAX_LEN) {
    errors.borrowerAlias = `Borrower name cannot exceed ${CONSTRAINTS.BORROWER_ALIAS_MAX_LEN} characters.`;
  }

  // 3. Date Range
  const start = (payload.startDate || payload.collectionDate || '').trim();
  const end = (payload.endDate || payload.returnDeadline || '').trim();

  if (!start) {
    errors.startDate = 'Collection date is required.';
  }
  if (!end) {
    errors.endDate = 'Return deadline is required.';
  }

  if (start && end) {
    const dateValidation = validateDateRange(start, end, today);
    if (!dateValidation.isValid) {
      if (dateValidation.error.includes('Collection date')) {
        errors.startDate = dateValidation.error;
      } else {
        errors.endDate = dateValidation.error;
      }
    }
  }

  // 4. Request Note (Optional)
  const note = (payload.requestNote || payload.note || '').trim();
  if (note.length > CONSTRAINTS.REQUEST_NOTE_MAX_LEN) {
    errors.requestNote = `Intended-use note cannot exceed ${CONSTRAINTS.REQUEST_NOTE_MAX_LEN} characters.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates a persisted or imported borrowing request record for database invariants.
 *
 * @param {object} record
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateBorrowRequestRecord(record) {
  const errors = {};

  if (!record || typeof record !== 'object') {
    return { isValid: false, errors: { record: 'Request record must be a valid object.' } };
  }

  if (!record.id || typeof record.id !== 'string' || !record.id.trim()) {
    errors.id = 'Request record must possess a valid non-empty string ID.';
  }

  if (!record.itemId || typeof record.itemId !== 'string' || !record.itemId.trim()) {
    errors.itemId = 'Request record must possess a valid target item ID.';
  }

  const alias = (record.borrowerAlias || record.requestedBy || '').trim();
  if (!alias) {
    errors.borrowerAlias = 'Request record is missing a borrower display name.';
  } else if (alias.length < CONSTRAINTS.BORROWER_ALIAS_MIN_LEN || alias.length > CONSTRAINTS.BORROWER_ALIAS_MAX_LEN) {
    errors.borrowerAlias = `Borrower display name must be between ${CONSTRAINTS.BORROWER_ALIAS_MIN_LEN} and ${CONSTRAINTS.BORROWER_ALIAS_MAX_LEN} characters.`;
  }

  const start = (record.startDate || record.collectionDate || '').trim();
  const end = (record.endDate || record.returnDeadline || '').trim();
  if (!start || !end) {
    errors.dates = 'Request record is missing start or end dates.';
  } else if (!isValidDateOnly(start) || !isValidDateOnly(end)) {
    errors.dates = 'Request dates must be valid calendar dates formatted as YYYY-MM-DD.';
  } else if (end < start) {
    errors.dates = 'Return deadline cannot precede collection date.';
  }

  const validStatuses = Object.values(REQUEST_STATUS);
  if (!record.status || !validStatuses.includes(record.status)) {
    errors.status = `Invalid request status "${record.status}". Allowed values: ${validStatuses.join(', ')}.`;
  }

  const note = (record.requestNote || record.note || '').trim();
  if (note.length > CONSTRAINTS.REQUEST_NOTE_MAX_LEN) {
    errors.note = `Request note cannot exceed ${CONSTRAINTS.REQUEST_NOTE_MAX_LEN} characters.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
