import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('TerminalApp', () => {
  let dom;
  let window;
  let document;
  let TerminalApp;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="terminal-window">
            <input id="terminal-input-main" />
          </div>
          <div id="terminal-dock-item"></div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Clear WindowManager and bringToFront before each test
    delete window.WindowManager;
    delete window.bringToFront;

    // Load TerminalApp
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/terminal/terminal-app.js'), 'utf8');
    eval(code);
    TerminalApp = window.TerminalAppClass;
  });

  describe('initialization', () => {
    it('should initialize terminal app', () => {
      const app = new TerminalApp();
      expect(app).toBeDefined();
      expect(app.windowId).toBe('terminal-window');
      expect(app.dockItemId).toBe('terminal-dock-item');
      expect(app.inputId).toBe('terminal-input-main');
      expect(app.focusDelay).toBe(300);
      expect(app.transitionDuration).toBe('0.3s');
    });

    it('should initialize window and dockItem references', () => {
      const app = new TerminalApp();
      expect(app.window).toBe(document.getElementById('terminal-window'));
      expect(app.dockItem).toBe(document.getElementById('terminal-dock-item'));
    });

    it('should handle missing window gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      document.getElementById('terminal-window').remove();

      const app = new TerminalApp();
      expect(app.window).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Terminal window not found');

      consoleSpy.mockRestore();
    });
  });

  describe('isWindowVisible', () => {
    it('should return true when window is visible', () => {
      const app = new TerminalApp();
      app.window.style.display = 'block';
      expect(app.isWindowVisible()).toBe(true);
    });

    it('should return false when window display is none', () => {
      const app = new TerminalApp();
      app.window.style.display = 'none';
      expect(app.isWindowVisible()).toBe(false);
    });

    it('should check computed style when inline style is not set', () => {
      const app = new TerminalApp();
      app.window.style.display = '';
      // In JSDOM, computed style defaults to block for divs
      expect(app.isWindowVisible()).toBe(true);
    });
  });

  describe('openWithWindowManager', () => {
    it('should return true and call WindowManager.open when WindowManager exists', () => {
      const app = new TerminalApp();
      const mockOpen = vi.fn();
      window.WindowManager = { open: mockOpen };

      const result = app.openWithWindowManager();

      expect(result).toBe(true);
      expect(mockOpen).toHaveBeenCalledWith(app.window, app.dockItem);
    });

    it('should return false when WindowManager does not exist', () => {
      const app = new TerminalApp();
      const result = app.openWithWindowManager();
      expect(result).toBe(false);
    });
  });

  describe('openWithFallback', () => {
    it('should update dock item active state', () => {
      const app = new TerminalApp();
      const dockItem1 = document.createElement('div');
      dockItem1.className = 'dock-item';
      dockItem1.classList.add('active');
      document.body.appendChild(dockItem1);

      app.openWithFallback();

      expect(dockItem1.classList.contains('active')).toBe(false);
      expect(app.dockItem.classList.contains('active')).toBe(true);
    });

    it('should set window position and styles for animation', () => {
      const app = new TerminalApp();
      app.openWithFallback();

      expect(app.window.style.top).toBe('50%');
      expect(app.window.style.left).toBe('50%');
      expect(app.window.style.display).toBe('block');
      expect(app.window.style.opacity).toBe('0');
      expect(app.window.style.transform).toBe('translate(-50%, -50%) scale(0.9)');
    });

    it('should reset window offsets if present', () => {
      const app = new TerminalApp();
      app.window._xOffset = 10;
      app.window._yOffset = 20;

      app.openWithFallback();

      expect(app.window._xOffset).toBe(0);
      expect(app.window._yOffset).toBe(0);
    });

    it('should call bringToFront if available', () => {
      const app = new TerminalApp();
      const mockBringToFront = vi.fn();
      window.bringToFront = mockBringToFront;

      app.openWithFallback();

      expect(mockBringToFront).toHaveBeenCalledWith(app.window);
    });

    it('should not call bringToFront if not available', () => {
      const app = new TerminalApp();
      delete window.bringToFront;

      expect(() => app.openWithFallback()).not.toThrow();
    });
  });

  describe('focusInput', () => {
    it('should focus input after delay', (done) => {
      const app = new TerminalApp();
      const input = document.getElementById('terminal-input-main');

      app.focusInput();

      setTimeout(() => {
        expect(document.activeElement).toBe(input);
        done();
      }, 350);
    });

    it('should handle missing input gracefully', () => {
      const app = new TerminalApp();
      document.getElementById('terminal-input-main').remove();

      expect(() => app.focusInput()).not.toThrow();
    });
  });

  describe('open', () => {
    it('should return early if window is null', () => {
      const app = new TerminalApp();
      app.window = null;

      expect(() => app.open()).not.toThrow();
    });

    it('should use WindowManager when available and window is hidden', () => {
      const app = new TerminalApp();
      const mockOpen = vi.fn();
      window.WindowManager = { open: mockOpen };
      app.window.style.display = 'none';

      app.open();

      expect(mockOpen).toHaveBeenCalledWith(app.window, app.dockItem);
    });

    it('should use fallback when WindowManager is not available', () => {
      const app = new TerminalApp();
      app.window.style.display = 'none';

      app.open();

      expect(app.window.style.display).toBe('block');
      expect(app.dockItem.classList.contains('active')).toBe(true);
    });

    it('should bring to front when window is already visible', () => {
      const app = new TerminalApp();
      const mockBringToFront = vi.fn();
      window.bringToFront = mockBringToFront;
      app.window.style.display = 'block';

      app.open();

      expect(mockBringToFront).toHaveBeenCalledWith(app.window);
    });

    it('should focus input after opening', (done) => {
      const app = new TerminalApp();
      const input = document.getElementById('terminal-input-main');
      app.window.style.display = 'none';

      app.open();

      setTimeout(() => {
        expect(document.activeElement).toBe(input);
        done();
      }, 350);
    });
  });

  describe('close', () => {
    it('should remove active class from dock item', () => {
      const app = new TerminalApp();
      app.dockItem.classList.add('active');

      app.close();

      expect(app.dockItem.classList.contains('active')).toBe(false);
    });

    it('should handle missing dock item gracefully', () => {
      const app = new TerminalApp();
      app.dockItem = null;

      expect(() => app.close()).not.toThrow();
    });
  });

  describe('setupEventListeners', () => {
    it('should set up click handler on dock item', () => {
      // Create app first
      const app = new TerminalApp();

      // Remove existing event listeners by cloning the element
      const newDockItem = app.dockItem.cloneNode(true);
      app.dockItem.parentNode.replaceChild(newDockItem, app.dockItem);
      app.dockItem = newDockItem;

      // Spy on open before setting up event listeners
      const openSpy = vi.spyOn(app, 'open');

      // Manually set up event listeners so it captures the spied method
      app.setupEventListeners();

      // Create and dispatch click event
      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      app.dockItem.dispatchEvent(clickEvent);

      expect(openSpy).toHaveBeenCalled();
      openSpy.mockRestore();
    });

    it('should prevent default and stop propagation on dock item click', () => {
      const app = new TerminalApp();
      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });

      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');
      const stopImmediatePropagationSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');

      app.dockItem.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(stopImmediatePropagationSpy).toHaveBeenCalled();
    });

    it('should handle missing dock item gracefully', () => {
      const app = new TerminalApp();
      app.dockItem = null;

      expect(() => app.setupEventListeners()).not.toThrow();
    });
  });

  describe('global functions', () => {
    it('should expose TerminalAppClass for testing', () => {
      expect(window.TerminalAppClass).toBeDefined();
      expect(window.TerminalAppClass).toBe(TerminalApp);
    });

    it('should expose openTerminalWindow function', () => {
      expect(window.openTerminalWindow).toBeDefined();
      expect(typeof window.openTerminalWindow).toBe('function');
    });

    it('should call open on TerminalApp instance when openTerminalWindow is called', () => {
      const openSpy = vi.spyOn(window.TerminalApp, 'open');

      window.openTerminalWindow();

      expect(openSpy).toHaveBeenCalled();
      openSpy.mockRestore();
    });

    it('should handle openTerminalWindow when TerminalApp is not initialized', () => {
      const originalApp = window.TerminalApp;
      window.TerminalApp = null;

      expect(() => window.openTerminalWindow()).not.toThrow();

      window.TerminalApp = originalApp;
    });
  });
});
