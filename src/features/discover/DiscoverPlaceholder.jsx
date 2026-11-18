import React from 'react';
import styles from './Placeholder.module.css';

export function DiscoverPlaceholder({ onNavigateToLending }) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper} aria-hidden="true">
          🔍
        </div>
        <span className={styles.badge}>Module 04 Roadmap</span>
        <h2 className={styles.title}>Item Discovery & Catalog</h2>
        <p className={styles.description}>
          The public item discovery experience—including keyword search, category exploration, and real-time availability filtering (DR-01)—is scheduled for implementation in <strong>Module 04</strong>.
        </p>
        <p className={styles.subtext}>
          In this release (Module 03), you can register, manage, and persist your own genuine item listings in your local Lending library.
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

export default DiscoverPlaceholder;
