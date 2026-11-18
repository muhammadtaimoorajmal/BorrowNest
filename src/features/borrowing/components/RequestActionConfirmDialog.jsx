import React, { useState, useEffect, useRef } from 'react';
import { formatDateRange } from '../services/dateRange';
import styles from './RequestActionConfirmDialog.module.css';

/**
 * Accessible confirmation dialog for Approve, Decline, or Cancel request actions.
 *
 * @param {object} props
 * @param {'approve'|'decline'|'cancel'} props.action - Action type
 * @param {object} props.request - The borrowing request record
 * @param {object} [props.item] - The associated item record
 * @param {function} props.onConfirm - Async confirm callback
 * @param {function} props.onClose - Close dialog callback
 */
export function RequestActionConfirmDialog({
  action,
  request,
  item,
  onConfirm,
  onClose,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    confirmBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isProcessing) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isProcessing]);

  const config = {
    approve: {
      title: 'Approve Borrowing Request',
      message:
        'Approving this request reserves the item for the requested dates and locks the schedule. Competing requests overlapping this period cannot be approved.',
      confirmLabel: 'Approve Request',
      buttonClass: styles.confirmBtnApprove,
    },
    decline: {
      title: 'Decline Borrowing Request',
      message:
        'Declining this request closes it permanently. The borrower will see the declined status in their Borrowing workspace. This action cannot be reversed.',
      confirmLabel: 'Decline Request',
      buttonClass: styles.confirmBtnDanger,
    },
    cancel: {
      title: 'Cancel Borrowing Request',
      message:
        'Cancelling your request withdraws it from the owner. You can submit a new request later if needed. This action cannot be reversed.',
      confirmLabel: 'Cancel Request',
      buttonClass: styles.confirmBtnDanger,
    },
  }[action] || {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmLabel: 'Confirm',
    buttonClass: styles.confirmBtnApprove,
  };

  const handleConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);
    try {
      await onConfirm(request.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className={styles.modal}
      >
        <header className={styles.header}>
          <h2 id="confirm-dialog-title" className={styles.title}>
            {config.title}
          </h2>
        </header>

        <div className={styles.body}>
          <p className={styles.message}>{config.message}</p>

          <div className={styles.detailsCard}>
            {item && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Item:</span>
                <span className={styles.detailVal}>{item.title}</span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Borrower Alias:</span>
              <span className={styles.detailVal}>{request.borrowerAlias}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Dates:</span>
              <span className={styles.detailVal}>
                {formatDateRange(request.startDate, request.endDate)}
              </span>
            </div>
          </div>

          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelBtn}
            disabled={isProcessing}
          >
            Go Back
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={handleConfirm}
            className={`${styles.confirmBtn} ${config.buttonClass}`}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : config.confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default RequestActionConfirmDialog;
