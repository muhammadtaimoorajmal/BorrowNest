import { describe, it, expect } from 'vitest';
import {
  validateConditionCheckpoint,
  compareConditionGrades,
  CONDITION_DISCLAIMER,
} from './conditionValidation';

describe('conditionValidation', () => {
  it('validates a valid condition checkpoint', () => {
    const valid = {
      conditionGrade: 4,
      conditionLabel: 'Good',
      notes: 'Clean and fully operational.',
      photos: [
        {
          id: 'p1',
          altText: 'Front casing showing minor surface scuffs',
          mimeType: 'image/webp',
        },
      ],
    };

    const res = validateConditionCheckpoint(valid);
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual({});
  });

  it('rejects invalid condition grades outside 1..5', () => {
    const invalidZero = validateConditionCheckpoint({ conditionGrade: 0 });
    expect(invalidZero.isValid).toBe(false);
    expect(invalidZero.errors.conditionGrade).toBeDefined();

    const invalidSix = validateConditionCheckpoint({ conditionGrade: 6 });
    expect(invalidSix.isValid).toBe(false);

    const nonNumber = validateConditionCheckpoint({ conditionGrade: 'excellent' });
    expect(nonNumber.isValid).toBe(false);
  });

  it('enforces character limits on notes and observations', () => {
    const longNotes = 'A'.repeat(501);
    const res = validateConditionCheckpoint({
      conditionGrade: 3,
      notes: longNotes,
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.notes).toContain('cannot exceed 500 characters');
  });

  it('enforces photo alt text and mime type validation', () => {
    const missingAlt = validateConditionCheckpoint({
      conditionGrade: 4,
      photos: [{ id: 'p1', altText: '   ' }],
    });
    expect(missingAlt.isValid).toBe(false);
    expect(missingAlt.errors.photo_0_altText).toBeDefined();

    const badMime = validateConditionCheckpoint({
      conditionGrade: 4,
      photos: [{ id: 'p1', altText: 'An item', mimeType: 'image/gif' }],
    });
    expect(badMime.isValid).toBe(false);
    expect(badMime.errors.photo_0_mimeType).toContain('unsupported format');
  });

  it('enforces maximum 5 photos per checkpoint', () => {
    const sixPhotos = Array.from({ length: 6 }, (_, i) => ({
      id: `p${i}`,
      altText: `Photo ${i}`,
      mimeType: 'image/webp',
    }));

    const res = validateConditionCheckpoint({
      conditionGrade: 4,
      photos: sixPhotos,
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.photos).toContain('maximum of 5 photos');
  });

  it('compares condition grades objectively without assigning fault', () => {
    const same = compareConditionGrades(4, 4, 'Baseline', 'Collection');
    expect(same.direction).toBe('same');
    expect(same.label).toBe('Condition rating unchanged');

    const degraded = compareConditionGrades(4, 3, 'Baseline', 'Return');
    expect(degraded.direction).toBe('degraded');
    expect(degraded.label).toBe('Recorded rating changed from Good to Fair');
    // Ensure no fault or liability attribution
    expect(degraded.summary).not.toContain('damage caused by');
    expect(degraded.summary).not.toContain('liable');

    const unavailable = compareConditionGrades(null, 4);
    expect(unavailable.direction).toBe('unavailable');
  });

  it('exports the standard informational disclaimer', () => {
    expect(CONDITION_DISCLAIMER).toContain('informational observations for transparency');
    expect(CONDITION_DISCLAIMER).toContain('not legal signatures');
  });
});
