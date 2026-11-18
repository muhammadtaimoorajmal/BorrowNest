import React, { useState, useMemo } from 'react';
import { REQUEST_STATUS } from '../constants/requestStatus';
import { formatDateRange } from '../services/dateRange';
import { useBorrowRequests } from '../hooks/useBorrowRequests';
import RequestCard from '../components/RequestCard';
import RequestActionConfirmDialog from '../components/RequestActionConfirmDialog';
import styles from './BorrowingPage.module.css';

/**
 * Functional Borrowing Workspace for BorrowNest (DR-02 & DR-03).
 * Enables borrowers to monitor and cancel their requests, and owners to review
 * and decide on incoming requests with atomic reservation conflict prevention.
 *
 * @param {object} props
 * @param {object} props.adapter - Storage adapter instance
 * @param {function} [props.onNavigateToDiscover] - Callback to navigate to Discover
 * @param {function} [props.onNavigateToLending] - Callback to navigate to Lending
 */
export function BorrowingPage({ adapter, onNavigateToDiscover, onNavigateToLending }) {
  const {
    requests,
    itemsMap,
    loading,
    error,
    refresh,
    approveRequest,
    declineRequest,
    cancelRequest,
  } = useBorrowRequests(adapter);

  const [perspective, setPerspective] = useState('borrower'); // 'borrower' | 'owner'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | REQUEST_STATUS.*
  const [confirmAction, setConfirmAction] = useState(null); // { action: 'approve'|'decline'|'cancel', request: object }

  // Filter requests based on status
  const filteredRequests = useMemo(() => {
    if (statusFilter === 'ALL') return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  // Approved reservations list for active schedule summary
  const approvedReservations = useMemo(() => {
    return requests.filter((r) => r.status === REQUEST_STATUS.APPROVED);
  }, [requests]);

  // Counts for status filter pills
  const counts = useMemo(() => {
    const res = {
      ALL: requests.length,
      [REQUEST_STATUS.PENDING]: 0,
      [REQUEST_STATUS.APPROVED]: 0,
      [REQUEST_STATUS.DECLINED]: 0,
      [REQUEST_STATUS.CANCELLED]: 0,
    };
    for (const r of requests) {
      if (res[r.status] !== undefined) {
        res[r.status]++;
      }
    }
    return res;
  }, [requests]);

  const handleOpenConfirm = (action, request) => {
    setConfirmAction({ action, request });
  };

  const handleCloseConfirm = () => {
    setConfirmAction(null);
  };

  const handleExecuteConfirm = async (requestId) => {
    if (!confirmAction) return;
    if (confirmAction.action === 'approve') {
      await approveRequest(requestId);
    } else if (confirmAction.action === 'decline') {
      await declineRequest(requestId);
    } else if (confirmAction.action === 'cancel') {
      await cancelRequest(requestId);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Borrowing Requests & Reservations Workspace</h1>
        <p className={styles.pageSubtitle}>
          Manage structured borrowing requests, review owner decisions, and track reserved date schedules.
        </p>

        {/* Local-First Disclosure Banner */}
        <div className={styles.disclosureBanner} role="note">
          <span className={styles.disclosureIcon} aria-hidden="true">
            ℹ️
          </span>
          <div>
            <strong>Local-First Architecture:</strong> BorrowNest operates entirely on your device’s local browser storage without remote user accounts or servers. &ldquo;Borrower View&rdquo; and &ldquo;Owner View&rdquo; let you manage both sides of the local borrowing workflow with full transparency.
          </div>
        </div>
      </header>

      {/* Perspective Switcher */}
      <div
        className={styles.perspectiveTabs}
        role="tablist"
        aria-label="Borrowing perspective selection"
      >
        <button
          type="button"
          role="tab"
          aria-selected={perspective === 'borrower'}
          onClick={() => setPerspective('borrower')}
          className={`${styles.perspectiveTab} ${
            perspective === 'borrower' ? styles.perspectiveTabActive : ''
          }`}
        >
          Borrower View (My Requests)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={perspective === 'owner'}
          onClick={() => setPerspective('owner')}
          className={`${styles.perspectiveTab} ${
            perspective === 'owner' ? styles.perspectiveTabActive : ''
          }`}
        >
          Owner View (Incoming Requests)
        </button>
      </div>

      {/* Active Approved Reservations Section */}
      {approvedReservations.length > 0 && (
        <section className={styles.reservationsSection} aria-label="Active item reservations">
          <h2 className={styles.reservationsSectionTitle}>
            <span aria-hidden="true">📅</span>
            <span>Active Scheduled Reservations ({approvedReservations.length})</span>
          </h2>
          <div className={styles.reservationsGrid}>
            {approvedReservations.map((res) => {
              const item = itemsMap.get(res.itemId);
              return (
                <div key={res.id} className={styles.reservationMiniCard}>
                  <span className={styles.reservationMiniTitle}>
                    {item?.title || `Item #${res.itemId}`}
                  </span>
                  <span className={styles.reservationMiniDates}>
                    {formatDateRange(res.startDate, res.endDate)}
                  </span>
                  <span className={styles.reservationMiniAlias}>
                    Borrower: {res.borrowerAlias}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Status Filter Bar */}
      <div className={styles.filterBar}>
        <div
          className={styles.statusPills}
          role="group"
          aria-label="Filter requests by status"
        >
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`${styles.statusPill} ${
              statusFilter === 'ALL' ? styles.statusPillActive : ''
            }`}
            aria-pressed={statusFilter === 'ALL'}
          >
            All ({counts.ALL})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(REQUEST_STATUS.PENDING)}
            className={`${styles.statusPill} ${
              statusFilter === REQUEST_STATUS.PENDING ? styles.statusPillActive : ''
            }`}
            aria-pressed={statusFilter === REQUEST_STATUS.PENDING}
          >
            Pending ({counts[REQUEST_STATUS.PENDING]})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(REQUEST_STATUS.APPROVED)}
            className={`${styles.statusPill} ${
              statusFilter === REQUEST_STATUS.APPROVED ? styles.statusPillActive : ''
            }`}
            aria-pressed={statusFilter === REQUEST_STATUS.APPROVED}
          >
            Approved ({counts[REQUEST_STATUS.APPROVED]})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(REQUEST_STATUS.DECLINED)}
            className={`${styles.statusPill} ${
              statusFilter === REQUEST_STATUS.DECLINED ? styles.statusPillActive : ''
            }`}
            aria-pressed={statusFilter === REQUEST_STATUS.DECLINED}
          >
            Declined ({counts[REQUEST_STATUS.DECLINED]})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(REQUEST_STATUS.CANCELLED)}
            className={`${styles.statusPill} ${
              statusFilter === REQUEST_STATUS.CANCELLED ? styles.statusPillActive : ''
            }`}
            aria-pressed={statusFilter === REQUEST_STATUS.CANCELLED}
          >
            Cancelled ({counts[REQUEST_STATUS.CANCELLED]})
          </button>
        </div>
      </div>

      {/* Requests List or States */}
      <section aria-label="Requests list">
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} aria-hidden="true" />
            <p>Loading borrowing requests...</p>
          </div>
        ) : error ? (
          <div className={styles.errorBanner} role="alert">
            <span>{error}</span>
            <button type="button" onClick={refresh} className={styles.actionBtn}>
              Retry
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon} aria-hidden="true">
              🤝
            </div>
            <h2 className={styles.emptyStateTitle}>
              {perspective === 'borrower'
                ? 'No Borrowing Requests Yet'
                : 'No Incoming Requests'}
            </h2>
            <p className={styles.emptyStateText}>
              {perspective === 'borrower'
                ? 'You have not submitted any borrowing requests yet. Explore the community catalog to discover items and submit a request.'
                : 'No community members have submitted requests for your items yet. Manage your listings or add new ones in Lending.'}
            </p>
            {perspective === 'borrower' && onNavigateToDiscover && (
              <button
                type="button"
                onClick={onNavigateToDiscover}
                className={styles.actionBtn}
              >
                Browse Catalog in Discover
              </button>
            )}
            {perspective === 'owner' && onNavigateToLending && (
              <button
                type="button"
                onClick={onNavigateToLending}
                className={styles.actionBtn}
              >
                Manage Items in Lending
              </button>
            )}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyStateTitle}>No Requests Matching Filter</h2>
            <p className={styles.emptyStateText}>
              There are no borrowing requests with status &ldquo;{statusFilter.toLowerCase()}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={styles.actionBtn}
            >
              Show All Requests
            </button>
          </div>
        ) : (
          <div className={styles.requestsList}>
            {filteredRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                item={itemsMap.get(req.itemId)}
                perspective={perspective}
                onApprove={(r) => handleOpenConfirm('approve', r)}
                onDecline={(r) => handleOpenConfirm('decline', r)}
                onCancel={(r) => handleOpenConfirm('cancel', r)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <RequestActionConfirmDialog
          action={confirmAction.action}
          request={confirmAction.request}
          item={itemsMap.get(confirmAction.request.itemId)}
          onConfirm={handleExecuteConfirm}
          onClose={handleCloseConfirm}
        />
      )}
    </div>
  );
}

export default BorrowingPage;
