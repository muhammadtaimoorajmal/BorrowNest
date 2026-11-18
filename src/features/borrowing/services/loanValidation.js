/**
 * Loan Lifecycle Entity Normalization and Record Validation (DR-04).
 */

import { LOAN_STATUS } from '../constants/loanStatus';
import { isValidDateOnly } from './dateRange';
import { validateConditionCheckpoint } from './conditionValidation';

export const LOAN_SCHEMA_VERSION = 1;

/**
 * Normalizes a loan record to ensure standard schema fields.
 *
 * @param {object} raw
 * @returns {object|null}
 */
export function normalizeLoanRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const requestId = (raw.requestId || raw.id || '').trim();
  const itemId = (raw.itemId || '').trim();
  const itemTitleSnapshot = (raw.itemTitleSnapshot || raw.itemTitle || '').trim();
  const borrowerAlias = (raw.borrowerAlias || raw.requestedBy || '').trim();

  const collectionDate = (raw.collectionDate || raw.startDate || '').trim();
  const returnDeadline = (raw.returnDeadline || raw.endDate || '').trim();

  const status = raw.status || LOAN_STATUS.RESERVED;
  const reservedAt = raw.reservedAt || raw.createdAt || new Date().toISOString();

  const collectionCheckpoint = raw.collectionCheckpoint
    ? {
        recordedAt: raw.collectionCheckpoint.recordedAt || null,
        conditionGrade: Number(raw.collectionCheckpoint.conditionGrade) || null,
        conditionLabel: raw.collectionCheckpoint.conditionLabel || '',
        notes: raw.collectionCheckpoint.notes || '',
        photos: Array.isArray(raw.collectionCheckpoint.photos) ? raw.collectionCheckpoint.photos : [],
        ownerRecordedAt: raw.collectionCheckpoint.ownerRecordedAt || null,
        borrowerReviewedAt: raw.collectionCheckpoint.borrowerReviewedAt || null,
        borrowerObservation: raw.collectionCheckpoint.borrowerObservation || '',
      }
    : null;

  const returnCheckpoint = raw.returnCheckpoint
    ? {
        recordedAt: raw.returnCheckpoint.recordedAt || null,
        conditionGrade: Number(raw.returnCheckpoint.conditionGrade) || null,
        conditionLabel: raw.returnCheckpoint.conditionLabel || '',
        notes: raw.returnCheckpoint.notes || '',
        photos: Array.isArray(raw.returnCheckpoint.photos) ? raw.returnCheckpoint.photos : [],
        ownerInspectedAt: raw.returnCheckpoint.ownerInspectedAt || null,
        borrowerReturnMarkedAt: raw.returnCheckpoint.borrowerReturnMarkedAt || null,
      }
    : null;

  return {
    schemaVersion: raw.schemaVersion || LOAN_SCHEMA_VERSION,
    requestId,
    itemId,
    itemTitleSnapshot,
    borrowerAlias,
    collectionDate,
    returnDeadline,
    status,
    reservedAt,
    collectionCheckpoint,
    collectedAt: raw.collectedAt || null,
    returnCheckpoint,
    completedAt: raw.completedAt || null,
    resolution: raw.resolution || null,
    releasedAt: raw.releasedAt || null,
    releaseNote: raw.releaseNote || '',
    provenance: raw.provenance || null,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  };
}

/**
 * Validates the schema and relational invariants of a loan lifecycle record.
 *
 * @param {object} loan
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateLoanRecord(loan) {
  const errors = {};

  if (!loan || typeof loan !== 'object') {
    return { isValid: false, errors: { loan: 'Loan record is required.' } };
  }

  if (!loan.requestId || typeof loan.requestId !== 'string' || !loan.requestId.trim()) {
    errors.requestId = 'Loan record requires a valid string requestId.';
  }

  if (!loan.itemId || typeof loan.itemId !== 'string' || !loan.itemId.trim()) {
    errors.itemId = 'Loan record requires a valid string itemId.';
  }

  if (!isValidDateOnly(loan.collectionDate)) {
    errors.collectionDate = 'Valid collectionDate (YYYY-MM-DD) is required.';
  }

  if (!isValidDateOnly(loan.returnDeadline)) {
    errors.returnDeadline = 'Valid returnDeadline (YYYY-MM-DD) is required.';
  }

  if (loan.collectionDate && loan.returnDeadline && loan.returnDeadline < loan.collectionDate) {
    errors.dates = 'Return deadline cannot precede collection date.';
  }

  if (!Object.values(LOAN_STATUS).includes(loan.status)) {
    errors.status = `Invalid loan status "${loan.status}". Must be one of: ${Object.values(LOAN_STATUS).join(', ')}.`;
  }

  // Validate state-dependent checkpoint requirements
  if (loan.status === LOAN_STATUS.ACTIVE) {
    if (!loan.collectedAt) {
      errors.collectedAt = 'Active loans must have a recorded collectedAt timestamp.';
    }
    if (!loan.collectionCheckpoint?.ownerRecordedAt) {
      errors.collectionCheckpoint = 'Active loans must have an owner-recorded collection checkpoint.';
    }
  }

  if (loan.status === LOAN_STATUS.COMPLETED) {
    if (!loan.completedAt) {
      errors.completedAt = 'Completed loans must have a completedAt timestamp.';
    }
    if (!loan.returnCheckpoint?.ownerInspectedAt) {
      errors.returnCheckpoint = 'Completed loans must have an owner return inspection checkpoint.';
    }
  }

  if (loan.status === LOAN_STATUS.RELEASED_NOT_COLLECTED) {
    if (!loan.releasedAt) {
      errors.releasedAt = 'Released loans must have a recorded releasedAt timestamp.';
    }
  }

  // Validate collection checkpoint if present
  if (loan.collectionCheckpoint) {
    const cpVal = validateConditionCheckpoint(loan.collectionCheckpoint, { type: 'collection' });
    if (!cpVal.isValid) {
      errors.collectionCheckpoint = Object.values(cpVal.errors).join('; ');
    }
  }

  // Validate return checkpoint if present
  if (loan.returnCheckpoint) {
    const cpVal = validateConditionCheckpoint(loan.returnCheckpoint, { type: 'return' });
    if (!cpVal.isValid) {
      errors.returnCheckpoint = Object.values(cpVal.errors).join('; ');
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
