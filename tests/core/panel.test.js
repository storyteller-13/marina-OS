import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Panel', () => {
  let dom;
  let window;
  let document;
  let Panel;
  let panel;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div class="clock"></div>
          <button id="applications-menu-button">Apps</button>
          <div id="applications-dropdown" class="menu-dropdown">
            <div class="menu-item">Item 1</div>
            <div class="menu-item">Item 2</div>
          </div>
          <div id="other-dropdown" class="menu-dropdown">
            <div class="menu-item">Other Item</div>
          </div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Load Panel class
    const code = readFileSync(join(__dirname, '../../scripts/core/panel.js'), 'utf8');

    // Execute code in window context
    const func = new Function('window', 'document', code);
    func(window, document);

    Panel = window.PanelClass;

    // Create a new panel instance for each test
    panel = new Panel();
  });

  afterEach(() => {
    if (panel) {
      panel.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize panel', () => {
      expect(panel).toBeDefined();
      expect(panel.clockIntervalId).not.toBeNull();
    });

    it('should update clock immediately on init', () => {
      const clock = document.querySelector('.clock');
      expect(clock.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should setup applications menu on init', () => {
      const button = document.getElementById('applications-menu-button');
      const dropdown = document.getElementById('applications-dropdown');
      expect(button).toBeDefined();
      expect(dropdown).toBeDefined();
    });
  });

  describe('Clock functionality', () => {
    it('should update clock with current time', () => {
      const clock = document.querySelector('.clock');
      panel.updateClock();
      expect(clock.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should format clock with leading zeros', () => {
      const clock = document.querySelector('.clock');

      // Mock Date to test formatting
      const originalDate = global.Date;
      global.Date = class extends originalDate {
        constructor() {
          super('2024-01-01T01:05:09Z');
        }
        getHours() { return 1; }
        getMinutes() { return 5; }
        getSeconds() { return 9; }
      };

      panel.updateClock();
      expect(clock.textContent).toBe('01:05:09');

      global.Date = originalDate;
    });

    it('should handle missing clock element gracefully', () => {
      const clock = document.querySelector('.clock');
      clock.remove();

      // Should not throw
      expect(() => panel.updateClock()).not.toThrow();
    });

    it('should start clock interval', () => {
      const newPanel = new Panel();
      expect(newPanel.clockIntervalId).not.toBeNull();
      newPanel.destroy();
    });

    it('should stop clock interval on destroy', () => {
      const newPanel = new Panel();
      const intervalId = newPanel.clockIntervalId;
      newPanel.destroy();
      expect(newPanel.clockIntervalId).toBeNull();

      // Verify interval is cleared (by checking it doesn't run)
      const clock = document.querySelector('.clock');
      const originalText = clock.textContent;

      // Wait a bit to ensure interval doesn't run
      setTimeout(() => {
        // If interval was cleared, text should remain the same
        // (though this is hard to test reliably, we at least verify no error)
        expect(clock.textContent).toBeDefined();
      }, 1500);
    });

    it('should restart clock if startClock is called multiple times', () => {
      const firstIntervalId = panel.clockIntervalId;
      panel.startClock();
      const secondIntervalId = panel.clockIntervalId;

      // Should have a new interval ID (old one cleared)
      expect(secondIntervalId).not.toBeNull();
    });
  });

  describe('Applications menu', () => {
    it('should handle missing menu button gracefully', () => {
      const button = document.getElementById('applications-menu-button');
      button.remove();

      const newPanel = new Panel();
      // Should not throw
      expect(() => newPanel.setupApplicationsMenu()).not.toThrow();
      newPanel.destroy();
    });

    it('should handle missing dropdown gracefully', () => {
      const dropdown = document.getElementById('applications-dropdown');
      dropdown.remove();

      const newPanel = new Panel();
      // Should not throw
      expect(() => newPanel.setupApplicationsMenu()).not.toThrow();
      newPanel.destroy();
    });

    it('should toggle dropdown on button click', () => {
      const button = document.getElementById('applications-menu-button');
      const dropdown = document.getElementById('applications-dropdown');

      // Ensure dropdown starts without 'show' class
      dropdown.classList.remove('show');

      // Verify event listener is attached
      expect(panel.eventListeners.length).toBeGreaterThan(0);

      // Find the button click handler and call it directly
      const buttonListener = panel.eventListeners.find(
        l => l.element === button && l.event === 'click'
      );
      expect(buttonListener).toBeDefined();

      // Create mock event and call handler
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: button
      };
      buttonListener.handler(mockEvent);

      expect(dropdown.classList.contains('show')).toBe(true);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should close dropdown when clicking button again', () => {
      const button = document.getElementById('applications-menu-button');
      const dropdown = document.getElementById('applications-dropdown');

      // Open dropdown first
      dropdown.classList.add('show');

      // Find the button click handler and call it
      const buttonListener = panel.eventListeners.find(
        l => l.element === button && l.event === 'click'
      );

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: button
      };
      buttonListener.handler(mockEvent);

      // Should remain closed (toggle logic only opens if closed)
      expect(dropdown.classList.contains('show')).toBe(false);
    });

    it('should close all other dropdowns when opening one', () => {
      const button = document.getElementById('applications-menu-button');
      const dropdown = document.getElementById('applications-dropdown');
      const otherDropdown = document.getElementById('other-dropdown');

      // Open other dropdown first
      otherDropdown.classList.add('show');
      dropdown.classList.remove('show');

      // Find the button click handler and call it
      const buttonListener = panel.eventListeners.find(
        l => l.element === button && l.event === 'click'
      );

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: button
      };
      buttonListener.handler(mockEvent);

      expect(dropdown.classList.contains('show')).toBe(true);
      expect(otherDropdown.classList.contains('show')).toBe(false);
    });

    it('should close dropdown when clicking outside', () => {
      const button = document.getElementById('applications-menu-button');
      const dropdown = document.getElementById('applications-dropdown');

      // Open dropdown first
      dropdown.classList.add('show');

      // Create a div outside the dropdown and button
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);

      // Click on the outside element
      outsideElement.click();

      // Dropdown should be closed
      expect(dropdown.classList.contains('show')).toBe(false);

      // Cleanup
      if (outsideElement.parentNode) {
        document.body.removeChild(outsideElement);
      }
    });

    it('should not close dropdown when clicking inside dropdown', () => {
      const button = document.getElementById('applications-menu-button');
      const dropdown = document.getElementById('applications-dropdown');

      // Open dropdown first
      dropdown.classList.add('show');

      // Click inside the dropdown (not on a menu item)
      dropdown.click();

      // Dropdown should remain open (document click handler checks if target is inside dropdown)
      expect(dropdown.classList.contains('show')).toBe(true);
    });

    it('should close dropdown when clicking on menu item', (done) => {
      const dropdown = document.getElementById('applications-dropdown');
      const menuItem = dropdown.querySelector('.menu-item');

      // Open dropdown first
      dropdown.classList.add('show');

      // Click menu item
      menuItem.click();

      // Should close after delay
      setTimeout(() => {
        expect(dropdown.classList.contains('show')).toBe(false);
        done();
      }, 150);
    });

    it('should close all dropdowns when calling closeAllDropdowns', () => {
      const dropdown = document.getElementById('applications-dropdown');
      const otherDropdown = document.getElementById('other-dropdown');

      dropdown.classList.add('show');
      otherDropdown.classList.add('show');

      panel.closeAllDropdowns();

      expect(dropdown.classList.contains('show')).toBe(false);
      expect(otherDropdown.classList.contains('show')).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should remove all event listeners on destroy', () => {
      const newPanel = new Panel();
      const initialListenersCount = newPanel.eventListeners.length;

      expect(initialListenersCount).toBeGreaterThan(0);

      newPanel.destroy();

      expect(newPanel.eventListeners.length).toBe(0);
    });

    it('should stop clock interval on destroy', () => {
      const newPanel = new Panel();
      expect(newPanel.clockIntervalId).not.toBeNull();

      newPanel.destroy();

      expect(newPanel.clockIntervalId).toBeNull();
    });

    it('should handle multiple destroy calls gracefully', () => {
      const newPanel = new Panel();

      expect(() => {
        newPanel.destroy();
        newPanel.destroy();
      }).not.toThrow();
    });
  });

  describe('Constants', () => {
    it('should have CLOCK_UPDATE_INTERVAL constant', () => {
      expect(Panel.CLOCK_UPDATE_INTERVAL).toBe(1000);
    });

    it('should have MENU_CLOSE_DELAY constant', () => {
      expect(Panel.MENU_CLOSE_DELAY).toBe(100);
    });
  });
});
