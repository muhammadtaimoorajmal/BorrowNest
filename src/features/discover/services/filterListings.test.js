import { describe, it, expect } from 'vitest';
import { filterListings } from './filterListings';

describe('Discovery Filtering Service: filterListings', () => {
  const sampleItems = [
    {
      id: 'item-1',
      title: 'Cordless Rotary Hammer Drill',
      description: '20V brushless hammer drill with SDS-plus chuck and 2 batteries.',
      category: 'TOOLS',
      conditionGrade: 4,
      approximateArea: 'North Hills / Oak Park',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
    },
    {
      id: 'item-2',
      title: 'Cordless Lawn String Trimmer',
      description: 'Lightweight battery-powered grass trimmer with bump feed spool.',
      category: 'GARDENING',
      conditionGrade: 5,
      approximateArea: 'West End / Main Street',
      availability: 'UNAVAILABLE',
      status: 'ACTIVE',
    },
    {
      id: 'item-3',
      title: 'Camping Dome Tent 4-Person',
      description: 'Waterproof double-layer family tent with aluminum poles.',
      category: 'OUTDOOR',
      conditionGrade: 3,
      approximateArea: 'East River / Pine Road',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
    },
    {
      id: 'item-4',
      title: 'Archived Hand Saw',
      description: 'Old wooden-handle carpenter hand saw.',
      category: 'TOOLS',
      conditionGrade: 2,
      approximateArea: 'South Hills',
      availability: 'AVAILABLE',
      status: 'ARCHIVED',
    },
  ];

  it('excludes archived listings regardless of matching search criteria', () => {
    const results = filterListings(sampleItems, { searchQuery: 'hand saw' });
    expect(results.some((i) => i.id === 'item-4')).toBe(false);
    expect(results.length).toBe(0);
  });

  it('returns all active listings when no search or filter options are provided', () => {
    const results = filterListings(sampleItems);
    expect(results.length).toBe(3);
    expect(results.map((i) => i.id)).toEqual(['item-1', 'item-2', 'item-3']);
  });

  it('filters by category accurately', () => {
    const tools = filterListings(sampleItems, { category: 'TOOLS' });
    expect(tools.length).toBe(1);
    expect(tools[0].id).toBe('item-1');

    const gardening = filterListings(sampleItems, { category: 'GARDENING' });
    expect(gardening.length).toBe(1);
    expect(gardening[0].id).toBe('item-2');

    const all = filterListings(sampleItems, { category: 'ALL' });
    expect(all.length).toBe(3);
  });

  it('filters by availability when availableOnly is true', () => {
    const available = filterListings(sampleItems, { availableOnly: true });
    expect(available.length).toBe(2);
    expect(available.map((i) => i.id)).toEqual(['item-1', 'item-3']);
  });

  it('matches single keyword across title and description', () => {
    const drillMatch = filterListings(sampleItems, { searchQuery: 'drill' });
    expect(drillMatch.length).toBe(1);
    expect(drillMatch[0].id).toBe('item-1');

    const batteryMatch = filterListings(sampleItems, { searchQuery: 'battery' });
    expect(batteryMatch.length).toBe(1);
    expect(batteryMatch[0].id).toBe('item-2'); // description has battery-powered
  });

  it('matches multiple tokens (AND conjunction)', () => {
    const multiMatch = filterListings(sampleItems, { searchQuery: 'cordless hammer' });
    expect(multiMatch.length).toBe(1);
    expect(multiMatch[0].id).toBe('item-1');

    const nonMatchingConjunction = filterListings(sampleItems, { searchQuery: 'tent hammer' });
    expect(nonMatchingConjunction.length).toBe(0);
  });

  it('matches approximate area text', () => {
    const areaMatch = filterListings(sampleItems, { searchQuery: 'West End' });
    expect(areaMatch.length).toBe(1);
    expect(areaMatch[0].id).toBe('item-2');
  });

  it('matches category and condition friendly labels', () => {
    const outdoorLabelMatch = filterListings(sampleItems, { searchQuery: 'Outdoor' });
    expect(outdoorLabelMatch.length).toBe(1);
    expect(outdoorLabelMatch[0].id).toBe('item-3');

    const conditionLabelMatch = filterListings(sampleItems, { searchQuery: 'Like New' });
    expect(conditionLabelMatch.length).toBe(1);
    expect(conditionLabelMatch[0].id).toBe('item-2'); // conditionGrade 5 is Like New
  });

  it('combines category, availability, and keyword query simultaneously', () => {
    // Only item-1 is TOOLS + AVAILABLE + has 'cordless'
    const combined1 = filterListings(sampleItems, {
      category: 'TOOLS',
      availableOnly: true,
      searchQuery: 'cordless',
    });
    expect(combined1.length).toBe(1);
    expect(combined1[0].id).toBe('item-1');

    // item-2 is GARDENING + 'cordless', but UNAVAILABLE, so availableOnly excludes it
    const combined2 = filterListings(sampleItems, {
      category: 'GARDENING',
      availableOnly: true,
      searchQuery: 'cordless',
    });
    expect(combined2.length).toBe(0);
  });

  it('returns empty array safely when items is null, undefined, or empty', () => {
    expect(filterListings(null)).toEqual([]);
    expect(filterListings(undefined)).toEqual([]);
    expect(filterListings([])).toEqual([]);
  });
});
