import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('DetectiveApp', () => {
  let dom;
  let window;
  let document;
  let DetectiveApp;
  let mockWindowManager;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="detective-window">
            <div id="detective-panel"></div>
          </div>
          <div id="detective-dock-item" class="dock-item"></div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Reset WindowManager mock
    mockWindowManager = {
      open: vi.fn(),
      close: vi.fn()
    };
    window.WindowManager = null;
    window.bringToFront = vi.fn();

    // Load DetectiveApp
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/detective/detective.js'), 'utf8');
    eval(code);
    DetectiveApp = window.DetectiveAppClass;
  });

  describe('initialization', () => {
    it('should initialize detective app', () => {
      const app = new DetectiveApp();
      expect(app).toBeDefined();
      expect(app.windowId).toBe('detective-window');
      expect(app.dockItemId).toBe('detective-dock-item');
      expect(app.window).toBeDefined();
      expect(app.dockItem).toBeDefined();
    });

    it('should handle missing window element gracefully', () => {
      const windowElement = document.getElementById('detective-window');
      windowElement.remove();

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const app = new DetectiveApp();

      expect(consoleSpy).toHaveBeenCalledWith('Detective window not found');
      expect(app.window).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should render content on initialization', () => {
      const app = new DetectiveApp();
      const panel = document.getElementById('detective-panel');

      expect(panel.innerHTML).toContain('detective-board');
      expect(panel.innerHTML).toContain('detective-criminals');
      expect(panel.innerHTML).toContain('mr. krut');
      expect(panel.innerHTML).toContain('mr. eggy');
      expect(panel.innerHTML).toContain('weirdo-demons');
    });
  });

  describe('open', () => {
    it('should open window using fallback when WindowManager is not available', () => {
      const app = new DetectiveApp();
      const windowElement = document.getElementById('detective-window');
      const dockItem = document.getElementById('detective-dock-item');
      windowElement.style.display = 'none';

      app.open();

      expect(windowElement.style.display).toBe('block');
      expect(dockItem.classList.contains('active')).toBe(true);
    });

    it('should use WindowManager when available', () => {
      window.WindowManager = mockWindowManager;
      const app = new DetectiveApp();
      const windowElement = document.getElementById('detective-window');
      const dockItem = document.getElementById('detective-dock-item');

      app.open();

      expect(mockWindowManager.open).toHaveBeenCalledTimes(1);
      expect(mockWindowManager.open).toHaveBeenCalledWith(windowElement, dockItem);
    });

    it('should handle missing window element', () => {
      const app = new DetectiveApp();
      app.window = null;

      expect(() => app.open()).not.toThrow();
    });

    it('should remove active class from other dock items', () => {
      // Add another dock item
      const otherDockItem = document.createElement('div');
      otherDockItem.className = 'dock-item';
      otherDockItem.classList.add('active');
      document.body.appendChild(otherDockItem);

      const app = new DetectiveApp();
      app.open();

      expect(otherDockItem.classList.contains('active')).toBe(false);
    });

    it('should reset window offsets and position on open', () => {
      const app = new DetectiveApp();
      const windowElement = document.getElementById('detective-window');
      windowElement._xOffset = 100;
      windowElement._yOffset = 200;

      app.open();

      expect(windowElement._xOffset).toBe(0);
      expect(windowElement._yOffset).toBe(0);
    });

    it('should render content when opening', () => {
      const app = new DetectiveApp();
      const panel = document.getElementById('detective-panel');
      panel.innerHTML = '';

      app.open();

      expect(panel.innerHTML).toContain('detective-board');
    });
  });

  describe('openFallback', () => {
    it('should set window styles correctly', () => {
      const app = new DetectiveApp();
      const windowElement = document.getElementById('detective-window');

      app.openFallback();

      expect(windowElement.style.top).toBe('50%');
      expect(windowElement.style.left).toBe('50%');
      expect(windowElement.style.display).toBe('block');
    });

    it('should call bringToFront if available', () => {
      window.bringToFront = vi.fn();
      const app = new DetectiveApp();
      const windowElement = document.getElementById('detective-window');

      app.openFallback();

      // Wait for requestAnimationFrame
      return new Promise(resolve => {
        setTimeout(() => {
          expect(window.bringToFront).toHaveBeenCalledWith(windowElement);
          resolve();
        }, 100);
      });
    });

    it('should handle missing dock item gracefully', () => {
      const app = new DetectiveApp();
      app.dockItem = null;

      expect(() => app.openFallback()).not.toThrow();
    });
  });

  describe('close', () => {
    it('should remove active class from dock item', () => {
      const app = new DetectiveApp();
      const dockItem = document.getElementById('detective-dock-item');
      dockItem.classList.add('active');

      app.close();

      expect(dockItem.classList.contains('active')).toBe(false);
    });

    it('should handle missing dock item gracefully', () => {
      const app = new DetectiveApp();
      app.dockItem = null;

      expect(() => app.close()).not.toThrow();
    });
  });

  describe('render', () => {
    it('should render detective board with criminals', () => {
      const app = new DetectiveApp();
      const panel = document.getElementById('detective-panel');
      panel.innerHTML = '';

      app.render();

      expect(panel.innerHTML).toContain('detective-board');
      expect(panel.innerHTML).toContain('detective-criminals');
      expect(panel.innerHTML).toContain('detective-row');
      expect(panel.innerHTML).toContain('detective-criminal');
    });

    it('should render main criminal mr. krut', () => {
      const app = new DetectiveApp();
      const panel = document.getElementById('detective-panel');

      app.render();

      expect(panel.innerHTML).toContain('mr. krut');
      expect(panel.innerHTML).toContain('main');
    });

    it('should render secondary criminals', () => {
      const app = new DetectiveApp();
      const panel = document.getElementById('detective-panel');

      app.render();

      expect(panel.innerHTML).toContain('mr. eggy');
      expect(panel.innerHTML).toContain('weirdo-demons');
    });

    it('should handle missing panel element gracefully', () => {
      const app = new DetectiveApp();
      const panel = document.getElementById('detective-panel');
      panel.remove();

      expect(() => app.render()).not.toThrow();
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const app = new DetectiveApp();

      // textContent escapes <, >, and & but not quotes
      expect(app.escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
      expect(app.escapeHtml('&')).toBe('&amp;');
      expect(app.escapeHtml('<div>')).toBe('&lt;div&gt;');
      expect(app.escapeHtml('>')).toBe('&gt;');
    });

    it('should handle empty string', () => {
      const app = new DetectiveApp();

      expect(app.escapeHtml('')).toBe('');
    });

    it('should handle plain text without special characters', () => {
      const app = new DetectiveApp();

      expect(app.escapeHtml('plain text')).toBe('plain text');
    });
  });

  describe('event listeners', () => {
    it('should open window when dock item is clicked', () => {
      const app = new DetectiveApp();
      const dockItem = document.getElementById('detective-dock-item');
      const openSpy = vi.spyOn(app, 'open');

      const clickEvent = new window.MouseEvent('click', { bubbles: true });
      dockItem.dispatchEvent(clickEvent);

      expect(openSpy).toHaveBeenCalledTimes(1);
    });

    it('should prevent default and stop propagation on click', () => {
      const app = new DetectiveApp();
      const dockItem = document.getElementById('detective-dock-item');
      const clickEvent = new window.MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

      dockItem.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should handle missing dock item gracefully', () => {
      const dockItem = document.getElementById('detective-dock-item');
      dockItem.remove();

      const app = new DetectiveApp();
      expect(app.dockItem).toBeNull();
      expect(() => app.open()).not.toThrow();
    });
  });

  describe('global functions', () => {
    it('should expose openDetectiveWindow function', () => {
      expect(typeof window.openDetectiveWindow).toBe('function');
    });

    it('should open window when openDetectiveWindow is called', () => {
      const app = new DetectiveApp();
      const openSpy = vi.spyOn(app, 'open');
      window.DetectiveApp = app;

      window.openDetectiveWindow();

      expect(openSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle missing DetectiveApp instance gracefully', () => {
      window.DetectiveApp = null;

      expect(() => window.openDetectiveWindow()).not.toThrow();
    });
  });
});
