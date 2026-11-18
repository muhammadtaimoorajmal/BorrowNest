import React, { useMemo, useEffect } from 'react';
import { REQUEST_STATUS } from '../constants/requestStatus';
import { formatDateRange, isOverdueReservation } from '../services/dateRange';
import RequestStatusBadge from './RequestStatusBadge';
import styles from './RequestCard.module.css';

/**
 * Accessible card representing a single borrowing request in either Borrower or Owner view.
 *
 * @param {object} props
 * @param {object} props.request - Borrowing request record
 * @param {object} [props.item] - Associated item listing
 * @param {'borrower'|'owner'} props.perspective - View perspective
 * @param {function} [props.onApprove] - Triggered when owner requests approval
 * @param {function} [props.onDecline] - Triggered when owner requests decline
 * @param {function} [props.onCancel] - Triggered when borrower requests cancellation
 */
export function RequestCard({
  request,
  item,
  perspective = 'borrower',
  onApprove,
  onDecline,
  onCancel,
}) {
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

  const isApproved = request.status === REQUEST_STATUS.APPROVED;
  const isPending = request.status === REQUEST_STATUS.PENDING;
  const isOverdue = isApproved && isOverdueReservation(request.endDate);

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
              {item?.title || `Item #${request.itemId}`}
            </h3>
            <span className={styles.itemMeta}>
              {item?.category || 'Community Item'} • 📍 {item?.approximateArea || 'Local area'}
            </span>
          </div>
        </div>

        <RequestStatusBadge status={request.status} />
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
        </div>

        {request.requestNote && (
          <div className={styles.noteBox}>
            &ldquo;{request.requestNote}&rdquo;
          </div>
        )}

        {isApproved && !isOverdue && (
          <div className={styles.activeReservationBanner}>
            <span aria-hidden="true">🔒</span>
            <span>Active Reservation: Item is scheduled and reserved for this borrower.</span>
          </div>
        )}

        {isOverdue && (
          <div className={styles.overdueBanner} role="alert">
            <span aria-hidden="true">⚠️</span>
            <span>
              Return deadline has passed ({request.endDate}). Item return and condition inspection will be completed in Module 06.
            </span>
          </div>
        )}
      </div>

      <footer className={styles.cardFooter}>
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

        {!isPending && (
          <span className={styles.terminalNotice}>
            {request.status === REQUEST_STATUS.APPROVED
              ? 'Approved reservation'
              : 'Closed request (immutable)'}
          </span>
        )}
      </footer>
    </article>
  );
}

export default RequestCard;
