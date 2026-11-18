import { describe, it, expect } from 'vitest';
import {
  LOAN_STATUS,
  isLoanOverdue,
  isReservationUncollected,
  canRecordCollection,
  canConfirmReceipt,
  canMarkReturn,
  canInspectReturn,
  canReleaseUncollected,
  doesLoanBlockReservations,
} from './loanStatus';

describe('loanStatus domain invariants', () => {
  const baseActiveLoan = {
    requestId: 'req-1',
    status: LOAN_STATUS.ACTIVE,
    collectionDate: '2026-12-01',
    returnDeadline: '2026-12-05',
    collectedAt: '2026-12-01T10:00:00.000Z',
  };

  const baseReservedLoan = {
    requestId: 'req-2',
    status: LOAN_STATUS.RESERVED,
    collectionDate: '2026-12-01',
    returnDeadline: '2026-12-05',
    collectedAt: null,
  };

  it('correctly derives isLoanOverdue strictly for ACTIVE loans', () => {
    // When today is after returnDeadline and loan is ACTIVE
    expect(isLoanOverdue(baseActiveLoan, '2026-12-06')).toBe(true);
    // On the return deadline day, it is not yet overdue
    expect(isLoanOverdue(baseActiveLoan, '2026-12-05')).toBe(false);
    // Prior to return deadline
    expect(isLoanOverdue(baseActiveLoan, '2026-12-04')).toBe(false);

    // CRITICAL: A RESERVED loan whose period elapsed without collection is NOT an overdue physical loan
    expect(isLoanOverdue(baseReservedLoan, '2026-12-06')).toBe(false);
    // COMPLETED or RELEASED loans are never overdue
    expect(isLoanOverdue({ ...baseActiveLoan, status: LOAN_STATUS.COMPLETED }, '2026-12-06')).toBe(false);
  });

  it('correctly derives isReservationUncollected strictly for RESERVED loans past deadline', () => {
    expect(isReservationUncollected(baseReservedLoan, '2026-12-06')).toBe(true);
    expect(isReservationUncollected(baseReservedLoan, '2026-12-05')).toBe(false);
    expect(isReservationUncollected(baseActiveLoan, '2026-12-06')).toBe(false);
  });

  it('validates collection recording window [collectionDate, returnDeadline]', () => {
    // Before collection date: not allowed
    expect(canRecordCollection(baseReservedLoan, '2026-11-30')).toBe(false);
    // On collection date: allowed
    expect(canRecordCollection(baseReservedLoan, '2026-12-01')).toBe(true);
    // During loan window: allowed
    expect(canRecordCollection(baseReservedLoan, '2026-12-03')).toBe(true);
    // On return deadline: allowed
    expect(canRecordCollection(baseReservedLoan, '2026-12-05')).toBe(true);
    // Past return deadline: not allowed (requires new reservation or release)
    expect(canRecordCollection(baseReservedLoan, '2026-12-06')).toBe(false);

    // If already ACTIVE, cannot record collection again
    expect(canRecordCollection(baseActiveLoan, '2026-12-01')).toBe(false);
  });

  it('validates receipt confirmation state', () => {
    // No owner handover yet
    expect(canConfirmReceipt(baseReservedLoan)).toBe(false);
    // Owner handover recorded, awaiting borrower confirmation
    expect(canConfirmReceipt({
      ...baseReservedLoan,
      collectionCheckpoint: { ownerRecordedAt: '2026-12-01T10:00:00.000Z' },
    })).toBe(true);
    // Already collected
    expect(canConfirmReceipt({
      ...baseReservedLoan,
      collectionCheckpoint: { ownerRecordedAt: '2026-12-01T10:00:00.000Z' },
      collectedAt: '2026-12-01T10:30:00.000Z',
    })).toBe(false);
  });

  it('validates return marking and inspection rights', () => {
    expect(canMarkReturn(baseActiveLoan)).toBe(true);
    expect(canMarkReturn({
      ...baseActiveLoan,
      returnCheckpoint: { borrowerReturnMarkedAt: '2026-12-05T12:00:00.000Z' },
    })).toBe(false);

    // B1: canInspectReturn requires borrower to have marked return
    expect(canInspectReturn(baseActiveLoan)).toBe(false);
    expect(canInspectReturn({
      ...baseActiveLoan,
      returnCheckpoint: { borrowerReturnMarkedAt: '2026-12-05T12:00:00.000Z' },
    })).toBe(true);
    expect(canInspectReturn(baseReservedLoan)).toBe(false);
  });

  it('validates release of uncollected reservations', () => {
    // Cannot release if deadline has not passed
    expect(canReleaseUncollected(baseReservedLoan, '2026-12-05')).toBe(false);
    // Can release after return deadline
    expect(canReleaseUncollected(baseReservedLoan, '2026-12-06')).toBe(true);
    // Cannot release if loan is ACTIVE
    expect(canReleaseUncollected(baseActiveLoan, '2026-12-06')).toBe(false);
  });

  it('identifies which loan statuses block overlapping reservations', () => {
    expect(doesLoanBlockReservations({ status: LOAN_STATUS.RESERVED })).toBe(true);
    expect(doesLoanBlockReservations({ status: LOAN_STATUS.ACTIVE })).toBe(true);
    expect(doesLoanBlockReservations({ status: LOAN_STATUS.COMPLETED })).toBe(false);
    expect(doesLoanBlockReservations({ status: LOAN_STATUS.RELEASED_NOT_COLLECTED })).toBe(false);
  });
});
