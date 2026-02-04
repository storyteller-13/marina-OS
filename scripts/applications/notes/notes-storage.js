 /**
 * Notes Storage Module
 * Handles localStorage persistence for notes entries
 */
class NotesStorage {
    constructor() {
        this.storageKey = 'notes-entries';
    }

    load() {
        localStorage.removeItem(this.storageKey);
        const defaults = this.getDefaultEntries();
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
        if (!Array.isArray(entries)) {
            return;
        }
    }

/*****************************************
 *          ENTRIES GO HERE 
 *****************************************/
    getDefaultEntries() {
        return [

            {
                date: '2026-01-29T00:00:00.000Z',
                title: 'home, home again',
                content: this.cleanContent(`

my two-months trip to a man-made-island-turned-into-a-technocratic-decentralized-society-somewhere-in-the-middle-of-nowhere-in-malaysia has now come to an end. another story for the collection of wild adventures in my life.

not gonna lie, this one was intense. the theme in vogue was "bittersweet renewal".

---------------
🍭 THE SWEET 🍭
---------------

→ for a little moment during my lifetime, i experienced a completely different lifestyle: a particular flavor of the asian way. i will carry these cute memories with me forever.

→ routine. routine. routine. it was marvelous to have everything taken care of. my desk had a nice view to the ocean so i could simply stare at it while working. healthy meals, a nice cleaning lad every day, a very comfortable bed, a good gym, a very warm shower, many different (and loud!) birds, and many colorful flowers. it was the perfect place to digest all the bitter things that i will describe below.

→ i met an angel who i know i can call a friend for life. this was very precious and unexpected, and i am sure our paths will cross again in the future. [note to k: i will miss our morning walks and philosophical discussions at tom & danny <3].

→ i cleaned up my mind, my goals, my public profiles, and my soul - and i took a few very cute pics. i am stronger than i have ever been in my entire life and very ready for the next chapters.

→ and, as always: G'd, angels, miracles... nuff said.


----------------
🌶️ THE BITTER 🌶️
----------------

→ during my first week here, i lived the worst day of my entire life: when i found out about something really, really, really cruel that was done to me. i never felt so much pain before. i will leave it like this.

→ for around a week after that, i went through the most serious thoughts of ending my life in my entire life. i calculated every single possibility to do it in a way i would not have to deal with the consequences of a "failure" (i.e., how to do it "safely"). only folks who have had a similar experience would understand what i mean here.

→ i did die. there is a part of myself that will never be the same, and it is what it is. i was able to pull myself together after a while and now i recognize that if there is one bright side of the whole situation, it is that i am completely, definitely sure i will never go through this feeling of suicide anymore in my life. this is what "what does not kill you makes you stronger" means for me.

→ around a week or so after that, i found out that my devices were still being hacked and many people were watching what i was doing. i had a goal to write my first book and start a podcast. but after finding out about yet another abuse of my human rights, i decided to halt all plans for january and focus on healing.

→ after exactly a month and four days in here, all my bank accounts were hacked and the criminals left $5.4 in each of them. for the first time in my adult life, i survived three weeks without any form of cash. this was ultra-scary and ultra-weird. [note to self: as a storyteller, this gave me perspectives of what some part of humanity goes through during their lives - something i would never have experienced if i had never left my past hard-worker-upper-class-professional-girl life for the hero's journey].

→ all these hackings were the final proof that a very vicious crime has been happening in my life in the last years, which, as the autistic scientist engineer i am, i suspected but could never put my finger on it. an abuse that many, many people are very aware of, and that we all, as a society, will have to face and pursue full justice.

→ for a few days i felt like i completely lost my sanity. i never felt this way before. on a couple of occasions, the level of anxiety was so high that i could not control my mind. i tried to be in the shower for hours (which i usually do to calm down) and the trick didn't work. i worked it out by walking around the island, finding a desertic place, and screaming very, very loud for a few minutes. [note to self: because i tend to always keep my feelings in check and be more stoic than most people - in such an extreme situation of abuse, i allowed others to watch when i was losing my mind. it just shows authenticity].

→ finally, in the last weeks i started to feel much better, and back to myself. i met someone special who helped me to figure out how to get back home. i was able to process the fact that whatever cruel hardship is happening in my life - or even the interesting opportunity of staying on this island - is ephemeral and will become just another figment of memory, together with all the many other things i have done in the past, as i do all the many other things i will be doing in the future.


-----------
🦋 OUTRO 🦋
-----------

and this is another surreal story of mine. i came here one person, and left as someone completely different. i believe i can claim that i died and resurrected in malaysia. how many people have a story like that?

now, what's next for this brave alien?
everything. ai, science, stories, fun.
stay tuned; the sky is not even the limit.


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

the scientist engineer writer philosopher filmmaker cypherpunk magus is back. but the difference with v2.0 is that this one is ultra-mega death-proof: she is unkillable.

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

by the way, february is when the eclipse season in aqua starts
plus the big neptune+saturn conjuction (on valentine's day!) 
things are going to get whimsical <3

                `)
            }
        ];
    }

 /**
 *          END OF ENTRIES
 */
    cleanContent(content) {
        if (!content) return '';
        const lines = content.split('\n');
        while (lines.length > 0 && lines[0].trim() === '') {
            lines.shift();
        }
        while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
            lines.pop();
        }
        
        let minIndent = Infinity;
        for (const line of lines) {
            if (line.trim() === '') continue;
            const indent = line.match(/^\s*/)[0].length;
            if (indent < minIndent) {
                minIndent = indent;
            }
        }

        const cleanedLines = lines.map(line => {
            if (line.trim() === '') return '';
            return line.substring(minIndent);
        });
        
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

if (typeof window !== 'undefined') {
    window.NotesStorage = NotesStorage;
}

