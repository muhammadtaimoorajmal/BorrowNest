import React from 'react';
import styles from './DiscoverySearch.module.css';

/**
 * Accessible search input component for catalog discovery.
 * Strictly adheres to WCAG 2.2 SC 3.3.2 (Labels or Instructions).
 *
 * @param {object} props
 * @param {string} props.value - Current search string
 * @param {function} props.onChange - Handler called on text change
 * @param {string} [props.placeholder] - Optional input placeholder
 */
export function DiscoverySearch({
  value = '',
  onChange,
  placeholder = 'Search by title, description, category, or approximate area...',
}) {
  return (
    <div className={styles.container}>
      <label htmlFor="discovery-search-field" className={styles.searchLabel}>
        Search local catalog
      </label>
      <div className={styles.inputWrapper}>
        <span className={styles.searchIcon} aria-hidden="true">
          🔍
        </span>
        <input
          id="discovery-search-field"
          type="search"
          role="searchbox"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={styles.searchInput}
          autoComplete="off"
          spellCheck="false"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className={styles.clearButton}
            aria-label="Clear search input"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default DiscoverySearch;
