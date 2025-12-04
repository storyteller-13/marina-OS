/**
 * Diary Storage Module
 * Handles localStorage persistence for diary entries
 */
class DiaryStorage {
    constructor() {
        this.storageKey = 'diary-entries';
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
            console.error('DiaryStorage.save: entries must be an array');
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

        // November entries
        createEntry(1, 'a glimpse into a brave new future', `
i\'ve been off-the-grid for a couple of days - and it felt surreal.

i met sophia on sunday, and she took me to a place i could never have imagined existed — a place she and her cypherpunk community call "the mesh society".

i arrived just before dusk, when the sun lit this old malaysian ghost island in soft gold and turned the broken windows into glittering fragments.

drones flying around like insects, antennas sprouted from rooftops like metal vines, robots of all kind of shapes and sizes walking around almost indistinguishable from humans, solar panels shimmered between rusted tiles, and everywhere i walked i could sense the quiet hum of encrypted signals.

people debated governance protocols over noodles, traded ideas with the same ease as cryptocurrency, and despite the sharpness of their words, the face-to-face civility on the street was disarming.

what struck me most wasn\'t the technology, though it\'s everywhere, stitched into daily life like a second skin.

it was the moral framework humming underneath it all — a kind of "moral innovation" i've never seen practiced so plainly.

citizenship begins with a social smart contract, not a passport, and everyone speaks about sovereignty as something earned through participation.

there is a strange budding national consciousness here, formed not from shared ancestry but shared intention.

i learned the community has crowdfunded territories far beyond this town — an archipelago of reclaimed resorts, farms, and workshops — and they\'re all tied together by encrypted mesh networks and the same invisible currency that pays for my room tonight.

an on-chain census tracks their population, income, and expanding footprint with clinical precision. it\'s all so improbable, yet the collective action i witnessed — dozens of strangers repairing a roof together, hacking governance tools over plastic tables — makes it feel inevitable.

as i started driving back from that parallel world, i realized i may have walked into the early days of something that calls itself a nation, and might just become one.

and on top of all this, i have new information about the malveth case, the st4lk3r, and the demonic cabal - and what happened to beatrice.

but before i can process any of this, i need to rest. i am dead tired.
`, 10),

        createEntry(22, 'hello world', `old souls, new beginnings.

last day in town, first entry in the diary.

the city feels different today. maybe it's the perspective that comes with knowing you're leaving, or maybe it's just the way the light hits the buildings in the morning.

i've been thinking about what it means to start fresh. there's something beautiful about carrying forward the wisdom of past experiences while embracing the unknown that lies ahead.

this diary will be a companion through it all - a place to capture thoughts, moments, and the quiet reflections that happen in between.`),

        createEntry(23, 'ᛚᛁᚢᛖᛏ ᛖᚱ ᚲᚨᛗᛈ ᛞᚢᛞᛖᚾ ᛖᚱ ᚺᚢᛁᛚᛖ', `yesterday, i spent the day praying and honouring my best friend, who was killed exactly one year ago by demons. i have spent this entire year trying to unveil this crime and destroy the demonic cabal.
it was far bigger than i expected, but i already have many clues.

however, for now, i need to focus on the film.

today, i must focus on mr. krut saty, the first antagonist our heroes will face. i need to understand his motivations, his goals, and his plans. i must feel his spirit in my brain until it hurts so much i can barely breath. then, i must let him attack, and we must endure the pain because we know that, as in any good story, there is always redemption in the end. for everyone.

that's why we are here anyway, that's why stories must be told - to remind us about the rules of the universe.

and, perhaps, that's why cinema is called the 7th art: because it encompasses the full spectrum of human experience - from uncertainty, to illusions, and to hope.`),

        createEntry(25, 'surviving the opening salvo', `slept for 28 hours straight.

it was a weird break from my routine, but honestly, it was welcome.
my mind completely shut down after experiencing mr. krut's presence for the first time.

it was dark, and even though i tend to compartmentalize, i felt scared.
scared that my heroes will really have to be at their best to defeat mr. krut. scared they might not make it.

but i can't worry about that now. i need to start the first act. i need to think about how everything begins. the colors, the tone, the atmosphere.

i need to think about its mystique.

but first, coffee. unfortunately, i can't have it in the same way i'm used to. i need to replan my schedule. it's become too obvious.
    `),

        createEntry(26, 'судьбоносный человек', `
kolya emailed me today. i'm still not sure what to make of it. the message hit like a punch — i couldn't get a single line written afterward.

after what happened last time in new orleans, i was sure we'd never speak again. i thought he'd spend the rest of his life pretending he hadn't seen what he saw.

i thought he'd never forgive me.

and yet here he is, casually talking about pies — as if nothing happened. as if he doesn't remember that every supernatural story we ever laughed at turned out to be real. as if pretending is safer than admitting the world is bigger and darker than we ever imagined.

i miss him. in another world — one where november 22nd, 2024 never happened — we'd be together. probably married. probably happy. beatrice would still be alive. the world would still make sense. no demons. no nightmares. no constant ache in my chest. just... normal.

maybe even happy.

but it did happen. and there's no rewinding fate.

i miss kolya. but i can't let him near this again. i won't drag him back into the dark. i won't let him get hurt — especially not because of me.

on another note, something surfaced about mr. krut. a face. one of his henchmen. i'm going to call him mr. eggy.

a real trickster — he could slip into any conversation, convince anyone he was on their side, and then walk them straight into the shadows.

i keep wondering if his story could bend toward redemption. maybe mr. eggy has a chance to change.

mr. krut, though? no. some kinds of evil are carved too deep to be undone.

unless, of course, i'm wrong.

`),

createEntry(27, 'Σοφία', `
sophia got back to me. there might be some light at the end of the tunnel. i was going nowhere with my research.

i remember when i first met her, right before the accident in tokyo.

beatrice and i were having our favorite omakase when this dark-haired small woman with a mysterious aura walked in.

she was looking for a table for herself, and beatrice invited her to join us.

sophia was a genius hacker. she had worked directly with satoshi nakamoto.
she was one of the maintainers of wikileaks. she had been in prison for a couple of years.

she had so many stories. she was the definition of the word whimsical.
i couldn't take my eyes off her. she was so confident, so sure of herself.

i never really drink alcohol, but that night i let myself indulge in a few sips of sake.

we talked about everything and nothing — about life, about death, about the universe, about the meaning of life.

beatrice had that smirking smile on her face when she noticed how awkward i was acting. she always knew what i was thinking.

damn, i miss beatrice. it has been a year now since she was gone, and i am still hunting her killers every single day.

one of the reasons i came here is to meet sophia — i knew she would help me. and i was not wrong.

    `),

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
    window.DiaryStorage = DiaryStorage;
}
