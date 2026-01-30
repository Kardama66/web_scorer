import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import type { AuditResult } from './types.js';
import { buildAuditResult } from './scoring.js';
import type { DomSignals } from './scoring.js';

const DEFAULT_TIMEOUT = Number.parseInt(process.env.TIMEOUT_MS ?? '45000', 10);

export async function runAudit(url: string, timeoutMs = DEFAULT_TIMEOUT): Promise<AuditResult> {
  let browser: puppeteer.Browser | null = null;
  try {
    const result = await withTimeout(async () => {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(timeoutMs);
      await page.setViewport({ width: 1280, height: 720 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: timeoutMs });

      const domSignals = await page.evaluate<DomSignals>(() => {
        const title = document.title?.trim() ?? '';
        const description =
          document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '';
        const hasViewport = Boolean(document.querySelector('meta[name="viewport"]'));
        const hasH1 = Boolean(document.querySelector('h1'));
        const links = Array.from(
          document.querySelectorAll('a,button,input[type="button"],input[type="submit"]')
        );
        const ctaKeywords = [
          'contact',
          'book',
          'call',
          'quote',
          'get started',
          'schedule',
          'demo',
          'sign up',
          'subscribe',
          'request'
        ];
        const hasCta = links.some((el) => {
          const text = (
            el.textContent ||
            (el instanceof HTMLInputElement ? el.value : '')
          )
            .toLowerCase()
            .trim();
          return ctaKeywords.some((keyword) => text.includes(keyword));
        });
        const hasMailto = Boolean(document.querySelector('a[href^="mailto:"]'));
        const hasTel = Boolean(document.querySelector('a[href^="tel:"]'));

        return {
          title,
          description,
          hasViewport,
          hasH1,
          hasCta,
          hasMailto,
          hasTel
        };
      });

      let lighthouseResult: any = null;
      try {
        const wsEndpoint = browser.wsEndpoint();
        const port = Number(new URL(wsEndpoint).port);
        lighthouseResult = await lighthouse(url, {
          port,
          logLevel: 'error',
          output: 'json',
          onlyCategories: ['performance', 'seo', 'best-practices', 'accessibility']
        });
      } catch {
        lighthouseResult = null;
      }

      return buildAuditResult(url, domSignals, lighthouseResult);
    }, timeoutMs);

    return result;
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}

async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('AUDIT_TIMEOUT')), timeoutMs);
  });
  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    return result as T;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
