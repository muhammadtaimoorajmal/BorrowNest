import { describe, it, expect } from 'vitest';
import {
  normalizeBorrowRequest,
  validateBorrowRequestPayload,
  validateBorrowRequestRecord,
  CONSTRAINTS,
} from './borrowRequestValidation';
import { REQUEST_STATUS } from '../constants/requestStatus';

describe('Borrowing Request Validation (DR-02, DR-03)', () => {
  const today = '2026-11-20';

  describe('normalizeBorrowRequest', () => {
    it('normalizes raw object and populates dual canonical and alias field properties', () => {
      const raw = {
        id: 'req-123',
        itemId: 'item-abc',
        itemTitle: 'Power Drill',
        borrowerAlias: 'Alex P.',
        startDate: '2026-12-01',
        endDate: '2026-12-04',
        requestNote: 'For weekend shelf hanging',
      };

      const normalized = normalizeBorrowRequest(raw);
      expect(normalized.id).toBe('req-123');
      expect(normalized.itemId).toBe('item-abc');
      expect(normalized.itemTitleSnapshot).toBe('Power Drill');

      // Canonical and aliases must be identical
      expect(normalized.borrowerAlias).toBe('Alex P.');
      expect(normalized.requestedBy).toBe('Alex P.');
      expect(normalized.startDate).toBe('2026-12-01');
      expect(normalized.collectionDate).toBe('2026-12-01');
      expect(normalized.endDate).toBe('2026-12-04');
      expect(normalized.returnDeadline).toBe('2026-12-04');
      expect(normalized.requestNote).toBe('For weekend shelf hanging');
      expect(normalized.note).toBe('For weekend shelf hanging');
      expect(normalized.status).toBe(REQUEST_STATUS.PENDING);
    });

    it('generates ID and timestamps if omitted in raw input', () => {
      const normalized = normalizeBorrowRequest({
        itemId: 'item-1',
        requestedBy: 'Sam',
        collectionDate: '2026-12-01',
        returnDeadline: '2026-12-02',
      });

      expect(normalized.id).toBeDefined();
      expect(normalized.createdAt).toBeDefined();
      expect(normalized.updatedAt).toBeDefined();
      expect(normalized.decidedAt).toBeNull();
    });
  });

  describe('validateBorrowRequestPayload', () => {
    const validPayload = {
      itemId: 'item-123',
      borrowerAlias: 'Jordan',
      startDate: '2026-11-25',
      endDate: '2026-11-28',
      requestNote: 'Garden trimming over the weekend',
    };

    it('accepts valid payload', () => {
      const res = validateBorrowRequestPayload(validPayload, { today });
      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors).length).toBe(0);
    });

    it('rejects missing or whitespace-only borrower display name', () => {
      const res = validateBorrowRequestPayload({ ...validPayload, borrowerAlias: '  ' }, { today });
      expect(res.isValid).toBe(false);
      expect(res.errors.borrowerAlias).toBeDefined();
    });

    it('enforces borrower display name length boundaries', () => {
      const tooShort = validateBorrowRequestPayload({ ...validPayload, borrowerAlias: 'J' }, { today });
      expect(tooShort.isValid).toBe(false);
      expect(tooShort.errors.borrowerAlias).toMatch(/at least 2/i);

      const tooLong = validateBorrowRequestPayload(
        { ...validPayload, borrowerAlias: 'A'.repeat(CONSTRAINTS.BORROWER_ALIAS_MAX_LEN + 1) },
        { today },
      );
      expect(tooLong.isValid).toBe(false);
      expect(tooLong.errors.borrowerAlias).toMatch(/cannot exceed/i);
    });

    it('rejects missing or past start date', () => {
      const missingStart = validateBorrowRequestPayload({ ...validPayload, startDate: '' }, { today });
      expect(missingStart.isValid).toBe(false);
      expect(missingStart.errors.startDate).toBeDefined();

      const pastStart = validateBorrowRequestPayload({ ...validPayload, startDate: '2026-11-15' }, { today });
      expect(pastStart.isValid).toBe(false);
      expect(pastStart.errors.startDate).toMatch(/cannot be in the past/i);
    });

    it('rejects return deadline preceding collection date', () => {
      const inverted = validateBorrowRequestPayload(
        { ...validPayload, startDate: '2026-11-25', endDate: '2026-11-22' },
        { today },
      );
      expect(inverted.isValid).toBe(false);
      expect(inverted.errors.endDate).toMatch(/cannot precede the collection date/i);
    });

    it('enforces note maximum length constraint', () => {
      const overLongNote = validateBorrowRequestPayload(
        { ...validPayload, requestNote: 'X'.repeat(CONSTRAINTS.REQUEST_NOTE_MAX_LEN + 1) },
        { today },
      );
      expect(overLongNote.isValid).toBe(false);
      expect(overLongNote.errors.requestNote).toMatch(/cannot exceed 500/i);
    });
  });

  describe('validateBorrowRequestRecord', () => {
    it('validates a complete record', () => {
      const record = {
        id: 'req-1',
        itemId: 'item-1',
        borrowerAlias: 'Taylor',
        startDate: '2026-12-01',
        endDate: '2026-12-05',
        status: 'PENDING',
      };
      expect(validateBorrowRequestRecord(record).isValid).toBe(true);
    });

    it('rejects invalid status', () => {
      const record = {
        id: 'req-1',
        itemId: 'item-1',
        borrowerAlias: 'Taylor',
        startDate: '2026-12-01',
        endDate: '2026-12-05',
        status: 'UNKNOWN_STATUS',
      };
      const res = validateBorrowRequestRecord(record);
      expect(res.isValid).toBe(false);
      expect(res.errors.status).toBeDefined();
    });
  });
});
