export interface UrlValidationResult {
  valid: boolean;
  normalized?: string;
  message?: string;
}

const PRIVATE_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

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

export function validateUrl(raw: string): UrlValidationResult {
  const normalized = normalizeUrl(raw);
  if (!normalized) {
    return { valid: false, message: 'Enter a valid URL like example.com' };
  }
  const url = new URL(normalized);
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { valid: false, message: 'Only http and https URLs are allowed.' };
  }
  if (url.username || url.password) {
    return { valid: false, message: 'Credentials in the URL are not allowed.' };
  }
  const hostname = url.hostname.toLowerCase();
  if (PRIVATE_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.localhost')) {
    return { valid: false, message: 'Localhost and .local domains are blocked.' };
  }
  if (isPrivateIp(hostname)) {
    return { valid: false, message: 'Private IP ranges are blocked.' };
  }
  return { valid: true, normalized };
}

function isPrivateIp(hostname: string): boolean {
  if (hostname.includes(':')) {
    return isPrivateIpv6(hostname);
  }
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return false;
  }
  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
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

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (normalized === '::1' || normalized === '::') {
    return true;
  }
  return (
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80')
  );
}
