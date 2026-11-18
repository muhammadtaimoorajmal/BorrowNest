import React from 'react';
import styles from './BrandMark.module.css';

/**
 * BorrowNest Brand Mark Component
 * Displays the authentic brand icon and wordmark.
 */
export function BrandMark({ showTagline = false, size = 'default' }) {
  return (
    <div className={`${styles.brandContainer} ${styles[size] || ''}`}>
      <svg
        className={styles.icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="var(--bn-color-primary-700)" />
        {/* Nest cradle */}
        <path
          d="M6 19C7.5 24 12 26 16 26C20 26 24.5 24 26 19C23 21 19 22 16 22C13 22 9 21 6 19Z"
          fill="var(--bn-surface-bg)"
          opacity="0.95"
        />
        {/* Lending exchange loop */}
        <path
          d="M10 13C10 9.68629 12.6863 7 16 7C19.3137 7 22 9.68629 22 13C22 15 20.5 17 18.5 17.5"
          stroke="var(--bn-color-accent-500)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M22 15C22 18.3137 19.3137 21 16 21C12.6863 21 10 18.3137 10 15C10 13 11.5 11 13.5 10.5"
          stroke="var(--bn-surface-card)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="14" r="2.5" fill="var(--bn-color-accent-500)" />
      </svg>
      <div className={styles.textGroup}>
        <span className={styles.wordmark}>
          Borrow<span className={styles.wordmarkAccent}>Nest</span>
        </span>
        {showTagline && (
          <span className={styles.tagline}>
            Share what you own. Borrow what you need.
          </span>
        )}
      </div>
    </div>
  );
}

export default BrandMark;
