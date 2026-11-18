import React, { useMemo, useEffect } from 'react';
import { REQUEST_STATUS } from '../constants/requestStatus';
import {
  LOAN_STATUS,
  isLoanOverdue,
  isReservationUncollected,
  canRecordCollection,
  canConfirmReceipt,
  canMarkReturn,
  canInspectReturn,
  canReleaseUncollected,
} from '../constants/loanStatus';
import { formatDateRange, getLocalToday, formatDateDisplay } from '../services/dateRange';
import RequestStatusBadge from './RequestStatusBadge';
import styles from './RequestCard.module.css';

/**
 * Accessible card representing a single borrowing request and its physical loan lifecycle (DR-02 + DR-04).
 *
 * @param {object} props
 * @param {object} props.request - Borrowing request record
 * @param {object} [props.loan] - Associated loan lifecycle record
 * @param {object} [props.item] - Associated item listing
 * @param {'borrower'|'owner'} props.perspective - View perspective
 * @param {function} [props.onApprove] - Owner approves request
 * @param {function} [props.onDecline] - Owner declines request
 * @param {function} [props.onCancel] - Borrower cancels request
 * @param {function} [props.onRecordHandover] - Owner records collection handover
 * @param {function} [props.onConfirmReceipt] - Borrower confirms receipt
 * @param {function} [props.onMarkReturned] - Borrower marks return
 * @param {function} [props.onInspectReturn] - Owner completes return inspection
 * @param {function} [props.onReleaseUncollected] - Owner releases uncollected reservation
 * @param {function} [props.onViewComparison] - Triggers side-by-side condition comparison
 */
