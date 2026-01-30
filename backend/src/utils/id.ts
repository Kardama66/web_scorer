import { randomBytes } from 'node:crypto';

export function generateId(length = 10): string {
  let id = '';
  while (id.length < length) {
    id += randomBytes(length)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '');
  }
  return id.slice(0, length).toLowerCase();
}
