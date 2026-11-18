import React from 'react';
import styles from './EmptyState.module.css';

export function EmptyState() {
  return (
    <section className={styles.emptyContainer} aria-labelledby="empty-title">
      <div className={styles.iconWrapper} aria-hidden="true">
        <svg
          className={styles.emptyIcon}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="32" cy="32" r="30" fill="var(--bn-color-primary-50)" stroke="var(--bn-color-primary-100)" strokeWidth="2" />
          {/* Stylized open empty nest / crate */}
          <path
            d="M16 38C18 48 26 52 32 52C38 52 46 48 48 38C42 42 36 44 32 44C28 44 22 42 16 38Z"
            fill="var(--bn-color-primary-700)"
          />
          <path
            d="M20 28L32 18L44 28"
            stroke="var(--bn-color-accent-500)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M26 32H38"
            stroke="var(--bn-color-slate-400)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h2 id="empty-title" className={styles.title}>
        No items listed yet
      </h2>

      <p className={styles.description}>
        Your local BorrowNest library is currently empty. As part of our strict data-integrity policy, we never populate the interface with fake listings, fictitious borrowers, or fabricated transactions.
      </p>

      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <h3 className={styles.cardHeading}>Local-First Architecture</h3>
          <p className={styles.cardText}>
            All future item records and borrowing workflows will reside directly in your local environment without external telemetry or mandatory remote accounts.
          </p>
        </div>

        <div className={styles.infoCard}>
          <h3 className={styles.cardHeading}>Genuine Data Integrity</h3>
          <p className={styles.cardText}>
            Every listing will be created from genuine user-entered details and authentic user-uploaded photographs, never generic stock images.
          </p>
        </div>

        <div className={styles.infoCard}>
          <h3 className={styles.cardHeading}>Next Milestones</h3>
          <p className={styles.cardText}>
            Module 02 establishes formalized Question-Option-Criteria (QOC) architectural decisions before item creation and borrowing coordination are implemented.
          </p>
        </div>
      </div>
    </section>
  );
}

export default EmptyState;
