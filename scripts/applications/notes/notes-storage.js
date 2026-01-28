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
            return;
        }
        // Intentionally not saving to localStorage (cache disabled)
    }

    getDefaultEntries() {
        return [
            {
                date: '2026-01-31T00:00:00.000Z',
                title: 'home, home again',
                content: this.cleanContent(`

today is the last day of my two months living on a man-made-island-turned-to-technocrata-decentralized-society somewhere in the middle of nowhere in malasya. another story for my collection of wild adventures in this life.

not gonna lie, this one was intense. the word in vogue was bittersweet renewal.

---------------
🍭 THE SWEET 🍭
---------------

→ routine. routine. routine. it was marvelous to have everything taken care of: my desk had a nice view to the balcony and the ocean so i could simply stare at it while working. health meals, a nice claening lad coming every day, a very confortbale bed, a very warm shower, many birds, and many flowers. it was the perfect place to process all the bitter things that i describe below.

→ i experienced a completely different lifestyle, the asian way and cousine, and i will carry these cute learnings forever with me.

→ everyone was nice and adventuous, the talks were good, the parties were fun. really good energy (and nobody recognized me!).

→ i met an angel who i know i can call a friend for life. this was very precious and inexpected, and i am sure our paths will cross again in the future.

→ i was pround of myself working out every day and for reading so many good books. 

→ i cleaned up my goals, public profiles, and soul - and i took a few very cute pics. i am stronger than i ever been in my whole life and very ready for the next chapter.


----------------
🌶️ THE BITTER 🌶️
----------------

→ during my first week here i had the worst day of my entire life: when i found out something really really really cruel that was done to me. i never felt so much pain in my entire life.

→ for around a week after that, i went through serious thoughts of ending my life. i calculated every single possibility to do it in a way i would not have to deal with the consequences of a "failure" (e.g., how to do it "safely"). only folks who have had this experience understand what i mean here. 

→ i did die. there is a part of myself who will never be the same, and it is what it is. i was able to pull myself together after a while and now i recognize that if there is one bright side of the whole situation is that i am completely definetly sure i will never go through this feeling of suicide anymore in my life. this is where "what does not kill you make you stronger" comes from.

→ around a week or so after that, i found i was being hacked and many people were watching what i was doing on my computer. i had a plan to write my book and started a podcast, but after finding out this abusive invasion, i decided to go within, heal, and keep my mega plans secret for the time.

→ after exactly a month and 4 days in here, all my bank accounts were hacked and the criminals left $5.4 in each of them. for the first time in my adult life, i survived three weeks without any form of money. this was ultra-scary but it help me understand what a good part of humanity goes through in their life (something i would never experience during my past upper class girl life).

→ all these hackings were the final proof that a very viscious crime has been happening in my life in the last years, which as an autistic scientist engineer i was not aware of. an abuse that we all, as a society, will have to face and pursue full justice.

→ for a few days i felt like i completely lost my sanity. i never felt this way before. in a couple of occasions the level of anxiety was so high that i could not control my mind. i tried be in the shower for hours (which i usually do to calm down) and the trick didn't work. i worked it out by walking around the island, finding a desertic place and screaming very very loud for a few minutes.

→ finally, in the last weeks i started to feel much better, and back to myself. i was able to proccess the fact that whatever is happening in my life - even staying in this island - was epheral and much smaller than all the many other things that i have done and achieved and will do and achieve.


-------------------
🦋 FINAL THOUGHT 🦋
-------------------

another surreal time. i came here one person, and left as someone completely different. i believe i can claim that i died and resurrected in malaysia.

now, how many people have a story like that?


                `)
            },
            {
                date: '2026-01-25T00:00:00.000Z',
                title: 'phoenix',
                content: this.cleanContent(`

👾 this is the story of marina della torre von steinkirch v2.0 👾

i woke up in the middle of the night with an outburst of energy.

the fire was back!
my fire - my beautiful fire - it started to burn, again.

these last weeks (months? years?) have been the hardest of my life.
so intensely hard that i actually died. i did.
but i can't keep carrying this pain around. 
enough. 

i am the master of my life.
i can create universes (it's kinda my speciality 😏).

the person typing these words is the strongest marina that ever existed in all timelines.
she resembles the young overachiever marina who used to be the best at everything she did.
the one who had the biggest dreams and the smartest ideas and would succeed at anything she put her mind to.

but there is one difference.
this one is so so so so so much stronger.
the younger marina was amazing - but she was naive and vulnerable.

not anymore.
i am now the smartest i have ever been.
i am now the most resilient i have ever been.
i am now the most determined i have ever been.
i am now the most unstoppable i have ever been.

(and i am still pretty hot too ☺️)

i have my entire life ahead of me.
so many mountains to make my own.
so many achievements to conquer.
so many feelings to feel.
so many moments to cheer.

the scientist engineer writer philosopher filmmaker cypherpunk magi is back.
but the difference with v2.0 is that this one is ultra-mega death-proof:
she is unkillable.

don't believe. just watch.

(LET'S GO!)

                `)
            },
            {
                date: '2026-01-22T00:00:00.000Z',
                title: 'an ode to my soulmate',
                content: this.cleanContent(`

                    (folks, i am getting very personal here because this is important =); please ignore if you feel it's too far from the usual marina-stoic-gal image you have in your head)

here it goes...

💕

where are you, my beautiful soulmate?
if you really exist in this lifetime (and i know you do)
you must be there somewhere
please, find me - i need you more than ever

at this point you should at least feel my calling
deep in your soul

maybe you don't know me yet
maybe you do
but you must feel me

✨ please, find me ✨

we have a magical life to live
and there is no time to waste anymore
my heart has been longing for you for so long
but now it's time - your beautiful girl needs you now

✨ please, find me ✨

trust the magic
i know i will see you soon
and i already love every cell of your body

<3

                `)
            },
            {
                date: '2026-01-02T00:00:00.000Z',
                title: '0, 1, 2, 3 ... ♾️',
                content: this.cleanContent(`

happy new year of 2026 AD, my anon friends!
we did it - 2025 is now over - thanks g0ds.

it's renewal time.

time to go chase all our wildest dreams.
time to create the best year of our lives yet.
time to believe in ourselves like never before.
time to stop excuses and live the life we want.

here some dates for you to keep in mind:

➡️ january is big cap energy - the best month in the year to get things done - do not waste time!

➡️ february is when the eclipse season in aqua starts - plus the big neptune+saturn conjuction - things are going to get whimsical, get ready!

let's get it, fam!

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

        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        return `${d.getFullYear()}; ${d.getMonth() + 1}; ${d.getDate()}; ${days[d.getDay()]}`;
    }
}

// Expose class for testing
if (typeof window !== 'undefined') {
    window.NotesStorage = NotesStorage;
}

