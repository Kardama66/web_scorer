import type { AuditCategory, AuditCheck, AuditResult, CheckStatus } from './types.js';
import { generateId } from './utils/id.js';

export interface DomSignals {
  title: string;
  description: string;
  hasViewport: boolean;
  hasH1: boolean;
  hasCta: boolean;
  hasMailto: boolean;
  hasTel: boolean;
}

type LighthouseResult = {
  lhr?: {
    categories?: Record<string, { score?: number }>;
    audits?: Record<string, { score?: number | null; numericValue?: number | null }>;
  };
};

const CATEGORY_WEIGHTS = {
  performance: 35,
  seo: 20,
  security: 15,
  mobile: 15,
  content: 15
};

const STATUS_SCORE: Record<CheckStatus, number> = {
  pass: 1,
  warn: 0.5,
  fail: 0
};

const RECOMMENDATIONS: Record<string, string> = {
  'performance-score': 'Reduce render-blocking resources and optimize images to improve overall performance.',
  lcp: 'Improve Largest Contentful Paint by optimizing hero images and caching critical assets.',
  cls: 'Stabilize layout shifts by reserving space for media and dynamic UI.',
  'seo-title': 'Add a concise, descriptive page title.',
  'seo-description': 'Write a compelling meta description (50-160 characters).',
  'seo-score': 'Address Lighthouse SEO findings such as crawlable links and metadata.',
  https: 'Serve the site over HTTPS to protect visitors.',
  'mixed-content': 'Eliminate mixed-content assets that load over HTTP.',
  viewport: 'Add a responsive viewport meta tag for mobile devices.',
  'font-size': 'Increase small font sizes to improve readability.',
  'tap-targets': 'Ensure tap targets are large enough for mobile users.',
  cta: 'Add a clear call-to-action button or link above the fold.',
  contact: 'Include email or phone links to make contacting you easier.',
  h1: 'Add a primary H1 heading to clarify page focus.'
};

export function buildAuditResult(
  url: string,
  dom: DomSignals,
  lighthouse: LighthouseResult | null,
): AuditResult {
  const categories: AuditCategory[] = [
    buildPerformanceCategory(lighthouse),
    buildSeoCategory(dom, lighthouse),
    buildSecurityCategory(url, lighthouse),
    buildMobileCategory(dom, lighthouse),
    buildContentCategory(dom)
  ];

  const total = Math.round(
    categories.reduce((sum, category) => sum + category.score * (category.weight / 100), 0),
  );

  const recommendations = collectRecommendations(categories);

  return {
    id: generateId(10),
    url,
    timestamp: new Date().toISOString(),
    score: total,
    categories,
    recommendations
  };
}

function buildPerformanceCategory(lighthouse: LighthouseResult | null): AuditCategory {
  const performanceScore = getCategoryScore(lighthouse, 'performance');
  const lcpMs = getAuditNumeric(lighthouse, 'largest-contentful-paint');
  const cls = getAuditNumeric(lighthouse, 'cumulative-layout-shift');

  const checks: AuditCheck[] = [
    {
      id: 'performance-score',
      title: 'Lighthouse performance score',
      description: formatScoreDescription(performanceScore),
      status: statusFromScore(performanceScore)
    },
    {
      id: 'lcp',
      title: 'Largest Contentful Paint',
      description: lcpMs ? `${Math.round(lcpMs)} ms` : 'Metric unavailable',
      status: statusFromThreshold(lcpMs, [2500, 4000])
    },
    {
      id: 'cls',
      title: 'Cumulative Layout Shift',
      description: cls ? cls.toFixed(2) : 'Metric unavailable',
      status: statusFromThreshold(cls, [0.1, 0.25])
    }
  ];

  return buildCategory('performance', 'Performance', CATEGORY_WEIGHTS.performance, checks);
}

function buildSeoCategory(dom: DomSignals, lighthouse: LighthouseResult | null): AuditCategory {
  const seoScore = getCategoryScore(lighthouse, 'seo');
  const checks: AuditCheck[] = [
    {
      id: 'seo-title',
      title: 'Title tag present',
      description: dom.title ? `"${truncate(dom.title, 60)}"` : 'Missing title',
      status: dom.title ? 'pass' : 'fail'
    },
    {
      id: 'seo-description',
      title: 'Meta description',
      description: dom.description ? `"${truncate(dom.description, 90)}"` : 'Missing meta description',
      status: dom.description ? 'pass' : 'warn'
    },
    {
      id: 'seo-score',
      title: 'Lighthouse SEO score',
      description: formatScoreDescription(seoScore),
      status: statusFromScore(seoScore)
    }
  ];
  return buildCategory('seo', 'SEO Basics', CATEGORY_WEIGHTS.seo, checks);
}

