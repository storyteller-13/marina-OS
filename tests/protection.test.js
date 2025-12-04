import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Protection', () => {
  let dom;
  let window;
  let document;
  let intervalIds = [];

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <img src="test.jpg" alt="Test image" />
          <div>Some content</div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock console.clear
    console.clear = vi.fn();

    // Track intervals for cleanup - must be set up before loading script
    intervalIds = [];
    const originalSetInterval = window.setInterval;
    const trackingSetInterval = function(...args) {
      const id = originalSetInterval.apply(this, args);
      intervalIds.push(id);
      return id;
    };

    // Override both window.setInterval and global setInterval
    window.setInterval = trackingSetInterval;
    global.setInterval = trackingSetInterval;

    // Load protection script
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(path.join(__dirname, '../scripts/core/protection.js'), 'utf8');
    eval(code);
  });

  afterEach(() => {
    // Clean up intervals
    intervalIds.forEach(id => clearInterval(id));
    intervalIds = [];
  });

  describe('Context Menu Protection', () => {
    it('should prevent right-click context menu', () => {
      const event = new window.Event('contextmenu', {
        bubbles: true,
        cancelable: true
      });

      const prevented = !document.dispatchEvent(event);
      expect(prevented).toBe(true);
    });
  });

  describe('Keyboard Shortcut Protection', () => {
    it('should prevent F12 key', () => {
      const event = new window.KeyboardEvent('keydown', {
        key: 'F12',
        bubbles: true,
        cancelable: true
      });

      const prevented = !document.dispatchEvent(event);
      expect(prevented).toBe(true);
    });

    it('should prevent Ctrl+Shift+I (DevTools)', () => {
      const event = new window.KeyboardEvent('keydown', {
        key: 'I',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true
      });

      const prevented = !document.dispatchEvent(event);
      expect(prevented).toBe(true);
    });

    it('should prevent Ctrl+Shift+J (Console)', () => {
      const event = new window.KeyboardEvent('keydown', {
        key: 'J',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true
      });

      const prevented = !document.dispatchEvent(event);
      expect(prevented).toBe(true);
    });

    it('should prevent Ctrl+Shift+C (Element Inspector)', () => {
      const event = new window.KeyboardEvent('keydown', {
        key: 'C',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true
      });

      const prevented = !document.dispatchEvent(event);
      expect(prevented).toBe(true);
    });

    it('should prevent Ctrl+U (View Source)', () => {
      const event = new window.KeyboardEvent('keydown', {
        key: 'u',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });

      const prevented = !document.dispatchEvent(event);
      expect(prevented).toBe(true);
    });

    it('should prevent Ctrl+S (Save Page)', () => {
      const event = new window.KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });

      const prevented = !document.dispatchEvent(event);
      expect(prevented).toBe(true);
    });

    it('should allow normal keyboard input', () => {
      const event = new window.KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true,
        cancelable: true
      });

      const prevented = !document.dispatchEvent(event);
      expect(prevented).toBe(false);
    });

    it('should allow Ctrl+A (select all)', () => {
      const event = new window.KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });

      const prevented = !document.dispatchEvent(event);
      expect(prevented).toBe(false);
    });

    it('should not prevent Shift+I without Ctrl', () => {
      const event = new window.KeyboardEvent('keydown', {
        key: 'I',
        shiftKey: true,
        bubbles: true,
        cancelable: true
      });

      const prevented = !document.dispatchEvent(event);
      expect(prevented).toBe(false);
    });

    it('should not prevent Ctrl+I without Shift', () => {
      const event = new window.KeyboardEvent('keydown', {
        key: 'i',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });

      const prevented = !document.dispatchEvent(event);
      expect(prevented).toBe(false);
    });
  });

  describe('Image Dragging Protection', () => {
    it('should prevent image dragging', () => {
      const img = document.querySelector('img');
      const event = document.createEvent('Event');
      event.initEvent('dragstart', true, true);
      Object.defineProperty(event, 'target', {
        value: img,
        enumerable: true
      });
      Object.defineProperty(event, 'dataTransfer', {
        value: {
          effectAllowed: 'none',
          dropEffect: 'none'
        },
        enumerable: true
      });

      const prevented = !document.dispatchEvent(event);
      expect(prevented).toBe(true);
    });

    it('should allow dragging of non-image elements', () => {
      const div = document.querySelector('div');
      const event = document.createEvent('Event');
      event.initEvent('dragstart', true, true);
      Object.defineProperty(event, 'target', {
        value: div,
        enumerable: true
      });

      const prevented = !document.dispatchEvent(event);
      expect(prevented).toBe(false);
    });
  });

  describe('DevTools Detection', () => {
    it('should set up DevTools monitoring interval', () => {
      // Verify that setInterval was called (intervalIds should have at least one entry)
      expect(intervalIds.length).toBeGreaterThan(0);
    });

    it('should monitor window dimensions for DevTools detection', () => {
      // Verify interval is set up
      expect(intervalIds.length).toBeGreaterThan(0);

      // Simulate DevTools opening by changing window dimensions
      // Note: We can't easily test the internal state, but we verify the interval exists
      Object.defineProperty(window, 'outerHeight', {
        value: 1000,
        writable: true,
        configurable: true
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 500,
        writable: true,
        configurable: true
      });
      Object.defineProperty(window, 'outerWidth', {
        value: 1000,
        writable: true,
        configurable: true
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 800,
        writable: true,
        configurable: true
      });

      // The monitoring function runs in an interval - we verify the interval exists
      expect(intervalIds.length).toBeGreaterThan(0);
    });
  });

  describe('Console Clearing', () => {
    it('should clear console on load', () => {
      expect(console.clear).toHaveBeenCalled();
    });
  });
});
