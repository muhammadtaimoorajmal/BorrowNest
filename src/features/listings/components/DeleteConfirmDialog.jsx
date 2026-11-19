import React, { useEffect, useMemo } from 'react';
import styles from './DeleteConfirmDialog.module.css';

/**
 * Relational-aware deletion, archival, and cascade cleanup dialog (Defect 05).
 * Accurately implements three distinct cases:
 * - Case A: Listing has no history -> Direct permanent delete.
 * - Case B: Listing has only resolved history -> Block permanent delete; offer Archive.
 * - Case C: Listing has pending requests or active loans -> Block delete; offer navigation to Borrowing.
 * - Case Seeded: Curated baseline catalogue item (demo-001..demo-020) cannot be permanently deleted.
 * - Classroom Demonstration Cascade: Destructive action to remove custom demo listing and its demo history.
 */
export function DeleteConfirmDialog({
  item,
  requests = [],
  loans = [],
  isDemoMode = false,
  onConfirm,
  onConfirmArchive,
  onConfirmCascadeDemoDelete,
  onNavigateToBorrowing,
  onCancel,
  isDeleting = false,
  isSubmitting = false,
}) {
  const busy = isDeleting || isSubmitting;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !busy) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, busy]);

  const isBaselineSeeded = Boolean(
    item?.demoSeed ||
      (typeof item?.id === 'string' && item.id.startsWith('demo-') && !item.id.startsWith('demo-custom-')),
  );

  const itemRequests = useMemo(() => {
    if (!item?.id) return [];
    return requests.filter((r) => r.itemId === item.id);
  }, [requests, item]);

  const itemLoans = useMemo(() => {
    if (!item?.id) return [];
    return loans.filter((l) => l.itemId === item.id);
  }, [loans, item]);

  const pendingRequests = useMemo(() => {
    return itemRequests.filter((r) => r.status === 'PENDING');
  }, [itemRequests]);

  const activeLoans = useMemo(() => {
    return itemLoans.filter((l) => l.status === 'RESERVED' || l.status === 'ACTIVE');
  }, [itemLoans]);

  const hasActiveActivity = pendingRequests.length > 0 || activeLoans.length > 0;
  const totalHistoryCount = itemRequests.length + itemLoans.length;

  if (!item) return null;

  return (
    <div className={styles.backdrop} onClick={!busy ? onCancel : undefined}>
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
      >
        <div className={styles.iconWrapper} aria-hidden="true">
          {hasActiveActivity ? '🛑' : isBaselineSeeded ? 'ℹ️' : totalHistoryCount > 0 ? '📦' : '⚠️'}
        </div>

        {/* 1. Baseline Seeded Catalogue Item Safeguard */}
        {isBaselineSeeded ? (
          <>
            <h2 id="delete-dialog-title" className={styles.title}>
              Curated Baseline Catalogue Item
            </h2>
            <p id="delete-dialog-desc" className={styles.description}>
              <strong>&ldquo;{item.title}&rdquo;</strong> is one of the 20 baseline curated items in the BorrowNest demonstration catalogue. To maintain the permanent demonstration catalogue, baseline items cannot be permanently deleted.
            </p>
            <div className={styles.noticeBox}>
              <p>
                You can <strong>Archive</strong> this item to remove it from the active marketplace, or set it Unavailable. To restore its original state, use <em>Reset Demonstration Transactions</em> in the Account workspace.
              </p>
            </div>
            <div className={styles.actionRow}>
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className={styles.cancelBtn}
              >
                Close
              </button>
              {onConfirmArchive && (
                <button
                  type="button"
                  onClick={() => onConfirmArchive(item.id)}
                  disabled={busy}
                  className={styles.archiveBtn}
                >
                  {busy ? 'Archiving...' : 'Archive Listing'}
                </button>
              )}
            </div>
          </>
        ) : hasActiveActivity ? (
          /* 2. Case C: Listing has pending requests or active loans */
          <>
            <h2 id="delete-dialog-title" className={styles.title}>
              Active Borrowing Activity in Progress
            </h2>
            <p id="delete-dialog-desc" className={styles.description}>
              This listing is still connected to an unresolved borrowing request or active loan. Resolve that activity before archiving or deleting the listing.
            </p>
            <div className={styles.noticeBox}>
              {pendingRequests.length > 0 && (
                <p>
                  ⏳ <strong>{pendingRequests.length} pending borrowing request(s)</strong> require an owner decision (Approve or Decline).
                </p>
              )}
              {activeLoans.length > 0 && (
                <p>
                  🤝 <strong>{activeLoans.length} active or reserved loan(s)</strong> are currently in progress.
                </p>
              )}
            </div>
            <div className={styles.actionRow}>
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              {onNavigateToBorrowing && (
                <button
                  type="button"
                  onClick={() => {
                    onCancel();
                    onNavigateToBorrowing();
                  }}
                  className={styles.workspaceBtn}
                >
                  Go to Borrowing Workspace →
                </button>
              )}
            </div>
            {isDemoMode && onConfirmCascadeDemoDelete && (
              <div className={styles.demoCascadeSection}>
                <span className={styles.demoCascadeLabel}>Classroom Demonstration Destructive Action:</span>
                <p className={styles.demoCascadeText}>
                  As an evaluator testing this prototype, you can force-remove this test listing along with its simulated requests and loans:
                </p>
                <button
                  type="button"
                  onClick={() => onConfirmCascadeDemoDelete(item.id)}
                  disabled={busy}
                  className={styles.cascadeBtn}
                >
                  {busy ? 'Deleting...' : 'Delete Listing and Its Local Demonstration History'}
                </button>
              </div>
            )}
          </>
        ) : totalHistoryCount > 0 ? (
          /* 3. Case B: Listing has only resolved history (declined/cancelled requests, completed loans) */
          <>
            <h2 id="delete-dialog-title" className={styles.title}>
              Listing Has Historical Records
            </h2>
            <p id="delete-dialog-desc" className={styles.description}>
              <strong>&ldquo;{item.title}&rdquo;</strong> has {itemRequests.length} resolved request(s) or completed loan records. Permanent deletion is blocked to preserve audit and transaction history.
            </p>
            <div className={styles.noticeBox}>
              <p>
                You can <strong>Archive</strong> this listing to remove it from the active marketplace. All historical transaction records will remain safely preserved in your records.
              </p>
            </div>
            <div className={styles.actionRow}>
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              {onConfirmArchive && (
                <button
                  type="button"
                  onClick={() => onConfirmArchive(item.id)}
                  disabled={busy}
                  className={styles.archiveBtn}
                >
                  {busy ? 'Archiving...' : 'Archive Listing'}
                </button>
              )}
            </div>
            {isDemoMode && onConfirmCascadeDemoDelete && (
              <div className={styles.demoCascadeSection}>
                <span className={styles.demoCascadeLabel}>Classroom Demonstration Destructive Action:</span>
                <button
                  type="button"
                  onClick={() => onConfirmCascadeDemoDelete(item.id)}
                  disabled={busy}
                  className={styles.cascadeBtn}
                >
                  {busy ? 'Deleting...' : 'Delete Listing and Its Local Demonstration History'}
                </button>
              </div>
            )}
          </>
        ) : (
          /* 4. Case A: Listing has NO history -> Permanent delete allowed */
          <>
            <h2 id="delete-dialog-title" className={styles.title}>
              Permanently Delete Listing?
            </h2>
            <p id="delete-dialog-desc" className={styles.description}>
              Are you sure you want to permanently delete <strong>&ldquo;{item.title}&rdquo;</strong>?
              This action cannot be undone. All local data and associated photographs will be permanently erased from your browser&rsquo;s local storage.
            </p>
            <div className={styles.actionRow}>
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onConfirm(item.id)}
                disabled={busy}
                className={styles.deleteBtn}
              >
                {busy ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DeleteConfirmDialog;
