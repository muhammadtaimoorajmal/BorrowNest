/**
 * Classroom Demonstration Profiles for BorrowNest.
 *
 * Provides a deterministic set of fictional demonstration identities to evaluate
 * borrower and owner task perspectives within a single browser environment.
 *
 * These profiles are simulated client-side demonstration identities, NOT
 * authenticated accounts or verified individuals.
 */

export const DEMO_PROFILES = Object.freeze([
  {
    id: 'demo-borrower',
    displayName: 'Demo Borrower',
    role: 'borrower',
    roleDescription: 'Borrower and optional owner',
    demoLabel: 'Classroom Demo Profile',
    badge: 'Borrower',
    avatar: '🎒',
    isDemoProfile: true,
    ownedCategories: [],
  },
  {
    id: 'demo-owner-tools',
    displayName: 'Demo Owner — Tools',
    role: 'lender',
    roleDescription: 'Owner of tool examples',
    demoLabel: 'Classroom Demo Profile',
    badge: 'Tools Lender',
    avatar: '🔧',
    isDemoProfile: true,
    ownedCategories: ['TOOLS'],
  },
  {
    id: 'demo-owner-gardening',
    displayName: 'Demo Owner — Gardening',
    role: 'lender',
    roleDescription: 'Owner of gardening examples',
    demoLabel: 'Classroom Demo Profile',
    badge: 'Gardening Lender',
    avatar: '🌱',
    isDemoProfile: true,
    ownedCategories: ['GARDENING'],
  },
  {
    id: 'demo-owner-household',
    displayName: 'Demo Owner — Household',
    role: 'lender',
    roleDescription: 'Owner of household examples',
    demoLabel: 'Classroom Demo Profile',
    badge: 'Household Lender',
    avatar: '🏠',
    isDemoProfile: true,
    ownedCategories: ['HOUSEHOLD'],
  },
  {
    id: 'demo-owner-outdoor-electronics',
    displayName: 'Demo Owner — Outdoor & Electronics',
    role: 'lender',
    roleDescription: 'Owner of outdoor and electronics examples',
    demoLabel: 'Classroom Demo Profile',
    badge: 'Outdoor & Tech Lender',
    avatar: '🏕️',
    isDemoProfile: true,
    ownedCategories: ['OUTDOOR', 'ELECTRONICS'],
  },
]);

export const DEFAULT_DEMO_PROFILE_ID = 'demo-borrower';

export const STORAGE_KEY_ACTIVE_PROFILE = 'borrowNest_activeDemoProfile';

/**
 * Returns the demonstration profile matching the given ID, or default.
 * @param {string} id
 * @returns {typeof DEMO_PROFILES[number]}
 */
export function getDemoProfileById(id) {
  if (!id) return DEMO_PROFILES[0];
  return DEMO_PROFILES.find((p) => p.id === id) || DEMO_PROFILES[0];
}

/**
 * Maps an item category to its assigned demonstration owner profile.
 *
 * - Tools (5 items) -> demo-owner-tools
 * - Gardening (4 items) -> demo-owner-gardening
 * - Household (4 items) -> demo-owner-household
 * - Outdoor (4 items) -> demo-owner-outdoor-electronics
 * - Electronics (3 items) -> demo-owner-outdoor-electronics
 *
 * @param {string} categoryId
 * @returns {typeof DEMO_PROFILES[number]}
 */
export function getDemoOwnerForCategory(categoryId) {
  const cat = (categoryId || '').toUpperCase();
  if (cat === 'TOOLS') {
    return getDemoProfileById('demo-owner-tools');
  }
  if (cat === 'GARDENING') {
    return getDemoProfileById('demo-owner-gardening');
  }
  if (cat === 'HOUSEHOLD') {
    return getDemoProfileById('demo-owner-household');
  }
  if (cat === 'OUTDOOR' || cat === 'ELECTRONICS') {
    return getDemoProfileById('demo-owner-outdoor-electronics');
  }
  return getDemoProfileById('demo-owner-tools');
}
