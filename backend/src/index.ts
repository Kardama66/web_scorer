import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runAudit } from './audit.js';
import { loadAudit, saveAudit } from './storage.js';
import { validateUrlInput } from './validation.js';
import { Semaphore } from './utils/semaphore.js';
import type { ApiError, AuditResult } from './types.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const port = Number.parseInt(process.env.PORT ?? '3001', 10);
const timeoutMs = Number.parseInt(process.env.TIMEOUT_MS ?? '45000', 10);
const lighthouseTimeoutMs = Number.parseInt(process.env.LIGHTHOUSE_TIMEOUT_MS ?? '60000', 10);
const maxConcurrency = Math.max(1, Number.parseInt(process.env.MAX_CONCURRENCY ?? '2', 10));
const fastMode = (process.env.FAST_MODE ?? 'true').toLowerCase() === 'true';
const lighthouseEnabled = (process.env.LIGHTHOUSE_ENABLED ?? 'true').toLowerCase() === 'true';
const cacheTtlMs = Math.max(0, Number.parseInt(process.env.CACHE_TTL_MS ?? '300000', 10));
const urlCache = new Map<string, { expiresAt: number; result: AuditResult }>();
const semaphore = new Semaphore(maxConcurrency);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/audit', async (req, res) => {
  const url = typeof req.body?.url === 'string' ? req.body.url : '';
  const validation = validateUrlInput(url);
  if (!validation.ok || !validation.normalizedUrl) {
    const payload: ApiError = {
      errorCode: 'INVALID_URL',
      message: validation.message ?? 'Invalid URL.'
    };
    res.status(400).json(payload);
    return;
  }

  const release = await semaphore.acquire();
  try {
    const cached = urlCache.get(validation.normalizedUrl);
    if (cached && cached.expiresAt > Date.now()) {
      res.json(cached.result);
      return;
    }
    const result = await runAudit(validation.normalizedUrl, {
      timeoutMs,
      lighthouseTimeoutMs,
      fastMode,
      lighthouseEnabled
    });
    await saveAudit(result);
    if (cacheTtlMs > 0) {
      urlCache.set(validation.normalizedUrl, {
        result,
        expiresAt: Date.now() + cacheTtlMs
      });
    }
    res.json(result);
  } catch (error) {
    console.error('Audit failed:', error);
    const payload: ApiError = {
      errorCode: 'AUDIT_FAILED',
      message: 'Unable to complete the audit.'
    };
    const message = error instanceof Error ? error.message : '';
    if (message === 'AUDIT_TIMEOUT') {
      payload.errorCode = 'TIMEOUT';
      payload.message = 'Audit timed out. Try again or choose a lighter page.';
      res.status(504).json(payload);
      return;
    }
    if (message.includes('ERR_NAME_NOT_RESOLVED')) {
      payload.errorCode = 'DNS_FAILED';
      payload.message = 'DNS lookup failed. Check the URL and try again.';
    } else if (message.includes('ERR_CONNECTION_REFUSED')) {
      payload.errorCode = 'CONNECTION_REFUSED';
      payload.message = 'The target site refused the connection.';
    } else if (message.includes('ERR_CERT') || message.includes('SSL')) {
      payload.errorCode = 'SSL_ERROR';
      payload.message = 'SSL/TLS error while connecting to the site.';
    }
    res.status(500).json(payload);
  } finally {
    release();
  }
});

app.get('/api/audit/:id', async (req, res) => {
  const id = req.params.id;
  const audit = await loadAudit(id);
  if (!audit) {
    const payload: ApiError = { errorCode: 'NOT_FOUND', message: 'Audit not found.' };
    res.status(404).json(payload);
    return;
  }
  res.json(audit as AuditResult);
});

app.listen(port, () => {
  console.log(`Audit backend listening on http://localhost:${port}`);
});
