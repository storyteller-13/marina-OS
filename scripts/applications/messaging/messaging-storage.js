/**
 * Messaging Storage Module
 * Handles localStorage persistence for messaging conversations
 */
class MessagingStorage {
    constructor() {
        this.storageKey = 'messaging-conversations';
    }

    /**
     * Load conversations from localStorage or return default conversations
     * @returns {Array} Array of conversation objects
     */
    load() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error parsing messaging data from storage:', e);
                return this.getDefaultConversations();
            }
        }
        return this.getDefaultConversations();
    }

    /**
     * Save conversations to localStorage
     * @param {Array} conversations - Array of conversation objects to save
     */
    save(conversations) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(conversations));
        } catch (e) {
            console.error('Error saving messaging data to storage:', e);
        }
    }

    /**
     * Get default conversations structure
     * @returns {Array} Array of default conversation objects
     */
    getDefaultConversations() {
        const now = new Date().toISOString();
        return [
            {
                id: this.generateId(),
                name: 'Alice',
                avatar: '👩',
                lastMessage: 'Hey, how are you?',
                lastMessageTime: now,
                unreadCount: 0,
                messages: [
                    {
                        id: this.generateId(),
                        text: 'Hey, how are you?',
                        sent: false,
                        timestamp: now
                    }
                ]
            },
            {
                id: this.generateId(),
                name: 'Bob',
                avatar: '👨',
                lastMessage: 'See you later!',
                lastMessageTime: now,
                unreadCount: 1,
                messages: [
                    {
                        id: this.generateId(),
                        text: 'See you later!',
                        sent: false,
                        timestamp: now
                    }
                ]
            }
        ];
    }

    /**
     * Add a message to a conversation
     * @param {string} conversationId - ID of the conversation
     * @param {string} text - Message text
     * @param {boolean} sent - Whether the message was sent (true) or received (false)
     * @returns {Object|undefined} Message object or undefined if conversation not found
     */
    addMessage(conversationId, text, sent) {
        const conversations = this.load();
        const conversation = conversations.find(c => c.id === conversationId);

        if (!conversation) {
            return undefined;
        }

        const trimmedText = text.trim();
        const message = {
            id: this.generateId(),
            text: trimmedText,
            sent: sent,
            timestamp: new Date().toISOString()
        };

        conversation.messages.push(message);
        conversation.lastMessage = trimmedText;
        conversation.lastMessageTime = message.timestamp;

        // Increment unread count only for received messages
        if (!sent) {
            conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }

        this.save(conversations);
        return message;
    }

    /**
     * Mark a conversation as read (set unreadCount to 0)
     * @param {string} conversationId - ID of the conversation
     */
    markAsRead(conversationId) {
        const conversations = this.load();
        const conversation = conversations.find(c => c.id === conversationId);

        if (conversation) {
            conversation.unreadCount = 0;
            this.save(conversations);
        }
    }

    /**
     * Generate a unique ID
     * @returns {string} Unique ID string
     */
    generateId() {
        return 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Format a timestamp for display
     * @param {string} timestamp - ISO timestamp string
     * @returns {string} Formatted time string
     */
    formatTime(timestamp) {
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                return 'now';
            }

            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) {
                return 'now';
            } else if (diffMins < 60) {
                return `${diffMins}m`;
            } else if (diffMins < 1440) {
                const hours = Math.floor(diffMins / 60);
                return `${hours}h`;
            } else {
                const days = Math.floor(diffMins / 1440);
                return `${days}d`;
            }
        } catch (e) {
            return 'now';
        }
    }
}

// Expose class for testing
if (typeof window !== 'undefined') {
    window.MessagingStorage = MessagingStorage;
}

