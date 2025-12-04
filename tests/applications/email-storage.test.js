import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('EmailStorage', () => {
  let dom;
  let window;
  let document;
  let EmailStorage;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost' });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      clear: vi.fn()
    };
    global.localStorage = localStorageMock;

    // Load EmailData first to make DEFAULT_EMAIL_DATA available
    const fs = require('fs');
    const path = require('path');
    const emailDataCode = fs.readFileSync(path.join(__dirname, '../../scripts/applications/email/email-data.js'), 'utf8');
    eval(emailDataCode);

    // Load EmailStorage class (depends on DEFAULT_EMAIL_DATA from email-data.js)
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/email/email-storage.js'), 'utf8');
    eval(code);
    EmailStorage = window.EmailStorage;
  });

  it('should initialize with email storage', () => {
    const storage = new EmailStorage();
    expect(storage).toBeDefined();
    expect(storage.storageKey).toBe('email-data');
  });

  it('should load default data when no stored data', () => {
    const storage = new EmailStorage();
    const data = storage.load();

    expect(data).toBeDefined();
    expect(data.inbox).toBeDefined();
    expect(data.sent).toBeDefined();
    expect(data.drafts).toBeDefined();
    expect(data.friends).toBeDefined();
    expect(data.trash).toBeDefined();
    expect(Array.isArray(data.inbox)).toBe(true);
    expect(Array.isArray(data.friends)).toBe(true);
    expect(data.friends.length).toBeGreaterThan(0);
  });

  it('should get folder emails', () => {
    const storage = new EmailStorage();
    const data = storage.load();
    const friendsEmails = storage.getFolder(data, 'friends');

    expect(Array.isArray(friendsEmails)).toBe(true);
    expect(friendsEmails.length).toBeGreaterThan(0);
  });

  it('should return empty array for non-existent folder', () => {
    const storage = new EmailStorage();
    const data = storage.load();
    const emails = storage.getFolder(data, 'nonexistent');

    expect(Array.isArray(emails)).toBe(true);
    expect(emails.length).toBe(0);
  });

  it('should get email by ID', () => {
    const storage = new EmailStorage();
    const data = storage.load();
    // Use the actual email ID from the default data (ID 5)
    const email = storage.getEmail(data, 'friends', 5);

    expect(email).toBeDefined();
    expect(email.id).toBe(5);
  });

  it('should return undefined for non-existent email', () => {
    const storage = new EmailStorage();
    const data = storage.load();
    const email = storage.getEmail(data, 'inbox', 99999);

    expect(email).toBeUndefined();
  });

  it('should mark email as read', () => {
    const storage = new EmailStorage();
    const data = storage.load();
    // Use the actual email ID from the default data (ID 5)
    const email = storage.getEmail(data, 'friends', 5);

    if (email && !email.read) {
      storage.markAsRead(data, 'friends', 5);
      expect(email.read).toBe(true);
    }
  });

  it('should get unread count for inbox', () => {
    const storage = new EmailStorage();
    const data = storage.load();
    const count = storage.getUnreadCount(data, 'inbox');

    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should get total count for non-inbox folders', () => {
    const storage = new EmailStorage();
    const data = storage.load();
    const sentCount = storage.getUnreadCount(data, 'sent');
    const trashCount = storage.getUnreadCount(data, 'trash');

    expect(typeof sentCount).toBe('number');
    expect(typeof trashCount).toBe('number');
  });

  it('should save data to localStorage', () => {
    const storage = new EmailStorage();
    const data = storage.load();

    storage.save(data);

    expect(global.localStorage.setItem).toHaveBeenCalledWith('email-data', expect.any(String));
  });

  it('should load data from localStorage when available', () => {
    const storedData = {
      inbox: [{ id: 1, from: 'test@example.com', subject: 'Test', date: '2025-01-01', read: false }],
      sent: [],
      drafts: [],
      trash: []
    };

    global.localStorage.getItem = vi.fn(() => JSON.stringify(storedData));

    const storage = new EmailStorage();
    const data = storage.load();

    expect(data.inbox).toHaveLength(1);
    expect(data.inbox[0].id).toBe(1);
  });

  it('should handle corrupted localStorage data gracefully', () => {
    global.localStorage.getItem = vi.fn(() => 'invalid json{');

    const storage = new EmailStorage();
    const data = storage.load();

    // Should fall back to default data
    expect(data).toBeDefined();
    expect(data.inbox).toBeDefined();
    expect(Array.isArray(data.inbox)).toBe(true);
  });

  it('should handle save errors gracefully', () => {
    global.localStorage.setItem = vi.fn(() => {
      throw new Error('Storage quota exceeded');
    });

    const storage = new EmailStorage();
    const data = storage.load();

    // Should not throw
    expect(() => storage.save(data)).not.toThrow();
  });

  it('should get email from trash folder', () => {
    const storage = new EmailStorage();
    const data = storage.load();
    // Add an email to trash first
    const testEmail = { id: 2, from: 'test@example.com', subject: 'Test', date: '2025-01-01', read: false };
    data.trash.push(testEmail);
    storage.save(data);
    
    const email = storage.getEmail(data, 'trash', 2);

    expect(email).toBeDefined();
    expect(email.id).toBe(2);
  });

  it('should handle markAsRead for non-existent email', () => {
    const storage = new EmailStorage();
    const data = storage.load();

    // Should not throw
    expect(() => storage.markAsRead(data, 'inbox', 99999)).not.toThrow();
  });

  it('should call save when marking email as read', () => {
    const storage = new EmailStorage();
    const data = storage.load();
    // Use the actual email ID from the default data (ID 5)
    const email = storage.getEmail(data, 'friends', 5);

    if (email && !email.read) {
      global.localStorage.setItem = vi.fn();
      storage.markAsRead(data, 'friends', 5);

      expect(global.localStorage.setItem).toHaveBeenCalled();
    }
  });

  it('should get unread count for non-existent folder', () => {
    const storage = new EmailStorage();
    const data = storage.load();
    const count = storage.getUnreadCount(data, 'nonexistent');

    expect(count).toBe(0);
  });

  it('should use fallback when DEFAULT_EMAIL_DATA is not available', () => {
    // Temporarily remove DEFAULT_EMAIL_DATA
    const originalDefault = window.DEFAULT_EMAIL_DATA;
    delete window.DEFAULT_EMAIL_DATA;

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Reload EmailStorage
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/email/email-storage.js'), 'utf8');
    eval(code);
    const EmailStorageWithoutDefault = window.EmailStorage;

    const storage = new EmailStorageWithoutDefault();
    const data = storage.getDefaultData();

    expect(data.inbox).toEqual([]);
    expect(data.sent).toEqual([]);
    expect(data.drafts).toEqual([]);
    expect(data.friends).toEqual([]);
    expect(data.trash).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    // Restore
    window.DEFAULT_EMAIL_DATA = originalDefault;
    consoleSpy.mockRestore();
  });
});
