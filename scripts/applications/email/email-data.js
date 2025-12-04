/**
 * Email Data Module
 * Manages email data structure and operations
 */

// Default email data structure (shared constant)
const DEFAULT_EMAIL_DATA = {
    inbox: [
        {
            id: 6,
            from: 'nikolai@drugoyepolushariye.ru',
            subject: 'Re: Отправляю виртуальный пирожок и немного заботы',
            preview: 'Don\'t shut me down. I\'m here for you.',
            date: '2025-11-27',
            read: false,
            body: `Don\'t shut me down. I\'m here for you.

Let me help you.
`
        }
    ],
    sent: [],
    drafts: [
        {
            id: 9,
            to: 'nikolai@drugoyepolushariye.ru',
            subject: 'Re: Отправляю виртуальный пирожок и немного заботы',
            preview: 'kolya... so much to tell you...',
            date: '2025-01-26',
            read: false,
            body: 'kolya... so much to tell you...'
        }
    ],
    friends: [
        {
            id: 5,
            from: 'nikolai@drugoyepolushariye.ru',
            subject: 'Отправляю виртуальный пирожок и немного заботы',
            preview: 'Привет, my dear friend',
            date: '2025-11-24',
            read: false,
            body: `Привет, my friend

I've been thinking about you lately.
You know, in Russia we have a saying: "Друг познаётся в беде".
Like that Placebo song, I guess :).

So, I wanted to check in, like a proper friend should.

I made myself a cup of черный чай this morning, and I suddenly thought, "I wonder how you're doing today?".

I know things have been a bit heavy for you recently, and even though I'm far away, I want you to know I'm here — listening ears, terrible multidimensional jokes, and all.

How's the film coming along? Am I going to be the inspiration for the villain? Should I start preparing my Брат-style cameo?

Take care. Sending you a virtual пирожок.

С теплом,
николай

`
        }
    ],
    trash: []
};

class EmailData {
    constructor() {
        // Deep clone default data to avoid shared references
        this.data = JSON.parse(JSON.stringify(DEFAULT_EMAIL_DATA));
    }

    /**
     * Get all emails from a folder
     * @param {string} folderName - Name of the folder
     * @returns {Array} Array of emails in the folder
     */
    getFolder(folderName) {
        return this.data[folderName] || [];
    }

    /**
     * Get a specific email by ID from a folder
     * @param {string} folderName - Name of the folder
     * @param {number} emailId - ID of the email
     * @returns {Object|undefined} Email object or undefined if not found
     */
    getEmail(folderName, emailId) {
        const folder = this.getFolder(folderName);
        return folder.find(email => email.id === emailId);
    }

    /**
     * Mark an email as read
     * @param {string} folderName - Name of the folder
     * @param {number} emailId - ID of the email
     * @returns {boolean} True if email was found and marked, false otherwise
     */
    markAsRead(folderName, emailId) {
        const email = this.getEmail(folderName, emailId);
        if (email) {
            email.read = true;
            return true;
        }
        return false;
    }

    /**
     * Get count for a folder
     * For inbox: returns unread count
     * For other folders: returns total count
     * @param {string} folderName - Name of the folder
     * @returns {number} Count of emails (unread for inbox, total for others)
     */
    getUnreadCount(folderName) {
        const folder = this.getFolder(folderName);
        if (folderName === 'inbox') {
            return folder.filter(email => !email.read).length;
        }
        return folder.length;
    }
}

// Expose class and default data for testing/sharing
if (typeof window !== 'undefined') {
    window.EmailData = EmailData;
    window.DEFAULT_EMAIL_DATA = DEFAULT_EMAIL_DATA;
}
