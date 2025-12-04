import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('MessagingStorage', () => {
  let dom;
  let window;
  let document;
  let MessagingStorage;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost' });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.localStorage = window.localStorage;

    // Clear localStorage before each test
    localStorage.clear();

    // Load MessagingStorage class
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/messaging/messaging-storage.js'), 'utf8');
    eval(code);
    MessagingStorage = window.MessagingStorage;
  });

  describe('Initialization', () => {
    it('should initialize with correct storage key', () => {
      const storage = new MessagingStorage();
      expect(storage.storageKey).toBe('messaging-conversations');
    });
  });

  describe('Loading Conversations', () => {
    it('should load default conversations when localStorage is empty', () => {
      localStorage.clear();
      const storage = new MessagingStorage();
      const conversations = storage.load();

      expect(Array.isArray(conversations)).toBe(true);
      expect(conversations.length).toBeGreaterThan(0);
    });

    it('should load conversations from localStorage', () => {
      const storage = new MessagingStorage();
      const testConversations = [
        {
          id: 'conv-1',
          name: 'Test User',
          avatar: '👤',
          lastMessage: 'Hello',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          messages: []
        }
      ];

      localStorage.setItem('messaging-conversations', JSON.stringify(testConversations));
      const loaded = storage.load();

      expect(loaded).toEqual(testConversations);
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem('messaging-conversations', 'invalid json');
      const storage = new MessagingStorage();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const conversations = storage.load();

      expect(Array.isArray(conversations)).toBe(true);
      expect(conversations.length).toBeGreaterThan(0); // Should return default conversations
      consoleSpy.mockRestore();
    });

    it('should handle corrupted data in localStorage', () => {
      localStorage.setItem('messaging-conversations', '{invalid}');
      const storage = new MessagingStorage();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const conversations = storage.load();

      expect(Array.isArray(conversations)).toBe(true);
      consoleSpy.mockRestore();
    });

    it('should return default conversations when localStorage is null', () => {
      localStorage.removeItem('messaging-conversations');
      const storage = new MessagingStorage();
      const conversations = storage.load();

      expect(Array.isArray(conversations)).toBe(true);
      expect(conversations.length).toBeGreaterThan(0);
    });
  });

  describe('Saving Conversations', () => {
    it('should save conversations to localStorage', () => {
      const storage = new MessagingStorage();
      const testConversations = [
        {
          id: 'conv-1',
          name: 'Test User',
          avatar: '👤',
          lastMessage: 'Hello',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          messages: []
        }
      ];

      storage.save(testConversations);
      const saved = JSON.parse(localStorage.getItem('messaging-conversations'));

      expect(saved).toEqual(testConversations);
    });

    it('should handle save errors gracefully', () => {
      const storage = new MessagingStorage();
      const testConversations = [{ id: 'conv-1', name: 'Test', messages: [] }];

      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw error
      expect(() => storage.save(testConversations)).not.toThrow();

      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('Default Conversations', () => {
    it('should return default conversations structure', () => {
      const storage = new MessagingStorage();
      const defaultConversations = storage.getDefaultConversations();

      expect(Array.isArray(defaultConversations)).toBe(true);
      expect(defaultConversations.length).toBeGreaterThan(0);

      defaultConversations.forEach(conv => {
        expect(conv).toHaveProperty('id');
        expect(conv).toHaveProperty('name');
        expect(conv).toHaveProperty('lastMessage');
        expect(conv).toHaveProperty('lastMessageTime');
        expect(conv).toHaveProperty('unreadCount');
        expect(conv).toHaveProperty('messages');

        expect(typeof conv.id).toBe('string');
        expect(typeof conv.name).toBe('string');
        expect(typeof conv.lastMessage).toBe('string');
        expect(typeof conv.lastMessageTime).toBe('string');
        expect(typeof conv.unreadCount).toBe('number');
        expect(Array.isArray(conv.messages)).toBe(true);
      });
    });

    it('should generate unique IDs for default conversations', () => {
      const storage = new MessagingStorage();
      const defaultConversations = storage.getDefaultConversations();

      const ids = defaultConversations.map(c => c.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(defaultConversations.length);
    });

    it('should have valid ISO date strings in default conversations', () => {
      const storage = new MessagingStorage();
      const defaultConversations = storage.getDefaultConversations();

      defaultConversations.forEach(conv => {
        const date = new Date(conv.lastMessageTime);
        expect(isNaN(date.getTime())).toBe(false);

        conv.messages.forEach(msg => {
          const msgDate = new Date(msg.timestamp);
          expect(isNaN(msgDate.getTime())).toBe(false);
        });
      });
    });
  });

  describe('Adding Messages', () => {
    it('should add a message to a conversation', () => {
      const storage = new MessagingStorage();
      // Create a test conversation
      const testConversation = {
        id: 'test-conv-1',
        name: 'Test User',
        avatar: '👤',
        lastMessage: 'Initial',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        messages: []
      };
      const conversations = [testConversation];
      storage.save(conversations);

      const initialMessageCount = testConversation.messages.length;
      const message = storage.addMessage(testConversation.id, 'Test message', true);

      expect(message).toBeDefined();
      expect(message.text).toBe('Test message');
      expect(message.sent).toBe(true);
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeDefined();

      const updatedConversations = storage.load();
      const updatedConversation = updatedConversations.find(c => c.id === testConversation.id);
      expect(updatedConversation).toBeDefined();
      expect(updatedConversation.messages.length).toBe(initialMessageCount + 1);
      expect(updatedConversation.lastMessage).toBe('Test message');
    });

    it('should update lastMessage and lastMessageTime when adding message', () => {
      const storage = new MessagingStorage();
      // Create a test conversation
      const testConversation = {
        id: 'test-conv-2',
        name: 'Test User',
        avatar: '👤',
        lastMessage: 'Initial',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        messages: []
      };
      const conversations = [testConversation];
      storage.save(conversations);

      const message = storage.addMessage(testConversation.id, 'New last message', true);

      const updatedConversations = storage.load();
      const updatedConversation = updatedConversations.find(c => c.id === testConversation.id);

      expect(updatedConversation).toBeDefined();
      expect(updatedConversation.lastMessage).toBe('New last message');
      expect(updatedConversation.lastMessageTime).toBe(message.timestamp);
    });

    it('should increment unreadCount for received messages', () => {
      const storage = new MessagingStorage();
      // Create a test conversation
      const testConversation = {
        id: 'test-conv-3',
        name: 'Test User',
        avatar: '👤',
        lastMessage: 'Initial',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        messages: []
      };
      const conversations = [testConversation];
      storage.save(conversations);

      const initialUnread = testConversation.unreadCount || 0;
      storage.addMessage(testConversation.id, 'Received message', false);

      const updatedConversations = storage.load();
      const updatedConversation = updatedConversations.find(c => c.id === testConversation.id);

      expect(updatedConversation).toBeDefined();
      expect(updatedConversation.unreadCount).toBe(initialUnread + 1);
    });

    it('should not increment unreadCount for sent messages', () => {
      const storage = new MessagingStorage();
      // Create a test conversation
      const testConversation = {
        id: 'test-conv-4',
        name: 'Test User',
        avatar: '👤',
        lastMessage: 'Initial',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 2,
        messages: []
      };
      const conversations = [testConversation];
      storage.save(conversations);

      const initialUnread = testConversation.unreadCount || 0;
      storage.addMessage(testConversation.id, 'Sent message', true);

      const updatedConversations = storage.load();
      const updatedConversation = updatedConversations.find(c => c.id === testConversation.id);

      expect(updatedConversation).toBeDefined();
      expect(updatedConversation.unreadCount).toBe(initialUnread);
    });

    it('should trim message text', () => {
      const storage = new MessagingStorage();
      // Create a test conversation
      const testConversation = {
        id: 'test-conv-5',
        name: 'Test User',
        avatar: '👤',
        lastMessage: 'Initial',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        messages: []
      };
      const conversations = [testConversation];
      storage.save(conversations);

      const message = storage.addMessage(testConversation.id, '  Trimmed message  ', true);

      expect(message).toBeDefined();
      expect(message.text).toBe('Trimmed message');
    });

    it('should return undefined if conversation not found', () => {
      const storage = new MessagingStorage();
      const message = storage.addMessage('non-existent-id', 'Test', true);

      expect(message).toBeUndefined();
    });
  });

  describe('Marking as Read', () => {
    it('should mark conversation as read', () => {
      const storage = new MessagingStorage();
      const conversations = storage.load();
      const conversation = conversations[0];

      if (conversation) {
        // Set unread count
        conversation.unreadCount = 5;
        storage.save(conversations);

        storage.markAsRead(conversation.id);

        const updatedConversations = storage.load();
        const updatedConversation = updatedConversations.find(c => c.id === conversation.id);

        expect(updatedConversation.unreadCount).toBe(0);
      }
    });

    it('should handle marking non-existent conversation as read', () => {
      const storage = new MessagingStorage();

      // Should not throw error
      expect(() => storage.markAsRead('non-existent-id')).not.toThrow();
    });
  });

  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const storage = new MessagingStorage();
      const id1 = storage.generateId();
      const id2 = storage.generateId();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should generate IDs with consistent format', () => {
      const storage = new MessagingStorage();
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

  describe('Time Formatting', () => {
    it('should format time as "now" for recent messages', () => {
      const storage = new MessagingStorage();
      const now = new Date().toISOString();
      const formatted = storage.formatTime(now);

      expect(formatted).toBe('now');
    });

    it('should format time in minutes for messages less than an hour old', () => {
      const storage = new MessagingStorage();
      const date = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const formatted = storage.formatTime(date.toISOString());

      expect(formatted).toBe('30m');
    });

    it('should handle invalid timestamp', () => {
      const storage = new MessagingStorage();
      const formatted = storage.formatTime('invalid-date');

      // Should handle gracefully, might return "now" or a date string
      expect(typeof formatted).toBe('string');
    });
  });
});
