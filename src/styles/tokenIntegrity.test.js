import { describe, it, expect } from 'vitest';
import { validateTokens } from '../../scripts/validate-tokens.mjs';

describe('CSS Design Token Integrity Check (Module 07)', () => {
  it('verifies that all CSS files resolve custom properties against canonical tokens', () => {
    const result = validateTokens();

    if (!result.success) {
      const summary = result.unresolved
        .map((u) => `  ${u.file}: unresolved "${u.variable}" (fallback: ${u.fallback || 'none'})`)
        .join('\n');
      expect.fail(`Found ${result.unresolved.length} unresolved custom property references:\n${summary}`);
    }

    expect(result.success).toBe(true);
    expect(result.scannedFilesCount).toBeGreaterThanOrEqual(30);
    expect(result.definedTokensCount).toBeGreaterThanOrEqual(100);
  });
});
