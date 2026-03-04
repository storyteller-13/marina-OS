/**
 * WindowManager tests – load script in jsdom and assert behavior
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, '../scripts/core/window-manager.js');
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
});
