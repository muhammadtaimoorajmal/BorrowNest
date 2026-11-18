/**
 * Loan Lifecycle Status Enumeration & Transition Invariants (DR-04).
 * Separates physical loan lifecycle from immutable borrowing request decisions.
 */

import { getLocalToday, isValidDateOnly } from '../services/dateRange';

export const LOAN_STATUS = Object.freeze({
  RESERVED: 'RESERVED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  RELEASED_NOT_COLLECTED: 'RELEASED_NOT_COLLECTED',
});

export const LOAN_STATUS_META = Object.freeze({
  [LOAN_STATUS.RESERVED]: {
    id: 'RESERVED',
    label: 'Reserved (Awaiting Collection)',
    description: 'Borrowing request approved. Physical collection handover has not yet been recorded.',
    badgeClass: 'badgeReserved',
    isTerminal: false,
    blocksReservations: true,
  },
  [LOAN_STATUS.ACTIVE]: {
    id: 'ACTIVE',
    label: 'Active Loan',
    description: 'Physical collection handover recorded and confirmed. Item is in borrower custody.',
    badgeClass: 'badgeActive',
    isTerminal: false,
    blocksReservations: true,
  },
  [LOAN_STATUS.COMPLETED]: {
    id: 'COMPLETED',
    label: 'Completed & Returned',
    description: 'Item physically returned and owner condition inspection completed.',
    badgeClass: 'badgeCompleted',
    isTerminal: true,
    blocksReservations: false,
  },
  [LOAN_STATUS.RELEASED_NOT_COLLECTED]: {
    id: 'RELEASED_NOT_COLLECTED',
    label: 'Released (Uncollected)',
    description: 'Reservation period elapsed without physical collection; explicitly released by owner.',
    badgeClass: 'badgeReleased',
    isTerminal: true,
    blocksReservations: false,
  },
});

/**
 * Checks whether an active loan is past its agreed return deadline (DR-03 + DR-04).
 * NOTE: Overdue is a DERIVED display status, applicable strictly to ACTIVE physical loans.
 * A RESERVED loan whose period elapsed without collection is uncollected, not an overdue physical loan.
 *
 * @param {object} loan - Loan lifecycle record
 * @param {string} [today=getLocalToday()] - Local calendar date
 * @returns {boolean}
 */
export function isLoanOverdue(loan, today = getLocalToday()) {
  if (!loan || loan.status !== LOAN_STATUS.ACTIVE) return false;
  const deadline = loan.returnDeadline || loan.endDate;
  if (!isValidDateOnly(deadline)) return false;
  return deadline < today;
}

/**
 * Checks whether an approved reservation period has elapsed without physical collection.
 * Requires explicit owner resolution.
 *
 * @param {object} loan - Loan lifecycle record
 * @param {string} [today=getLocalToday()] - Local calendar date
 * @returns {boolean}
 */
export function isReservationUncollected(loan, today = getLocalToday()) {
  if (!loan || loan.status !== LOAN_STATUS.RESERVED) return false;
  const deadline = loan.returnDeadline || loan.endDate;
  if (!isValidDateOnly(deadline)) return false;
  return deadline < today;
}

/**
 * Determines whether physical collection handover may be recorded today.
 * Collection is permitted only when today is within [collectionDate, returnDeadline].
 *
 * @param {object} loan
 * @param {string} [today=getLocalToday()]
 * @returns {boolean}
 */
export function canRecordCollection(loan, today = getLocalToday()) {
  if (!loan || loan.status !== LOAN_STATUS.RESERVED) return false;
  const start = loan.collectionDate || loan.startDate;
  const end = loan.returnDeadline || loan.endDate;
  if (!isValidDateOnly(start) || !isValidDateOnly(end)) return false;
  return today >= start && today <= end;
}

/**
 * Determines whether borrower receipt confirmation is pending.
 *
 * @param {object} loan
 * @returns {boolean}
 */
export function canConfirmReceipt(loan) {
  if (!loan || loan.status !== LOAN_STATUS.RESERVED) return false;
  return Boolean(loan.collectionCheckpoint?.ownerRecordedAt && !loan.collectedAt);
}

/**
 * Determines whether the borrower can mark the item physically returned.
 *
 * @param {object} loan
 * @returns {boolean}
 */
export function canMarkReturn(loan) {
  if (!loan || loan.status !== LOAN_STATUS.ACTIVE) return false;
  return !loan.returnCheckpoint?.borrowerReturnMarkedAt;
}

/**
 * Determines whether the owner can complete the return condition inspection.
 *
 * @param {object} loan
 * @returns {boolean}
 */
export function canInspectReturn(loan) {
  if (!loan || loan.status !== LOAN_STATUS.ACTIVE) return false;
  return true;
}

/**
 * Determines whether an owner can explicitly release an uncollected reservation.
 * Permitted only when status is RESERVED, collection was never confirmed, and returnDeadline < today.
 *
 * @param {object} loan
 * @param {string} [today=getLocalToday()]
 * @returns {boolean}
 */
export function canReleaseUncollected(loan, today = getLocalToday()) {
  if (!loan || loan.status !== LOAN_STATUS.RESERVED) return false;
  const deadline = loan.returnDeadline || loan.endDate;
  if (!isValidDateOnly(deadline)) return false;
  return today > deadline;
}

/**
 * Determines whether a loan lifecycle record occupies calendar dates and blocks conflicting reservations.
 *
 * @param {object} loan
 * @returns {boolean}
 */
export function doesLoanBlockReservations(loan) {
  if (!loan) return false;
  return loan.status === LOAN_STATUS.RESERVED || loan.status === LOAN_STATUS.ACTIVE;
}
