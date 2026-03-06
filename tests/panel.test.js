/**
 * Panel tests – PanelClass clock and menu helpers (no full DOM menu tree)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, '../core/panel.js');
const script = readFileSync(scriptPath, 'utf8');

describe('Panel', () => {
    beforeAll(() => {
        document.body.innerHTML = '<div class="clock"></div>';
        eval(script);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('exposes PanelClass on window for testing', () => {
        expect(window.PanelClass).toBeDefined();
        expect(typeof window.PanelClass).toBe('function');
    });

    it('PanelClass has expected static constants', () => {
        expect(window.PanelClass.CLOCK_UPDATE_INTERVAL).toBe(1000);
        expect(window.PanelClass.MENU_CLOSE_DELAY).toBe(100);
        expect(window.PanelClass.SUBMENU_HIDE_DELAY).toBe(150);
    });

    describe('Panel instance (clock only)', () => {
        it('updateClock sets clock element to HH:MM:SS format', () => {
            const clock = document.querySelector('.clock');
            const panel = new window.PanelClass();
            panel.updateClock();
            const text = clock.textContent;
            expect(/^\d{2}:\d{2}:\d{2}$/.test(text)).toBe(true);
        });

        it('startClock sets an interval and clears previous one', () => {
            vi.useFakeTimers();
            const panel = new window.PanelClass();
            panel.clockIntervalId = 999;
            const clearSpy = vi.spyOn(global, 'clearInterval');
            panel.startClock();
            expect(clearSpy).toHaveBeenCalledWith(999);
            expect(panel.clockIntervalId).toBeTruthy();
            vi.advanceTimersByTime(2000);
            vi.useRealTimers();
        });
    });

    describe('closeAllSubmenus / closeAllDropdowns', () => {
        it('closeAllSubmenus clears submenu hide timeout and removes .show from submenus', () => {
            const panel = new window.PanelClass();
            panel.submenuHideTimeoutId = 123;
            const clearSpy = vi.spyOn(global, 'clearTimeout');
            const sub = document.createElement('div');
            sub.className = 'menu-submenu show';
            document.body.appendChild(sub);
            panel.closeAllSubmenus();
            expect(clearSpy).toHaveBeenCalledWith(123);
            expect(panel.submenuHideTimeoutId).toBeNull();
            expect(sub.classList.contains('show')).toBe(false);
            document.body.removeChild(sub);
        });

        it('closeAllDropdowns removes .show from elements with .menu-dropdown', () => {
            const panel = new window.PanelClass();
            const dropdown = document.createElement('div');
            dropdown.className = 'menu-dropdown show';
            document.body.appendChild(dropdown);
            panel.closeAllDropdowns();
            expect(dropdown.classList.contains('show')).toBe(false);
            document.body.removeChild(dropdown);
        });
    });
});
