import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { EXAMPLE_CATALOGUE, getDemoImageUrl } from './exampleCatalogue';
import { CATEGORIES } from '../../listings/validation/itemValidation';

describe('Curated Example Catalogue Data (Module 08)', () => {
  it('contains exactly 20 high-quality curated items', () => {
    expect(EXAMPLE_CATALOGUE.length).toBe(20);
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

  it('enforces exact category distribution: Tools (5), Gardening (4), Household (4), Outdoor (4), Electronics (3)', () => {
    const counts = {
      TOOLS: 0,
      GARDENING: 0,
      HOUSEHOLD: 0,
      OUTDOOR: 0,
      ELECTRONICS: 0,
    };

    for (const item of EXAMPLE_CATALOGUE) {
      counts[item.category]++;
    }

    expect(counts.TOOLS).toBe(5);
    expect(counts.GARDENING).toBe(4);
    expect(counts.HOUSEHOLD).toBe(4);
    expect(counts.OUTDOOR).toBe(4);
    expect(counts.ELECTRONICS).toBe(3);
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

      // Section 9 Content Integrity: Zero fabricated neighbourhood or condition inspection claims
      expect(item.approximateArea).toBeUndefined();
      expect(item.owner).toBeUndefined();
      expect(item.conditionGrade).toBeUndefined();
      expect(item.conditionDescription).toBeUndefined();
    }
  });

  it('guarantees unique local image paths and all 20 image files physically exist', () => {
    const imagePaths = EXAMPLE_CATALOGUE.map((item) => item.imagePath);
    const uniquePaths = new Set(imagePaths);
    expect(uniquePaths.size).toBe(20);

    for (const imgRelPath of imagePaths) {
      const fullPath = path.resolve(process.cwd(), 'public', imgRelPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(1000);
    }
  });

  it('correctly resolves asset URLs with Vite base path using getDemoImageUrl', () => {
    const samplePath = 'demo/items/cordless-drill.jpg';
    const resolved = getDemoImageUrl(samplePath);

    expect(typeof resolved).toBe('string');
    expect(resolved.endsWith('demo/items/cordless-drill.jpg')).toBe(true);
  });
});