export function RequestCard({
  request,
  loan,
  item,
  perspective = 'borrower',
  onApprove,
  onDecline,
  onCancel,
  onRecordHandover,
  onConfirmReceipt,
  onMarkReturned,
  onInspectReturn,
  onReleaseUncollected,
  onViewComparison,
}) {
  const today = getLocalToday();

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

  const isPending = request.status === REQUEST_STATUS.PENDING;

  // Loan state derivation (B1 + B2)
  const isOverdue = loan ? isLoanOverdue(loan, today) : false;
  const isUncollected = loan ? isReservationUncollected(loan, today) : false;
  const showReleaseOption = loan && canReleaseUncollected(loan, today);
  const showRecordHandover = loan && canRecordCollection(loan, today) && !loan.collectionCheckpoint?.ownerRecordedAt;
  const showConfirmReceipt = loan && canConfirmReceipt(loan);
  const showMarkReturn = loan && canMarkReturn(loan);
  const showInspectReturn = loan && canInspectReturn(loan);

  return (
    <article className={styles.card} aria-labelledby={`req-title-${request.id}`}>
      <header className={styles.cardHeader}>
        <div className={styles.itemHeaderInfo}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={item?.title || 'Item thumbnail'}
              className={styles.thumb}
            />
          ) : (
            <div className={styles.thumbPlaceholder} aria-hidden="true">
              📦
            </div>
          )}
          <div className={styles.itemTitles}>
            <h3 id={`req-title-${request.id}`} className={styles.itemTitle}>
              {item?.title || request.itemTitleSnapshot || `Item #${request.itemId}`}
            </h3>
            <span className={styles.itemMeta}>
              {item?.category || 'Community Item'} • 📍 {item?.approximateArea || 'Local area'}
            </span>
          </div>
        </div>

        <div className={styles.badgesCol}>
          <RequestStatusBadge status={request.status} />
          {loan && (
            <span
              className={`${styles.loanStatusBadge} ${
                loan.status === LOAN_STATUS.ACTIVE
                  ? styles.badgeActive
                  : loan.status === LOAN_STATUS.COMPLETED
                    ? styles.badgeCompleted
                    : loan.status === LOAN_STATUS.RELEASED_NOT_COLLECTED
                      ? styles.badgeReleased
                      : styles.badgeReserved
              }`}
            >
              {loan.status === LOAN_STATUS.ACTIVE
                ? 'Active Loan'
                : loan.status === LOAN_STATUS.COMPLETED
                  ? 'Completed'
                  : loan.status === LOAN_STATUS.RELEASED_NOT_COLLECTED
                    ? 'Released'
                    : 'Reserved'}
            </span>
          )}
        </div>
      </header>

      <div className={styles.cardBody}>
        <div className={styles.infoGrid}>
          <div className={styles.infoCol}>
            <span className={styles.infoLabel}>
              {perspective === 'owner' ? 'Requested By' : 'Borrower Alias'}
            </span>
            <span className={styles.infoValue}>{request.borrowerAlias}</span>
          </div>

          <div className={styles.infoCol}>
            <span className={styles.infoLabel}>Scheduled Period</span>
            <span className={styles.infoValue}>
              {formatDateRange(request.startDate, request.endDate)}
            </span>
          </div>

          {loan?.collectedAt && (
            <div className={styles.infoCol}>
              <span className={styles.infoLabel}>Collected On</span>
              <span className={styles.infoValue}>
                {formatDateDisplay(loan.collectedAt.split('T')[0])}
              </span>
            </div>
          )}

          {loan?.completedAt && (
            <div className={styles.infoCol}>
              <span className={styles.infoLabel}>Returned On</span>
              <span className={styles.infoValue}>
                {formatDateDisplay(loan.completedAt.split('T')[0])}
              </span>
            </div>
          )}
        </div>

        {request.requestNote && (
          <div className={styles.noteBox}>
            &ldquo;{request.requestNote}&rdquo;
          </div>
        )}

        {/* Loan Lifecycle Status Banners (DR-04) */}
        {loan?.status === LOAN_STATUS.RESERVED && !isUncollected && (
          <div className={styles.activeReservationBanner}>
            <span aria-hidden="true">📅</span>
            <span>
              {loan.collectionCheckpoint?.ownerRecordedAt
                ? 'Handover recorded by owner. Awaiting borrower receipt confirmation.'
                : 'Approved Reservation: Item is scheduled and reserved for this borrower.'}
            </span>
          </div>
        )}

        {/* Uncollected Reservation Notice */}
        {isUncollected && (
          <div className={styles.uncollectedBanner} role="note">
            <span aria-hidden="true">⚠️</span>
            <span>Collection not recorded — owner resolution required. Return deadline has passed.</span>
          </div>
        )}

        {/* Active Loan & Overdue Notices */}
        {loan?.status === LOAN_STATUS.ACTIVE && !isOverdue && (
          <div className={styles.activeLoanBanner}>
            <span aria-hidden="true">🤝</span>
            <span>
              Active Loan: Physical item in borrower custody. Agreed return deadline is{' '}
              {formatDateDisplay(loan.returnDeadline)}.
            </span>
          </div>
        )}

        {isOverdue && (
          <div className={styles.overdueBanner} role="alert">
            <span aria-hidden="true">⚠️</span>
            <span>
              Overdue Active Loan: Return deadline was {formatDateDisplay(loan.returnDeadline)}. Item remains in physical custody until return inspection.
            </span>
          </div>
        )}

        {loan?.status === LOAN_STATUS.COMPLETED && (
          <div className={styles.completedBanner}>
            <span aria-hidden="true">✅</span>
            <span>Loan completed. Item returned and condition inspection recorded.</span>
          </div>
        )}

        {loan?.status === LOAN_STATUS.RELEASED_NOT_COLLECTED && (
          <div className={styles.releasedBanner}>
            <span aria-hidden="true">ℹ️</span>
            <span>
              Reservation released without physical collection ({loan.releaseNote || 'No note'}).
            </span>
          </div>
        )}
      </div>

      <footer className={styles.cardFooter}>
        {/* Pending Request Decisions */}
        {isPending && perspective === 'borrower' && onCancel && (
          <button
            type="button"
            onClick={() => onCancel(request)}
            className={styles.actionBtnCancel}
          >
            Cancel Request
          </button>
        )}

        {isPending && perspective === 'owner' && (
          <>
            {onDecline && (
              <button
                type="button"
                onClick={() => onDecline(request)}
                className={styles.actionBtnDecline}
              >
                Decline
              </button>
            )}
            {onApprove && (
              <button
                type="button"
                onClick={() => onApprove(request)}
                className={styles.actionBtnApprove}
              >
                Approve Request
              </button>
            )}
          </>
        )}

        {/* Physical Lifecycle Actions (DR-04) */}
        {loan?.status === LOAN_STATUS.RESERVED && (
          <>
            {perspective === 'owner' && showRecordHandover && onRecordHandover && (
              <button
                type="button"
                className={styles.actionBtnPrimary}
                onClick={() => onRecordHandover(loan, item)}
              >
                Record Handover
              </button>
            )}

            {perspective === 'borrower' && showConfirmReceipt && onConfirmReceipt && (
              <button
                type="button"
                className={styles.actionBtnPrimary}
                onClick={() => onConfirmReceipt(loan, item)}
              >
                Confirm Physical Receipt
              </button>
            )}

            {perspective === 'owner' && showReleaseOption && onReleaseUncollected && (
              <button
                type="button"
                className={styles.actionBtnWarn}
                onClick={() => onReleaseUncollected(loan, item)}
              >
                Release Uncollected Reservation
              </button>
            )}
          </>
        )}

        {loan?.status === LOAN_STATUS.ACTIVE && (
          <>
            {perspective === 'borrower' && showMarkReturn && onMarkReturned && (
              <button
                type="button"
                className={styles.actionBtnSecondary}
                onClick={() => onMarkReturned(loan, item)}
              >
                Mark Item Returned
              </button>
            )}

            {perspective === 'owner' && showInspectReturn && onInspectReturn && (
              <button
                type="button"
                className={styles.actionBtnPrimary}
                onClick={() => onInspectReturn(loan, item)}
              >
                Inspect Return & Complete
              </button>
            )}
          </>
        )}

        {/* Condition Comparison Trigger */}
        {(loan?.collectionCheckpoint || loan?.returnCheckpoint) && onViewComparison && (
          <button
            type="button"
            className={styles.actionBtnSecondary}
            onClick={() => onViewComparison(loan, item)}
          >
            View Condition Comparison
          </button>
        )}

        {!isPending && !loan && (
          <span className={styles.terminalNotice}>
            {request.status === REQUEST_STATUS.APPROVED
              ? 'Approved decision'
              : 'Closed request (immutable)'}
          </span>
        )}
      </footer>
    </article>
  );
}

export default RequestCard;
