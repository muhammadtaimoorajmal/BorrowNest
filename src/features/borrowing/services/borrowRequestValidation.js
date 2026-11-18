import { REQUEST_STATUS } from '../constants/requestStatus';
import { validateDateRange, getLocalToday } from './dateRange';

export const REQUEST_SCHEMA_VERSION = 1;

export const CONSTRAINTS = Object.freeze({
  BORROWER_ALIAS_MIN_LEN: 2,
  BORROWER_ALIAS_MAX_LEN: 50,
  REQUEST_NOTE_MAX_LEN: 500,
});

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
 * @returns {object} Normalized borrowing request record
 */
export function normalizeBorrowRequest(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = raw.id || `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const itemId = raw.itemId || '';
  const itemTitleSnapshot = raw.itemTitleSnapshot || raw.itemTitle || '';

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
    note: note,
    status,
    createdAt,
    updatedAt,
    decidedAt: decisionAt,
    decisionAt: decisionAt,
  };
}

/**
 * Validates a user-submitted request payload from form inputs.
 *
 * @param {object} payload
 * @param {object} [options]
 * @param {string} [options.today=getLocalToday()]
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateBorrowRequestPayload(payload, { today = getLocalToday() } = {}) {
  const errors = {};

  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errors: { form: 'Invalid request payload provided.' } };
  }

  // 1. Item ID
  const itemId = (payload.itemId || '').trim();
  if (!itemId) {
    errors.itemId = 'Target item ID is required.';
  }

  // 2. Borrower Alias / Display Name
  const alias = (payload.borrowerAlias || payload.requestedBy || '').trim();
  if (!alias) {
    errors.borrowerAlias = 'Please enter a borrower display name.';
  } else if (alias.length < CONSTRAINTS.BORROWER_ALIAS_MIN_LEN) {
    errors.borrowerAlias = `Borrower display name must be at least ${CONSTRAINTS.BORROWER_ALIAS_MIN_LEN} characters.`;
  } else if (alias.length > CONSTRAINTS.BORROWER_ALIAS_MAX_LEN) {
    errors.borrowerAlias = `Borrower display name cannot exceed ${CONSTRAINTS.BORROWER_ALIAS_MAX_LEN} characters.`;
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

  if (!record.id || typeof record.id !== 'string') {
    errors.id = 'Request record must possess a valid string ID.';
  }

  if (!record.itemId || typeof record.itemId !== 'string') {
    errors.itemId = 'Request record must possess a valid target item ID.';
  }

  const alias = (record.borrowerAlias || record.requestedBy || '').trim();
  if (!alias) {
    errors.borrowerAlias = 'Request record is missing a borrower display name.';
  }

  const start = (record.startDate || record.collectionDate || '').trim();
  const end = (record.endDate || record.returnDeadline || '').trim();
  if (!start || !end) {
    errors.dates = 'Request record is missing start or end dates.';
  } else if (end < start) {
    errors.dates = 'Return deadline cannot precede collection date.';
  }

  const validStatuses = Object.values(REQUEST_STATUS);
  if (!record.status || !validStatuses.includes(record.status)) {
    errors.status = `Invalid request status "${record.status}". Allowed values: ${validStatuses.join(', ')}.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
