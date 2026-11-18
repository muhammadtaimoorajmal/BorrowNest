import { describe, it, expect } from 'vitest';
import { normalizeSearchText, tokenizeQuery } from './normalizeSearch';

describe('Search Normalization Service: normalizeSearch', () => {
  describe('normalizeSearchText', () => {
    it('returns empty string for null, undefined, or non-string inputs', () => {
      expect(normalizeSearchText(null)).toBe('');
      expect(normalizeSearchText(undefined)).toBe('');
      expect(normalizeSearchText(12345)).toBe('');
      expect(normalizeSearchText({})).toBe('');
    });

    it('trims leading and trailing whitespace and collapses multiple spaces', () => {
      expect(normalizeSearchText('   cordless    drill   ')).toBe('cordless drill');
      expect(normalizeSearchText('\t\nlawn   mower\n')).toBe('lawn mower');
    });

    it('converts uppercase and mixed-case text to lowercase', () => {
      expect(normalizeSearchText('DEWALT 20V MAX')).toBe('dewalt 20v max');
      expect(normalizeSearchText('Pressure WASHER')).toBe('pressure washer');
    });

    it('applies Unicode NFKC normalization', () => {
      // Fullwidth characters or compatibility characters normalized
      expect(normalizeSearchText('Ｓｐａｄｅ')).toBe('spade');
      expect(normalizeSearchText('café')).toBe('café');
    });
  });

  describe('tokenizeQuery', () => {
    it('returns empty array for empty or whitespace-only queries', () => {
      expect(tokenizeQuery('')).toEqual([]);
      expect(tokenizeQuery('   ')).toEqual([]);
      expect(tokenizeQuery(null)).toEqual([]);
    });

    it('splits query into distinct normalized keyword tokens', () => {
      expect(tokenizeQuery('cordless drill')).toEqual(['cordless', 'drill']);
      expect(tokenizeQuery('  Rotary   Hammer   Drill  ')).toEqual(['rotary', 'hammer', 'drill']);
    });

    it('handles single-word queries', () => {
      expect(tokenizeQuery('tent')).toEqual(['tent']);
    });
  });
});
