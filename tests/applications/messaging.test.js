import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('MessagingApp', () => {
  let dom;
  let window;
  let document;
  let MessagingApp;
  let MessagingStorage;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="messaging-window">
            <div id="messaging-conversation-list"></div>
            <div id="messaging-empty-state" style="display: none;"></div>
            <div id="messaging-chat-view" style="display: none;">
              <div class="messaging-chat-header">
                <div class="messaging-chat-header-info">
                  <div id="messaging-chat-header-name"></div>
                </div>
              </div>
              <div id="messaging-messages"></div>
              <div class="messaging-input-container">
                <input type="text" class="messaging-input" id="messaging-input" placeholder="type a message..." />
                <button class="messaging-send-btn" id="messaging-send-btn">send</button>
              </div>
            </div>
          </div>
          <div id="messaging-dock-item"></div>
          <div id="messaging-count-badge" style="display: none;">0</div>
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

    // Load MessagingStorage first
    const storageCode = fs.readFileSync(path.join(__dirname, '../../scripts/applications/messaging/messaging-storage.js'), 'utf8');
    eval(storageCode);
    MessagingStorage = window.MessagingStorage;

    // Load MessagingApp
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/messaging/messaging.js'), 'utf8');
    eval(code);
    MessagingApp = window.MessagingAppClass;
  });

  describe('Initialization', () => {
    it('should initialize messaging app with correct properties', () => {
      const app = new MessagingApp();
      expect(app).toBeDefined();
      expect(app.windowId).toBe('messaging-window');
      expect(app.dockItemId).toBe('messaging-dock-item');
      expect(app.storage).toBeInstanceOf(MessagingStorage);
      expect(Array.isArray(app.conversations)).toBe(true);
      expect(app.currentConversationId).toBeNull();
    });

    it('should cache DOM selectors on init', () => {
      const app = new MessagingApp();
      expect(app.selectors.conversationList).toBeDefined();
      expect(app.selectors.messageInput).toBeDefined();
      expect(app.selectors.sendButton).toBeDefined();
      expect(app.selectors.messagesContainer).toBeDefined();
      expect(app.selectors.chatHeader).toBeDefined();
      expect(app.selectors.emptyState).toBeDefined();
      expect(app.selectors.badge).toBeDefined();
    });

    it('should handle missing window element gracefully', () => {
      const originalGetElementById = document.getElementById;
      document.getElementById = vi.fn((id) => {
        if (id === 'messaging-window') return null;
        return originalGetElementById.call(document, id);
      });

      const app = new MessagingApp();
      expect(app.window).toBeNull();

      document.getElementById = originalGetElementById;
    });

    it('should initialize renderedMessageCount to 0', () => {
      const app = new MessagingApp();
      expect(app.renderedMessageCount).toBe(0);
    });
  });

  describe('Loading Conversations', () => {
    it('should load conversations from storage', () => {
      const app = new MessagingApp();
      expect(Array.isArray(app.conversations)).toBe(true);
      expect(app.conversations.length).toBeGreaterThanOrEqual(0);
    });

    it('should reload conversations when loadConversations is called', () => {
      const app = new MessagingApp();
      const initialCount = app.conversations.length;

      // Add a conversation via storage
      const newConv = {
        id: 'test-conv',
        name: 'Test',
        lastMessage: 'Test',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        messages: []
      };
      const conversations = app.storage.load();
      conversations.push(newConv);
      app.storage.save(conversations);

      app.loadConversations();
      expect(app.conversations.length).toBe(initialCount + 1);
    });
  });

  describe('Rendering Conversation List', () => {
    it('should render empty state when no conversations', () => {
      const app = new MessagingApp();
      app.conversations = [];
      app.renderConversationList();

      const conversationList = document.getElementById('messaging-conversation-list');
      expect(conversationList.innerHTML).toContain('no conversations');
      expect(conversationList.innerHTML).toContain('💬');
    });

    it('should render conversations list', () => {
      const app = new MessagingApp();
      app.conversations = [
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
      app.renderConversationList();

      const conversationList = document.getElementById('messaging-conversation-list');
      expect(conversationList.innerHTML).toContain('Test User');
      expect(conversationList.innerHTML).toContain('Hello');
    });

    it('should mark active conversation', () => {
      const app = new MessagingApp();
      app.conversations = [
        {
          id: 'conv-1',
          name: 'Test User',
          lastMessage: 'Hello',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          messages: []
        }
      ];
      app.currentConversationId = 'conv-1';
      app.renderConversationList();

      const conversationList = document.getElementById('messaging-conversation-list');
      const conversationItem = conversationList.querySelector('[data-conversation-id="conv-1"]');
      expect(conversationItem.classList.contains('active')).toBe(true);
    });

    it('should display unread count', () => {
      const app = new MessagingApp();
      app.conversations = [
        {
          id: 'conv-1',
          name: 'Test User',
          lastMessage: 'Hello',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 5,
          messages: []
        }
      ];
      app.renderConversationList();

      const conversationList = document.getElementById('messaging-conversation-list');
      expect(conversationList.innerHTML).toContain('5');
    });

    it('should handle missing conversation list element', () => {
      const app = new MessagingApp();
      app.selectors.conversationList = null;

      // Should not throw error
      expect(() => app.renderConversationList()).not.toThrow();
    });
  });

  describe('Opening Conversations', () => {
    it('should open a conversation', () => {
      const app = new MessagingApp();
      const conversation = app.conversations[0];

      if (conversation) {
        app.openConversation(conversation.id);

        expect(app.currentConversationId).toBe(conversation.id);
      }
    });

    it('should mark conversation as read when opened', () => {
      const app = new MessagingApp();
      const conversation = app.conversations[0];

      if (conversation) {
        conversation.unreadCount = 5;
        app.storage.save(app.conversations);

        app.openConversation(conversation.id);

        const updatedConversations = app.storage.load();
        const updatedConversation = updatedConversations.find(c => c.id === conversation.id);
        expect(updatedConversation.unreadCount).toBe(0);
      }
    });

    it('should render messages when opening conversation', () => {
      const app = new MessagingApp();
      const conversation = app.conversations[0];

      if (conversation) {
        const renderMessagesSpy = vi.spyOn(app, 'renderMessages');
        app.openConversation(conversation.id);

        expect(renderMessagesSpy).toHaveBeenCalled();
        renderMessagesSpy.mockRestore();
      }
    });

    it('should show chat view and hide empty state when opening conversation', () => {
      const app = new MessagingApp();
      const conversation = app.conversations[0];

      if (conversation) {
        app.openConversation(conversation.id);

        const chatView = document.getElementById('messaging-chat-view');
        const emptyState = document.getElementById('messaging-empty-state');

        expect(chatView.style.display).toBe('flex');
        expect(emptyState.style.display).toBe('none');
      }
    });

    it('should handle opening non-existent conversation', () => {
      const app = new MessagingApp();

      // Should not throw error
      expect(() => app.openConversation('non-existent-id')).not.toThrow();
    });

    it('should reset renderedMessageCount when opening conversation', () => {
      const app = new MessagingApp();
      const conversation = app.conversations[0];

      if (conversation) {
        app.renderedMessageCount = 10;
        // Reset happens before renderMessages is called
        const renderMessagesSpy = vi.spyOn(app, 'renderMessages').mockImplementation(() => {});
        app.openConversation(conversation.id);

        expect(app.renderedMessageCount).toBe(0);
        renderMessagesSpy.mockRestore();
      }
    });
  });

  describe('Rendering Messages', () => {
    it('should render empty state when no messages', () => {
      const app = new MessagingApp();
      const conversation = {
        id: 'conv-1',
        name: 'Test',
        messages: []
      };

      app.renderMessages(conversation);

      const messagesContainer = document.getElementById('messaging-messages');
      expect(messagesContainer.innerHTML).toContain('no messages yet');
      expect(app.renderedMessageCount).toBe(0);
    });

    it('should render messages', () => {
      const app = new MessagingApp();
      const conversation = {
        id: 'conv-1',
        name: 'Test',
        messages: [
          {
            id: 'msg-1',
            text: 'Hello',
            timestamp: new Date().toISOString(),
            sent: true
          }
        ]
      };

      app.renderMessages(conversation);

      const messagesContainer = document.getElementById('messaging-messages');
      expect(messagesContainer.innerHTML).toContain('Hello');
      expect(app.renderedMessageCount).toBe(1);
    });

    it('should render sent and received messages differently', () => {
      const app = new MessagingApp();
      const conversation = {
        id: 'conv-1',
        name: 'Test',
        messages: [
          {
            id: 'msg-1',
            text: 'Sent',
            timestamp: new Date().toISOString(),
            sent: true
          },
          {
            id: 'msg-2',
            text: 'Received',
            timestamp: new Date().toISOString(),
            sent: false
          }
        ]
      };

      app.renderMessages(conversation);

      const messagesContainer = document.getElementById('messaging-messages');
      expect(messagesContainer.innerHTML).toContain('sent');
      expect(messagesContainer.innerHTML).toContain('received');
    });

    it('should show date separator for first message', () => {
      const app = new MessagingApp();
      const conversation = {
        id: 'conv-1',
        name: 'Test',
        messages: [
          {
            id: 'msg-1',
            text: 'Hello',
            timestamp: new Date().toISOString(),
            sent: true
          }
        ]
      };

      app.renderMessages(conversation);

      const messagesContainer = document.getElementById('messaging-messages');
      expect(messagesContainer.querySelector('.messaging-date-separator')).toBeDefined();
    });

    it('should show date separator when date changes', () => {
      const app = new MessagingApp();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const conversation = {
        id: 'conv-1',
        name: 'Test',
        messages: [
          {
            id: 'msg-1',
            text: 'Yesterday',
            timestamp: yesterday.toISOString(),
            sent: true
          },
          {
            id: 'msg-2',
            text: 'Today',
            timestamp: new Date().toISOString(),
            sent: true
          }
        ]
      };

      app.renderMessages(conversation);

      const messagesContainer = document.getElementById('messaging-messages');
      const separators = messagesContainer.querySelectorAll('.messaging-date-separator');
      expect(separators.length).toBeGreaterThan(0);
    });

    it('should incrementally render new messages', () => {
      const app = new MessagingApp();
      const conversation = {
        id: 'conv-1',
        name: 'Test',
        messages: [
          {
            id: 'msg-1',
            text: 'First',
            timestamp: new Date().toISOString(),
            sent: true
          }
        ]
      };

      app.renderMessages(conversation);
      expect(app.renderedMessageCount).toBe(1);

      conversation.messages.push({
        id: 'msg-2',
        text: 'Second',
        timestamp: new Date().toISOString(),
        sent: true
      });

      app.renderMessages(conversation);
      expect(app.renderedMessageCount).toBe(2);

      const messagesContainer = document.getElementById('messaging-messages');
      expect(messagesContainer.innerHTML).toContain('First');
      expect(messagesContainer.innerHTML).toContain('Second');
    });

    it('should update chat header name', () => {
      const app = new MessagingApp();
      const conversation = {
        id: 'conv-1',
        name: 'Test User',
        messages: []
      };

      app.renderMessages(conversation);

      const chatHeader = document.getElementById('messaging-chat-header-name');
      expect(chatHeader.textContent).toBe('Test User');
    });

    it('should handle missing messages container', () => {
      const app = new MessagingApp();
      app.selectors.messagesContainer = null;
      const conversation = {
        id: 'conv-1',
        name: 'Test',
        messages: []
      };

      // Should not throw error
      expect(() => app.renderMessages(conversation)).not.toThrow();
    });
  });

  describe('Sending Messages', () => {
    it('should send a message', () => {
      const app = new MessagingApp();
      // Create a test conversation
      const testConversation = {
        id: 'test-conv-send',
        name: 'Test User',
        avatar: '👤',
        lastMessage: 'Initial',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        messages: []
      };
      app.conversations = [testConversation];
      app.storage.save(app.conversations);
      app.loadConversations();

      app.currentConversationId = testConversation.id;
      app.selectors.messageInput.value = 'Test message';

      const initialMessageCount = testConversation.messages.length;
      app.sendMessage();

      const updatedConversations = app.storage.load();
      const updatedConversation = updatedConversations.find(c => c.id === testConversation.id);
      expect(updatedConversation).toBeDefined();
      expect(updatedConversation.messages.length).toBe(initialMessageCount + 1);
      expect(updatedConversation.messages[updatedConversation.messages.length - 1].text).toBe('Test message');
    });

    it('should clear input after sending message', () => {
      const app = new MessagingApp();
      const conversation = app.conversations[0];

      if (conversation) {
        app.currentConversationId = conversation.id;
        app.selectors.messageInput.value = 'Test message';
        app.sendMessage();

        expect(app.selectors.messageInput.value).toBe('');
      }
    });

    it('should not send empty message', () => {
      const app = new MessagingApp();
      const conversation = app.conversations[0];

      if (conversation) {
        app.currentConversationId = conversation.id;
        app.selectors.messageInput.value = '   ';

        const initialMessageCount = conversation.messages.length;
        app.sendMessage();

        expect(conversation.messages.length).toBe(initialMessageCount);
      }
    });

    it('should not send message if no conversation is open', () => {
      const app = new MessagingApp();
      app.currentConversationId = null;
      app.selectors.messageInput.value = 'Test message';

      // Get initial conversation count
      const initialConversations = app.storage.load();
      const initialMessageCounts = initialConversations.map(c => c.messages.length);

      app.sendMessage();

      const updatedConversations = app.storage.load();
      // Verify no new messages were added to any conversation
      updatedConversations.forEach((conv, index) => {
        if (index < initialConversations.length) {
          expect(conv.messages.length).toBe(initialMessageCounts[index]);
        }
      });
    });

    it('should re-render messages and conversation list after sending', () => {
      const app = new MessagingApp();
      // Create a test conversation
      const testConversation = {
        id: 'test-conv-render',
        name: 'Test User',
        avatar: '👤',
        lastMessage: 'Initial',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        messages: []
      };
      app.conversations = [testConversation];
      app.storage.save(app.conversations);
      app.loadConversations();

      app.currentConversationId = testConversation.id;
      app.selectors.messageInput.value = 'Test message';

      const renderMessagesSpy = vi.spyOn(app, 'renderMessages');
      const renderConversationListSpy = vi.spyOn(app, 'renderConversationList');

      app.sendMessage();

      expect(renderMessagesSpy).toHaveBeenCalled();
      expect(renderConversationListSpy).toHaveBeenCalled();

      renderMessagesSpy.mockRestore();
      renderConversationListSpy.mockRestore();
    });
  });

  describe('Badge Updates', () => {
    it('should update badge with total unread count', () => {
      const app = new MessagingApp();
      app.conversations = [
        {
          id: 'conv-1',
          name: 'User 1',
          lastMessage: 'Hello',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 3,
          messages: []
        },
        {
          id: 'conv-2',
          name: 'User 2',
          lastMessage: 'Hi',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 2,
          messages: []
        }
      ];

      app.updateBadge();

      const badge = document.getElementById('messaging-count-badge');
      expect(badge.textContent).toBe('5');
      expect(badge.style.display).toBe('flex');
    });

    it('should hide badge when no unread messages', () => {
      const app = new MessagingApp();
      app.conversations = [
        {
          id: 'conv-1',
          name: 'User 1',
          lastMessage: 'Hello',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          messages: []
        }
      ];

      app.updateBadge();

      const badge = document.getElementById('messaging-count-badge');
      expect(badge.style.display).toBe('none');
    });

    it('should cap badge at 99+', () => {
      const app = new MessagingApp();
      app.conversations = [
        {
          id: 'conv-1',
          name: 'User 1',
          lastMessage: 'Hello',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 150,
          messages: []
        }
      ];

      app.updateBadge();

      const badge = document.getElementById('messaging-count-badge');
      expect(badge.textContent).toBe('99+');
    });

    it('should handle missing badge element', () => {
      const app = new MessagingApp();
      app.selectors.badge = null;

      // Should not throw error
      expect(() => app.updateBadge()).not.toThrow();
    });
  });

  describe('HTML Escaping', () => {
    it('should escape HTML in message text', () => {
      const app = new MessagingApp();
      const escaped = app.escapeHtml('<script>alert("xss")</script>');

      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
    });

    it('should escape all HTML special characters', () => {
      const app = new MessagingApp();
      const text = '& < > " \'';
      const escaped = app.escapeHtml(text);

      expect(escaped).toContain('&amp;');
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
      expect(escaped).toContain('&quot;');
      expect(escaped).toContain('&#039;');
    });

    it('should handle empty string', () => {
      const app = new MessagingApp();
      const escaped = app.escapeHtml('');

      expect(escaped).toBe('');
    });

    it('should handle null/undefined', () => {
      const app = new MessagingApp();
      const escapedNull = app.escapeHtml(null);
      const escapedUndefined = app.escapeHtml(undefined);

      expect(escapedNull).toBe('');
      expect(escapedUndefined).toBe('');
    });
  });

  describe('Date Separators', () => {
    it('should show separator for first message', () => {
      const app = new MessagingApp();
      const message = {
        timestamp: new Date().toISOString()
      };

      const shouldShow = app.shouldShowDateSeparator(message, null);
      expect(shouldShow).toBe(true);
    });

    it('should show separator when date changes', () => {
      const app = new MessagingApp();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const message = {
        timestamp: new Date().toISOString()
      };
      const prevMessage = {
        timestamp: yesterday.toISOString()
      };

      const shouldShow = app.shouldShowDateSeparator(message, prevMessage);
      expect(shouldShow).toBe(true);
    });

    it('should not show separator for same day', () => {
      const app = new MessagingApp();
      const now = new Date();
      const earlier = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

      const message = {
        timestamp: now.toISOString()
      };
      const prevMessage = {
        timestamp: earlier.toISOString()
      };

      const shouldShow = app.shouldShowDateSeparator(message, prevMessage);
      expect(shouldShow).toBe(false);
    });

    it('should format date separator as "today"', () => {
      const app = new MessagingApp();
      const text = app.getDateSeparatorText(new Date().toISOString());

      expect(text).toBe('today');
    });

    it('should format date separator as "yesterday"', () => {
      const app = new MessagingApp();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const text = app.getDateSeparatorText(yesterday.toISOString());

      expect(text).toBe('yesterday');
    });

    it('should format date separator for older dates', () => {
      const app = new MessagingApp();
      // Create date in local time to avoid timezone issues
      const oldDate = new Date(2024, 0, 15); // January 15, 2024 (month is 0-indexed)
      const text = app.getDateSeparatorText(oldDate.toISOString());

      expect(text.toLowerCase()).toContain('january');
      expect(text).toContain('15');
    });
  });

  describe('Message Time Formatting', () => {
    it('should format message time correctly', () => {
      const app = new MessagingApp();
      const date = new Date('2024-11-22T14:30:00');
      const formatted = app.formatMessageTime(date.toISOString());

      expect(formatted).toMatch(/\d{1,2}:\d{2}/); // e.g., "2:30 PM" or "14:30"
    });
  });

  describe('Window Management', () => {
    it('should open window using WindowManager if available', () => {
      const app = new MessagingApp();
      window.WindowManager = {
        open: vi.fn()
      };

      app.open();

      expect(window.WindowManager.open).toHaveBeenCalledWith(app.window, app.dockItem);
    });

    it('should use fallback when WindowManager is not available', () => {
      const app = new MessagingApp();
      window.WindowManager = undefined;

      app.open();

      expect(app.window.style.display).toBe('block');
    });

    it('should mark conversation as read when opening window', () => {
      const app = new MessagingApp();
      const conversation = app.conversations[0];

      if (conversation) {
        app.currentConversationId = conversation.id;
        conversation.unreadCount = 5;
        app.storage.save(app.conversations);

        app.open();

        const updatedConversations = app.storage.load();
        const updatedConversation = updatedConversations.find(c => c.id === conversation.id);
        expect(updatedConversation.unreadCount).toBe(0);
      }
    });

    it('should close window', () => {
      const app = new MessagingApp();
      if (app.dockItem) {
        app.dockItem.classList.add('active');
        app.close();
        expect(app.dockItem.classList.contains('active')).toBe(false);
      }
    });

    it('should handle close when dock item is missing', () => {
      const app = new MessagingApp();
      app.dockItem = null;

      // Should not throw error
      expect(() => app.close()).not.toThrow();
    });

    it('should handle open when window is missing', () => {
      const app = new MessagingApp();
      app.window = null;

      // Should not throw error
      expect(() => app.open()).not.toThrow();
    });
  });

  describe('Event Listeners', () => {
    it('should setup dock item click handler', () => {
      const app = new MessagingApp();
      const openSpy = vi.spyOn(app, 'open');

      if (app.dockItem) {
        const event = new window.Event('click', { bubbles: true });
        app.dockItem.dispatchEvent(event);

        expect(openSpy).toHaveBeenCalled();
        openSpy.mockRestore();
      }
    });

    it('should handle conversation item clicks', () => {
      const app = new MessagingApp();
      app.conversations = [
        {
          id: 'conv-1',
          name: 'Test User',
          lastMessage: 'Hello',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          messages: []
        }
      ];
      app.renderConversationList();

      const openConversationSpy = vi.spyOn(app, 'openConversation');
      const conversationItem = document.querySelector('[data-conversation-id="conv-1"]');

      if (conversationItem) {
        conversationItem.click();
        expect(openConversationSpy).toHaveBeenCalledWith('conv-1');
        openConversationSpy.mockRestore();
      }
    });

    it('should send message on Enter key', () => {
      const app = new MessagingApp();
      const conversation = app.conversations[0];

      if (conversation) {
        app.currentConversationId = conversation.id;
        app.selectors.messageInput.value = 'Test message';

        const sendMessageSpy = vi.spyOn(app, 'sendMessage');
        const event = new window.KeyboardEvent('keypress', { key: 'Enter', bubbles: true });
        app.selectors.messageInput.dispatchEvent(event);

        expect(sendMessageSpy).toHaveBeenCalled();
        sendMessageSpy.mockRestore();
      }
    });

    it('should not send message on Shift+Enter', () => {
      const app = new MessagingApp();
      const conversation = app.conversations[0];

      if (conversation) {
        app.currentConversationId = conversation.id;
        app.selectors.messageInput.value = 'Test message';

        const sendMessageSpy = vi.spyOn(app, 'sendMessage');
        const event = new window.KeyboardEvent('keypress', { key: 'Enter', shiftKey: true, bubbles: true });
        app.selectors.messageInput.dispatchEvent(event);

        expect(sendMessageSpy).not.toHaveBeenCalled();
        sendMessageSpy.mockRestore();
      }
    });

    it('should send message on send button click', () => {
      const app = new MessagingApp();
      const conversation = app.conversations[0];

      if (conversation) {
        app.currentConversationId = conversation.id;
        app.selectors.messageInput.value = 'Test message';

        const sendMessageSpy = vi.spyOn(app, 'sendMessage');
        app.selectors.sendButton.click();

        expect(sendMessageSpy).toHaveBeenCalled();
        sendMessageSpy.mockRestore();
      }
    });
  });
});
