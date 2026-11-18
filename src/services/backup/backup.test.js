import { describe, it, expect, beforeEach } from 'vitest';
import { generateBackupData } from './exportBackup';
import {
  parseAndValidateBackup,
  executeMerge,
  executeReplace,
  BackupValidationError,
} from './importBackup';
import { IndexedDbStorageAdapter } from '../storage/IndexedDbStorageAdapter';
import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION } from './backupSchema';

describe('Backup and Restore Subsystem', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new IndexedDbStorageAdapter(null, 'BorrowNest_Backup_Test');
    await adapter.initialize();
    await adapter.clearAllItems();
  });

  const validBackupFixture = {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: '2026-11-18T10:00:00.000Z',
    itemCount: 1,
    items: [
      {
        schemaVersion: 1,
        id: 'backup-item-1',
        title: 'Pressure Washer 2000 PSI',
        description: 'Electric pressure washer with soap cannon and turbo nozzle attachments.',
        category: 'TOOLS',
        conditionGrade: 4,
        conditionNotes: 'Works great, hose has light scuffing.',
        approximateArea: 'North Hills / Near Water Tower',
        availability: 'AVAILABLE',
        status: 'ACTIVE',
        photoAttestation: true,
        photos: [
          {
            id: 'photo-1',
            dataUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=',
            altText: 'Front angle of yellow electric pressure washer',
            mimeType: 'image/webp',
            width: 800,
            height: 600,
            sizeBytes: 1200,
          },
        ],
        createdAt: '2026-11-18T09:00:00.000Z',
        updatedAt: '2026-11-18T09:00:00.000Z',
      },
    ],
  };

  it('generates valid backup JSON from storage adapter', async () => {
    const backupData = await generateBackupData(adapter);
    expect(backupData.format).toBe(BACKUP_FORMAT);
    expect(backupData.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(backupData.itemCount).toBe(0);
    expect(backupData.items).toEqual([]);
  });

  it('parses and previews valid backup data correctly', async () => {
    const jsonStr = JSON.stringify(validBackupFixture);
    const { preview, items } = await parseAndValidateBackup(jsonStr);

    expect(preview.itemCount).toBe(1);
    expect(preview.activeCount).toBe(1);
    expect(preview.photoCount).toBe(1);
    expect(items.length).toBe(1);
    expect(items[0].id).toBe('backup-item-1');
  });

  it('rejects malformed JSON strings', async () => {
    await expect(parseAndValidateBackup('not a json string {')).rejects.toThrow(
      BackupValidationError,
    );
  });

  it('rejects backup with invalid format identifier', async () => {
    const invalidFormat = { ...validBackupFixture, format: 'unknown-format' };
    await expect(parseAndValidateBackup(JSON.stringify(invalidFormat))).rejects.toThrow(
      /Unrecognized backup format/i,
    );
  });

  it('rejects backup with unsupported schema version', async () => {
    const invalidVer = { ...validBackupFixture, schemaVersion: 99 };
    await expect(parseAndValidateBackup(JSON.stringify(invalidVer))).rejects.toThrow(
      /Unsupported backup schema version/i,
    );
  });

  it('rejects backup containing corrupted or invalid item records', async () => {
    const corrupted = {
      ...validBackupFixture,
      items: [
        {
          id: 'corrupted-item',
          title: 'Hi', // Too short (min 3)
          description: 'Too short',
          category: 'INVALID_CATEGORY',
        },
      ],
    };
    await expect(parseAndValidateBackup(JSON.stringify(corrupted))).rejects.toThrow(
      /Invalid item data in backup/i,
    );
  });

  it('executes MERGE by adding novel records and skipping duplicates', async () => {
    const { items } = await parseAndValidateBackup(JSON.stringify(validBackupFixture));

    // First merge
    const result1 = await executeMerge(items, adapter);
    expect(result1.addedCount).toBe(1);
    expect(result1.skippedCount).toBe(0);
    expect(await adapter.countItems()).toBe(1);

    // Second merge with same items
    const result2 = await executeMerge(items, adapter);
    expect(result2.addedCount).toBe(0);
    expect(result2.skippedCount).toBe(1);
    expect(await adapter.countItems()).toBe(1);
  });

  it('executes REPLACE by wiping existing items and inserting backup items', async () => {
    // Add existing dummy item
    await adapter.createItem({
      id: 'existing-local-item',
      title: 'Old Lawn Mower',
      description: 'Existing lawn mower in local database before replacement.',
      category: 'GARDENING',
      conditionGrade: 3,
      approximateArea: 'East Park',
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      photoAttestation: true,
      photos: [{ id: 'p', altText: 'Old lawn mower', blob: new Blob(['x']) }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(await adapter.countItems()).toBe(1);

    const { items } = await parseAndValidateBackup(JSON.stringify(validBackupFixture));
    const { replacedCount } = await executeReplace(items, adapter);

    expect(replacedCount).toBe(1);
    expect(await adapter.countItems()).toBe(1);

    const retrieved = await adapter.getItemById('backup-item-1');
    expect(retrieved.title).toBe('Pressure Washer 2000 PSI');
  });

  describe('Robust Merge Error Handling', () => {
    it('propagates unexpected storage errors without silently swallowing them', async () => {
      const failingAdapter = {
        getItemById: () => {
          throw new Error('Unexpected fatal database corruption');
        },
        createItem: () => {},
      };

      const items = [{ id: 'test-item-x', title: 'Sample' }];
      await expect(executeMerge(items, failingAdapter)).rejects.toThrow(
        /Unexpected fatal database corruption/i,
      );
    });

    it('rejects merging items with missing or invalid IDs', async () => {
      const invalidItems = [{ title: 'No ID item' }];
      await expect(executeMerge(invalidItems, adapter)).rejects.toThrow(/missing id/i);
    });
  });

  describe('Photo Validation in Backup Import', () => {
    it('rejects backup with unsupported image MIME type (e.g. SVG or GIF)', async () => {
      const unsupportedPhotoBackup = {
        ...validBackupFixture,
        items: [
          {
            ...validBackupFixture.items[0],
            photos: [
              {
                id: 'p-svg',
                altText: 'Vector illustration',
                dataUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
              },
            ],
          },
        ],
      };

      await expect(parseAndValidateBackup(JSON.stringify(unsupportedPhotoBackup))).rejects.toThrow(
        /unsupported MIME type/i,
      );
    });

    it('rejects backup with malformed base64 image payload', async () => {
      const malformedPhotoBackup = {
        ...validBackupFixture,
        items: [
          {
            ...validBackupFixture.items[0],
            photos: [
              {
                id: 'p-corrupt',
                altText: 'Corrupted image',
                dataUrl: 'data:image/webp;base64,!!!NotBase64Data!!!',
              },
            ],
          },
        ],
      };

      await expect(parseAndValidateBackup(JSON.stringify(malformedPhotoBackup))).rejects.toThrow(
        /Failed to decode photo/i,
      );
    });

    it('rejects photo missing required accessible altText description', async () => {
      const noAltBackup = {
        ...validBackupFixture,
        items: [
          {
            ...validBackupFixture.items[0],
            photos: [
              {
                id: 'p-no-alt',
                altText: '   ', // whitespace only
                dataUrl: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=',
              },
            ],
          },
        ],
      };

      await expect(parseAndValidateBackup(JSON.stringify(noAltBackup))).rejects.toThrow(
        /missing required accessible description/i,
      );
    });

    it('reprocesses accepted photo into a clean WebP/JPEG Blob stripping original metadata', async () => {
      const { items } = await parseAndValidateBackup(JSON.stringify(validBackupFixture));
      expect(items[0].photos.length).toBe(1);
      const processedPhoto = items[0].photos[0];

      expect(processedPhoto.blob).toBeInstanceOf(Blob);
      expect(['image/webp', 'image/jpeg']).toContain(processedPhoto.mimeType);
      expect(processedPhoto.altText).toBe('Front angle of yellow electric pressure washer');
      expect(processedPhoto.width).toBeLessThanOrEqual(1600);
      expect(processedPhoto.height).toBeLessThanOrEqual(1600);
    });
  });
});
