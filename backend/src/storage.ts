import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AuditResult } from './types.js';

const cache = new Map<string, AuditResult>();
const dataDir = path.join(process.cwd(), 'data');

export async function saveAudit(result: AuditResult): Promise<void> {
  cache.set(result.id, result);
  await fs.mkdir(dataDir, { recursive: true });
  const filePath = path.join(dataDir, `${result.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(result, null, 2), 'utf8');
}

export async function loadAudit(id: string): Promise<AuditResult | null> {
  const cached = cache.get(id);
  if (cached) {
    return cached;
  }
  try {
    const filePath = path.join(dataDir, `${id}.json`);
    const raw = await fs.readFile(filePath, 'utf8');
    const result = JSON.parse(raw) as AuditResult;
    cache.set(id, result);
    return result;
  } catch {
    return null;
  }
}
