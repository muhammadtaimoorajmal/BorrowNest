import React, { useState, useEffect } from 'react';
import { formatDateRange } from '../services/dateRange';
import styles from './ReleaseUncollectedDialog.module.css';

/**
 * Accessible Dialog for Owner to Release an Uncollected Reservation (DR-03 + DR-04).
 *
 * @param {object} props
 * @param {object} props.loan - Loan lifecycle record
 * @param {object} [props.item] - Item listing
 * @param {function} props.onRelease - Release callback (requestId, note)
 * @param {function} props.onClose - Dismissal callback
 */
export function ReleaseUncollectedDialog({ loan, item, onRelease, onClose }) {
  const [releaseNote, setReleaseNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSubmitting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onRelease(loan.requestId, releaseNote.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to release uncollected reservation.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerTitles}>
            <span className={styles.eyebrow}>Owner Resolution</span>
            <h2 id="release-dialog-title" className={styles.title}>
              Release Uncollected Reservation
            </h2>
            <span className={styles.subtitle}>
              Item: <strong>{loan.itemTitleSnapshot || item?.title}</strong> • Borrower: <strong>{loan.borrowerAlias}</strong>
            </span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.body}>
            {error && (
              <div className={styles.errorMessage} role="alert">
                {error}
              </div>
            )}

            <div className={styles.infoBanner}>
              <span aria-hidden="true">ℹ️</span>
              <div>
                The scheduled return deadline for this reservation (
                {formatDateRange(loan.collectionDate, loan.returnDeadline)}) has passed without physical collection.
                Releasing this reservation will unlock the item&rsquo;s calendar dates for future borrowing requests without recording a false physical return.
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="release-note-input" className={styles.label}>
                Resolution Note (Optional)
              </label>
              <textarea
                id="release-note-input"
                className={styles.textarea}
                rows={3}
                maxLength={500}
                placeholder="e.g. Borrower did not arrive for scheduled collection and did not make contact..."
                value={releaseNote}
                onChange={(e) => setReleaseNote(e.target.value)}
              />
              <span className={styles.charCount}>{releaseNote.length} / 500 characters</span>
            </div>

            <div className={styles.disclosureBox}>
              Notice: This action will mark the loan lifecycle as RELEASED_NOT_COLLECTED. The original request approval remains intact as an audit decision record.
            </div>
          </div>

          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Releasing...' : 'Release Reservation'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default ReleaseUncollectedDialog;
