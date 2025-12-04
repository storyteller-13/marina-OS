import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('add-draft-to-localstorage', () => {
  let dom;
  let window;
  let document;
  let localStorage;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body></body>
      </html>
    `, { url: 'http://localhost' });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock localStorage
    localStorage = {
      data: {},
      getItem: vi.fn((key) => {
        return localStorage.data[key] || null;
      }),
      setItem: vi.fn((key, value) => {
        localStorage.data[key] = value;
      }),
      clear: vi.fn(() => {
        localStorage.data = {};
      })
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorage,
      writable: true
    });

    // Mock console methods
    global.console = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    };
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const executeScript = () => {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(__dirname, '../scripts/add-draft-to-localstorage.js'),
      'utf8'
    );

    // Extract the IIFE content and wrap it in a function to handle return statements
    const match = code.match(/\(function\(\)\s*\{([\s\S]*)\}\)\(\);/);
    if (match) {
      // Wrap the code in a function so return statements are valid
      const wrappedCode = `(function() { ${match[1]} })();`;
      eval(wrappedCode);
    }
  };

  describe('with existing email data', () => {
    beforeEach(() => {
      const existingData = {
        inbox: [
          { id: 1, to: 'test@example.com', subject: 'Test', date: '2024-01-01', read: false, body: '' }
        ],
        sent: [
          { id: 2, to: 'test@example.com', subject: 'Sent', date: '2024-01-02', read: true, body: '' }
        ],
        drafts: [
          { id: 3, to: 'other@example.com', subject: 'Draft', date: '2024-01-03', read: false, body: '' }
        ],
        research: [],
        trash: []
      };

      localStorage.getItem.mockReturnValue(JSON.stringify(existingData));
      localStorage.setItem.mockClear();
    });

    it('should add draft to existing drafts array', () => {
      executeScript();

      expect(localStorage.setItem).toHaveBeenCalled();
      const lastCall = localStorage.setItem.mock.calls[localStorage.setItem.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1]);
      expect(savedData.drafts).toHaveLength(2);
      const newDraft = savedData.drafts.find(d => d.to === 'nikolai@drugoyepolushariye.ru');
      expect(newDraft).toBeDefined();
      expect(newDraft.subject).toBe('Re: Отправляю виртуальный пирожок и немного заботы');
    });

    it('should assign correct ID based on max ID', () => {
      executeScript();

      expect(localStorage.setItem).toHaveBeenCalled();
      const lastCall = localStorage.setItem.mock.calls[localStorage.setItem.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1]);
      const newDraft = savedData.drafts.find(d => d.to === 'nikolai@drugoyepolushariye.ru');
      expect(newDraft).toBeDefined();
      expect(newDraft.id).toBe(4); // max(1, 2, 3) + 1
    });

    it('should not add duplicate draft if already exists by ID', () => {
      const existingData = {
        inbox: [],
        sent: [],
        drafts: [{
          id: 6,
          to: 'nikolai@drugoyepolushariye.ru',
          subject: 'Re: Отправляю виртуальный пирожок',
          date: '2024-01-04',
          read: false,
          body: ''
        }],
        research: [],
        trash: []
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(existingData));
      localStorage.setItem.mockClear();
      console.log.mockClear();

      executeScript();

      expect(console.log).toHaveBeenCalledWith('Draft already exists:', expect.any(Object));
      // Should not have called setItem
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should not add duplicate draft if already exists by to and subject', () => {
      const existingData = {
        inbox: [],
        sent: [],
        drafts: [{
          id: 5,
          to: 'nikolai@drugoyepolushariye.ru',
          subject: 'Re: Отправляю виртуальный пирожок и немного заботы',
          date: '2024-01-04',
          read: false,
          body: ''
        }],
        research: [],
        trash: []
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(existingData));
      localStorage.setItem.mockClear();
      console.log.mockClear();

      executeScript();

      expect(console.log).toHaveBeenCalledWith('Draft already exists:', expect.any(Object));
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should preserve existing data in all folders', () => {
      executeScript();

      expect(localStorage.setItem).toHaveBeenCalled();
      const lastCall = localStorage.setItem.mock.calls[localStorage.setItem.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1]);
      expect(savedData.inbox).toHaveLength(1);
      expect(savedData.sent).toHaveLength(1);
      expect(savedData.drafts).toHaveLength(2);
      expect(savedData.research).toHaveLength(0);
      expect(savedData.trash).toHaveLength(0);
    });
  });

  describe('with no existing email data', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue(null);
      localStorage.setItem.mockClear();
    });

    it('should create new email data structure', () => {
      executeScript();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'email-data',
        expect.stringContaining('"drafts"')
      );

      const lastCall = localStorage.setItem.mock.calls[localStorage.setItem.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1]);
      expect(savedData).toHaveProperty('inbox');
      expect(savedData).toHaveProperty('sent');
      expect(savedData).toHaveProperty('drafts');
      expect(savedData).toHaveProperty('research');
      expect(savedData).toHaveProperty('trash');
    });

    it('should add draft with ID 1', () => {
      executeScript();

      const lastCall = localStorage.setItem.mock.calls[localStorage.setItem.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1]);
      expect(savedData.drafts).toHaveLength(1);
      expect(savedData.drafts[0].id).toBe(1);
    });

    it('should initialize all folders as empty arrays', () => {
      executeScript();

      const lastCall = localStorage.setItem.mock.calls[localStorage.setItem.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1]);
      expect(Array.isArray(savedData.inbox)).toBe(true);
      expect(Array.isArray(savedData.sent)).toBe(true);
      expect(Array.isArray(savedData.drafts)).toBe(true);
      expect(Array.isArray(savedData.research)).toBe(true);
      expect(Array.isArray(savedData.trash)).toBe(true);
    });
  });

  describe('with invalid JSON data', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue('invalid json{');
      localStorage.setItem.mockClear();
      console.error.mockClear();
    });

    it('should handle parse error gracefully', () => {
      executeScript();

      expect(console.error).toHaveBeenCalledWith(
        'Error parsing email data from storage:',
        expect.any(Error)
      );
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('draft properties', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue(null);
      localStorage.setItem.mockClear();
    });

    it('should create draft with correct properties', () => {
      executeScript();

      const lastCall = localStorage.setItem.mock.calls[localStorage.setItem.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1]);
      const draft = savedData.drafts[0];

      expect(draft.to).toBe('nikolai@drugoyepolushariye.ru');
      expect(draft.subject).toBe('Re: Отправляю виртуальный пирожок и немного заботы');
      expect(draft.preview).toBe('');
      expect(draft.read).toBe(false);
      expect(draft.body).toBe('');
      expect(draft.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO date format
    });

    it('should set date to current date', () => {
      const today = new Date().toISOString().split('T')[0];

      executeScript();

      const savedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      const draft = savedData.drafts[0];

      expect(draft.date).toBe(today);
    });
  });

  describe('ID calculation', () => {
    it('should find max ID across all folders', () => {
      const existingData = {
        inbox: [{ id: 10 }],
        sent: [{ id: 5 }],
        drafts: [{ id: 7 }],
        research: [{ id: 15 }],
        trash: [{ id: 3 }]
      };

      localStorage.getItem.mockReturnValue(JSON.stringify(existingData));
      localStorage.setItem.mockClear();

      executeScript();

      expect(localStorage.setItem).toHaveBeenCalled();
      const lastCall = localStorage.setItem.mock.calls[localStorage.setItem.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1]);
      const newDraft = savedData.drafts.find(d => d.to === 'nikolai@drugoyepolushariye.ru');
      expect(newDraft).toBeDefined();
      expect(newDraft.id).toBe(16); // max(10, 5, 7, 15, 3) + 1
    });

    it('should handle missing folders gracefully', () => {
      const existingData = {
        inbox: [{ id: 5 }],
        drafts: [{ id: 3 }]
        // missing sent, research, trash
      };

      localStorage.getItem.mockReturnValue(JSON.stringify(existingData));
      localStorage.setItem.mockClear();

      executeScript();

      expect(localStorage.setItem).toHaveBeenCalled();
      const lastCall = localStorage.setItem.mock.calls[localStorage.setItem.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1]);
      const newDraft = savedData.drafts.find(d => d.to === 'nikolai@drugoyepolushariye.ru');
      expect(newDraft).toBeDefined();
      expect(newDraft.id).toBe(6); // max(5, 3) + 1
    });
  });

  describe('console output', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue(null);
      localStorage.setItem.mockClear();
      console.log.mockClear();
    });

    it('should log success message', () => {
      executeScript();

      expect(console.log).toHaveBeenCalledWith('✓ Draft reply to nikolai added to localStorage');
    });

    it('should log draft details', () => {
      executeScript();

      expect(console.log).toHaveBeenCalledWith('  Draft ID:', expect.any(Number));
      expect(console.log).toHaveBeenCalledWith('  To:', 'nikolai@drugoyepolushariye.ru');
      expect(console.log).toHaveBeenCalledWith('  Subject:', 'Re: Отправляю виртуальный пирожок и немного заботы');
    });

    it('should log refresh instruction', () => {
      executeScript();

      expect(console.log).toHaveBeenCalledWith('\nRefresh the page to see the draft in your drafts folder.');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue(null);
      console.error.mockClear();
    });

    it('should handle localStorage.setItem error', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      executeScript();

      expect(console.error).toHaveBeenCalledWith(
        'Error saving to localStorage:',
        expect.any(Error)
      );
    });
  });
});
