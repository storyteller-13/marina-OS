/**
 * Email Storage Module
 * Handles localStorage persistence for email data
 *
 * Note: This module provides utility methods for working with plain data objects.
 * For in-memory data management, use the EmailData class instead.
 * These utility methods are primarily used by tests.
 */
class EmailStorage {
    constructor() {
        this.storageKey = 'email-data';
    }

    /**
     * Load email data from localStorage or return default data
     * @returns {Object} Email data object
     */
    load() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return this.getDefaultData();
            }
        }
        return this.getDefaultData();
    }

    /**
     * Save email data to localStorage
     * @param {Object} data - Email data object to save
     */
    save(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            // Error saving to storage
        }
    }

    /**
     * Get default email data structure
     * Uses shared DEFAULT_EMAIL_DATA from email-data.js if available, otherwise falls back
     * @returns {Object} Default email data (deep cloned to avoid shared references)
     */
    getDefaultData() {
        // Use shared default data from email-data.js if available
        if (typeof window !== 'undefined' && window.DEFAULT_EMAIL_DATA) {
            return JSON.parse(JSON.stringify(window.DEFAULT_EMAIL_DATA));
        }

        // Fallback: create default data structure (shouldn't happen if email-data.js is loaded)
        return {
            inbox: [],
            sent: [],
            drafts: [],
            friends: [],
            trash: []
        };
    }

    /**
     * Utility methods for working with plain data objects
     * These methods mirror EmailData class methods but operate on data objects directly.
     * Primarily used by tests that work with loaded data objects.
     */

    getFolder(data, folderName) {
        return data[folderName] || [];
    }

    getEmail(data, folderName, emailId) {
        const folder = this.getFolder(data, folderName);
        return folder.find(e => e.id === emailId);
    }

    markAsRead(data, folderName, emailId) {
        const email = this.getEmail(data, folderName, emailId);
        if (email) {
            email.read = true;
            this.save(data);
        }
    }

    getUnreadCount(data, folderName) {
        if (folderName === 'inbox') {
            return this.getFolder(data, 'inbox').filter(email => !email.read).length;
        }
        return this.getFolder(data, folderName).length;
    }
}

// Expose class for testing
if (typeof window !== 'undefined') {
    window.EmailStorage = EmailStorage;
}
