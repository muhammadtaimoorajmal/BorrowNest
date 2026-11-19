import React, { useState, useMemo, useEffect, useRef } from 'react';
import { REQUEST_STATUS } from '../constants/requestStatus';
import {
  LOAN_STATUS,
  isLoanOverdue,
  isReservationUncollected,
} from '../constants/loanStatus';
import { formatDateRange, getLocalToday } from '../services/dateRange';
import { useBorrowRequests } from '../hooks/useBorrowRequests';
import RequestCard from '../components/RequestCard';
import RequestActionConfirmDialog from '../components/RequestActionConfirmDialog';
import CollectionHandoverDialog from '../components/CollectionHandoverDialog';
import ReturnInspectionDialog from '../components/ReturnInspectionDialog';
import ConditionComparisonView from '../components/ConditionComparisonView';
import ReleaseUncollectedDialog from '../components/ReleaseUncollectedDialog';
import { useDemoProfile } from '../../demo/context/DemoProfileContext';
import styles from './BorrowingPage.module.css';

/**
 * Functional Borrowing Workspace for BorrowNest (DR-02, DR-03 & DR-04).
 * Coordinates structured requests, decision reviews, collection handovers,
 * condition comparisons, and return inspections.
 *
 * @param {object} props
 * @param {object} props.adapter - Storage adapter instance
 * @param {function} [props.onNavigateToDiscover] - Callback to navigate to Discover
 * @param {function} [props.onNavigateToLending] - Callback to navigate to Lending
 */
