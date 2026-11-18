import React, { useState, useMemo } from 'react';
import { useDiscovery } from '../hooks/useDiscovery';
import { DiscoverySearch } from '../components/DiscoverySearch';
import { CategoryFilters } from '../components/CategoryFilters';
import { AvailabilityFilter } from '../components/AvailabilityFilter';
import { DiscoveryCard } from '../components/DiscoveryCard';
import { DiscoveryEmptyState } from '../components/DiscoveryEmptyState';
import { DiscoveryNoResults } from '../components/DiscoveryNoResults';
import { ItemDetailModal } from '../components/ItemDetailModal';
import { BorrowRequestDialog } from '../../borrowing/components/BorrowRequestDialog';
import { EXAMPLE_CATALOGUE } from '../data/exampleCatalogue';
import { filterListings } from '../services/filterListings';
import styles from './DiscoverPage.module.css';

/**
 * Public item discovery, exploration, and catalogue browsing page for BorrowNest.
 * Fully implements DR-01 (Unified Discovery) with keyword search, category pills,
 * live feedback, and clear architectural separation between the curated read-only
 * example catalogue and the visitor's private IndexedDB local inventory.
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
  // Personal local inventory state via existing IndexedDB hook
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

  // Filter curated example catalogue items in memory
  const filteredExampleItems = useMemo(() => {
    return filterListings(EXAMPLE_CATALOGUE, {
      searchQuery,
      category: selectedCategory,
    });
  }, [searchQuery, selectedCategory]);

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
      {/* Product Introduction Hero (Module 06) */}
      <section className={styles.introHero} aria-label="BorrowNest Introduction">
        <h2 className={styles.introHeroTagline}>Share what you own. Borrow what you need.</h2>
        <p className={styles.introHeroText}>
          BorrowNest helps neighbors and local community members organize everyday tools,
          gardening implements, and household equipment. Browse our curated example catalogue
          below to see what equipment people share, or add your own listings in Lending.
        </p>
      </section>

      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Item Discovery & Catalog</h1>
        <p className={styles.pageSubtitle}>
          Explore equipment shared across your local community. Search by keyword, browse by
          category, and inspect detailed condition records.
        </p>
      </div>

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
              ? 'Loading community catalog...'
              : localTotalCount === 0
              ? 'Your local listings: 0 items in local catalog'
              : `Showing ${localResultCount} of ${localTotalCount} items (local)`}
          </span>
          <span className={styles.countSeparator} aria-hidden="true"> • </span>
          <span className={styles.exampleCount}>
            {`Example catalogue: ${filteredExampleItems.length} of ${EXAMPLE_CATALOGUE.length} illustrative items`}
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

      {/* Main Content Area */}
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
        ) : (
          <>
            {/* If local inventory has 0 items, display honest empty state */}
            {localTotalCount === 0 && (
              <DiscoveryEmptyState onNavigateToLending={onNavigateToLending} />
            )}

            {/* If local inventory has items, show local items */}
            {localTotalCount > 0 && (
              <div className={styles.localSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    My Local Listings ({localTotalCount})
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Genuine items stored directly in your browser&apos;s IndexedDB.
                  </p>
                </div>
                {localResultCount === 0 ? (
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
              </div>
            )}

            {/* Curated Example Catalogue: Always visible showcase with real photography */}
            <section className={styles.exampleSection} aria-label="Curated Example Equipment">
              <div className={styles.exampleHeader}>
                <div className={styles.exampleHeaderBadge}>
                  <span aria-hidden="true">✨</span> Illustrative Demonstration Catalogue
                </div>
                <h2 className={styles.exampleTitle}>
                  Explore Community Equipment ({EXAMPLE_CATALOGUE.length} Example Items)
                </h2>
                <p className={styles.exampleSubtitle}>
                  Illustrative examples, not live community listings. Browse genuine equipment photography to explore what neighbors
                  share on BorrowNest. These illustrative items showcase specifications, condition
                  grades, and use cases without geographic restrictions.
                </p>
              </div>

              {filteredExampleItems.length === 0 ? (
                <div className={styles.noExampleResults}>
                  <p>No example items match the current filters.</p>
                </div>
              ) : (
                <div className={styles.grid}>
                  {filteredExampleItems.map((item) => (
                    <DiscoveryCard
                      key={item.id}
                      item={item}
                      onView={setSelectedItem}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onNavigateToLending={onNavigateToLending}
          onRequestBorrow={(item) => {
            if (item.isDemo) return;
            setSelectedItem(null);
            setRequestingItem(item);
          }}
        />
      )}

      {/* Borrow Request Submission Dialog (DR-02 / DR-03 - Real Items Only) */}
      {requestingItem && !requestingItem.isDemo && (
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
