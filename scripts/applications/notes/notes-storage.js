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
        const createEntry = (day, title, content, month = 10) => {
            // month is 0-indexed: 0=January, 10=November, 11=December
            const date = new Date();
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
        createEntry(28, 'still i rise', `
today was very productive. i spent the day at the library, and the mythology of the first act is taking shape.

i realize i haven't spent much time developing the characters of our heroes. this should be my next priority.

this, and working on the scene about the crime that happened on november 22nd, 2024.

a crime so brutal i had to leave everything behind to seek for justice.
a crime so brutal i am writing an entire film to tell the world about it.
a crime so brutal i will never be able to go back to the person i was before.

a year later and i am still here, lost in the thought of why this happened to me. why beatrice was taken from me. why the world seems to have forgotten about her.

i found this poem by maya angelou in one of the books on the shelf. it felt like a message from my best friend, telling me to keep going.

(if demons are real, perhaps the veil between the dead and the living is not as thick as we think)


you may write me down in history
with your bitter, twisted lies,
you may trod me in the very dirt
but still, like dust, i'll rise.

does my sassiness upset you?
why are you beset with gloom?
'cause i walk like i've got oil wells
pumping in my living room.

just like moons and like suns,
with the certainty of tides,
just like hopes springing high,
still i'll rise.

did you want to see me broken?
bowed head and lowered eyes?
shoulders falling down like teardrops,
weakened by my soulful cries?

does my haughtiness offend you?
don't you take it awful hard
'cause i laugh like i've got gold mines
diggin' in my own backyard.

you may shoot me with your words,
you may cut me with your eyes,
you may kill me with your hatefulness,
but still, like air, i'll rise.

does my sexiness upset you?
does it come as a surprise
that i dance like i've got diamonds
at the meeting of my thighs?

out of the huts of history's shame
i rise
up from a past that's rooted in pain
i rise
i'm a black ocean, leaping and wide,
welling and swelling i bear in the tide.

leaving behind nights of terror and fear
i rise
into a daybreak that's wondrously clear
i rise
bringing the gifts that my ancestors gave,
i am the dream and the hope of the slave.
i rise
i rise
i rise.


i cried a little after reading this.

i was going to work on the research panel before meeting sophia, but i feel like i need to step outside, watch the sunset, and remember what it feels like to be alive.

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