export function BorrowingPage({ adapter, onNavigateToDiscover, onNavigateToLending }) {
  const {
    requests,
    loansMap,
    itemsMap,
    loading,
    error,
    refresh,
    approveRequest,
    declineRequest,
    cancelRequest,
    recordCollectionHandover,
    confirmCollectionReceipt,
    markLoanReturned,
    completeReturnInspection,
    releaseUncollectedReservation,
  } = useBorrowRequests(adapter);

  const { activeProfile, switchProfile, isDemoMode } = useDemoProfile();

  const [perspective, setPerspective] = useState(() => {
    return activeProfile?.role === 'lender' || (activeProfile?.id && activeProfile.id !== 'demo-borrower')
      ? 'owner'
      : 'borrower';
  });
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | REQUEST_STATUS.*
  const [confirmAction, setConfirmAction] = useState(null); // { action: 'approve'|'decline'|'cancel', request: object }

  // Modal dialog states
  const [handoverDialog, setHandoverDialog] = useState(null); // { mode, loan, item }
  const [returnDialog, setReturnDialog] = useState(null); // { mode, loan, item }
  const [comparisonDialog, setComparisonDialog] = useState(null); // { loan, item }
  const [releaseDialog, setReleaseDialog] = useState(null); // { loan, item }

  // Synchronize default perspective dynamically when active demo profile changes (Defect 04)
  const prevProfileIdRef = useRef(activeProfile?.id);

  useEffect(() => {
    if (activeProfile?.id && prevProfileIdRef.current !== activeProfile.id) {
      prevProfileIdRef.current = activeProfile.id;
      const targetPerspective =
        activeProfile.role === 'lender' || activeProfile.id !== 'demo-borrower'
          ? 'owner'
          : 'borrower';
      setPerspective(targetPerspective);
      setStatusFilter('ALL');
      setConfirmAction(null);
      setHandoverDialog(null);
      setReturnDialog(null);
      setComparisonDialog(null);
      setReleaseDialog(null);
      if (typeof refresh === 'function') {
        refresh();
      }
    }
  }, [activeProfile?.id, activeProfile?.role, refresh]);

  const today = getLocalToday();

  // Perspective-aware request subset for active demonstration profile
  const perspectiveRequests = useMemo(() => {
    return requests.filter((r) => {
      // Allow unassigned requests in isolated unit tests
      if (!isDemoMode || !activeProfile || (!r.borrowerProfileId && !r.ownerProfileId)) {
        return true;
      }

      if (perspective === 'borrower') {
        return r.borrowerProfileId === activeProfile.id || !r.borrowerProfileId;
      } else {
        return r.ownerProfileId === activeProfile.id || !r.ownerProfileId;
      }
    });
  }, [requests, perspective, activeProfile, isDemoMode]);

  // Filter requests based on status
  const filteredRequests = useMemo(() => {
    if (statusFilter === 'ALL') return perspectiveRequests;
    return perspectiveRequests.filter((r) => r.status === statusFilter);
  }, [perspectiveRequests, statusFilter]);

  // Active Approved Reservations List
  const approvedReservations = useMemo(() => {
    return perspectiveRequests.filter((r) => r.status === REQUEST_STATUS.APPROVED);
  }, [perspectiveRequests]);

  // Counts for status filter pills
  const counts = useMemo(() => {
    const res = {
      ALL: perspectiveRequests.length,
      [REQUEST_STATUS.PENDING]: 0,
      [REQUEST_STATUS.APPROVED]: 0,
      [REQUEST_STATUS.DECLINED]: 0,
      [REQUEST_STATUS.CANCELLED]: 0,
    };
    for (const r of perspectiveRequests) {
      if (res[r.status] !== undefined) {
        res[r.status]++;
      }
    }
    return res;
  }, [perspectiveRequests]);

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

        {/* Local-First Disclosure Banner (Module 09 Section 4) */}
        <div className={styles.disclosureBanner} role="note">
          <span className={styles.disclosureIcon} aria-hidden="true">
            ℹ️
          </span>
          <div>
            <strong>Local-First Prototype:</strong> BorrowNest is a local-first prototype. Listings, requests and loan records are stored in this browser. It does not yet publish items to a shared online marketplace or synchronize data between users. &ldquo;Borrower View&rdquo; and &ldquo;Owner View&rdquo; are local task perspectives within this browser environment; requests are not sent to remote devices.
          </div>
        </div>
      </header>

      {/* Demonstration Profile Context Indicator */}
      {isDemoMode && activeProfile && (
        <div className={styles.demoProfileBanner}>
          <div className={styles.demoProfileInfo}>
            <span aria-hidden="true">{activeProfile.avatar}</span>
            <span>
              Active Demo Profile: <strong>{activeProfile.displayName}</strong>
            </span>
            <span className={styles.demoProfileBadge}>{activeProfile.badge}</span>
          </div>
          {perspective === 'owner' && activeProfile.role === 'borrower' && (
            <div>
              <span>Incoming equipment requests are owned by lenders: </span>
              <button
                type="button"
                onClick={() => switchProfile('demo-owner-tools')}
                className={styles.demoSwitchLink}
              >
                Switch to Demo Owner — Tools →
              </button>
            </div>
          )}
          {perspective === 'borrower' && activeProfile.role === 'lender' && (
            <div>
              <span>Viewing submitted borrower requests: </span>
              <button
                type="button"
                onClick={() => switchProfile('demo-borrower')}
                className={styles.demoSwitchLink}
              >
                Switch to Demo Borrower →
              </button>
            </div>
          )}
        </div>
      )}

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
              const loan = loansMap.get(res.id);
              const overdue = loan ? isLoanOverdue(loan, today) : false;
              const uncollected = loan ? isReservationUncollected(loan, today) : false;

              return (
                <div key={res.id} className={styles.reservationMiniCard}>
                  <span className={styles.reservationMiniTitle}>
                    {item?.title || res.itemTitleSnapshot || `Item #${res.itemId}`}
                  </span>
                  <span className={styles.reservationMiniDates}>
                    {formatDateRange(res.startDate, res.endDate)}
                  </span>
                  <span className={styles.reservationMiniAlias}>
                    Borrower: {res.borrowerAlias}
                  </span>
                  {loan && (
                    <span className={styles.reservationMiniStatus}>
                      Status:{' '}
                      <strong>
                        {overdue
                          ? '⚠️ Overdue'
                          : uncollected
                            ? '⚠️ Uncollected'
                            : loan.status === LOAN_STATUS.ACTIVE
                              ? 'Active Loan'
                              : loan.status === LOAN_STATUS.COMPLETED
                                ? 'Completed'
                                : 'Reserved'}
                      </strong>
                    </span>
                  )}
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
        ) : perspectiveRequests.length === 0 ? (
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
                loan={loansMap.get(req.id)}
                item={itemsMap.get(req.itemId)}
                perspective={perspective}
                onApprove={(r) => handleOpenConfirm('approve', r)}
                onDecline={(r) => handleOpenConfirm('decline', r)}
                onCancel={(r) => handleOpenConfirm('cancel', r)}
                onRecordHandover={(l, it) =>
                  setHandoverDialog({ mode: 'owner_handover', loan: l, item: it })
                }
                onConfirmReceipt={(l, it) =>
                  setHandoverDialog({ mode: 'borrower_receipt', loan: l, item: it })
                }
                onMarkReturned={(l, it) =>
                  setReturnDialog({ mode: 'borrower_mark_return', loan: l, item: it })
                }
                onInspectReturn={(l, it) =>
                  setReturnDialog({ mode: 'owner_inspection', loan: l, item: it })
                }
                onReleaseUncollected={(l, it) =>
                  setReleaseDialog({ loan: l, item: it })
                }
                onViewComparison={(l, it) =>
                  setComparisonDialog({ loan: l, item: it })
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Confirmation Dialog for Approve / Decline / Cancel */}
      {confirmAction && (
        <RequestActionConfirmDialog
          action={confirmAction.action}
          request={confirmAction.request}
          item={itemsMap.get(confirmAction.request.itemId)}
          onConfirm={handleExecuteConfirm}
          onClose={handleCloseConfirm}
        />
      )}

      {/* Collection Handover / Receipt Dialog */}
      {handoverDialog && (
        <CollectionHandoverDialog
          mode={handoverDialog.mode}
          loan={handoverDialog.loan}
          item={handoverDialog.item}
          onSubmit={
            handoverDialog.mode === 'owner_handover'
              ? (reqId, cp) => recordCollectionHandover(reqId, cp)
              : (reqId, obs) => confirmCollectionReceipt(reqId, obs)
          }
          onClose={() => setHandoverDialog(null)}
        />
      )}

      {/* Return Marking / Inspection Dialog */}
      {returnDialog && (
        <ReturnInspectionDialog
          mode={returnDialog.mode}
          loan={returnDialog.loan}
          item={returnDialog.item}
          onSubmit={
            returnDialog.mode === 'borrower_mark_return'
              ? (reqId) => markLoanReturned(reqId)
              : (reqId, cp) => completeReturnInspection(reqId, cp)
          }
          onClose={() => setReturnDialog(null)}
        />
      )}

      {/* Release Uncollected Reservation Dialog */}
      {releaseDialog && (
        <ReleaseUncollectedDialog
          loan={releaseDialog.loan}
          item={releaseDialog.item}
          onRelease={(reqId, note) => releaseUncollectedReservation(reqId, note)}
          onClose={() => setReleaseDialog(null)}
        />
      )}

      {/* Side-by-Side Condition Comparison View */}
      {comparisonDialog && (
        <ConditionComparisonView
          loan={comparisonDialog.loan}
          item={comparisonDialog.item}
          onClose={() => setComparisonDialog(null)}
        />
      )}
    </div>
  );
}

export default BorrowingPage;
