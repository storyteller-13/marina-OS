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
        // Normalize entries to include required fields for app compatibility
        return defaults.map(entry => this.normalizeEntry(entry));
    }

    normalizeEntry(entry) {
        return {
            id: entry.id || this.generateId(),
            title: entry.title || '',
            content: entry.content || '',
            createdAt: entry.date || entry.createdAt || new Date().toISOString(),
            updatedAt: entry.updatedAt || null,
            read: entry.read || false
        };
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
        return [
            {
                date: '2025-12-08T00:00:00.000Z',
                title: 'today',
                content: this.cleanContent(`
we get up and fight...
                `)
            },
            {
                date: '2025-12-15T00:00:00.000Z',
                title: 'i am a perfect 10',
                content: this.cleanContent(`
obviously, last week was very shocking and painful.
all these years. all these people in my old life failed me.
and i don't want to have anything to do with any of them anymore.


i am still learning how to cope with this reality that i was sucked into.
but i am stronger than i have ever been. and i will make it my reality.


and most of my strength is due to the beautiful folks who have been supporting me.
i don't care about the haters anymore. 
i have enough good people on my side.
and i will not die.
on the contrary, i will be reborn as the star i always have been.


and i am a powerful magickian.
i proved that reality is an illusion several times.
perhaps i can even claim that i am the biggest of our lifetime.
(and obviously, next year bad people will be prosecuted like hell)


but for now, i need to be resurrected from death.
completely new and apologetically me.
stronger than ever.
smarter than ever.
brighter than ever.
hotter than ever.
perfercter than ever.


taking a well-deserved break from the interwebs for now.
need to focus on my work, my new community, my future.
2026 is going to be the best year ever yet. period.


whoever is my real tribe will find me offline.
my new friends should be excited to meet me there.
my soulmate can't wait to finally find me in real life.


i will be back online when my new artwork is ready.
all the pain alchemized into gold.

and that's where i start my next glorious life chapter.

                `)
            }
        ];
    }

    cleanContent(content) {
        if (!content) return '';
        
        // Split into lines
        const lines = content.split('\n');
        
        // Remove leading and trailing empty lines
        while (lines.length > 0 && lines[0].trim() === '') {
            lines.shift();
        }
        while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
            lines.pop();
        }
        
        // Find the minimum indentation (excluding empty lines)
        let minIndent = Infinity;
        for (const line of lines) {
            if (line.trim() === '') continue;
            const indent = line.match(/^\s*/)[0].length;
            if (indent < minIndent) {
                minIndent = indent;
            }
        }
        
        // Remove the minimum indentation from all lines
        const cleanedLines = lines.map(line => {
            if (line.trim() === '') return '';
            return line.substring(minIndent);
        });
        
        // Join lines and normalize multiple consecutive newlines to double newlines (paragraph breaks)
        return cleanedLines
            .join('\n')
            .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
            .trim();
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

