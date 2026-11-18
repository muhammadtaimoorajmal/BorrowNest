import React from 'react';
import styles from '../discover/Placeholder.module.css';

export function BorrowingPlaceholder({ onNavigateToLending }) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper} aria-hidden="true">
          🤝
        </div>
        <span className={styles.badge}>Module 05 Roadmap</span>
        <h2 className={styles.title}>Borrowing Requests & Coordination</h2>
        <p className={styles.description}>
          The structured borrowing workflow—including request submissions, owner consent decisions (DR-02), and date-range scheduling with conflict prevention (DR-03)—is scheduled for <strong>Module 05</strong>.
        </p>
        <p className={styles.subtext}>
          As part of our mandatory data-integrity policy, BorrowNest does not display simulated borrowing transactions, artificial requests, or fake countdowns.
        </p>
        <button
          type="button"
          onClick={onNavigateToLending}
          className={styles.actionBtn}
        >
          Manage Your Items in Lending
        </button>
      </div>
    </div>
  );
}

export default BorrowingPlaceholder;
