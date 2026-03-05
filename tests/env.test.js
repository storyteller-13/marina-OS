/**
 * Env tests – isLocalhost() and getApiBase() behavior
 */
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, '../core/env.js');
const script = readFileSync(scriptPath, 'utf8');

describe('Env', () => {
    let realLocation;

    beforeAll(() => {
        realLocation = window.location;
        eval(script);
    });

    afterEach(() => {
        vi.stubGlobal('location', realLocation);
    });

    describe('isLocalhost', () => {
        it('returns true for hostname localhost', () => {
            vi.stubGlobal('location', { ...realLocation, hostname: 'localhost' });
            expect(window.Env.isLocalhost()).toBe(true);
        });

        it('returns true for hostname 127.0.0.1', () => {
            vi.stubGlobal('location', { ...realLocation, hostname: '127.0.0.1' });
            expect(window.Env.isLocalhost()).toBe(true);
        });

        it('returns false for production hostname', () => {
            vi.stubGlobal('location', { ...realLocation, hostname: 'example.com' });
            expect(window.Env.isLocalhost()).toBe(false);
        });
    });

    describe('getApiBase', () => {
        it('returns null on localhost', () => {
            vi.stubGlobal('location', { ...realLocation, hostname: 'localhost' });
            expect(window.Env.getApiBase('apod')).toBe(null);
        });

        it('returns /api/<path> in production', () => {
            vi.stubGlobal('location', { ...realLocation, hostname: 'example.com' });
            expect(window.Env.getApiBase('apod')).toBe('/api/apod');
        });

        it('strips leading slash from path', () => {
            vi.stubGlobal('location', { ...realLocation, hostname: 'example.com' });
            expect(window.Env.getApiBase('/apod')).toBe('/api/apod');
        });
    });
});
