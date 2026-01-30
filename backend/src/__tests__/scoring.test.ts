import { describe, expect, it } from 'vitest';
import { buildAuditResult } from '../scoring.js';

describe('buildAuditResult', () => {
  it('returns a perfect score when all checks pass', () => {
    const domSignals = {
      title: 'Example Title',
      description: 'Example description for SEO.',
      hasViewport: true,
      hasH1: true,
      hasCta: true,
      hasMailto: true,
      hasTel: true
    };

    const lighthouse = {
      lhr: {
        categories: {
          performance: { score: 0.95 },
          seo: { score: 0.92 },
          'best-practices': { score: 0.9 }
        },
        audits: {
          'largest-contentful-paint': { numericValue: 2000 },
          'cumulative-layout-shift': { numericValue: 0.05 },
          'mixed-content': { score: 1 },
          'font-size': { score: 1 },
          'tap-targets': { score: 1 }
        }
      }
    };

    const result = buildAuditResult('https://example.com', domSignals, lighthouse);
    expect(result.score).toBe(100);
    expect(result.categories).toHaveLength(5);
  });
});
