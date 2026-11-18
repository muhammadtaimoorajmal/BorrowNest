import { describe, it, expect } from 'vitest';
import { EXAMPLE_CATALOGUE, getDemoImageUrl } from './exampleCatalogue';
import { CATEGORIES, CONDITION_TIERS } from '../../listings/validation/itemValidation';

describe('Curated Example Catalogue Data (Module 06)', () => {
  it('contains exactly 10 high-quality curated items', () => {
    expect(EXAMPLE_CATALOGUE.length).toBe(10);
  });

  it('guarantees unique IDs across all items with "demo-" prefix', () => {
    const ids = EXAMPLE_CATALOGUE.map((item) => item.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    for (const id of ids) {
      expect(id).toMatch(/^demo-[a-z0-9-]+$/);
    }
  });

  it('assigns valid categories matching the central category taxonomy', () => {
    const validCategoryIds = Object.keys(CATEGORIES);

    for (const item of EXAMPLE_CATALOGUE) {
      expect(validCategoryIds).toContain(item.category);
      expect(item.categoryLabel).toBe(CATEGORIES[item.category].label);
    }
  });

  it('covers all five supported BorrowNest categories', () => {
    const representedCategories = new Set(EXAMPLE_CATALOGUE.map((item) => item.category));
    expect(representedCategories.has('TOOLS')).toBe(true);
    expect(representedCategories.has('GARDENING')).toBe(true);
    expect(representedCategories.has('HOUSEHOLD')).toBe(true);
    expect(representedCategories.has('OUTDOOR')).toBe(true);
    expect(representedCategories.has('ELECTRONICS')).toBe(true);
  });

  it('defines valid condition grades (1–5) and matching labels', () => {
    for (const item of EXAMPLE_CATALOGUE) {
      expect(item.conditionGrade).toBeGreaterThanOrEqual(1);
      expect(item.conditionGrade).toBeLessThanOrEqual(5);
      expect(item.conditionLabel).toBe(CONDITION_TIERS[item.conditionGrade].label);
      expect(typeof item.conditionDescription).toBe('string');
      expect(item.conditionDescription.trim().length).toBeGreaterThan(10);
    }
  });

  it('provides complete and rich metadata for every example item', () => {
    for (const item of EXAMPLE_CATALOGUE) {
      expect(typeof item.title).toBe('string');
      expect(item.title.trim().length).toBeGreaterThan(5);

      expect(typeof item.description).toBe('string');
      expect(item.description.trim().length).toBeGreaterThan(20);

      expect(Array.isArray(item.specifications)).toBe(true);
      expect(item.specifications.length).toBeGreaterThanOrEqual(3);

      expect(typeof item.suggestedUseCase).toBe('string');
      expect(item.suggestedUseCase.trim().length).toBeGreaterThan(10);

      expect(typeof item.imagePath).toBe('string');
      expect(item.imagePath).toMatch(/^demo\/items\/[a-z-]+\.jpg$/);

      expect(typeof item.imageAlt).toBe('string');
      expect(item.imageAlt.trim().length).toBeGreaterThan(15);

      expect(item.isDemo).toBe(true);

      // Section 8.1 Content Integrity: Zero fabricated neighbourhood names
      expect(item.approximateArea).toBeUndefined();
    }
  });

  it('correctly resolves asset URLs with Vite base path using getDemoImageUrl', () => {
    const samplePath = 'demo/items/cordless-drill.jpg';
    const resolved = getDemoImageUrl(samplePath);

    expect(typeof resolved).toBe('string');
    expect(resolved.endsWith('demo/items/cordless-drill.jpg')).toBe(true);
  });
});
