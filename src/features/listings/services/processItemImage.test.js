import { describe, it, expect } from 'vitest';
import {
  calculateBoundedDimensions,
  processItemImage,
  ImageProcessingError,
  MAX_DIMENSION_PX,
} from './processItemImage';

describe('Image Processing Pipeline: processItemImage', () => {
  describe('calculateBoundedDimensions', () => {
    it('preserves dimensions already within maximum bound', () => {
      const res = calculateBoundedDimensions(1200, 800, MAX_DIMENSION_PX);
      expect(res).toEqual({ width: 1200, height: 800 });
    });

    it('proportionally downscales landscape images exceeding maximum bound', () => {
      const res = calculateBoundedDimensions(3200, 1600, MAX_DIMENSION_PX);
      expect(res.width).toBe(1600);
      expect(res.height).toBe(800);
    });

    it('proportionally downscales portrait images exceeding maximum bound', () => {
      const res = calculateBoundedDimensions(1200, 2400, MAX_DIMENSION_PX);
      expect(res.width).toBe(800);
      expect(res.height).toBe(1600);
    });

    it('throws on non-positive dimensions', () => {
      expect(() => calculateBoundedDimensions(0, 500)).toThrow(ImageProcessingError);
      expect(() => calculateBoundedDimensions(-100, -200)).toThrow(ImageProcessingError);
    });
  });

  describe('MIME type and file boundary validation', () => {
    it('rejects unsupported SVG format', async () => {
      const svgFile = new File(['<svg></svg>'], 'vector.svg', { type: 'image/svg+xml' });
      await expect(processItemImage(svgFile)).rejects.toThrow(/Unsupported format/i);
    });

    it('rejects animated GIF format', async () => {
      const gifFile = new File(['GIF89a'], 'animation.gif', { type: 'image/gif' });
      await expect(processItemImage(gifFile)).rejects.toThrow(/Unsupported format/i);
    });

    it('rejects oversized files exceeding 10MB', async () => {
      const largeFile = {
        name: 'huge.jpg',
        type: 'image/jpeg',
        size: 11 * 1024 * 1024,
      };
      await expect(processItemImage(largeFile)).rejects.toThrow(/too large/i);
    });

    it('rejects empty 0-byte files', async () => {
      const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });
      await expect(processItemImage(emptyFile)).rejects.toThrow(/empty/i);
    });

    it('rejects null or undefined file', async () => {
      await expect(processItemImage(null)).rejects.toThrow(/No image file provided/i);
    });
  });
});
