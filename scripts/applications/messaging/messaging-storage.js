/**
 * Messaging Storage Module
 * Handles localStorage persistence for conversations and messages
 */
class MessagingStorage {
    constructor() {
        this.storageKey = 'messaging-conversations';
    }

    load() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error parsing stored conversations:', e);
            }
        }
        return this.getDefaultConversations();
    }

    save(conversations) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(conversations));
        } catch (e) {
            console.error('Error saving conversations:', e);
        }
    }

    getDefaultConversations() {
        // November 30, 2025 (Sunday) at 1:11pm for "here" message
        const nov30_1_11pm = new Date('2025-11-30T13:11:00Z');
        // November 27, 2025 for other messages
        const nov27_morning = new Date('2025-11-27T10:00:00Z');
        const nov27_afternoon = new Date('2025-11-27T14:30:00Z');
        const nov27_evening = new Date('2025-11-27T18:00:00Z');
        const nov27_night = new Date('2025-11-27T22:15:00Z');

        const conversations = [
            {
                id: this.generateId(),
                name: 'sophia',
                avatar: '👤',
                lastMessage: 'here',
                lastMessageTime: nov30_1_11pm.toISOString(),
                unreadCount: 1,
                messages: [
                    {
                        id: this.generateId(),
                        text: 'Let me know when you see my email.',
                        timestamp: nov27_morning.toISOString(),
                        sent: false
                    },
                    {
                        id: this.generateId(),
                        text: 'all yours this weekend',
                        timestamp: nov27_afternoon.toISOString(),
                        sent: true
                    },
                    {
                        id: this.generateId(),
                        text: 'Fort Canning Park, at The Gate. Sunday. 1:11pm.',
                        timestamp: nov27_evening.toISOString(),
                        sent: false
                    },
                    {
                        id: this.generateId(),
                        text: 'copy that',
                        timestamp: nov27_night.toISOString(),
                        sent: true
                    },
                    {
                        id: this.generateId(),
                        text: 'here',
                        timestamp: nov30_1_11pm.toISOString(),
                        sent: true
                    }
                ]
            }
        ];
        return conversations;
    }

    addMessage(conversationId, text, sent = true) {
        const conversations = this.load();
        const conversation = conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        const message = {
            id: this.generateId(),
            text: text.trim(),
            timestamp: new Date().toISOString(),
            sent: sent
        };

        conversation.messages.push(message);
        conversation.lastMessage = text.trim();
        conversation.lastMessageTime = message.timestamp;
        if (!sent) {
            conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }

        this.save(conversations);
        return message;
    }

    markAsRead(conversationId) {
        const conversations = this.load();
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.unreadCount = 0;
            this.save(conversations);
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'now';
        }

        const now = Date.now();
        const diffMs = now - date.getTime();

        // Handle future dates by formatting as date string
        if (diffMs < 0) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = months[date.getMonth()];
            const day = date.getDate();
            return `${month} ${day}`;
        }

        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        return `${month} ${day}`;
    }
}

// Expose class for testing
if (typeof window !== 'undefined') {
    window.MessagingStorage = MessagingStorage;
}
