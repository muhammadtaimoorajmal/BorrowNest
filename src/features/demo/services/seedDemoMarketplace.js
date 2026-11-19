/**
 * Classroom Demonstration Marketplace Seeding Service.
 *
 * Idempotently seeds the 20 curated catalogue products from `exampleCatalogue.js`
 * into the native IndexedDB `items` store so they become fully interactive,
 * requestable marketplace listings with assigned demonstration owners.
 *
 * Seeder Safety Guarantees:
 * - Runs once during application initialization.
 * - Idempotent: adds missing demo records only; never duplicates items.
 * - Non-destructive: never overwrites user-created listings or user modifications on normal refresh.
 * - Stable: uses the 20 existing unique product IDs and genuine image assets.
 */

import { EXAMPLE_CATALOGUE, getDemoImageUrl } from '../../discover/data/exampleCatalogue';
import { getDemoOwnerForCategory } from '../data/demoProfiles';
import { SCHEMA_VERSION } from '../../listings/validation/itemValidation';

export const SEEDED_CATALOGUE_COUNT = 20;

/**
 * Builds a valid, complete marketplace listing record from an EXAMPLE_CATALOGUE item.
 *
 * @param {object} exampleItem
 * @returns {object} Validated item record ready for IndexedDB
 */
export function buildDemoItemRecord(exampleItem) {
  const owner = getDemoOwnerForCategory(exampleItem.category);
  const imageUrl = getDemoImageUrl(exampleItem.imagePath);

  // Determine standard demo condition tier based on specifications
  let conditionGrade = 4; // Good
  if (
    exampleItem.id.includes('projector') ||
    exampleItem.id.includes('power-station') ||
    exampleItem.id.includes('air-purifier') ||
    exampleItem.id.includes('electric-screwdriver')
  ) {
    conditionGrade = 5; // Like New
  } else if (
    exampleItem.id.includes('wet-dry') ||
    exampleItem.id.includes('folding-camping-table')
  ) {
    conditionGrade = 3; // Fair
  }

  const now = '2026-11-19T00:00:00.000Z';

  return {
    schemaVersion: SCHEMA_VERSION,
    id: exampleItem.id,
    title: exampleItem.title,
    description: exampleItem.description,
    category: exampleItem.category,
    conditionGrade,
    conditionNotes: 'Curated demonstration equipment with genuine photography. Verified for classroom borrowing simulation.',
    approximateArea: 'Demo pickup area',
    availability: 'AVAILABLE',
    status: 'ACTIVE',
    imagePath: exampleItem.imagePath,
    imageAlt: exampleItem.imageAlt,
    isDemo: true,
    demoSeed: true,
    photoAttestation: true,
    ownerProfileId: owner.id,
    ownerDisplayName: owner.displayName,
    photos: [
      {
        id: `${exampleItem.id}-photo-1`,
        dataUrl: imageUrl,
        imagePath: exampleItem.imagePath,
        altText: exampleItem.imageAlt,
        width: 1200,
        height: 900,
        sizeBytes: 45000,
      },
    ],
    specifications: exampleItem.specifications || [],
    suggestedUseCase: exampleItem.suggestedUseCase || '',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Seeds missing demo catalogue products into IndexedDB.
 *
 * @param {import('../../../services/storage/StorageAdapter').StorageAdapter} adapter
 * @returns {Promise<{ seededCount: number, existingCount: number, totalDemoCount: number }>}
 */
export async function seedDemoMarketplace(adapter) {
  if (!adapter) {
    return { seededCount: 0, existingCount: 0, totalDemoCount: SEEDED_CATALOGUE_COUNT };
  }

  try {
    await adapter.initialize();
  } catch (err) {
    // If initialization fails, log and return safe fallback
    console.warn('Demo seeder: adapter initialization failed:', err);
    return { seededCount: 0, existingCount: 0, totalDemoCount: SEEDED_CATALOGUE_COUNT };
  }

  // Fetch all existing items across all statuses
  let existingItems = [];
  try {
    if (typeof adapter.getAllItems === 'function') {
      existingItems = await adapter.getAllItems();
    } else if (typeof adapter.listItems === 'function') {
      existingItems = await adapter.listItems();
    }
  } catch (err) {
    console.warn('Demo seeder: failed to list items:', err);
    existingItems = [];
  }

  const existingMap = new Map();
  for (const item of existingItems) {
    existingMap.set(item.id, item);
  }

  let seededCount = 0;
  let existingCount = 0;

  for (const example of EXAMPLE_CATALOGUE) {
    if (existingMap.has(example.id)) {
      existingCount++;
    } else {
      const demoRecord = buildDemoItemRecord(example);
      try {
        await adapter.createItem(demoRecord);
        seededCount++;
      } catch (err) {
        // If already exists or error, continue
        console.warn(`Demo seeder: failed to create item ${example.id}:`, err);
      }
    }
  }

  return {
    seededCount,
    existingCount,
    totalDemoCount: SEEDED_CATALOGUE_COUNT,
  };
}
