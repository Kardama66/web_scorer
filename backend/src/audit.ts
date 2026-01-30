import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import type { AuditResult } from './types.js';
import { buildAuditResult } from './scoring.js';
import type { DomSignals } from './scoring.js';

export interface AuditOptions {
  timeoutMs: number;
  lighthouseTimeoutMs: number;
  fastMode: boolean;
  lighthouseEnabled: boolean;
}

export async function runAudit(url: string, options: AuditOptions): Promise<AuditResult> {
  let browser: puppeteer.Browser | null = null;
  try {
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
    page.setDefaultNavigationTimeout(options.timeoutMs);
    await page.setViewport({ width: 1280, height: 720 });

    if (options.fastMode) {
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const type = request.resourceType();
        if (type === 'image' || type === 'media' || type === 'font') {
          request.abort();
          return;
        }
        request.continue();
      });
    }

    await withTimeout(
      () =>
        page.goto(url, {
          waitUntil: options.fastMode ? 'domcontentloaded' : 'networkidle2',
          timeout: options.timeoutMs
        }),
      options.timeoutMs,
      'AUDIT_TIMEOUT'
    );

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
        const text = (el.textContent || (el instanceof HTMLInputElement ? el.value : ''))
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
    if (options.lighthouseEnabled) {
      try {
        const wsEndpoint = browser.wsEndpoint();
        const port = Number(new URL(wsEndpoint).port);
        lighthouseResult = await withTimeout(
          () =>
            lighthouse(url, {
              port,
              logLevel: 'error',
              output: 'json',
              onlyCategories: ['performance', 'seo', 'best-practices', 'accessibility']
            }),
          options.lighthouseTimeoutMs,
          'LIGHTHOUSE_TIMEOUT'
        );
      } catch {
        lighthouseResult = null;
      }
    }

    return buildAuditResult(url, domSignals, lighthouseResult);
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}

async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number, code: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(code)), timeoutMs);
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
