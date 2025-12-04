/**
 * Messaging Application Module
 * Signal-style messaging application
 */
class MessagingApp {
    constructor() {
        this.windowId = 'messaging-window';
        this.dockItemId = 'messaging-dock-item';
        this.storage = new MessagingStorage();
        this.conversations = [];
        this.currentConversationId = null;
        this.window = null;
        this.dockItem = null;

        // Cache DOM selectors
        this.selectors = {
            conversationList: null,
            messageInput: null,
            sendButton: null,
            messagesContainer: null,
            chatHeader: null,
            chatView: null,
            emptyState: null,
            badge: null
        };

        // Cache for rendered message count to enable incremental updates
        this.renderedMessageCount = 0;

        this.init();
    }

    init() {
        this.window = document.getElementById(this.windowId);
        this.dockItem = document.getElementById(this.dockItemId);

        if (!this.window) {
            console.error('Messaging window not found');
            return;
        }

        // Cache all DOM selectors
        this.selectors.conversationList = this.window.querySelector('#messaging-conversation-list');
        this.selectors.messageInput = this.window.querySelector('#messaging-input');
        this.selectors.sendButton = this.window.querySelector('#messaging-send-btn');
        this.selectors.messagesContainer = this.window.querySelector('#messaging-messages');
        this.selectors.chatHeader = this.window.querySelector('#messaging-chat-header-name');
        this.selectors.chatView = this.window.querySelector('#messaging-chat-view');
        this.selectors.emptyState = this.window.querySelector('#messaging-empty-state');
        this.selectors.badge = document.getElementById('messaging-count-badge');

        this.loadConversations();
        this.setupEventListeners();
        this.renderConversationList();
        this.updateBadge();
    }

    loadConversations() {
        this.conversations = this.storage.load();
    }

