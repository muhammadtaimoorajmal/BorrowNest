import { describe, it, expect } from 'vitest';
import {
  getLocalToday,
  isValidDateOnly,
  isDateInPast,
  validateDateRange,
  rangesOverlapInclusive,
  findConflictingReservations,
  isOverdueReservation,
  formatDateDisplay,
  formatDateRange,
} from './dateRange';

describe('Date-Range & Scheduling Engine (DR-03)', () => {
  describe('getLocalToday', () => {
    it('returns a valid YYYY-MM-DD string matching local date', () => {
      const today = getLocalToday();
      expect(isValidDateOnly(today)).toBe(true);
      const now = new Date();
      expect(today.startsWith(String(now.getFullYear()))).toBe(true);
    });
  });

  describe('isValidDateOnly', () => {
    it('accepts valid calendar dates', () => {
      expect(isValidDateOnly('2026-01-01')).toBe(true);
      expect(isValidDateOnly('2026-12-31')).toBe(true);
      expect(isValidDateOnly('2024-02-29')).toBe(true); // 2024 is leap year
    });

    it('rejects invalid format or types', () => {
      expect(isValidDateOnly('')).toBe(false);
      expect(isValidDateOnly(null)).toBe(false);
      expect(isValidDateOnly(undefined)).toBe(false);
      expect(isValidDateOnly('2026/12/01')).toBe(false);
      expect(isValidDateOnly('12-01-2026')).toBe(false);
      expect(isValidDateOnly('not-a-date')).toBe(false);
    });

    it('rejects non-existent calendar dates', () => {
      expect(isValidDateOnly('2025-02-29')).toBe(false); // 2025 is not a leap year
      expect(isValidDateOnly('2026-04-31')).toBe(false); // April has 30 days
      expect(isValidDateOnly('2026-13-01')).toBe(false); // Month 13 invalid
      expect(isValidDateOnly('2026-00-10')).toBe(false); // Month 00 invalid
      expect(isValidDateOnly('2026-01-32')).toBe(false); // Day 32 invalid
    });
  });

  describe('isDateInPast', () => {
    it('returns true for dates prior to baseline', () => {
      expect(isDateInPast('2026-01-01', '2026-01-02')).toBe(true);
      expect(isDateInPast('2025-12-31', '2026-01-01')).toBe(true);
    });

    it('returns false for today and future dates', () => {
      expect(isDateInPast('2026-01-02', '2026-01-02')).toBe(false);
      expect(isDateInPast('2026-01-03', '2026-01-02')).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    const today = '2026-11-20';

    it('accepts valid future date range', () => {
      const res = validateDateRange('2026-11-25', '2026-11-28', today);
      expect(res.isValid).toBe(true);
      expect(res.error).toBeNull();
    });

    it('accepts same-day collection and return starting today', () => {
      const res = validateDateRange('2026-11-20', '2026-11-20', today);
      expect(res.isValid).toBe(true);
      expect(res.error).toBeNull();
    });

    it('rejects collection date in the past', () => {
      const res = validateDateRange('2026-11-19', '2026-11-22', today);
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/cannot be in the past/i);
    });

    it('rejects return deadline earlier than collection date', () => {
      const res = validateDateRange('2026-11-25', '2026-11-22', today);
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/cannot precede the collection date/i);
    });

    it('rejects missing or invalid dates', () => {
      expect(validateDateRange('', '2026-11-25', today).isValid).toBe(false);
      expect(validateDateRange('2026-11-25', '', today).isValid).toBe(false);
      expect(validateDateRange('invalid', '2026-11-25', today).isValid).toBe(false);
    });
  });

  describe('rangesOverlapInclusive (Inclusive interval rule: candidateStart <= existingEnd && existingStart <= candidateEnd)', () => {
    it('detects overlap when ranges are identical', () => {
      expect(rangesOverlapInclusive('2026-12-01', '2026-12-05', '2026-12-01', '2026-12-05')).toBe(true);
    });

    it('detects overlap when candidate is entirely inside existing range', () => {
      expect(rangesOverlapInclusive('2026-12-02', '2026-12-04', '2026-12-01', '2026-12-06')).toBe(true);
    });

    it('detects overlap when candidate encompasses existing range', () => {
      expect(rangesOverlapInclusive('2026-12-01', '2026-12-10', '2026-12-03', '2026-12-07')).toBe(true);
    });

    it('detects overlap on exact start/end boundary sharing date', () => {
      // Range A ends Dec 5, Range B starts Dec 5 -> inclusive overlap on Dec 5
      expect(rangesOverlapInclusive('2026-12-01', '2026-12-05', '2026-12-05', '2026-12-10')).toBe(true);
      expect(rangesOverlapInclusive('2026-12-05', '2026-12-10', '2026-12-01', '2026-12-05')).toBe(true);
    });

    it('returns false for adjacent non-overlapping ranges', () => {
      // Range A ends Dec 4, Range B starts Dec 5 -> no overlap
      expect(rangesOverlapInclusive('2026-12-01', '2026-12-04', '2026-12-05', '2026-12-10')).toBe(false);
      expect(rangesOverlapInclusive('2026-12-05', '2026-12-10', '2026-12-01', '2026-12-04')).toBe(false);
    });

    it('returns false for completely disjoint ranges', () => {
      expect(rangesOverlapInclusive('2026-11-01', '2026-11-05', '2026-12-01', '2026-12-05')).toBe(false);
    });

    it('handles same-day loan overlap', () => {
      expect(rangesOverlapInclusive('2026-12-03', '2026-12-03', '2026-12-01', '2026-12-05')).toBe(true);
      expect(rangesOverlapInclusive('2026-12-03', '2026-12-03', '2026-12-04', '2026-12-04')).toBe(false);
    });
  });

  describe('findConflictingReservations', () => {
    const existing = [
      { id: 'res-1', status: 'APPROVED', startDate: '2026-12-05', endDate: '2026-12-10' },
      { id: 'res-2', status: 'PENDING', startDate: '2026-12-12', endDate: '2026-12-15' },
      { id: 'res-3', status: 'DECLINED', startDate: '2026-12-18', endDate: '2026-12-20' },
      { id: 'res-4', status: 'CANCELLED', startDate: '2026-12-22', endDate: '2026-12-25' },
      { id: 'res-5', status: 'APPROVED', collectionDate: '2026-12-28', returnDeadline: '2026-12-30' },
    ];

    it('returns approved reservation overlapping candidate dates', () => {
      const conflicts = findConflictingReservations(
        { startDate: '2026-12-08', endDate: '2026-12-11' },
        existing,
      );
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].id).toBe('res-1');
    });

    it('does NOT treat pending, declined, or cancelled requests as blocking conflicts', () => {
      // Overlaps res-2 (PENDING), res-3 (DECLINED), and res-4 (CANCELLED)
      const conflicts = findConflictingReservations(
        { startDate: '2026-12-12', endDate: '2026-12-25' },
        existing,
      );
      expect(conflicts.length).toBe(0);
    });

    it('supports collectionDate/returnDeadline field aliases in reservation objects', () => {
      const conflicts = findConflictingReservations(
        { startDate: '2026-12-29', endDate: '2026-12-31' },
        existing,
      );
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].id).toBe('res-5');
    });

    it('ignores target request ID when evaluating self-update', () => {
      const conflicts = findConflictingReservations(
        { startDate: '2026-12-05', endDate: '2026-12-10' },
        existing,
        'res-1',
      );
      expect(conflicts.length).toBe(0);
    });

    it('identifies RESERVED and ACTIVE loans as blocking, but ignores COMPLETED and RELEASED_NOT_COLLECTED (Module 09 Section 8)', () => {
      const loanRecords = [
        { requestId: 'loan-res', status: 'RESERVED', collectionDate: '2026-12-01', returnDeadline: '2026-12-04' },
        { requestId: 'loan-act', status: 'ACTIVE', collectionDate: '2026-12-06', returnDeadline: '2026-12-08' },
        { requestId: 'loan-comp', status: 'COMPLETED', collectionDate: '2026-12-10', returnDeadline: '2026-12-12' },
        { requestId: 'loan-rel', status: 'RELEASED_NOT_COLLECTED', collectionDate: '2026-12-14', returnDeadline: '2026-12-16' },
      ];

      // Overlaps RESERVED loan -> blocked
      expect(findConflictingReservations({ startDate: '2026-12-02', endDate: '2026-12-03' }, loanRecords).length).toBe(1);

      // Overlaps ACTIVE loan -> blocked
      expect(findConflictingReservations({ startDate: '2026-12-07', endDate: '2026-12-09' }, loanRecords).length).toBe(1);

      // Overlaps COMPLETED loan -> UNBLOCKED (can borrow again)
      expect(findConflictingReservations({ startDate: '2026-12-10', endDate: '2026-12-12' }, loanRecords).length).toBe(0);

      // Overlaps RELEASED_NOT_COLLECTED loan -> UNBLOCKED (can borrow again)
      expect(findConflictingReservations({ startDate: '2026-12-14', endDate: '2026-12-16' }, loanRecords).length).toBe(0);
    });
  });

  describe('isOverdueReservation', () => {
    it('detects when an approved return deadline has passed', () => {
      expect(isOverdueReservation('2026-11-15', '2026-11-20')).toBe(true);
      expect(isOverdueReservation('2026-11-20', '2026-11-20')).toBe(false);
      expect(isOverdueReservation('2026-11-25', '2026-11-20')).toBe(false);
    });
  });

  describe('formatDateDisplay and formatDateRange', () => {
    it('formats single date safely', () => {
      const disp = formatDateDisplay('2026-12-01');
      expect(disp).toContain('2026');
      expect(disp).toMatch(/Dec|12/);
    });

    it('formats date range safely', () => {
      const range = formatDateRange('2026-12-01', '2026-12-05');
      expect(range).toContain('–');
      expect(range).toContain('2026');
    });

    it('returns single date if start and end are identical', () => {
      const range = formatDateRange('2026-12-01', '2026-12-01');
      expect(range).not.toContain('–');
    });
  });
});
