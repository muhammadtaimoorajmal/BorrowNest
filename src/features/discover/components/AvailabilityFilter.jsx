import React from 'react';
import styles from './AvailabilityFilter.module.css';

/**
 * Accessible checkbox filter for immediate item availability.
 * Adheres strictly to DR-01 facet requirements.
 *
 * @param {object} props
 * @param {boolean} props.availableOnly - Whether available-only filter is active
 * @param {function} props.onChange - Handler called on toggle
 */
export function AvailabilityFilter({ availableOnly = false, onChange }) {
  return (
    <div className={styles.container}>
      <label htmlFor="available-only-checkbox" className={styles.label}>
        <input
          id="available-only-checkbox"
          type="checkbox"
          checked={availableOnly}
          onChange={(e) => onChange(e.target.checked)}
          className={styles.checkbox}
        />
        <span>Available now only</span>
        <span className={styles.statusIndicator} aria-hidden="true" />
      </label>
    </div>
  );
}

export default AvailabilityFilter;
