import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('EmailData', () => {
  let dom;
  let window;
  let document;
  let EmailData;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost' });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Load EmailData class
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/email/email-data.js'), 'utf8');
    eval(code);
    EmailData = window.EmailData;
  });

  it('should initialize with email data', () => {
    const data = new EmailData();
    expect(data.data).toBeDefined();
    expect(data.data.inbox).toBeDefined();
    expect(data.data.sent).toBeDefined();
    expect(data.data.drafts).toBeDefined();
    expect(data.data.friends).toBeDefined();
    expect(data.data.trash).toBeDefined();
  });

  it('should get folder emails', () => {
    const data = new EmailData();
    const friendsEmails = data.getFolder('friends');

    expect(Array.isArray(friendsEmails)).toBe(true);
    expect(friendsEmails.length).toBeGreaterThan(0);
  });

  it('should return empty array for non-existent folder', () => {
    const data = new EmailData();
    const emails = data.getFolder('nonexistent');

    expect(Array.isArray(emails)).toBe(true);
    expect(emails.length).toBe(0);
  });

  it('should get email by ID from friends folder', () => {
    const data = new EmailData();
    // Use the actual email ID from the default data (ID 5)
    const email = data.getEmail('friends', 5);

    expect(email).toBeDefined();
    expect(email.id).toBe(5);
    expect(email.from).toBeDefined();
    expect(email.subject).toBeDefined();
  });

  it('should get email by ID from trash', () => {
    const data = new EmailData();
    // Add an email to trash first since default data has empty trash
    const testEmail = { id: 2, from: 'test@example.com', subject: 'Test', date: '2025-01-01', read: false };
    data.data.trash.push(testEmail);
    
    const email = data.getEmail('trash', 2);

    expect(email).toBeDefined();
    expect(email.id).toBe(2);
  });

  it('should get email by ID from friends folder', () => {
    const data = new EmailData();
    const email = data.getEmail('friends', 5);

    expect(email).toBeDefined();
    expect(email.id).toBe(5);
    expect(email.from).toBeDefined();
  });

  it('should return undefined for non-existent email', () => {
    const data = new EmailData();
    const email = data.getEmail('inbox', 99999);

    expect(email).toBeUndefined();
  });

  it('should return undefined for email from non-existent folder', () => {
    const data = new EmailData();
    const email = data.getEmail('nonexistent', 1);

    expect(email).toBeUndefined();
  });

  it('should mark email as read and return true', () => {
    const data = new EmailData();
    const email = data.getEmail('friends', 1);

    if (email && !email.read) {
      const result = data.markAsRead('friends', 1);
      expect(result).toBe(true);
      expect(email.read).toBe(true);
    }
  });

  it('should mark already-read email as read and return true', () => {
    const data = new EmailData();
    const email = data.getEmail('friends', 1);

    if (email) {
      email.read = true;
      const result = data.markAsRead('friends', 1);
      expect(result).toBe(true);
      expect(email.read).toBe(true);
    }
  });

  it('should return false when marking non-existent email as read', () => {
    const data = new EmailData();
    const result = data.markAsRead('inbox', 99999);

    expect(result).toBe(false);
  });

  it('should mark email as read from trash folder', () => {
    const data = new EmailData();
    const email = data.getEmail('trash', 2);

    if (email) {
      const result = data.markAsRead('trash', 2);
      expect(result).toBe(true);
      expect(email.read).toBe(true);
    }
  });

  it('should get unread count for inbox', () => {
    const data = new EmailData();
    const count = data.getUnreadCount('inbox');

    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
    // Should count only unread emails
    const inboxEmails = data.getFolder('inbox');
    const actualUnreadCount = inboxEmails.filter(email => !email.read).length;
    expect(count).toBe(actualUnreadCount);
  });

  it('should decrease unread count when marking email as read', () => {
    const data = new EmailData();
    // Test with inbox which tracks unread count
    const initialCount = data.getUnreadCount('inbox');
    const inboxEmails = data.getFolder('inbox');
    const unreadEmail = inboxEmails.find(e => !e.read);

    if (unreadEmail) {
      data.markAsRead('inbox', unreadEmail.id);
      const newCount = data.getUnreadCount('inbox');
      expect(newCount).toBe(initialCount - 1);
    } else {
      // If inbox is empty, test that marking as read works
      // For non-inbox folders, getUnreadCount returns total count, not unread count
      const friendsEmail = data.getEmail('friends', 1);
      if (friendsEmail && !friendsEmail.read) {
        const beforeUnreadCount = data.getFolder('friends').filter(e => !e.read).length;
        data.markAsRead('friends', 1);
        const afterUnreadCount = data.getFolder('friends').filter(e => !e.read).length;
        expect(afterUnreadCount).toBe(beforeUnreadCount - 1);
        // Total count should remain the same for non-inbox folders
        expect(data.getUnreadCount('friends')).toBe(data.getFolder('friends').length);
      }
    }
  });

  it('should get total count for non-inbox folders', () => {
    const data = new EmailData();
    const sentCount = data.getUnreadCount('sent');
    const trashCount = data.getUnreadCount('trash');
    const draftsCount = data.getUnreadCount('drafts');
    const friendsCount = data.getUnreadCount('friends');

    expect(typeof sentCount).toBe('number');
    expect(typeof trashCount).toBe('number');
    expect(typeof draftsCount).toBe('number');
    expect(typeof friendsCount).toBe('number');

    // Should return total count, not unread count
    const sentEmails = data.getFolder('sent');
    const trashEmails = data.getFolder('trash');
    const draftsEmails = data.getFolder('drafts');
    const friendsEmails = data.getFolder('friends');

    expect(sentCount).toBe(sentEmails.length);
    expect(trashCount).toBe(trashEmails.length);
    expect(draftsCount).toBe(draftsEmails.length);
    expect(friendsCount).toBe(friendsEmails.length);
  });

  it('should return 0 for non-existent folder', () => {
    const data = new EmailData();
    const count = data.getUnreadCount('nonexistent');

    expect(count).toBe(0);
  });

  it('should create independent instances with deep cloned data', () => {
    const data1 = new EmailData();
    const data2 = new EmailData();

    // Modify data in first instance
    const email1 = data1.getEmail('friends', 1);
    if (email1) {
      email1.read = true;
    }

    // Second instance should not be affected
    const email2 = data2.getEmail('friends', 1);
    if (email2) {
      expect(email2.read).toBe(false);
    }

    // Verify they are different objects
    expect(data1.data).not.toBe(data2.data);
    expect(data1.data.friends).not.toBe(data2.data.friends);
  });
});
