/**
 * Protection tests – context menu, keyboard shortcuts, and image drag are prevented
 */
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, '../core/protection.js');
const script = readFileSync(scriptPath, 'utf8');

describe('Protection', () => {
    beforeAll(() => {
        document.body.innerHTML = '<div id="root"><img id="test-img" alt="test" /></div>';
        eval(script);
    });

    beforeEach(() => {
        document.body.innerHTML = '<div id="root"><img id="test-img" alt="test" /></div>';
    });

    it('contextmenu is prevented on document', () => {
        const e = new MouseEvent('contextmenu', { bubbles: true });
        const preventSpy = vi.spyOn(e, 'preventDefault');
        document.dispatchEvent(e);
        expect(preventSpy).toHaveBeenCalled();
    });

    it('F12 keydown is prevented', () => {
        const e = new KeyboardEvent('keydown', { key: 'F12', bubbles: true });
        const preventSpy = vi.spyOn(e, 'preventDefault');
        document.dispatchEvent(e);
        expect(preventSpy).toHaveBeenCalled();
    });

    it('Ctrl+Shift+I (DevTools) keydown is prevented', () => {
        const e = new KeyboardEvent('keydown', {
            key: 'I',
            ctrlKey: true,
            shiftKey: true,
            bubbles: true
        });
        const preventSpy = vi.spyOn(e, 'preventDefault');
        document.dispatchEvent(e);
        expect(preventSpy).toHaveBeenCalled();
    });

    it('Ctrl+U (View Source) keydown is prevented', () => {
        const e = new KeyboardEvent('keydown', {
            key: 'u',
            ctrlKey: true,
            bubbles: true
        });
        const preventSpy = vi.spyOn(e, 'preventDefault');
        document.dispatchEvent(e);
        expect(preventSpy).toHaveBeenCalled();
    });

    it('dragstart on IMG is prevented', () => {
        const img = document.getElementById('test-img');
        // jsdom has no DragEvent; use Event and set target so handler sees e.target.tagName === 'IMG'
        const e = new Event('dragstart', { bubbles: true });
        Object.defineProperty(e, 'target', { value: img, configurable: true });
        const preventSpy = vi.spyOn(e, 'preventDefault');
        document.dispatchEvent(e);
        expect(preventSpy).toHaveBeenCalled();
    });
});
