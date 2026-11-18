/**
 * Pure Date-Range and Inclusive Calendar-Day Scheduling Utilities (DR-03).
 * Uses strictly local browser calendar dates to prevent UTC timezone displacement.
 */

/**
 * Returns today's calendar date in local timezone formatted as YYYY-MM-DD.
 * @returns {string} YYYY-MM-DD
 */
export function getLocalToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates whether a string is a strictly valid real calendar date formatted as YYYY-MM-DD.
 * Properly validates days per month and leap years (e.g. rejects 2025-02-29).
 * @param {string} dateStr - Date string to evaluate
 * @returns {boolean}
 */
export function isValidDateOnly(dateStr) {
  if (typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const [yStr, mStr, dStr] = dateStr.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);

  if (month < 1 || month > 12) return false;
  if (day < 1) return false;

  // Days in month calculation accounting for leap years
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonths = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return day <= daysInMonths[month - 1];
}

/**
 * Checks whether a YYYY-MM-DD date precedes today's local date.
 * @param {string} dateStr - Date string to compare
 * @param {string} [today=getLocalToday()] - Local today string
 * @returns {boolean}
 */
export function isDateInPast(dateStr, today = getLocalToday()) {
  if (!isValidDateOnly(dateStr)) return false;
  return dateStr < today;
}

/**
 * Validates a start (collection) and end (return deadline) date range.
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {string} [today=getLocalToday()] - Comparison baseline
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateDateRange(startDate, endDate, today = getLocalToday()) {
  if (!startDate) {
    return { isValid: false, error: 'Collection date is required.' };
  }
  if (!isValidDateOnly(startDate)) {
    return { isValid: false, error: 'Collection date must be a valid calendar date in YYYY-MM-DD format.' };
  }
  if (!endDate) {
    return { isValid: false, error: 'Return deadline is required.' };
  }
  if (!isValidDateOnly(endDate)) {
    return { isValid: false, error: 'Return deadline must be a valid calendar date in YYYY-MM-DD format.' };
  }

  if (startDate < today) {
    return { isValid: false, error: 'Collection date cannot be in the past.' };
  }

  if (endDate < startDate) {
    return { isValid: false, error: 'Return deadline cannot precede the collection date.' };
  }

  return { isValid: true, error: null };
}

/**
 * Evaluates whether two calendar date intervals overlap using inclusive day semantics (DR-03).
 * Two intervals overlap if and only if: candidateStart <= existingEnd AND existingStart <= candidateEnd.
 *
 * @param {string} startA - YYYY-MM-DD
 * @param {string} endA - YYYY-MM-DD
 * @param {string} startB - YYYY-MM-DD
 * @param {string} endB - YYYY-MM-DD
 * @returns {boolean} True if intervals overlap on any day (including boundary days)
 */
export function rangesOverlapInclusive(startA, endA, startB, endB) {
  if (!isValidDateOnly(startA) || !isValidDateOnly(endA) || !isValidDateOnly(startB) || !isValidDateOnly(endB)) {
    return false;
  }
  return startA <= endB && startB <= endA;
}

/**
 * Identifies any existing approved reservation records that conflict with candidate dates.
 * Applies the DR-03 overdue safety hold rule: an approved reservation whose deadline has passed
 * remains a safety hold blocking overlapping ranges until formally resolved.
 *
 * @param {{ startDate: string, endDate: string }} candidateRange
 * @param {Array<object>} approvedRequests - Existing approved request records for the item
 * @param {string} [ignoreRequestId] - Optional request ID to exclude (e.g. self)
 * @returns {Array<object>} Conflicting reservation records
 */
export function findConflictingReservations(candidateRange, approvedRequests, ignoreRequestId = null) {
  if (!candidateRange || !Array.isArray(approvedRequests)) return [];

  const candidateStart = candidateRange.startDate || candidateRange.collectionDate;
  const candidateEnd = candidateRange.endDate || candidateRange.returnDeadline;

  if (!isValidDateOnly(candidateStart) || !isValidDateOnly(candidateEnd)) return [];

  return approvedRequests.filter((req) => {
    if (ignoreRequestId && req.id === ignoreRequestId) return false;
    if (req.status !== 'APPROVED') return false;

    const existingStart = req.startDate || req.collectionDate;
    const existingEnd = req.endDate || req.returnDeadline;

    return rangesOverlapInclusive(candidateStart, candidateEnd, existingStart, existingEnd);
  });
}

/**
 * Checks whether an approved reservation's return deadline has passed.
 * @param {string} endDate - YYYY-MM-DD
 * @param {string} [today=getLocalToday()]
 * @returns {boolean}
 */
export function isOverdueReservation(endDate, today = getLocalToday()) {
  if (!isValidDateOnly(endDate)) return false;
  return endDate < today;
}

/**
 * Formats a YYYY-MM-DD string into a readable local date display string (e.g. "Dec 1, 2026").
 * Constructs date using local components to avoid UTC hour-shifting.
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string}
 */
export function formatDateDisplay(dateStr) {
  if (!isValidDateOnly(dateStr)) return dateStr || '';
  const [yStr, mStr, dStr] = dateStr.split('-');
  const localDate = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, parseInt(dStr, 10));
  return localDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a date range into a concise human-readable string.
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {string}
 */
export function formatDateRange(startDate, endDate) {
  const startDisp = formatDateDisplay(startDate);
  const endDisp = formatDateDisplay(endDate);
  if (!startDisp && !endDisp) return '';
  if (startDisp === endDisp) return startDisp;
  return `${startDisp} – ${endDisp}`;
}
