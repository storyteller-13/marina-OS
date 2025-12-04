import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('WikiApp', () => {
  let dom;
  let window;
  let document;
  let WikiApp;
  let mockFocus;
  let mockClose;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost' });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock screen dimensions (global screen object)
    global.screen = { width: 1920, height: 1080 };

    mockFocus = vi.fn();
    mockClose = vi.fn();

    // Mock window.open
    window.open = vi.fn(() => ({
      closed: false,
      focus: mockFocus,
      close: mockClose
    }));

    // Load WikiApp
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/wiki/wiki.js'), 'utf8');
    eval(code);
    WikiApp = window.WikiAppClass;
  });

  describe('initialization', () => {
    it('should initialize wiki app', () => {
      const app = new WikiApp();
      expect(app).toBeDefined();
      expect(app.url).toBe('https://choices.vonsteinkirch.com/');
      expect(app.popupWindow).toBeNull();
    });
  });

  describe('open', () => {
    it('should open wiki in popup window with correct parameters', () => {
      const app = new WikiApp();
      app.open();

      expect(window.open).toHaveBeenCalledTimes(1);
      const callArgs = window.open.mock.calls[0];
      expect(callArgs[0]).toBe('https://choices.vonsteinkirch.com/');
      expect(callArgs[1]).toBe('wiki');
      expect(callArgs[2]).toContain('width=1200');
      expect(callArgs[2]).toContain('height=800');
      expect(callArgs[2]).toContain('resizable=yes');
      expect(callArgs[2]).toContain('scrollbars=yes');
      expect(callArgs[2]).toContain('noopener=yes');
    });

    it('should calculate centered window position', () => {
      const app = new WikiApp();
      app.open();

      const callArgs = window.open.mock.calls[0];
      const features = callArgs[2];
      // Screen is 1920x1080, window is 1200x800
      // Expected: left=360, top=140
      expect(features).toContain('left=360');
      expect(features).toContain('top=140');
    });

    it('should focus popup window when opened successfully', () => {
      const app = new WikiApp();
      app.open();

      expect(mockFocus).toHaveBeenCalledTimes(1);
    });

    it('should fallback to new tab when popup is blocked (null)', () => {
      window.open = vi.fn(() => null);
      const app = new WikiApp();
      app.open();

      expect(window.open).toHaveBeenCalledTimes(2);
      expect(window.open.mock.calls[0][1]).toBe('wiki');
      expect(window.open.mock.calls[1][1]).toBe('_blank');
      expect(window.open.mock.calls[1][2]).toBe('noopener=yes');
    });

    it('should fallback to new tab when popup is closed immediately', () => {
      window.open = vi.fn(() => ({ closed: true }));
      const app = new WikiApp();
      app.open();

      expect(window.open).toHaveBeenCalledTimes(2);
      expect(window.open.mock.calls[1][1]).toBe('_blank');
    });
  });

  describe('close', () => {
    it('should close popup window when open', () => {
      const app = new WikiApp();
      const mockWindow = { closed: false, close: mockClose };
      app.popupWindow = mockWindow;

      app.close();

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when popupWindow is null', () => {
      const app = new WikiApp();
      app.popupWindow = null;

      expect(() => app.close()).not.toThrow();
    });

    it('should not close already closed popup window', () => {
      const app = new WikiApp();
      const mockWindow = { closed: true, close: mockClose };
      app.popupWindow = mockWindow;

      app.close();

      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  describe('global functions', () => {
    it('should expose openWikiWindow function', () => {
      expect(typeof window.openWikiWindow).toBe('function');
    });

    it('should open wiki when openWikiWindow is called', () => {
      window.open = vi.fn(() => ({
        closed: false,
        focus: mockFocus,
        close: mockClose
      }));

      window.openWikiWindow();

      expect(window.open).toHaveBeenCalled();
      expect(window.open.mock.calls[0][0]).toBe('https://choices.vonsteinkirch.com/');
    });
  });
});
