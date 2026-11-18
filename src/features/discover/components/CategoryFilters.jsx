import React from 'react';
import { CATEGORIES } from '../../listings/validation/itemValidation';
import styles from './CategoryFilters.module.css';

/**
 * Category filter pills component.
 * Adheres to Nielsen Heuristic #6 (Recognition Rather than Recall).
 * Uses role="group" and aria-pressed for accessible toggle state.
 *
 * @param {object} props
 * @param {string} props.selectedCategory - Currently selected category ID or 'ALL'
 * @param {function} props.onSelectCategory - Callback when a category pill is clicked
 */
export function CategoryFilters({ selectedCategory = 'ALL', onSelectCategory }) {
  const categoryList = [
    { id: 'ALL', label: 'All Categories' },
    ...Object.values(CATEGORIES),
  ];

  return (
    <div className={styles.container}>
      <span id="category-filter-label" className={styles.label}>
        Filter by category
      </span>
      <div
        role="group"
        aria-labelledby="category-filter-label"
        className={styles.pillGroup}
      >
        {categoryList.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectCategory(cat.id)}
              className={`${styles.pill} ${isSelected ? styles.pillActive : ''}`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryFilters;
