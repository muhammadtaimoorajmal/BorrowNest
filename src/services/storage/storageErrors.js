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
