import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('NotesApp', () => {
  let dom;
  let window;
  let document;
  let NotesApp;
  let NotesStorage;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="notes-window">
            <div id="notes-entries-list"></div>
          </div>
          <div id="notes-dock-item"></div>
          <div id="notes-letter-window">
            <div class="window-content"></div>
            <div id="letter-date"></div>
            <div id="letter-title"></div>
            <div id="letter-content"></div>
          </div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.localStorage = window.localStorage;

    // Clear localStorage before each test
    localStorage.clear();

    // Load dependencies
    const fs = require('fs');
    const path = require('path');

    // Load NotesStorage first
    const storageCode = fs.readFileSync(path.join(__dirname, '../../scripts/applications/notes/notes-storage.js'), 'utf8');
    eval(storageCode);
    NotesStorage = window.NotesStorage;

    // Load NotesApp
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/notes/notes.js'), 'utf8');
    eval(code);
    NotesApp = window.NotesAppClass;
  });

  describe('Initialization', () => {
    it('should initialize notes app with correct properties', () => {
      const app = new NotesApp();
      expect(app).toBeDefined();
      expect(app.windowId).toBe('notes-window');
      expect(app.dockItemId).toBe('notes-dock-item');
      expect(app.storage).toBeInstanceOf(NotesStorage);
      expect(Array.isArray(app.entries)).toBe(true);
      expect(typeof app.entriesByDate).toBe('object');
    });

    it('should load entries on init', () => {
      const app = new NotesApp();
      expect(Array.isArray(app.entries)).toBe(true);
      expect(app.entries.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing window element gracefully', () => {
      const originalGetElementById = document.getElementById;
      document.getElementById = vi.fn((id) => {
        if (id === 'notes-window') return null;
        return originalGetElementById.call(document, id);
      });

      const app = new NotesApp();
      expect(app.window).toBeNull();
    });
  });

  describe('Entry Management', () => {
    it('should add a new entry', () => {
      const app = new NotesApp();
      const initialCount = app.entries.length;
      const newEntry = app.addEntry('Test Title', 'Test content');

      expect(app.entries.length).toBe(initialCount + 1);
      expect(newEntry.title).toBe('Test Title');
      expect(newEntry.content).toBe('Test content');
      expect(newEntry.id).toBeDefined();
      expect(newEntry.createdAt).toBeDefined();
      expect(newEntry.read).toBe(false);
    });

    it('should add entry with empty title and content', () => {
      const app = new NotesApp();
      const newEntry = app.addEntry('', '');

      expect(newEntry.title).toBe('');
      expect(newEntry.content).toBe('');
    });

    it('should sort entries by date (newest first) after adding', () => {
      const app = new NotesApp();
      const oldEntry = app.entries[0];
      if (oldEntry) {
        const initialCount = app.entries.length;
        const newEntry = app.addEntry('New Entry', 'Content');

        // Verify entry was added
        expect(app.entries.length).toBe(initialCount + 1);
        expect(app.entries.some(e => e.id === newEntry.id)).toBe(true);

        // Check that entries are sorted by date (newest first)
        // The first entry should have the latest timestamp
        const firstEntry = app.entries[0];
        const allTimestamps = app.entries.map(e => new Date(e.createdAt).getTime());
        const maxTimestamp = Math.max(...allTimestamps);
        expect(new Date(firstEntry.createdAt).getTime()).toBe(maxTimestamp);

        // Verify the new entry exists and entries are properly sorted
        // (The new entry should be among the entries, and sorting should work correctly)
        const isSorted = app.entries.every((entry, index) => {
          if (index === 0) return true;
          return new Date(entry.createdAt).getTime() <= new Date(app.entries[index - 1].createdAt).getTime();
        });
        expect(isSorted).toBe(true);
      }
    });

    it('should check if entry exists for today', () => {
      const app = new NotesApp();
      const today = new Date().toDateString();

      // Clear entries and add one for today
      app.entries = [];
      app.addEntry('Today Entry', 'Content');

      expect(app.hasEntryForToday()).toBe(true);
    });

    it('should return false when no entry exists for today', () => {
      const app = new NotesApp();
      // Set all entries to yesterday
      app.entries.forEach(entry => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        entry.createdAt = yesterday.toISOString();
      });

      expect(app.hasEntryForToday()).toBe(false);
    });
  });

  describe('Rendering', () => {
    it('should render empty state when no entries', () => {
      const app = new NotesApp();
      app.entries = [];
      app.render();

      const entriesList = document.getElementById('notes-entries-list');
      expect(entriesList.innerHTML).toContain('no entries yet');
      expect(entriesList.innerHTML).toContain('notes-empty');
    });

    it('should render entries grouped by date', () => {
      const app = new NotesApp();
      app.entries = [
        {
          id: '1',
          title: 'Entry 1',
          content: 'Content 1',
          createdAt: new Date('2024-11-22').toISOString(),
          read: false
        },
        {
          id: '2',
          title: 'Entry 2',
          content: 'Content 2',
          createdAt: new Date('2024-11-23').toISOString(),
          read: false
        }
      ];
      app.render();

      const entriesList = document.getElementById('notes-entries-list');
      expect(entriesList.querySelectorAll('.notes-date-item').length).toBeGreaterThan(0);
    });

    it('should group multiple entries by same date', () => {
      const app = new NotesApp();
      const sameDate = new Date('2024-11-22').toISOString();
      app.entries = [
        {
          id: '1',
          title: 'Entry 1',
          content: 'Content 1',
          createdAt: sameDate,
          read: false
        },
        {
          id: '2',
          title: 'Entry 2',
          content: 'Content 2',
          createdAt: sameDate,
          read: false
        }
      ];
      app.render();

      const dateKeys = Object.keys(app.entriesByDate);
      const sameDateEntries = app.entriesByDate[dateKeys[0]];
      expect(sameDateEntries.length).toBe(2);
    });

    it('should show read indicator when entry is read', () => {
      const app = new NotesApp();
      app.entries = [
        {
          id: '1',
          title: 'Entry 1',
          content: 'Content 1',
          createdAt: new Date().toISOString(),
          read: true
        }
      ];
      app.render();

      const entriesList = document.getElementById('notes-entries-list');
      const dateItem = entriesList.querySelector('.notes-date-item');
      expect(dateItem.classList.contains('read')).toBe(true);
      expect(dateItem.textContent).toContain('✓');
    });

    it('should handle render when entries list element is missing', () => {
      const app = new NotesApp();
      const entriesList = document.getElementById('notes-entries-list');
      entriesList.remove();

      // Should not throw error
      expect(() => app.render()).not.toThrow();
    });
  });

  describe('Content Formatting', () => {
    it('should format content with newlines', () => {
      const app = new NotesApp();
      const content = 'Line 1\nLine 2\nLine 3';
      const formatted = app.formatContent(content);

      expect(formatted).toContain('<br>');
      expect(formatted.split('<br>').length).toBe(3);
    });

    it('should escape HTML in content', () => {
      const app = new NotesApp();
      const content = '<script>alert("xss")</script>';
      const formatted = app.formatContent(content);

      expect(formatted).not.toContain('<script>');
      expect(formatted).not.toContain('</script>');
    });

    it('should escape HTML in title', () => {
      const app = new NotesApp();
      const text = '<img src=x onerror=alert(1)>';
      const escaped = app.escapeHtml(text);

      expect(escaped).not.toContain('<img');
      expect(escaped).not.toContain('>');
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
    });

    it('should handle empty content', () => {
      const app = new NotesApp();
      const formatted = app.formatContent('');
      expect(formatted).toBe('');
    });
  });

  describe('Letter Window', () => {
    it('should mark entry as read when opening letter', () => {
      const app = new NotesApp();
      const entry = app.entries[0];
      if (entry) {
        entry.read = false;
        app.openLetterWindow(entry);

        expect(entry.read).toBe(true);
      }
    });

    it('should populate letter window with entry content', () => {
      const app = new NotesApp();
      const entry = app.entries[0];
      if (entry) {
        app.openLetterWindow(entry);

        const letterTitle = document.getElementById('letter-title');
        const letterContent = document.getElementById('letter-content');
        const letterDate = document.getElementById('letter-date');

        expect(letterTitle.textContent).toBe(entry.title || '');
        expect(letterContent.innerHTML).toBeDefined();
        expect(letterDate.textContent).toBeDefined();
      }
    });

    it('should handle missing letter window element', () => {
      const app = new NotesApp();
      const entry = app.entries[0];
      if (entry) {
        const letterWindow = document.getElementById('notes-letter-window');
        letterWindow.remove();

        // Should not throw error
        expect(() => app.openLetterWindow(entry)).not.toThrow();
      }
    });

    it('should re-render after opening letter window', () => {
      const app = new NotesApp();
      const entry = app.entries[0];
      if (entry) {
        entry.read = false;
        const renderSpy = vi.spyOn(app, 'render');
        app.openLetterWindow(entry);

        expect(renderSpy).toHaveBeenCalled();
        renderSpy.mockRestore();
      }
    });
  });

  describe('Storage Operations', () => {
    it('should not save entries to storage (cache disabled)', () => {
      const app = new NotesApp();
      app.addEntry('Test', 'Content');

      // localStorage should be cleared/not contain entries
      const saved = localStorage.getItem('notes-entries');
      expect(saved).toBeNull();
    });

    it('should always load default entries, ignoring storage', () => {
      const app = new NotesApp();
      const testEntries = [
        {
          id: 'test-1',
          title: 'Stored Entry',
          content: 'Stored Content',
          createdAt: new Date().toISOString(),
          read: false
        }
      ];
      localStorage.setItem('notes-entries', JSON.stringify(testEntries));

      app.loadEntries();
      // Should load default entries, not the stored ones
      expect(app.entries.length).toBeGreaterThan(0);
      expect(app.entries[0].title).not.toBe('Stored Entry');
      // localStorage should be cleared
      expect(localStorage.getItem('notes-entries')).toBeNull();
    });

    it('should always return default entries without saving', () => {
      localStorage.clear();
      const app = new NotesApp();

      // Should have default entries
      expect(app.entries.length).toBeGreaterThan(0);
      // But should not be saved to localStorage
      const saved = localStorage.getItem('notes-entries');
      expect(saved).toBeNull();
    });
  });

  describe('Window Management', () => {
    it('should open window using WindowManager if available', () => {
      const app = new NotesApp();
      window.WindowManager = {
        open: vi.fn()
      };

      app.open();

      expect(window.WindowManager.open).toHaveBeenCalledWith(app.window, app.dockItem);
    });

    it('should use fallback when WindowManager is not available', () => {
      const app = new NotesApp();
      window.WindowManager = undefined;

      app.open();

      expect(app.window.style.display).toBe('block');
    });

    it('should close window', () => {
      const app = new NotesApp();
      if (app.dockItem) {
        app.dockItem.classList.add('active');
        app.close();
        expect(app.dockItem.classList.contains('active')).toBe(false);
      }
    });

    it('should handle close when dock item is missing', () => {
      const app = new NotesApp();
      app.dockItem = null;

      // Should not throw error
      expect(() => app.close()).not.toThrow();
    });
  });

  describe('Event Listeners', () => {
    it('should setup dock item click handler', () => {
      const app = new NotesApp();
      const openSpy = vi.spyOn(app, 'open');

      if (app.dockItem) {
        app.dockItem.click();
        expect(openSpy).toHaveBeenCalled();
        openSpy.mockRestore();
      }
    });

    it('should handle date item clicks', () => {
      const app = new NotesApp();
      app.entries = [
        {
          id: '1',
          title: 'Test',
          content: 'Content',
          createdAt: new Date().toISOString(),
          read: false
        }
      ];
      app.render();

      const openLetterSpy = vi.spyOn(app, 'openLetterWindow');
      const dateItem = document.querySelector('.notes-date-item');

      if (dateItem) {
        dateItem.click();
        expect(openLetterSpy).toHaveBeenCalled();
        openLetterSpy.mockRestore();
      }
    });
  });

  describe('Sorting', () => {
    it('should sort entries by date (newest first)', () => {
      const app = new NotesApp();
      app.entries = [
        {
          id: '1',
          title: 'Old',
          content: 'Content',
          createdAt: new Date('2024-01-01').toISOString(),
          read: false
        },
        {
          id: '2',
          title: 'New',
          content: 'Content',
          createdAt: new Date('2024-12-31').toISOString(),
          read: false
        }
      ];

      app.sortEntries();

      expect(app.entries[0].id).toBe('2');
      expect(app.entries[1].id).toBe('1');
    });
  });
});

