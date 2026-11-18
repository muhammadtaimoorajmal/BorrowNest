/**
 * BorrowNest Storage Error Classes
 */

export class StorageError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'StorageError';
    this.cause = cause;
  }
}

export class DatabaseUnavailableError extends StorageError {
  constructor(message = 'IndexedDB is unavailable in this browser environment.', cause) {
    super(message, cause);
    this.name = 'DatabaseUnavailableError';
  }
}

export class RecordNotFoundError extends StorageError {
  constructor(id, message = `Record with ID "${id}" was not found.`) {
    super(message);
    this.name = 'RecordNotFoundError';
    this.recordId = id;
  }
}

export class DuplicateKeyError extends StorageError {
  constructor(id, message = `Record with ID "${id}" already exists.`) {
    super(message);
    this.name = 'DuplicateKeyError';
    this.recordId = id;
  }
}

export class QuotaExceededError extends StorageError {
  constructor(message = 'Browser storage quota exceeded. Consider exporting a backup or clearing unused items.', cause) {
    super(message, cause);
    this.name = 'QuotaExceededError';
  }
}

export class ReservationConflictError extends StorageError {
  constructor(conflicts, message) {
    const defaultMsg = conflicts && conflicts.length > 0
      ? `Requested dates conflict with an approved reservation (${conflicts.map(c => `${c.startDate || c.collectionDate} to ${c.endDate || c.returnDeadline}`).join(', ')}).`
      : 'Requested dates conflict with an existing approved reservation.';
    super(message || defaultMsg);
    this.name = 'ReservationConflictError';
    this.conflicts = conflicts || [];
  }
}

export class InvalidStateTransitionError extends StorageError {
  constructor(fromStatus, toStatus, message) {
    super(message || `Cannot transition borrowing request from "${fromStatus}" to "${toStatus}". Only pending requests can be modified.`);
    this.name = 'InvalidStateTransitionError';
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
  }
}

export class ItemUnavailableError extends StorageError {
  constructor(itemId, reason, message) {
    super(message || `Item "${itemId}" is not available for borrowing (${reason || 'unavailable'}).`);
    this.name = 'ItemUnavailableError';
    this.itemId = itemId;
    this.reason = reason;
  }
}

export class ItemHasRequestHistoryError extends StorageError {
  constructor(itemId, requestCount = 0, message) {
    super(message || `Cannot delete item "${itemId}" because it has ${requestCount} associated borrowing request(s). Archive the listing instead to preserve request history.`);
    this.name = 'ItemHasRequestHistoryError';
    this.itemId = itemId;
    this.requestCount = requestCount;
  }
}

export class ItemHasActiveReservationError extends StorageError {
  constructor(itemId, message) {
    super(message || `Cannot archive item "${itemId}" because it has an active or approved reservation.`);
    this.name = 'ItemHasActiveReservationError';
    this.itemId = itemId;
  }
}

// ==========================================
// Module 06: Loan Lifecycle Domain Errors (DR-04)
// ==========================================

export class LoanNotFoundError extends StorageError {
  constructor(requestId, message = `Loan lifecycle record for request "${requestId}" was not found.`) {
    super(message);
    this.name = 'LoanNotFoundError';
    this.requestId = requestId;
  }
}

export class LoanStateTransitionError extends StorageError {
  constructor(fromStatus, toStatus, message) {
    super(message || `Cannot transition loan from "${fromStatus}" to "${toStatus}".`);
    this.name = 'LoanStateTransitionError';
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
  }
}

export class CollectionDateNotReachedError extends StorageError {
  constructor(collectionDate, today, message) {
    super(message || `Physical collection cannot be recorded before the agreed start date (${collectionDate}). Today is ${today}.`);
    this.name = 'CollectionDateNotReachedError';
    this.collectionDate = collectionDate;
    this.today = today;
  }
}

export class ReservationExpiredError extends StorageError {
  constructor(returnDeadline, today, message) {
    super(message || `Reservation period has expired (deadline was ${returnDeadline}, today is ${today}). Collection cannot be recorded.`);
    this.name = 'ReservationExpiredError';
    this.returnDeadline = returnDeadline;
    this.today = today;
  }
}

export class CollectionAlreadyRecordedError extends StorageError {
  constructor(requestId, message = `Collection handover has already been recorded for request "${requestId}".`) {
    super(message);
    this.name = 'CollectionAlreadyRecordedError';
    this.requestId = requestId;
  }
}

export class BorrowerReceiptRequiredError extends StorageError {
  constructor(requestId, message = `Borrower physical receipt confirmation is required before loan can become ACTIVE.`) {
    super(message);
    this.name = 'BorrowerReceiptRequiredError';
    this.requestId = requestId;
  }
}

export class ReturnNotMarkedError extends StorageError {
  constructor(requestId, message = `Physical return must be marked before owner inspection can be completed.`) {
    super(message);
    this.name = 'ReturnNotMarkedError';
    this.requestId = requestId;
  }
}

export class ReturnInspectionRequiredError extends StorageError {
  constructor(requestId, message = `Owner return condition inspection is required to complete the loan.`) {
    super(message);
    this.name = 'ReturnInspectionRequiredError';
    this.requestId = requestId;
  }
}

export class LoanAlreadyCompletedError extends StorageError {
  constructor(requestId, message = `Loan "${requestId}" is already completed and immutable.`) {
    super(message);
    this.name = 'LoanAlreadyCompletedError';
    this.requestId = requestId;
  }
}

export class UncollectedReleaseNotAllowedError extends StorageError {
  constructor(requestId, reason, message) {
    super(message || `Cannot release reservation "${requestId}": ${reason}.`);
    this.name = 'UncollectedReleaseNotAllowedError';
    this.requestId = requestId;
    this.reason = reason;
  }
}

export class ConditionValidationError extends StorageError {
  constructor(errors, message = 'Condition checkpoint validation failed.') {
    super(message);
    this.name = 'ConditionValidationError';
    this.errors = errors;
  }
}

export class LoanHistoryIntegrityError extends StorageError {
  constructor(requestId, message = `Loan history integrity violation for request "${requestId}".`) {
    super(message);
    this.name = 'LoanHistoryIntegrityError';
    this.requestId = requestId;
  }
}

