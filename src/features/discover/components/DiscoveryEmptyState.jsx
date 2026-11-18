import React from 'react';
import styles from './DiscoveryEmptyState.module.css';

/**
 * Honest empty state for the public discovery catalog when zero active items exist.
 * Avoids synthetic or mock items entirely, encouraging users to list real items in Lending.
 *
 * @param {object} props
 * @param {function} props.onNavigateToLending - Handler to switch to the Lending workspace
 */
export function DiscoveryEmptyState({ onNavigateToLending }) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          🌱
        </div>
        <h2 className={styles.title}>No items listed yet</h2>
        <p className={styles.description}>
          Your local BorrowNest catalog does not have any active items available to borrow.
          To get started, switch to the Lending workspace and add your first community item.
        </p>
        <button
          type="button"
          onClick={onNavigateToLending}
          className={styles.actionBtn}
        >
          Go to Lending Workspace
        </button>
      </div>
    </div>
  );
}

export default DiscoveryEmptyState;