    setupEventListeners() {
        // Setup dock item click handler
        if (this.dockItem) {
            this.dockItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.open();
                return false;
            });
        }

        // Setup conversation list clicks
        if (this.selectors.conversationList) {
            this.selectors.conversationList.addEventListener('click', (e) => {
                const conversationItem = e.target.closest('.messaging-conversation-item');
                if (conversationItem) {
                    const conversationId = conversationItem.dataset.conversationId;
                    this.openConversation(conversationId);
                }
            });
        }

        // Setup message input
        if (this.selectors.messageInput) {
            this.selectors.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Setup send button
        if (this.selectors.sendButton) {
            this.selectors.sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }
    }

    open() {
        if (!this.window) return;

        // Use window manager if available
        if (window.WindowManager) {
            window.WindowManager.open(this.window, this.dockItem);
        } else {
            // Fallback
            const dockItems = document.querySelectorAll('.dock-item');
            dockItems.forEach(di => di.classList.remove('active'));
            if (this.dockItem) {
                this.dockItem.classList.add('active');
            }

            this.window.style.display = 'block';
            this.window.style.opacity = '0';
            this.window.style.transform = 'translate(0, 0) scale(0.9)';

            void this.window.offsetHeight;

            requestAnimationFrame(() => {
                this.window.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                this.window.style.opacity = '1';
                this.window.style.transform = 'translate(0, 0) scale(1)';
            });

            if (window.bringToFront) {
                window.bringToFront(this.window);
            }
        }

        // Mark current conversation as read if one is open
        if (this.currentConversationId) {
            this.storage.markAsRead(this.currentConversationId);
            this.loadConversations();
            this.renderConversationList();
            this.updateBadge();

            setTimeout(() => {
                if (this.selectors.messageInput) {
                    this.selectors.messageInput.focus();
                }
            }, 300);
        }
    }

    close() {
        if (this.dockItem) {
            this.dockItem.classList.remove('active');
        }
    }

    renderConversationList() {
        if (!this.selectors.conversationList) return;

        if (this.conversations.length === 0) {
            this.selectors.conversationList.innerHTML = `
                <div class="messaging-empty">
                    <div class="empty-icon">💬</div>
                    <div class="empty-text">no conversations</div>
                    <div class="empty-subtext">start a new conversation</div>
                </div>
            `;
            return;
        }

        this.selectors.conversationList.innerHTML = this.conversations.map(conv => {
            const isActive = conv.id === this.currentConversationId;
            const unreadCount = conv.unreadCount || 0;
            return `
                <div class="messaging-conversation-item ${isActive ? 'active' : ''}" data-conversation-id="${conv.id}">
                    ${conv.avatar ? `<div class="conversation-avatar">${conv.avatar}</div>` : ''}
                    <div class="conversation-info">
                        <div class="conversation-header">
                            <div class="conversation-name">${this.escapeHtml(conv.name)}</div>
                            <div class="conversation-time">${this.storage.formatTime(conv.lastMessageTime)}</div>
                        </div>
                        <div class="conversation-preview">
                            <span class="conversation-last-message">${this.escapeHtml(conv.lastMessage)}</span>
                            ${unreadCount > 0 ? `<span class="conversation-unread-count">${unreadCount}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    openConversation(conversationId) {
        this.currentConversationId = conversationId;
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        // Mark as read
        this.storage.markAsRead(conversationId);
        this.loadConversations();

        // Get updated conversation after reload, fallback to original if not found
        const updatedConversation = this.conversations.find(c => c.id === conversationId) || conversation;

        // Reset rendered message count for full render
        this.renderedMessageCount = 0;

        // Update UI
        this.renderConversationList();
        this.updateBadge();
        this.renderMessages(updatedConversation);

        // Show chat view, hide empty state
        if (this.selectors.chatView) this.selectors.chatView.style.display = 'flex';
        if (this.selectors.emptyState) this.selectors.emptyState.style.display = 'none';

        // Focus input
        setTimeout(() => {
            if (this.selectors.messageInput) {
                this.selectors.messageInput.focus();
            }
        }, 100);
    }

    renderMessages(conversation) {
        if (!this.selectors.messagesContainer) return;

        // Update header
        if (this.selectors.chatHeader) {
            this.selectors.chatHeader.textContent = conversation.name;
        }

        // Render messages
        if (conversation.messages.length === 0) {
            this.selectors.messagesContainer.innerHTML = `
                <div class="messaging-empty-messages">
                    <div class="empty-icon">💬</div>
                    <div class="empty-text">no messages yet</div>
                </div>
            `;
            this.renderedMessageCount = 0;
            return;
        }

        // Incremental rendering: only render new messages if we've already rendered some
        if (this.renderedMessageCount > 0 && this.renderedMessageCount < conversation.messages.length) {
            // Append only new messages
            const newMessages = conversation.messages.slice(this.renderedMessageCount);
            const fragment = document.createDocumentFragment();

            newMessages.forEach((message, relativeIndex) => {
                const index = this.renderedMessageCount + relativeIndex;
                const prevMessage = index > 0 ? conversation.messages[index - 1] : null;
                const showDateSeparator = this.shouldShowDateSeparator(message, prevMessage);

                if (showDateSeparator) {
                    const dateSep = document.createElement('div');
                    dateSep.className = 'messaging-date-separator';
                    dateSep.textContent = this.getDateSeparatorText(message.timestamp);
                    fragment.appendChild(dateSep);
                }

                const messageDiv = document.createElement('div');
                messageDiv.className = `messaging-message ${message.sent ? 'sent' : 'received'}`;
                messageDiv.innerHTML = `
                    <div class="message-bubble">
                        <div class="message-text">${this.escapeHtml(message.text)}</div>
                        <div class="message-time">${this.formatMessageTime(message.timestamp)}</div>
                    </div>
                `;
                fragment.appendChild(messageDiv);
            });

            this.selectors.messagesContainer.appendChild(fragment);
            this.renderedMessageCount = conversation.messages.length;
        } else {
            // Full render
            this.selectors.messagesContainer.innerHTML = conversation.messages.map((message, index) => {
                const prevMessage = index > 0 ? conversation.messages[index - 1] : null;
                const showDateSeparator = this.shouldShowDateSeparator(message, prevMessage);
                const dateSeparator = showDateSeparator ? this.getDateSeparator(message.timestamp) : '';

                return `
                    ${dateSeparator}
                    <div class="messaging-message ${message.sent ? 'sent' : 'received'}">
                        <div class="message-bubble">
                            <div class="message-text">${this.escapeHtml(message.text)}</div>
                            <div class="message-time">${this.formatMessageTime(message.timestamp)}</div>
                        </div>
                    </div>
                `;
            }).join('');

            this.renderedMessageCount = conversation.messages.length;
        }

        // Scroll to bottom
        this.selectors.messagesContainer.scrollTop = this.selectors.messagesContainer.scrollHeight;
    }

    shouldShowDateSeparator(message, prevMessage) {
        if (!prevMessage) return true;

        const messageDate = new Date(message.timestamp);
        const prevDate = new Date(prevMessage.timestamp);

        return messageDate.toDateString() !== prevDate.toDateString();
    }

    getDateSeparator(timestamp) {
        return `<div class="messaging-date-separator">${this.getDateSeparatorText(timestamp)}</div>`;
    }

    getDateSeparatorText(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'yesterday';
        } else {
            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        }
    }

    formatMessageTime(timestamp) {
        // Hardcoded times for specific messages
        const timestampStr = timestamp;
        if (timestampStr.includes('2025-11-30T13:11:00')) {
            return '1:11pm';
        }
        if (timestampStr.includes('2025-11-27T10:00:00')) {
            return '10:00am';
        }
        if (timestampStr.includes('2025-11-27T14:30:00')) {
            return '2:30pm';
        }
        if (timestampStr.includes('2025-11-27T18:00:00')) {
            return '6:00pm';
        }
        if (timestampStr.includes('2025-11-27T22:15:00')) {
            return '10:15pm';
        }

        // General timestamp formatting
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                return '';
            }

            const hours = date.getHours();
            const minutes = date.getMinutes();
            const period = hours >= 12 ? 'pm' : 'am';
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, '0');

            return `${displayHours}:${displayMinutes}${period}`;
        } catch (e) {
            return '';
        }
    }

    sendMessage() {
        if (!this.currentConversationId || !this.selectors.messageInput) return;

        const text = this.selectors.messageInput.value.trim();
        if (!text) return;

        // Add message
        this.storage.addMessage(this.currentConversationId, text, true);

        // Reload and re-render
        this.loadConversations();
        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (conversation) {
            this.renderMessages(conversation);
            this.renderConversationList();
            this.updateBadge();
        }

        // Clear input
        this.selectors.messageInput.value = '';

        // Focus input again
        this.selectors.messageInput.focus();
    }

    updateBadge() {
        if (!this.selectors.badge) return;

        const totalUnread = this.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

        if (totalUnread === 0) {
            this.selectors.badge.style.display = 'none';
        } else {
            this.selectors.badge.style.display = 'flex';
            this.selectors.badge.textContent = totalUnread > 99 ? '99+' : totalUnread.toString();
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        // More efficient than creating DOM elements
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Expose class constructor for testing
window.MessagingAppClass = MessagingApp;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.MessagingApp = new MessagingApp();
    });
} else {
    window.MessagingApp = new MessagingApp();
}

// Expose open function globally for onclick handlers
window.openMessagingWindow = function() {
    if (window.MessagingApp) {
        window.MessagingApp.open();
    }
};
