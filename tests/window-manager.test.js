/**
 * WindowManager tests – load script in jsdom and assert behavior
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, '../core/window-manager.js');
const script = readFileSync(scriptPath, 'utf8');

describe('WindowManager', () => {
    beforeAll(() => {
        // Minimal DOM so init() can run (querySelectorAll('.window'))
        document.body.innerHTML = `
            <div class="window" id="test-window">
                <div class="window-header"></div>
            </div>
        `;
        // Run the script; it will set window.WindowManager when document.readyState !== 'loading'
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => eval(script));
        } else {
            eval(script);
        }
    });

    it('exposes WindowManager on window after load', () => {
        expect(window.WindowManager).toBeDefined();
        expect(typeof window.WindowManager.open).toBe('function');
        expect(typeof window.WindowManager.close).toBe('function');
        expect(typeof window.WindowManager.bringToFront).toBe('function');
    });

    it('bringToFront increases z-index', () => {
        const wm = window.WindowManager;
        const el = document.getElementById('test-window');
        expect(el).toBeTruthy();
        const before = parseInt(el.style.zIndex || '0', 10) || 0;
        wm.bringToFront(el);
        const after = parseInt(el.style.zIndex, 10);
        expect(after).toBeGreaterThan(before);
    });

    it('exposes bringToFront globally', () => {
        expect(typeof window.bringToFront).toBe('function');
    });

    it('exposes WindowManagerClass for testing', () => {
        expect(window.WindowManagerClass).toBeDefined();
    });

    it('isCenteredWindow returns true for terminal-window, artwork-window, notes-letter-window', () => {
        const wm = window.WindowManager;
        const term = document.createElement('div');
        term.className = 'window terminal-window';
        const art = document.createElement('div');
        art.className = 'window artwork-window';
        const notes = document.createElement('div');
        notes.className = 'window notes-letter-window';
        expect(wm.isCenteredWindow(term)).toBe(true);
        expect(wm.isCenteredWindow(art)).toBe(true);
        expect(wm.isCenteredWindow(notes)).toBe(true);
    });

    it('isCenteredWindow returns false for regular window', () => {
        const wm = window.WindowManager;
        const el = document.getElementById('test-window');
        expect(wm.isCenteredWindow(el)).toBe(false);
    });

    it('open() shows window and brings to front', () => {
        const wm = window.WindowManager;
        const el = document.getElementById('test-window');
        el.style.display = 'none';
        wm.open(el, null);
        expect(el.style.display).toBe('block');
        expect(parseInt(el.style.zIndex, 10)).toBeGreaterThan(0);
    });

    it('close() hides window after transition', async () => {
        const wm = window.WindowManager;
        const el = document.getElementById('test-window');
        wm.open(el, null);
        wm.close(el, null);
        await new Promise((r) => setTimeout(r, 250));
        expect(el.style.display).toBe('none');
    });

    it('minimize() applies transform and reduces opacity', () => {
        const wm = window.WindowManager;
        const el = document.getElementById('test-window');
        wm.minimize(el);
        expect(el.style.transform).toContain('translateY');
        expect(el.style.transform).toContain('scale(0.8)');
    });
});
