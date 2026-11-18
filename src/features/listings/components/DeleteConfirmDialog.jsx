import React, { useEffect } from 'react';
import styles from './DeleteConfirmDialog.module.css';

export function DeleteConfirmDialog({ item, onConfirm, onCancel, isDeleting = false }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, isDeleting]);

  if (!item) return null;

  return (
    <div className={styles.backdrop} onClick={!isDeleting ? onCancel : undefined}>
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
      >
        <div className={styles.iconWrapper} aria-hidden="true">
          ⚠️
        </div>

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
            disabled={isDeleting}
            className={styles.cancelBtn}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(item.id)}
            disabled={isDeleting}
            className={styles.deleteBtn}
          >
            {isDeleting ? 'Deleting...' : 'Permanently Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmDialog;
