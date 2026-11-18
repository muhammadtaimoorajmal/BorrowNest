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
