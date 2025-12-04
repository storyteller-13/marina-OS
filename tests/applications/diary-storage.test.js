import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('DiaryStorage', () => {
  let dom;
  let window;
  let document;
  let DiaryStorage;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost' });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.localStorage = window.localStorage;

    // Clear localStorage before each test
    localStorage.clear();

    // Load DiaryStorage class
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/diary/diary-storage.js'), 'utf8');
    eval(code);
    DiaryStorage = window.DiaryStorage;
  });

  describe('Initialization', () => {
    it('should initialize with correct storage key', () => {
      const storage = new DiaryStorage();
      expect(storage.storageKey).toBe('diary-entries');
    });
  });

  describe('Loading Entries', () => {
    it('should load default entries when localStorage is empty', () => {
      localStorage.clear();
      const storage = new DiaryStorage();
      const entries = storage.load();

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);
    });

    it('should always load default entries, ignoring localStorage (cache disabled)', () => {
      const storage = new DiaryStorage();
      const testEntries = [
        {
          id: '1',
          title: 'Test Entry',
          content: 'Test content',
          createdAt: new Date().toISOString(),
          updatedAt: null,
          read: false
        }
      ];

      // Manually set localStorage to simulate saved entries
      localStorage.setItem('diary-entries', JSON.stringify(testEntries));
      const loaded = storage.load();

      // Should return default entries, not the saved ones
      expect(loaded).not.toEqual(testEntries);
      expect(loaded.length).toBeGreaterThan(0);
      // localStorage should be cleared
      expect(localStorage.getItem('diary-entries')).toBeNull();
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem('diary-entries', 'invalid json');
      const storage = new DiaryStorage();
      const entries = storage.load();

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0); // Should return default entries
    });

    it('should handle corrupted data in localStorage', () => {
      localStorage.setItem('diary-entries', '{invalid}');
      const storage = new DiaryStorage();
      const entries = storage.load();

      expect(Array.isArray(entries)).toBe(true);
    });

    it('should handle null in localStorage', () => {
      localStorage.setItem('diary-entries', 'null');
      const storage = new DiaryStorage();
      const entries = storage.load();

      expect(Array.isArray(entries)).toBe(true);
    });

    it('should always return default entries, ignoring empty array in localStorage', () => {
      localStorage.setItem('diary-entries', '[]');
      const storage = new DiaryStorage();
      const entries = storage.load();

      expect(Array.isArray(entries)).toBe(true);
      // Should return default entries, not empty array
      expect(entries.length).toBeGreaterThan(0);
      // localStorage should be cleared
      expect(localStorage.getItem('diary-entries')).toBeNull();
    });
  });

  describe('Saving Entries', () => {
    it('should not save entries to localStorage (cache disabled)', () => {
      const storage = new DiaryStorage();
      const testEntries = [
        {
          id: '1',
          title: 'Test Entry',
          content: 'Test content',
          createdAt: new Date().toISOString(),
          updatedAt: null,
          read: false
        }
      ];

      storage.save(testEntries);
      const saved = localStorage.getItem('diary-entries');

      // Should not save anything
      expect(saved).toBeNull();
    });

    it('should handle save errors gracefully', () => {
      const storage = new DiaryStorage();
      const testEntries = [{ id: '1', title: 'Test', content: 'Content', createdAt: new Date().toISOString(), read: false }];

      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw error
      expect(() => storage.save(testEntries)).not.toThrow();

      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });

    it('should always return default entries (cache disabled)', () => {
      const storage = new DiaryStorage();
      const testEntries = [
        {
          id: '1',
          title: 'Complex Entry',
          content: 'Multi-line\ncontent\nwith\nnewlines',
          createdAt: new Date('2024-11-22T10:00:00Z').toISOString(),
          updatedAt: new Date('2024-11-22T11:00:00Z').toISOString(),
          read: true
        }
      ];

      storage.save(testEntries);
      const loaded = storage.load();

      // Should return default entries, not the saved ones
      expect(loaded.length).toBeGreaterThan(0);
      // Default entries have read: false
      expect(loaded[0].read).toBe(false);
    });
  });

  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const storage = new DiaryStorage();
      const id1 = storage.generateId();
      const id2 = storage.generateId();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should generate IDs with consistent format', () => {
      const storage = new DiaryStorage();
      const ids = Array.from({ length: 10 }, () => storage.generateId());

      ids.forEach(id => {
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      });

      // All IDs should be unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly', () => {
      const storage = new DiaryStorage();
      const date = new Date('2024-11-22T12:00:00Z');
      const formatted = storage.formatDate(date.toISOString());

      expect(formatted).toContain('november');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('22');
    });

    it('should format date with correct day of week', () => {
      const storage = new DiaryStorage();
      const date = new Date('2024-11-22T12:00:00Z'); // Friday
      const formatted = storage.formatDate(date.toISOString());

      expect(formatted).toContain('friday');
    });

    it('should handle all months correctly', () => {
      const storage = new DiaryStorage();
      const months = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];

      months.forEach((month, index) => {
        const date = new Date(2024, index, 15);
        const formatted = storage.formatDate(date.toISOString());
        expect(formatted.toLowerCase()).toContain(month);
      });
    });

    it('should handle invalid date strings', () => {
      const storage = new DiaryStorage();
      const formatted = storage.formatDate('invalid-date');

      expect(formatted).toBe('');
    });

    it('should handle null date', () => {
      const storage = new DiaryStorage();
      const formatted = storage.formatDate(null);

      expect(formatted).toBe('');
    });

    it('should handle undefined date', () => {
      const storage = new DiaryStorage();
      const formatted = storage.formatDate(undefined);

      expect(formatted).toBe('');
    });

    it('should handle empty string date', () => {
      const storage = new DiaryStorage();
      const formatted = storage.formatDate('');

      expect(formatted).toBe('');
    });
  });

  describe('Default Entries', () => {
    it('should return default entries structure', () => {
      const storage = new DiaryStorage();
      const defaultEntries = storage.getDefaultEntries();

      expect(Array.isArray(defaultEntries)).toBe(true);
      expect(defaultEntries.length).toBeGreaterThan(0);

      defaultEntries.forEach(entry => {
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('title');
        expect(entry).toHaveProperty('content');
        expect(entry).toHaveProperty('createdAt');
        expect(entry).toHaveProperty('updatedAt');
        expect(entry).toHaveProperty('read');

        expect(typeof entry.id).toBe('string');
        expect(typeof entry.title).toBe('string');
        expect(typeof entry.content).toBe('string');
        expect(typeof entry.createdAt).toBe('string');
        expect(typeof entry.read).toBe('boolean');
      });
    });

    it('should generate unique IDs for default entries', () => {
      const storage = new DiaryStorage();
      const defaultEntries = storage.getDefaultEntries();

      const ids = defaultEntries.map(e => e.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(defaultEntries.length);
    });

    it('should have valid ISO date strings in default entries', () => {
      const storage = new DiaryStorage();
      const defaultEntries = storage.getDefaultEntries();

      defaultEntries.forEach(entry => {
        const date = new Date(entry.createdAt);
        expect(isNaN(date.getTime())).toBe(false);
      });
    });

    it('should have November dates in default entries', () => {
      const storage = new DiaryStorage();
      const defaultEntries = storage.getDefaultEntries();

      defaultEntries.forEach(entry => {
        const date = new Date(entry.createdAt);
        expect(date.getMonth()).toBe(10); // November (0-indexed)
      });
    });

    it('should have read property set to false in default entries', () => {
      const storage = new DiaryStorage();
      const defaultEntries = storage.getDefaultEntries();

      defaultEntries.forEach(entry => {
        expect(entry.read).toBe(false);
      });
    });

    it('should have updatedAt set to null in default entries', () => {
      const storage = new DiaryStorage();
      const defaultEntries = storage.getDefaultEntries();

      defaultEntries.forEach(entry => {
        expect(entry.updatedAt).toBeNull();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should always return default entries, ignoring large arrays (cache disabled)', () => {
      const storage = new DiaryStorage();
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `entry-${i}`,
        title: `Entry ${i}`,
        content: `Content ${i}`,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        read: false
      }));

      storage.save(largeArray);
      const loaded = storage.load();

      // Should return default entries, not the large array
      expect(loaded.length).toBeLessThan(1000);
      expect(loaded.length).toBeGreaterThan(0);
    });

    it('should always return default entries, ignoring special characters (cache disabled)', () => {
      const storage = new DiaryStorage();
      const testEntries = [
        {
          id: '1',
          title: 'Special: <>&"\'',
          content: 'Content with\nnewlines\tand\ttabs',
          createdAt: new Date().toISOString(),
          updatedAt: null,
          read: false
        }
      ];

      storage.save(testEntries);
      const loaded = storage.load();

      // Should return default entries, not the saved ones
      expect(loaded[0].title).not.toBe('Special: <>&"\'');
      expect(loaded.length).toBeGreaterThan(0);
    });

    it('should always return default entries, ignoring unicode entries (cache disabled)', () => {
      const storage = new DiaryStorage();
      const testEntries = [
        {
          id: '1',
          title: 'ᛚᛁᚢᛖᛏ ᛖᚱ ᚲᚨᛗᛈ',
          content: 'Unicode content: 你好世界 🌍',
          createdAt: new Date().toISOString(),
          updatedAt: null,
          read: false
        }
      ];

      storage.save(testEntries);
      const loaded = storage.load();

      // Should return default entries, not the saved ones
      // Note: one of the default entries does have unicode, but we're testing that
      // saved entries are ignored
      expect(loaded.length).toBeGreaterThan(0);
      // Should not match the test entry (which has a different unicode title)
      expect(loaded[0].title).not.toBe('ᛚᛁᚢᛖᛏ ᛖᚱ ᚲᚨᛗᛈ');
      // localStorage should be cleared
      expect(localStorage.getItem('diary-entries')).toBeNull();
    });
  });
});
