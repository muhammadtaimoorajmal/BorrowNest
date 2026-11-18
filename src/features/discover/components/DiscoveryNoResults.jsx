import React from 'react';
import styles from './DiscoveryNoResults.module.css';

/**
 * Honest zero-results feedback state when search or filters return no matching listings.
 * Adheres strictly to Nielsen Heuristic #9 (Error Recovery).
 *
 * @param {object} props
 * @param {function} props.onResetFilters - Callback to clear search and reset filters
 */
export function DiscoveryNoResults({ onResetFilters }) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          🔎
        </div>
        <h2 className={styles.title}>No matching items found</h2>
        <p className={styles.description}>
          We couldn't find any items matching your active search query and filter criteria.
          Try using broader search terms, selecting "All Categories", or turning off the
          "Available now only" filter.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className={styles.resetBtn}
        >
          Reset all filters
        </button>
      </div>
    </div>
  );
}

export default DiscoveryNoResults;
