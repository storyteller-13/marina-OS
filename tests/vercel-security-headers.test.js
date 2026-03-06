import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Vercel security headers', () => {
  it('configures standard security headers for all routes', () => {
    const vercelConfigPath = resolve(process.cwd(), 'vercel.json');
    const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, 'utf-8'));

    const globalHeaders = vercelConfig.headers?.find((entry) => entry.source === '/(.*)');
    expect(globalHeaders).toBeDefined();

    const headerMap = new Map(globalHeaders.headers.map((header) => [header.key, header.value]));

    expect(headerMap.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headerMap.get('X-Frame-Options')).toBe('DENY');
    expect(headerMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headerMap.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
    expect(headerMap.get('Strict-Transport-Security')).toContain('max-age=63072000');
  });
});
