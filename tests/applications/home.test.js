import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('HomeApp', () => {
  let dom;
  let window;
  let document;
  let HomeApp;
  let mockWindowManager;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="home-window"></div>
          <div id="home-dock-item" class="dock-item"></div>
          <div id="home-desktop-icon"></div>
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

    // Load HomeApp
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/home/home.js'), 'utf8');
    eval(code);
    HomeApp = window.HomeAppClass;
  });

  describe('initialization', () => {
    it('should initialize home app', () => {
      const app = new HomeApp();
      expect(app).toBeDefined();
      expect(app.windowId).toBe('home-window');
      expect(app.dockItemId).toBe('home-dock-item');
      expect(app.window).toBeDefined();
      expect(app.dockItem).toBeDefined();
      expect(app.desktopIcon).toBeDefined();
    });

    it('should handle missing window element gracefully', () => {
      const windowElement = document.getElementById('home-window');
      windowElement.remove();

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const app = new HomeApp();

      expect(consoleSpy).toHaveBeenCalledWith('Home window not found');
      expect(app.window).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('open', () => {
    it('should open window using fallback when WindowManager is not available', () => {
      const app = new HomeApp();
      const windowElement = document.getElementById('home-window');
      const dockItem = document.getElementById('home-dock-item');
      windowElement.style.display = 'none';

      app.open();

      expect(windowElement.style.display).toBe('block');
      expect(dockItem.classList.contains('active')).toBe(true);
    });

    it('should use WindowManager when available', () => {
      window.WindowManager = mockWindowManager;
      const app = new HomeApp();
      const windowElement = document.getElementById('home-window');
      const dockItem = document.getElementById('home-dock-item');

      app.open();

      expect(mockWindowManager.open).toHaveBeenCalledTimes(1);
      expect(mockWindowManager.open).toHaveBeenCalledWith(windowElement, dockItem);
    });

    it('should handle missing window element', () => {
      const app = new HomeApp();
      app.window = null;

      expect(() => app.open()).not.toThrow();
    });

    it('should remove active class from other dock items', () => {
      // Add another dock item
      const otherDockItem = document.createElement('div');
      otherDockItem.className = 'dock-item';
      otherDockItem.classList.add('active');
      document.body.appendChild(otherDockItem);

      const app = new HomeApp();
      app.open();

      expect(otherDockItem.classList.contains('active')).toBe(false);
    });
  });

  describe('close', () => {
    it('should use WindowManager when available', () => {
      window.WindowManager = mockWindowManager;
      const app = new HomeApp();
      const windowElement = document.getElementById('home-window');
      const dockItem = document.getElementById('home-dock-item');

      app.close();

      expect(mockWindowManager.close).toHaveBeenCalledTimes(1);
      expect(mockWindowManager.close).toHaveBeenCalledWith(windowElement, dockItem);
    });

    it('should remove active class from dock item when WindowManager is not available', () => {
      const app = new HomeApp();
      const dockItem = document.getElementById('home-dock-item');
      dockItem.classList.add('active');

      app.close();

      expect(dockItem.classList.contains('active')).toBe(false);
    });

    it('should handle missing dock item gracefully', () => {
      const app = new HomeApp();
      app.dockItem = null;

      expect(() => app.close()).not.toThrow();
    });

    it('should handle missing window when WindowManager is available', () => {
      window.WindowManager = mockWindowManager;
      const app = new HomeApp();
      app.window = null;

      app.close();

      expect(mockWindowManager.close).not.toHaveBeenCalled();
    });
  });

  describe('event listeners', () => {
    it('should open window when dock item is clicked', () => {
      const app = new HomeApp();
      const dockItem = document.getElementById('home-dock-item');
      const openSpy = vi.spyOn(app, 'open');

      const clickEvent = new window.MouseEvent('click', { bubbles: true });
      dockItem.dispatchEvent(clickEvent);

      expect(openSpy).toHaveBeenCalledTimes(1);
    });

    it('should open window when desktop icon is clicked', () => {
      const app = new HomeApp();
      const desktopIcon = document.getElementById('home-desktop-icon');
      const openSpy = vi.spyOn(app, 'open');

      const clickEvent = new window.MouseEvent('click', { bubbles: true });
      desktopIcon.dispatchEvent(clickEvent);

      expect(openSpy).toHaveBeenCalledTimes(1);
    });

    it('should prevent default and stop propagation on click', () => {
      const app = new HomeApp();
      const dockItem = document.getElementById('home-dock-item');
      const clickEvent = new window.MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

      dockItem.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should handle missing dock item gracefully', () => {
      const dockItem = document.getElementById('home-dock-item');
      dockItem.remove();

      const app = new HomeApp();
      expect(app.dockItem).toBeNull();
      expect(() => app.open()).not.toThrow();
    });

    it('should handle missing desktop icon gracefully', () => {
      const desktopIcon = document.getElementById('home-desktop-icon');
      desktopIcon.remove();

      const app = new HomeApp();
      expect(app.desktopIcon).toBeNull();
      expect(() => app.open()).not.toThrow();
    });
  });

  describe('global functions', () => {
    it('should expose openHomeWindow function', () => {
      expect(typeof window.openHomeWindow).toBe('function');
    });

    it('should open window when openHomeWindow is called', () => {
      const app = new HomeApp();
      const openSpy = vi.spyOn(app, 'open');
      window.HomeApp = app;

      window.openHomeWindow();

      expect(openSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle missing HomeApp instance gracefully', () => {
      window.HomeApp = null;

      expect(() => window.openHomeWindow()).not.toThrow();
    });
  });
});