function buildSecurityCategory(url: string, lighthouse: LighthouseResult | null): AuditCategory {
  const https = url.startsWith('https://');
  const mixedContent = getAuditScore(lighthouse, 'mixed-content');
  const bestPractices = getCategoryScore(lighthouse, 'best-practices');

  const checks: AuditCheck[] = [
    {
      id: 'https',
      title: 'HTTPS enabled',
      description: https ? 'Secure transport detected' : 'Site is not served over HTTPS',
      status: https ? 'pass' : 'fail'
    },
    {
      id: 'mixed-content',
      title: 'Mixed content',
      description: mixedContent == null ? 'Check unavailable' : mixedContent === 1 ? 'No mixed content' : 'Mixed content found',
      status: mixedContent == null ? 'warn' : mixedContent === 1 ? 'pass' : 'warn'
    },
    {
      id: 'best-practices',
      title: 'Best practices score',
      description: formatScoreDescription(bestPractices),
      status: statusFromScore(bestPractices)
    }
  ];
  return buildCategory('security', 'Security', CATEGORY_WEIGHTS.security, checks);
}

function buildMobileCategory(dom: DomSignals, lighthouse: LighthouseResult | null): AuditCategory {
  const fontSize = getAuditScore(lighthouse, 'font-size');
  const tapTargets = getAuditScore(lighthouse, 'tap-targets');

  const checks: AuditCheck[] = [
    {
      id: 'viewport',
      title: 'Viewport meta tag',
      description: dom.hasViewport ? 'Responsive viewport configured' : 'Missing viewport meta tag',
      status: dom.hasViewport ? 'pass' : 'fail'
    },
    {
      id: 'font-size',
      title: 'Readable font sizes',
      description: fontSize == null ? 'Check unavailable' : fontSize === 1 ? 'Font sizing looks good' : 'Some text may be small',
      status: fontSize == null ? 'warn' : fontSize === 1 ? 'pass' : 'warn'
    },
    {
      id: 'tap-targets',
      title: 'Tap target sizing',
      description: tapTargets == null ? 'Check unavailable' : tapTargets === 1 ? 'Tap targets sized well' : 'Some targets are too small',
      status: tapTargets == null ? 'warn' : tapTargets === 1 ? 'pass' : 'warn'
    }
  ];
  return buildCategory('mobile', 'Mobile/UX', CATEGORY_WEIGHTS.mobile, checks);
}

function buildContentCategory(dom: DomSignals): AuditCategory {
  const checks: AuditCheck[] = [
    {
      id: 'cta',
      title: 'Visible call-to-action',
      description: dom.hasCta ? 'CTA keyword detected' : 'No obvious CTA found',
      status: dom.hasCta ? 'pass' : 'warn'
    },
    {
      id: 'contact',
      title: 'Contact links',
      description: dom.hasMailto || dom.hasTel ? 'Contact links detected' : 'Missing tel: or mailto: links',
      status: dom.hasMailto || dom.hasTel ? 'pass' : 'warn'
    },
    {
      id: 'h1',
      title: 'Primary headline',
      description: dom.hasH1 ? 'H1 present' : 'Missing H1 heading',
      status: dom.hasH1 ? 'pass' : 'warn'
    }
  ];
  return buildCategory('content', 'Content/CTA', CATEGORY_WEIGHTS.content, checks);
}

function buildCategory(
  id: string,
  title: string,
  weight: number,
  checks: AuditCheck[],
): AuditCategory {
  const score = scoreFromChecks(checks);
  return { id, title, weight, score, checks };
}

function scoreFromChecks(checks: AuditCheck[]): number {
  const totalWeight = checks.reduce((sum, check) => sum + (check.weight ?? 1), 0);
  const weighted = checks.reduce(
    (sum, check) => sum + STATUS_SCORE[check.status] * (check.weight ?? 1),
    0,
  );
  return Math.round((weighted / totalWeight) * 100);
}

function collectRecommendations(categories: AuditCategory[]): string[] {
  const items = new Set<string>();
  for (const category of categories) {
    for (const check of category.checks) {
      if (check.status !== 'pass') {
        const rec = RECOMMENDATIONS[check.id];
        if (rec) {
          items.add(rec);
        }
      }
    }
  }
  return Array.from(items);
}

function statusFromScore(score?: number | null): CheckStatus {
  if (score == null) {
    return 'warn';
  }
  if (score >= 0.9) {
    return 'pass';
  }
  if (score >= 0.6) {
    return 'warn';
  }
  return 'fail';
}

function statusFromThreshold(value?: number | null, thresholds: [number, number]): CheckStatus {
  if (value == null) {
    return 'warn';
  }
  if (value <= thresholds[0]) {
    return 'pass';
  }
  if (value <= thresholds[1]) {
    return 'warn';
  }
  return 'fail';
}

function getCategoryScore(lighthouse: LighthouseResult | null, key: string): number | null {
  return lighthouse?.lhr?.categories?.[key]?.score ?? null;
}

function getAuditScore(lighthouse: LighthouseResult | null, key: string): number | null {
  const score = lighthouse?.lhr?.audits?.[key]?.score;
  if (typeof score === 'number') {
    return score;
  }
  return null;
}

function getAuditNumeric(lighthouse: LighthouseResult | null, key: string): number | null {
  const value = lighthouse?.lhr?.audits?.[key]?.numericValue;
  if (typeof value === 'number') {
    return value;
  }
  return null;
}

function formatScoreDescription(score?: number | null): string {
  if (score == null) {
    return 'Score unavailable';
  }
  return `${Math.round(score * 100)} / 100`;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
}
