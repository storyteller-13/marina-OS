/**
 * BaseApp tests – load script in jsdom and assert init/open/close behavior
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, '../core/base-app.js');
const script = readFileSync(scriptPath, 'utf8');

describe('BaseApp', () => {
    let BaseApp;
    let app;
    let windowEl;
    let dockItem;

    beforeAll(() => {
        eval(script);
        BaseApp = window.BaseApp;
    });

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="notes-window" class="window" style="display: none;">
                <div class="window-header"></div>
            </div>
            <div id="notes-dock-item" class="dock-item"></div>
        `;
        windowEl = document.getElementById('notes-window');
        dockItem = document.getElementById('notes-dock-item');
        app = new BaseApp({ windowId: 'notes-window', dockItemId: 'notes-dock-item' });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('exposes BaseApp on window after load', () => {
        expect(window.BaseApp).toBeDefined();
        expect(typeof window.BaseApp).toBe('function');
    });

    it('constructor sets windowId and dockItemId from options', () => {
        expect(app.windowId).toBe('notes-window');
        expect(app.dockItemId).toBe('notes-dock-item');
    });

    it('init() finds window and dock item and does not throw', () => {
        expect(() => app.init()).not.toThrow();
        expect(app.window).toBe(windowEl);
        expect(app.dockItem).toBe(dockItem);
    });

    it('init() returns early when window element is missing', () => {
        const noWindow = new BaseApp({ windowId: 'missing-window', dockItemId: 'notes-dock-item' });
        noWindow.init();
        expect(noWindow.window).toBeNull();
    });

    it('dock item click calls open()', () => {
        app.init();
        const openSpy = vi.spyOn(app, 'open').mockImplementation(() => {});
        dockItem.click();
        expect(openSpy).toHaveBeenCalled();
    });

    it('open() uses openFallback when WindowManager is absent', () => {
        app.init();
        const fallbackSpy = vi.spyOn(app, 'openFallback').mockImplementation(() => {});
        delete window.WindowManager;
        app.open();
        expect(fallbackSpy).toHaveBeenCalled();
    });

    it('open() uses WindowManager.open when present', () => {
        app.init();
        window.WindowManager = { open: vi.fn() };
        app.open();
        expect(window.WindowManager.open).toHaveBeenCalledWith(windowEl, dockItem);
    });

    it('openFallback() shows window and adds active to dock item', () => {
        app.init();
        const otherDock = document.createElement('div');
        otherDock.className = 'dock-item active';
        document.body.appendChild(otherDock);
        app.openFallback();
        expect(windowEl.style.display).toBe('block');
        expect(dockItem.classList.contains('active')).toBe(true);
        expect(otherDock.classList.contains('active')).toBe(false);
    });

    it('close() uses WindowManager.close when present', () => {
        app.init();
        window.WindowManager = { close: vi.fn() };
        app.close();
        expect(window.WindowManager.close).toHaveBeenCalledWith(windowEl, dockItem);
    });

    it('close() removes active from dock item when WindowManager absent', () => {
        app.init();
        dockItem.classList.add('active');
        delete window.WindowManager;
        app.close();
        expect(dockItem.classList.contains('active')).toBe(false);
    });
});
