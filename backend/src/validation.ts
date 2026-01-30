import { isIP } from 'node:net';

export interface ValidationResult {
  ok: boolean;
  normalizedUrl?: string;
  message?: string;
}

export function normalizeUrl(raw: string): string | null {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return url.toString();
  } catch {
    return null;
  }
}

export function validateUrlInput(raw: string): ValidationResult {
  const normalized = normalizeUrl(raw);
  if (!normalized) {
    return { ok: false, message: 'Invalid URL. Please use a public http(s) address.' };
  }
  const url = new URL(normalized);
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { ok: false, message: 'Only http and https URLs are allowed.' };
  }
  if (url.username || url.password) {
    return { ok: false, message: 'Credentials in the URL are not allowed.' };
  }
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.localhost')) {
    return { ok: false, message: 'Localhost and .local domains are blocked.' };
  }
  if (isPrivateIp(hostname)) {
    return { ok: false, message: 'Private network targets are blocked.' };
  }
  return { ok: true, normalizedUrl: url.toString() };
}

function isPrivateIp(hostname: string): boolean {
  const ipVersion = isIP(hostname);
  if (ipVersion === 4) {
    return isPrivateIpv4(hostname);
  }
  if (ipVersion === 6) {
    return isPrivateIpv6(hostname);
  }
  return false;
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') {
    return true;
  }
  return (
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80')
  );
}
