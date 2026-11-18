import React, { useState } from 'react';
import { useDiscovery } from '../hooks/useDiscovery';
import { DiscoverySearch } from '../components/DiscoverySearch';
import { CategoryFilters } from '../components/CategoryFilters';
import { AvailabilityFilter } from '../components/AvailabilityFilter';
import { DiscoveryCard } from '../components/DiscoveryCard';
import { DiscoveryEmptyState } from '../components/DiscoveryEmptyState';
import { DiscoveryNoResults } from '../components/DiscoveryNoResults';
import { ItemDetailModal } from '../components/ItemDetailModal';
import { BorrowRequestDialog } from '../../borrowing/components/BorrowRequestDialog';
import styles from './DiscoverPage.module.css';

/**
 * Public item discovery, exploration, and filtering page for BorrowNest.
 * Fully implements DR-01 (Unified Discovery) with keyword search, category pills,
 * progressive availability facet, live feedback, and honest empty/no-results states.
 *
 * @param {object} props
 * @param {object} [props.adapter] - Storage adapter instance
 * @param {function} props.onNavigateToLending - Callback to navigate to Lending workspace
 * @param {function} [props.onNavigateToBorrowing] - Callback to navigate to Borrowing workspace
 */
export function DiscoverPage({ adapter, onNavigateToLending, onNavigateToBorrowing }) {
  const {
    items,
    totalActiveCount,
    resultCount,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    availableOnly,
    setAvailableOnly,
    hasActiveFilters,
    resetFilters,
    loading,
    error,
    refresh,
  } = useDiscovery(adapter);

  const [selectedItem, setSelectedItem] = useState(null);
  const [requestingItem, setRequestingItem] = useState(null);

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Item Discovery & Catalog</h1>
        <p className={styles.pageSubtitle}>
          Search, explore, and borrow items shared by your local community.
          Browse genuine listings stored directly in your local BorrowNest catalog.
        </p>
      </header>

      {/* Discovery Filters Panel (DR-01: Unified Discovery) */}
      <section className={styles.filterCard} aria-label="Catalog search and filters">
        <div className={styles.topFilterRow}>
          <DiscoverySearch
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <AvailabilityFilter
            availableOnly={availableOnly}
            onChange={setAvailableOnly}
          />
        </div>

        <CategoryFilters
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </section>

      {/* Live Region for Result Count and Active Filters (WCAG 2.2 / Nielsen #6) */}
      <div
        role="status"
        aria-live="polite"
        className={styles.resultsBar}
      >
        <div className={styles.resultCount}>
          {loading ? (
            'Loading community catalog...'
          ) : totalActiveCount === 0 ? (
            '0 items in local catalog'
          ) : (
            `Showing ${resultCount} of ${totalActiveCount} ${
              totalActiveCount === 1 ? 'item' : 'items'
            }`
          )}
        </div>

        {hasActiveFilters && !loading && (
          <div className={styles.activeFiltersGroup}>
            <span className={styles.filterPill}>Filters active</span>
            <button
              type="button"
              onClick={resetFilters}
              className={styles.clearFiltersBtn}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <section aria-label="Catalog items">
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} aria-hidden="true" />
            <p>Loading items from local database...</p>
          </div>
        ) : error ? (
          <div className={styles.errorBanner} role="alert">
            <p>{error}</p>
            <button type="button" onClick={refresh} className={styles.clearFiltersBtn}>
              Retry
            </button>
          </div>
        ) : totalActiveCount === 0 ? (
          <DiscoveryEmptyState onNavigateToLending={onNavigateToLending} />
        ) : resultCount === 0 ? (
          <DiscoveryNoResults onResetFilters={resetFilters} />
        ) : (
          <div className={styles.grid}>
            {items.map((item) => (
              <DiscoveryCard
                key={item.id}
                item={item}
                onView={setSelectedItem}
              />
            ))}
          </div>
        )}
      </section>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onRequestBorrow={(item) => {
            setSelectedItem(null);
            setRequestingItem(item);
          }}
        />
      )}

      {/* Borrow Request Submission Dialog (DR-02 / DR-03) */}
      {requestingItem && (
        <BorrowRequestDialog
          item={requestingItem}
          adapter={adapter}
          onClose={() => setRequestingItem(null)}
          onNavigateToBorrowing={onNavigateToBorrowing}
        />
      )}
    </div>
  );
}

export default DiscoverPage;
