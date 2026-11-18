import { describe, it, expect } from 'vitest';
import { LOAN_STATUS } from '../constants/loanStatus';
import { normalizeLoanRecord, validateLoanRecord } from './loanValidation';

describe('loanValidation', () => {
  it('normalizes and validates a standard RESERVED loan record', () => {
    const raw = {
      requestId: 'req-123',
      itemId: 'item-456',
      itemTitleSnapshot: 'High-Pressure Washer',
      borrowerAlias: 'Alex Rivers',
      collectionDate: '2026-12-10',
      returnDeadline: '2026-12-14',
      status: LOAN_STATUS.RESERVED,
    };

    const normalized = normalizeLoanRecord(raw);
    expect(normalized.requestId).toBe('req-123');
    expect(normalized.status).toBe(LOAN_STATUS.RESERVED);
    expect(normalized.schemaVersion).toBe(1);

    const validation = validateLoanRecord(normalized);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toEqual({});
  });

  it('validates ACTIVE loans require collectedAt and collectionCheckpoint', () => {
    const invalidActive = {
      requestId: 'req-1',
      itemId: 'item-1',
      collectionDate: '2026-12-10',
      returnDeadline: '2026-12-14',
      status: LOAN_STATUS.ACTIVE,
      collectedAt: null,
    };

    const res = validateLoanRecord(invalidActive);
    expect(res.isValid).toBe(false);
    expect(res.errors.collectedAt).toBeDefined();

    const validActive = {
      ...invalidActive,
      collectedAt: '2026-12-10T11:00:00.000Z',
      collectionCheckpoint: {
        conditionGrade: 4,
        conditionLabel: 'Good',
        ownerRecordedAt: '2026-12-10T10:50:00.000Z',
      },
    };
    const validRes = validateLoanRecord(validActive);
    expect(validRes.isValid).toBe(true);
  });

  it('validates COMPLETED loans require completedAt and returnCheckpoint', () => {
    const invalidCompleted = {
      requestId: 'req-1',
      itemId: 'item-1',
      collectionDate: '2026-12-10',
      returnDeadline: '2026-12-14',
      status: LOAN_STATUS.COMPLETED,
      completedAt: null,
    };

    const res = validateLoanRecord(invalidCompleted);
    expect(res.isValid).toBe(false);
    expect(res.errors.completedAt).toBeDefined();

    const missingBorrowerReturn = {
      ...invalidCompleted,
      collectedAt: '2026-12-10T11:00:00.000Z',
      collectionCheckpoint: {
        conditionGrade: 4,
        ownerRecordedAt: '2026-12-10T10:50:00.000Z',
      },
      completedAt: '2026-12-14T15:00:00.000Z',
      returnCheckpoint: {
        conditionGrade: 4,
        ownerInspectedAt: '2026-12-14T15:00:00.000Z',
      },
    };
    const missingBorrowerRes = validateLoanRecord(missingBorrowerReturn);
    expect(missingBorrowerRes.isValid).toBe(false);
    expect(missingBorrowerRes.errors.borrowerReturnMarkedAt).toBeDefined();

    const validCompleted = {
      ...missingBorrowerReturn,
      returnCheckpoint: {
        conditionGrade: 4,
        borrowerReturnMarkedAt: '2026-12-14T14:30:00.000Z',
        ownerInspectedAt: '2026-12-14T15:00:00.000Z',
      },
    };
    const validRes = validateLoanRecord(validCompleted);
    expect(validRes.isValid).toBe(true);
  });

  it('rejects invalid dates or inverted date ranges', () => {
    const inverted = {
      requestId: 'req-1',
      itemId: 'item-1',
      collectionDate: '2026-12-15',
      returnDeadline: '2026-12-10',
      status: LOAN_STATUS.RESERVED,
    };

    const res = validateLoanRecord(inverted);
    expect(res.isValid).toBe(false);
    expect(res.errors.dates).toContain('cannot precede');
  });

  it('rejects missing requestId or itemId', () => {
    const missingReqId = {
      requestId: '',
      itemId: 'item-1',
      collectionDate: '2026-12-10',
      returnDeadline: '2026-12-14',
      status: LOAN_STATUS.RESERVED,
    };
    expect(validateLoanRecord(missingReqId).isValid).toBe(false);
  });
});
