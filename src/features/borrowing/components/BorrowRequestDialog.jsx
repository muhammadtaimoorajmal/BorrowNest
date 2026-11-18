import React, { useState, useEffect, useRef, useMemo } from 'react';
import { REQUEST_STATUS } from '../constants/requestStatus';
import {
  getLocalToday,
  formatDateRange,
  findConflictingReservations,
} from '../services/dateRange';
import { validateBorrowRequestPayload } from '../services/borrowRequestValidation';
import styles from './BorrowRequestDialog.module.css';

/**
 * Accessible dialog for submitting a structured borrowing request (DR-02, DR-03).
 *
 * @param {object} props
 * @param {object} props.item - The item to borrow
 * @param {object} props.adapter - Storage adapter instance
 * @param {function} props.onClose - Close dialog callback
 * @param {function} [props.onNavigateToBorrowing] - Navigate to Borrowing workspace callback
 */
export function BorrowRequestDialog({ item, adapter, onClose, onNavigateToBorrowing }) {
  const [borrowerAlias, setBorrowerAlias] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [requestNote, setRequestNote] = useState('');

  const [approvedReservations, setApprovedReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  const modalRef = useRef(null);
  const initialFocusRef = useRef(null);

  const today = getLocalToday();

  // Focus initial element on mount
  useEffect(() => {
    initialFocusRef.current?.focus();
  }, [submittedRequest]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSubmitting]);

  // Load existing approved reservations for this item
  useEffect(() => {
    let isMounted = true;
    async function fetchReservations() {
      if (!adapter || !item?.id) {
        setLoadingReservations(false);
        return;
      }
      try {
        const requests = await adapter.listBorrowRequests({ itemId: item.id });
        if (isMounted) {
          const approved = requests.filter((r) => r.status === REQUEST_STATUS.APPROVED);
          setApprovedReservations(approved);
          setLoadingReservations(false);
        }
      } catch {
        if (isMounted) {
          setLoadingReservations(false);
        }
      }
    }
    fetchReservations();
    return () => {
      isMounted = false;
    };
  }, [adapter, item?.id]);

  // Prepare photo preview URL
  const photoUrl = useMemo(() => {
    const photo = item?.photos?.[0];
    if (!photo) return null;
    if (photo.dataUrl) return photo.dataUrl;
    if (photo.blob instanceof Blob) {
      return URL.createObjectURL(photo.blob);
    }
    return null;
  }, [item?.photos]);

  useEffect(() => {
    return () => {
      if (photoUrl && photoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrors({});

    // 1. Basic field validation
    const payload = {
      itemId: item.id,
      borrowerAlias,
      startDate,
      endDate,
      requestNote,
    };

    const { isValid, errors: validationErrors } = validateBorrowRequestPayload(payload);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    // 2. Client-side overlap pre-validation against known approved reservations
    const conflicts = findConflictingReservations(
      { startDate, endDate },
      approvedReservations,
    );
    if (conflicts.length > 0) {
      const conflictStrs = conflicts
        .map((c) => formatDateRange(c.startDate, c.endDate))
        .join(', ');
      setErrors({
        general: `Selected dates (${formatDateRange(startDate, endDate)}) overlap with an existing reservation (${conflictStrs}). Please select non-overlapping dates.`,
      });
      return;
    }

    // 3. Persist request in storage adapter
    setIsSubmitting(true);
    try {
      const newRequest = await adapter.createBorrowRequest(payload);
      setSubmittedRequest(newRequest);
    } catch (err) {
      setErrors({
        general: err.message || 'Failed to submit borrowing request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="borrow-dialog-title"
        aria-describedby="borrow-dialog-desc"
        className={styles.modal}
      >
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h2 id="borrow-dialog-title" className={styles.title}>
              {submittedRequest ? 'Request Confirmed' : 'Request to Borrow'}
            </h2>
            <p id="borrow-dialog-desc" className={styles.subtitle}>
              {submittedRequest
                ? 'Your borrowing request has been recorded locally.'
                : 'Select dates and send your request to the item owner.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close dialog"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </header>

        <div className={styles.body}>
          {/* Item Summary Banner */}
          <div className={styles.itemSummaryCard}>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={item.title}
                className={styles.itemThumb}
              />
            ) : (
              <div className={styles.itemThumbPlaceholder} aria-hidden="true">
                📦
              </div>
            )}
            <div className={styles.itemInfo}>
              <h3 className={styles.itemTitle}>{item.title}</h3>
              <span className={styles.itemMeta}>
                {item.category} • 📍 {item.approximateArea || 'Local community area'}
              </span>
            </div>
          </div>

          {submittedRequest ? (
            /* Confirmation View */
            <div className={styles.successContainer}>
              <div className={styles.successIcon} aria-hidden="true">
                ✓
              </div>
              <h3 className={styles.successTitle}>Borrowing Request Submitted!</h3>

              <div className={styles.successSummary}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Item:</span>
                  <span className={styles.summaryValue}>{item.title}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Borrower Alias:</span>
                  <span className={styles.summaryValue}>{submittedRequest.borrowerAlias}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Requested Period:</span>
                  <span className={styles.summaryValue}>
                    {formatDateRange(submittedRequest.startDate, submittedRequest.endDate)}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Current Status:</span>
                  <span className={styles.statusPill}>Pending Review</span>
                </div>
              </div>

              <div className={styles.disclosureBox}>
                Notice: BorrowNest operates entirely on your local device. This request is saved in your local database. Track and manage it anytime in the Borrowing workspace.
              </div>
            </div>
          ) : (
            /* Request Form */
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              {/* Existing Reservations Warning */}
              <div className={styles.reservationsBox}>
                <h4 className={styles.reservationsTitle}>Item Availability & Reservations</h4>
                {loadingReservations ? (
                  <p className={styles.helperText}>Checking schedule availability...</p>
                ) : approvedReservations.length > 0 ? (
                  <ul className={styles.reservationsList} aria-label="Booked dates">
                    {approvedReservations.map((res) => (
                      <li key={res.id} className={styles.reservationItem}>
                        🔒 Booked: {formatDateRange(res.startDate, res.endDate)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.noReservationsText}>
                    ✨ No existing reservations. All dates are currently open.
                  </p>
                )}
              </div>

              {errors.general && (
                <div className={styles.alertBox} role="alert">
                  {errors.general}
                </div>
              )}

              {/* Borrower Alias Input */}
              <div className={styles.formGroup}>
                <label htmlFor="borrower-alias-input" className={styles.label}>
                  Your Name or Alias <span aria-hidden="true">*</span>
                </label>
                <input
                  ref={initialFocusRef}
                  id="borrower-alias-input"
                  type="text"
                  value={borrowerAlias}
                  onChange={(e) => setBorrowerAlias(e.target.value)}
                  placeholder="e.g. Jordan River"
                  maxLength={60}
                  className={`${styles.input} ${errors.borrowerAlias ? styles.inputError : ''}`}
                  aria-invalid={!!errors.borrowerAlias}
                  aria-describedby={
                    errors.borrowerAlias
                      ? 'alias-help alias-error'
                      : 'alias-help'
                  }
                  required
                />
                <p id="alias-help" className={styles.helperText}>
                  Stored locally on this device. BorrowNest does not verify user identity.
                </p>
                {errors.borrowerAlias && (
                  <p id="alias-error" className={styles.errorMessage} role="alert">
                    {errors.borrowerAlias}
                  </p>
                )}
              </div>

              {/* Date Scheduling (DR-03) */}
              <div className={styles.dateRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="start-date-input" className={styles.label}>
                    Collection Date <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="start-date-input"
                    type="date"
                    min={today}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`${styles.input} ${errors.startDate ? styles.inputError : ''}`}
                    aria-invalid={!!errors.startDate}
                    aria-describedby={errors.startDate ? 'start-date-error' : undefined}
                    required
                  />
                  {errors.startDate && (
                    <p id="start-date-error" className={styles.errorMessage} role="alert">
                      {errors.startDate}
                    </p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="end-date-input" className={styles.label}>
                    Return Deadline <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="end-date-input"
                    type="date"
                    min={startDate || today}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`${styles.input} ${errors.endDate ? styles.inputError : ''}`}
                    aria-invalid={!!errors.endDate}
                    aria-describedby={errors.endDate ? 'end-date-error' : undefined}
                    required
                  />
                  {errors.endDate && (
                    <p id="end-date-error" className={styles.errorMessage} role="alert">
                      {errors.endDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Request Note */}
              <div className={styles.formGroup}>
                <label htmlFor="request-note-input" className={styles.label}>
                  Note to Owner (Optional)
                </label>
                <textarea
                  id="request-note-input"
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="e.g. Planning to clean my front driveway on Saturday..."
                  maxLength={500}
                  className={`${styles.textarea} ${errors.requestNote ? styles.inputError : ''}`}
                  aria-invalid={!!errors.requestNote}
                  aria-describedby="note-counter"
                />
                <p id="note-counter" className={styles.charCount}>
                  {requestNote.length} / 500 characters
                </p>
                {errors.requestNote && (
                  <p className={styles.errorMessage} role="alert">
                    {errors.requestNote}
                  </p>
                )}
              </div>

              {/* Local-First Disclosure Notice */}
              <div className={styles.disclosureBox}>
                Notice: BorrowNest operates entirely on your local device. Submitting this request creates a local record; it does not send emails, SMS, or cloud push notifications.
              </div>
            </form>
          )}
        </div>

        <footer className={styles.footer}>
          {submittedRequest ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelBtn}
              >
                Close
              </button>
              {onNavigateToBorrowing && (
                <button
                  ref={initialFocusRef}
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToBorrowing();
                  }}
                  className={styles.viewWorkspaceBtn}
                >
                  View in Borrowing Workspace
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelBtn}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

export default BorrowRequestDialog;
