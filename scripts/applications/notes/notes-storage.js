/**
 * Notes Storage Module
 * Handles localStorage persistence for notes entries
 */
class NotesStorage {
    constructor() {
        this.storageKey = 'notes-entries';
    }

    load() {
        // Always clear cache and return fresh default entries
        // This ensures all entries including the latest are always shown
        // Cache is disabled, so we don't save to localStorage
        localStorage.removeItem(this.storageKey);
        const defaults = this.getDefaultEntries();
        return defaults;
    }

    save(entries) {
        // Cache is disabled, so we don't save to localStorage
        // This method is kept for API compatibility but does nothing
        if (!Array.isArray(entries)) {
            console.error('NotesStorage.save: entries must be an array');
            return;
        }
        // Intentionally not saving to localStorage (cache disabled)
    }

    getDefaultEntries() {
        const createEntry = (day, title, content, month = 11) => {
            // month is 0-indexed: 0=January, 10=November, 11=December
            const date = new Date();
            // Use current year by default (Date already has current year)
            date.setMonth(month);
            date.setDate(day);
            date.setHours(0, 0, 0, 0); // Normalize time

            return {
                id: this.generateId(),
                title,
                content,
                createdAt: date.toISOString(),
                updatedAt: null,
                read: false
            };
        };

        return [
        createEntry(8, 'today', `

            we get up and fight...
`)
        ];
    }


    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(date) {
        if (!date) return '';

        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        const months = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december'];
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        return `${days[d.getDay()]}; ${d.getFullYear()}; ${months[d.getMonth()]}; ${d.getDate()}`;
    }
}

// Expose class for testing
if (typeof window !== 'undefined') {
    window.NotesStorage = NotesStorage;
}

