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
import { DemonstrationGuide } from '../../demo/components/DemonstrationGuide';
import styles from './DiscoverPage.module.css';

/**
 * Public item discovery, exploration, and marketplace browsing page for BorrowNest.
 * Fully implements DR-01 (Unified Discovery) with keyword search, category pills,
 * and live feedback using IndexedDB as the single runtime source of truth (Defect 01).
 *
 * @param {object} props
 * @param {object} [props.adapter] - Storage adapter instance
 * @param {function} props.onNavigateToLending - Callback to navigate to Lending workspace
 * @param {function} [props.onNavigateToBorrowing] - Callback to navigate to Borrowing workspace
 */
export function DiscoverPage({
  adapter,
  onNavigateToLending,
  onNavigateToBorrowing,
}) {
  // Single source of truth: Unified marketplace inventory loaded from IndexedDB
  const {
    items: localItems,
    totalActiveCount: localTotalCount,
    resultCount: localResultCount,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    availableOnly,
    setAvailableOnly,
    hasActiveFilters: localHasFilters,
    resetFilters: resetLocalFilters,
    loading: localLoading,
    error: localError,
    refresh: refreshLocal,
  } = useDiscovery(adapter);

  const [selectedItem, setSelectedItem] = useState(null);
  const [requestingItem, setRequestingItem] = useState(null);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setAvailableOnly(false);
    resetLocalFilters();
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Product Introduction Hero (Module 06 & 09) */}
      <section className={styles.introHero} aria-label="BorrowNest Introduction">
        <h2 className={styles.introHeroTagline}>Share what you own. Borrow what you need.</h2>
        <p className={styles.introHeroText}>
          BorrowNest is an interactive classroom marketplace prototype. Demo profiles and marketplace activity are stored in this browser and do not synchronize between different visitors. Explore 20 curated marketplace products below with genuine photography and simulated owners, or add your own listings in Lending.
        </p>
      </section>

      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Item Discovery & Catalog</h1>
        <p className={styles.pageSubtitle}>
          Explore 20 curated marketplace products with genuine photography. Search by keyword and browse by category.
        </p>
      </div>

      {/* Classroom Demonstration Guide Walkthrough */}
      <DemonstrationGuide
        onNavigateToSection={(s) => {
          if (s === 'borrowing' && onNavigateToBorrowing) onNavigateToBorrowing();
          else if (s === 'lending' && onNavigateToLending) onNavigateToLending();
        }}
      />

      {/* Discovery Filters Panel (DR-01: Unified Discovery) */}
      <section className={styles.filterCard} aria-label="Catalogue search and filters">
        <div className={styles.topFilterRow}>
          <DiscoverySearch
            value={searchQuery}
            onChange={setSearchQuery}
          />
          {localTotalCount > 0 && (
            <AvailabilityFilter
              availableOnly={availableOnly}
              onChange={setAvailableOnly}
            />
          )}
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
          <span className={styles.localCount}>
            {localLoading
              ? 'Loading local listings...'
              : localTotalCount === 0
              ? 'Your local listings: 0'
              : `Showing ${localResultCount} of ${localTotalCount} items`}
          </span>
        </div>

        {localHasFilters && !localLoading && (
          <div className={styles.activeFiltersGroup}>
            <span className={styles.filterPill}>Filters active</span>
            <button
              type="button"
              onClick={handleResetFilters}
              className={styles.clearFiltersBtn}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area - Single Unified Marketplace Grid (Defect 01) */}
      <section
        id="catalogue-panel"
        aria-label="Catalogue items"
      >
        {localLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} aria-hidden="true" />
            <p>Loading items from local database...</p>
          </div>
        ) : localError ? (
          <div className={styles.errorBanner} role="alert">
            <p>{localError}</p>
            <button type="button" onClick={refreshLocal} className={styles.clearFiltersBtn}>
              Retry
            </button>
          </div>
        ) : localTotalCount === 0 ? (
          <DiscoveryEmptyState onNavigateToLending={onNavigateToLending} />
        ) : localResultCount === 0 ? (
          <DiscoveryNoResults onResetFilters={handleResetFilters} />
        ) : (
          <div className={styles.grid}>
            {localItems.map((item) => (
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
          onNavigateToLending={onNavigateToLending}
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
