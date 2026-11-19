/**
 * Service to reset classroom demonstration activity in BorrowNest.
 * Restores the 20 seeded demo items, purges demo requests and loans,
 * and sets the active profile back to Demo Borrower.
 *
 * Never affects user-created listings, user requests, or user loans.
 */

import { DEFAULT_DEMO_PROFILE_ID, STORAGE_KEY_ACTIVE_PROFILE } from '../data/demoProfiles';

/**
 * Resets the demonstration marketplace.
 *
 * @param {import('../../../services/storage/StorageAdapter').StorageAdapter} adapter
 * @returns {Promise<{ removedRequests: number, removedLoans: number, resetItems: number }>}
 */
export async function resetDemoMarketplace(adapter) {
  if (!adapter) {
    return { removedRequests: 0, removedLoans: 0, resetItems: 0 };
  }

  // 1. Reset storage data
  let result = { removedRequests: 0, removedLoans: 0, resetItems: 0 };
  if (typeof adapter.resetDemoMarketplaceData === 'function') {
    result = await adapter.resetDemoMarketplaceData();
  }

  // 2. Reset active profile in localStorage to default Demo Borrower
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE, DEFAULT_DEMO_PROFILE_ID);
    } catch {
      // Ignore storage errors
    }
  }

  return result;
}
