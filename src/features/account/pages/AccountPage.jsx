import React, { useState, useEffect } from 'react';
import { generateBackupData, downloadBackupFile } from '../../../services/backup/exportBackup';
import {
  parseAndValidateBackup,
  executeMerge,
  executeReplace,
} from '../../../services/backup/importBackup';
import styles from './AccountPage.module.css';

export function AccountPage({ storageAdapter, onDataRestored }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState(null);

  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importItems, setImportItems] = useState([]);
  const [importRequests, setImportRequests] = useState([]);
  const [importLoans, setImportLoans] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  const [storageEstimate, setStorageEstimate] = useState(null);
  const [localItemCount, setLocalItemCount] = useState(0);
  const [localRequestStats, setLocalRequestStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [localLoanStats, setLocalLoanStats] = useState({ total: 0, reserved: 0, active: 0, completed: 0, released: 0 });

  // Load storage diagnostics
  useEffect(() => {
    let isMounted = true;

    async function loadDiagnostics() {
      try {
        const count = await storageAdapter.countItems();
        if (isMounted) setLocalItemCount(count);

        if (typeof storageAdapter.listBorrowRequests === 'function') {
          const reqs = await storageAdapter.listBorrowRequests();
          if (isMounted) {
            const pending = reqs.filter((r) => r.status === 'PENDING').length;
            const approved = reqs.filter((r) => r.status === 'APPROVED').length;
            setLocalRequestStats({ total: reqs.length, pending, approved });
          }
        }

        if (typeof storageAdapter.listLoans === 'function') {
          const loans = await storageAdapter.listLoans();
          if (isMounted) {
            const reserved = loans.filter((l) => l.status === 'RESERVED').length;
            const active = loans.filter((l) => l.status === 'ACTIVE').length;
            const completed = loans.filter((l) => l.status === 'COMPLETED').length;
            const released = loans.filter((l) => l.status === 'RELEASED_NOT_COLLECTED').length;
            setLocalLoanStats({ total: loans.length, reserved, active, completed, released });
          }
        }

        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          if (isMounted) {
            setStorageEstimate({
              usageMb: (estimate.usage / (1024 * 1024)).toFixed(2),
              quotaMb: (estimate.quota / (1024 * 1024)).toFixed(0),
              percentage: estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(1) : 0,
            });
          }
        }
      } catch (err) {
        console.warn('Could not read storage diagnostics:', err);
      }
    }

    loadDiagnostics();
    return () => {
      isMounted = false;
    };
  }, [storageAdapter]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const backupData = await generateBackupData(storageAdapter);
      downloadBackupFile(backupData);
      setExportMessage(
        `Successfully exported ${backupData.itemCount} items, ${backupData.requestCount || 0} borrowing requests, and ${backupData.loanCount || 0} loan lifecycles with photographs.`,
      );
    } catch (err) {
      setExportMessage(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);
    setImportPreview(null);
    setImportItems([]);
    setImportRequests([]);
    setImportLoans([]);
    setImportResult(null);
    setIsImporting(true);

    try {
      const { preview, items, requests, loans } = await parseAndValidateBackup(file);
      setImportPreview(preview);
      setImportItems(items);
      setImportRequests(requests || []);
      setImportLoans(loans || []);
    } catch (err) {
      setImportError(err.message || 'Failed to parse backup file.');
    } finally {
      setIsImporting(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleExecuteMerge = async () => {
    if (!importItems.length && !importRequests.length && !importLoans.length) return;
    setIsImporting(true);
    setImportError(null);
    try {
      const { addedCount, skippedCount } = await executeMerge(
        { items: importItems, requests: importRequests, loans: importLoans },
        storageAdapter,
      );
      setImportResult({
        type: 'MERGE',
        message: `Merge complete: ${addedCount} new records imported, ${skippedCount} duplicate records skipped.`,
      });
      setImportPreview(null);
      setImportItems([]);
      setImportRequests([]);
      setImportLoans([]);
      setImportFile(null);
      if (typeof onDataRestored === 'function') onDataRestored();
    } catch (err) {
      setImportError(`Merge failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExecuteReplace = async () => {
    if (!importItems.length && !importRequests.length && !importLoans.length) return;
    setIsImporting(true);
    setImportError(null);
    setShowReplaceConfirm(false);
    try {
      const { replacedCount, replacedRequestsCount, replacedLoansCount } = await executeReplace(
        { items: importItems, requests: importRequests, loans: importLoans },
        storageAdapter,
      );
      setImportResult({
        type: 'REPLACE',
        message: `Replace complete: Local library replaced with ${replacedCount} items, ${replacedRequestsCount ?? importRequests.length} requests, and ${replacedLoansCount ?? importLoans.length} loan lifecycles from backup.`,
      });
      setImportPreview(null);
      setImportItems([]);
      setImportRequests([]);
      setImportLoans([]);
      setImportFile(null);
      if (typeof onDataRestored === 'function') onDataRestored();
    } catch (err) {
      setImportError(`Replace failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Account & Local Data Management</h1>
        <p className={styles.subtitle}>
          BorrowNest is a local-first prototype. Listings, requests and loan records are stored in this browser. Manage local storage, export portable backup archives, and inspect data boundaries.
        </p>
      </header>

      {/* Grid of feature cards */}
      <div className={styles.sectionsGrid}>
        {/* Export Card */}
        <section className={styles.card} aria-labelledby="export-heading">
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} aria-hidden="true">💾</span>
            <h2 id="export-heading" className={styles.cardTitle}>Export Local Backup</h2>
          </div>
          <p className={styles.cardDesc}>
            Download a portable, versioned JSON archive containing all your active listings, archived records, and genuine item photographs.
          </p>

          <div className={styles.advisoryBox}>
            <span aria-hidden="true">🔒</span>
            <span>
              Advisory: Exported backups are validated, unencrypted JSON files containing your item descriptions and photos. Store your backup file securely and do not share it publicly.
            </span>
          </div>

          {exportMessage && (
            <div className={styles.successBanner} role="status">
              {exportMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className={styles.primaryActionBtn}
          >
            {isExporting ? 'Generating Backup...' : 'Export Backup File (.json)'}
          </button>
        </section>

        {/* Import & Restore Card */}
        <section className={styles.card} aria-labelledby="restore-heading">
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} aria-hidden="true">📥</span>
            <h2 id="restore-heading" className={styles.cardTitle}>Restore from Backup</h2>
          </div>
          <p className={styles.cardDesc}>
            Upload a previously exported BorrowNest backup archive to restore or merge item records.
          </p>

          <div className={styles.fileUploadArea}>
            <label htmlFor="backup-upload-input" className={styles.fileInputLabel}>
              <span>Choose Backup JSON File</span>
            </label>
            <input
              id="backup-upload-input"
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              disabled={isImporting}
              className={styles.hiddenInput}
            />
            {importFile && <span className={styles.fileNameDisplay}>{importFile.name}</span>}
          </div>

          {importError && (
            <div className={styles.errorBanner} role="alert">
              {importError}
            </div>
          )}

          {importResult && (
            <div className={styles.successBanner} role="status">
              {importResult.message}
            </div>
          )}

          {/* Backup Preview Section */}
          {importPreview && (
            <div className={styles.previewBox}>
              <h3 className={styles.previewHeading}>Backup Archive Summary</h3>
              <ul className={styles.previewList}>
                <li><strong>Exported:</strong> {new Date(importPreview.exportedAt).toLocaleString()}</li>
                <li><strong>Total Items in Backup:</strong> {importPreview.itemCount} ({importPreview.activeCount} active, {importPreview.archivedCount} archived)</li>
                <li><strong>Photographs in Backup:</strong> {importPreview.photoCount}</li>
                <li><strong>Borrowing Requests in Backup:</strong> {importPreview.requestCount || 0} ({importPreview.pendingRequestCount || 0} pending, {importPreview.approvedRequestCount || 0} approved)</li>
                <li><strong>Loan Lifecycles in Backup:</strong> {importPreview.loanCount || 0} ({importPreview.activeLoanCount || 0} active, {importPreview.completedLoanCount || 0} completed)</li>
                <li><strong>Current Local State:</strong> {localItemCount} items, {localRequestStats.total} requests, {localLoanStats.total} loans</li>
              </ul>

              <div className={styles.restoreActionsRow}>
                <button
                  type="button"
                  onClick={handleExecuteMerge}
                  disabled={isImporting}
                  className={styles.mergeBtn}
                >
                  Merge (Preserve Local Items)
                </button>
                <button
                  type="button"
                  onClick={() => setShowReplaceConfirm(true)}
                  disabled={isImporting}
                  className={styles.replaceBtn}
                >
                  Replace All Local Data
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Storage Diagnostics Card */}
        <section className={styles.card} aria-labelledby="diagnostics-heading">
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} aria-hidden="true">📊</span>
            <h2 id="diagnostics-heading" className={styles.cardTitle}>Storage Diagnostics</h2>
          </div>
          <p className={styles.cardDesc}>
            BorrowNest operates purely on client-side IndexedDB storage within this browser origin.
          </p>

          <div className={styles.diagnosticsList}>
            <div className={styles.diagRow}>
              <span>Saved Items in Database:</span>
              <strong>{localItemCount}</strong>
            </div>
            <div className={styles.diagRow}>
              <span>Borrowing Requests:</span>
              <strong>
                {localRequestStats.total} ({localRequestStats.pending} pending, {localRequestStats.approved} approved)
              </strong>
            </div>
            <div className={styles.diagRow}>
              <span>Physical Loan Lifecycles:</span>
              <strong>
                {localLoanStats.total} ({localLoanStats.active} active, {localLoanStats.reserved} reserved, {localLoanStats.completed} completed, {localLoanStats.released} released)
              </strong>
            </div>
            {storageEstimate && (
              <>
                <div className={styles.diagRow}>
                  <span>Origin Storage Used:</span>
                  <strong>{storageEstimate.usageMb} MB</strong>
                </div>
                <div className={styles.diagRow}>
                  <span>Browser Storage Quota:</span>
                  <strong>{storageEstimate.quotaMb} MB</strong>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Privacy & Architectural Boundary Card */}
        <section className={styles.card} aria-labelledby="privacy-heading">
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon} aria-hidden="true">🛡️</span>
            <h2 id="privacy-heading" className={styles.cardTitle}>Privacy & Data Principles</h2>
          </div>
          <ul className={styles.principlesList}>
            <li>
              <strong>Local-First Boundary:</strong> BorrowNest is a local-first prototype. Listings, requests and loan records are stored in this browser&apos;s local storage (IndexedDB) and persist across sessions. It does not publish items to a shared online marketplace or synchronize data between users.
            </li>
            <li>
              <strong>Coarse Location Privacy (DR-05):</strong> Exact residential street addresses and lockbox codes are strictly not collected or stored.
            </li>
            <li>
              <strong>Structured Condition Checkpoints (DR-04):</strong> Condition ratings, notes, and photos at listing, handover, and return are informational records between neighbors. They are not legal determinations, insurance appraisals, or verified digital signatures.
            </li>
            <li>
              <strong>Authentic Imagery:</strong> Photos must represent actual items. Original EXIF metadata and GPS coordinates are stripped before local persistence.
            </li>
            <li>
              <strong>Browser Storage Clearing:</strong> If you clear browser history or site data, local records may be erased. Export backups regularly to preserve your library.
            </li>
          </ul>
        </section>
      </div>

      {/* Confirmation Dialog for REPLACE restore */}
      {showReplaceConfirm && (
        <div className={styles.modalBackdrop}>
          <div className={styles.confirmDialog} role="alertdialog" aria-labelledby="replace-dialog-title">
            <h3 id="replace-dialog-title" className={styles.confirmTitle}>
              Replace All Local Records?
            </h3>
            <p className={styles.confirmText}>
              Warning: Replacing will permanently delete all {localItemCount} current local item records and {localRequestStats.total} borrowing requests, replacing them with the {importPreview?.itemCount} items and {importPreview?.requestCount || 0} requests from your backup file. This cannot be undone unless you already have a backup.
            </p>
            <div className={styles.confirmBtnRow}>
              <button
                type="button"
                onClick={() => setShowReplaceConfirm(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReplace}
                className={styles.dangerReplaceBtn}
              >
                Yes, Replace Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountPage;
