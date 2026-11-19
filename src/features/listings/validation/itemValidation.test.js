import { describe, it, expect } from 'vitest';
import {
  validateItemRecord,
  checkPrivacyPatterns,
  CATEGORIES,
  CONDITION_TIERS,
  AVAILABILITY_STATUS,
  LISTING_STATUS,
} from './itemValidation';

describe('Domain Validation: itemValidation', () => {
  const validRecordFixture = {
    schemaVersion: 1,
    id: 'test-item-uuid-1234',
    title: 'DeWalt Cordless Drill 20V Max',
    description: 'High performance brushless hammer drill with 2 lithium-ion batteries and heavy-duty charger.',
    category: 'TOOLS',
    conditionGrade: 4,
    conditionNotes: 'Small scratch on battery casing, motor runs perfectly.',
    approximateArea: 'West End / Near Central Station',
    availability: 'AVAILABLE',
    status: 'ACTIVE',
    photoAttestation: true,
    photos: [
      {
        id: 'photo-1',
        blob: new Blob(['mock-data'], { type: 'image/webp' }),
        altText: 'Side view of DeWalt cordless drill showing chuck and battery',
        mimeType: 'image/webp',
        width: 1200,
        height: 900,
        sizeBytes: 150000,
      },
    ],
    createdAt: '2026-11-18T10:00:00.000Z',
    updatedAt: '2026-11-18T10:00:00.000Z',
  };

  it('approves a fully valid item record', () => {
    const { isValid, errors } = validateItemRecord(validRecordFixture);
    expect(isValid).toBe(true);
    expect(Object.keys(errors).length).toBe(0);
  });

  it('rejects missing or too short title', () => {
    const resEmpty = validateItemRecord({ ...validRecordFixture, title: '' });
    expect(resEmpty.isValid).toBe(false);
    expect(resEmpty.errors.title).toMatch(/Item title is required/i);

    const resShort = validateItemRecord({ ...validRecordFixture, title: 'ab' });
    expect(resShort.isValid).toBe(false);
    expect(resShort.errors.title).toMatch(/at least 3 characters/i);
  });

  it('rejects title exceeding maximum length', () => {
    const longTitle = 'a'.repeat(81);
    const res = validateItemRecord({ ...validRecordFixture, title: longTitle });
    expect(res.isValid).toBe(false);
    expect(res.errors.title).toMatch(/must not exceed 80 characters/i);
  });

  it('rejects missing or too short description', () => {
    const resShort = validateItemRecord({ ...validRecordFixture, description: 'Short desc' });
    expect(resShort.isValid).toBe(false);
    expect(resShort.errors.description).toMatch(/at least 20 characters/i);
  });

  it('rejects invalid or missing category', () => {
    const resNone = validateItemRecord({ ...validRecordFixture, category: '' });
    expect(resNone.isValid).toBe(false);

    const resInvalid = validateItemRecord({ ...validRecordFixture, category: 'ALL' });
    expect(resInvalid.isValid).toBe(false);
    expect(resInvalid.errors.category).toMatch(/valid item category/i);
  });

  it('rejects invalid condition grade', () => {
    const res0 = validateItemRecord({ ...validRecordFixture, conditionGrade: 0 });
    expect(res0.isValid).toBe(false);

    const res6 = validateItemRecord({ ...validRecordFixture, conditionGrade: 6 });
    expect(res6.isValid).toBe(false);
  });

  it('rejects missing approximateArea', () => {
    const res = validateItemRecord({ ...validRecordFixture, approximateArea: '   ' });
    expect(res.isValid).toBe(false);
    expect(res.errors.approximateArea).toMatch(/General pickup area is required/i);
  });

  it('rejects listings with zero photos', () => {
    const res = validateItemRecord({ ...validRecordFixture, photos: [] });
    expect(res.isValid).toBe(false);
    expect(res.errors.photos).toMatch(/At least one genuine photograph/i);
  });

  it('rejects photos without alt text', () => {
    const res = validateItemRecord({
      ...validRecordFixture,
      photos: [
        {
          id: 'p1',
          blob: new Blob(['data'], { type: 'image/webp' }),
          altText: '',
        },
      ],
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.photo_0_alt).toMatch(/requires an accessible description/i);
  });

  it('rejects listings without genuine photo attestation', () => {
    const res = validateItemRecord({ ...validRecordFixture, photoAttestation: false });
    expect(res.isValid).toBe(false);
    expect(res.errors.photoAttestation).toMatch(/confirm that uploaded photographs genuinely represent/i);
  });

  it('detects privacy warning for residential address patterns', () => {
    const warningStreet = checkPrivacyPatterns('124 Elm Street, Apt 4B');
    expect(warningStreet).toMatch(/Possible street address detected/i);

    const warningGate = checkPrivacyPatterns('Gate code: 5432');
    expect(warningGate).toMatch(/Potential gate, key, or lockbox code detected/i);

    const warningLockbox = checkPrivacyPatterns('lockbox 4321');
    expect(warningLockbox).toMatch(/Potential gate, key, or lockbox code detected/i);

    const warningPrivateAccess = checkPrivacyPatterns('private access: key under mat');
    expect(warningPrivateAccess).toMatch(/Private residential access instructions detected/i);

    const safeNeighborhood = checkPrivacyPatterns('East Riverside / Near Community Center');
    expect(safeNeighborhood).toBeNull();

    const safeIslamabad = checkPrivacyPatterns('Islamabad');
    expect(safeIslamabad).toBeNull();

    const safeMarkaz = checkPrivacyPatterns('F-10 Markaz');
    expect(safeMarkaz).toBeNull();
  });

  it('rejects listings with prohibited private address or credential patterns', () => {
    const resStreet = validateItemRecord({ ...validRecordFixture, approximateArea: '142 Elm Street' });
    expect(resStreet.isValid).toBe(false);
    expect(resStreet.errors.approximateArea).toMatch(/Possible street address detected/i);

    const resApt = validateItemRecord({ ...validRecordFixture, approximateArea: 'Apt 4B, Westside' });
    expect(resApt.isValid).toBe(false);
    expect(resApt.errors.approximateArea).toMatch(/Apartment or unit number detected/i);

    const resLockbox = validateItemRecord({ ...validRecordFixture, approximateArea: 'Lockbox code: 9876' });
    expect(resLockbox.isValid).toBe(false);
    expect(resLockbox.errors.approximateArea).toMatch(/Potential gate, key, or lockbox code detected/i);

    const resIslamabad = validateItemRecord({ ...validRecordFixture, approximateArea: 'Islamabad' });
    expect(resIslamabad.isValid).toBe(true);

    const resF10 = validateItemRecord({ ...validRecordFixture, approximateArea: 'F-10 Markaz' });
    expect(resF10.isValid).toBe(true);
  });
});
