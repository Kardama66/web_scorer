import { describe, expect, it } from 'vitest';
import { validateUrlInput } from '../validation.js';

describe('validateUrlInput', () => {
  it('normalizes bare domains to https', () => {
    const result = validateUrlInput('example.com');
    expect(result.ok).toBe(true);
    expect(result.normalizedUrl).toMatch(/^https:\/\/example.com/);
  });

  it('rejects localhost', () => {
    const result = validateUrlInput('http://localhost:3000');
    expect(result.ok).toBe(false);
  });
});
