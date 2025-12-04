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
    sent: [
        {
            id: 7,
            to: 'franfran@alverna.it',
            subject: 'Re: ✨ thinking about you ✨',
            preview: 'thank you, my dear friend',
            date: '2025-11-21',
            read: true,
            body: `thank you, my dear friend,

your words found their way to me like morning light
through the cracks in my own quiet

the new moon you mentioned — i stared at it for a bit
a sliver of possibility in the dark

thank you for remembering this humble old soul
sending my thoughts and prayers your way
`
        }
    ],
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
            id: 1,
            from: 'franfran@alverna.it',
            subject: '✨ thinking about you ✨',
            preview: 'canticle of quiet joy',
            date: '2025-11-20',
            read: false,
            body: `canticle of quiet joy

o brother sun, who warms the waking earth,
spill your gold into the corners of my heart,
that I may rise with grateful breath
and shine upon all I meet.

o sister moon, soft lantern of the night,
teach me the holiness of quiet,
that I may rest in the peace
that gently folds the world asleep.

o brother wind, wandering and free,
carry away the weight I cannot bear,
and whisper courage into my bones
so I may walk lightly again.

o sister water, pure and patient,
wash the dust from weary days,
and leave in me a clear reflection
of kindness unafraid.

o brother fire, dancing with life,
brighten the dull corners of my spirit;
let your flame remind me
that hope is never fully spent.

o mother earth, steadfast and tender,
hold me in your ancient arms,
and teach me how to live rooted in love—
simple, humble, and joyful.

and you, most gentle light,
whose love is the breath of all things:
let me be a small song of peace
in the great music of your creation.

happy new moon, my friend.

-f
`
        },
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
    research: [
        {
            id: 8,
            from: 'sophia@theunderline.org',
            subject: 'Leads',
            preview: 'Hey. I\'ve got some leads on the st4lk3r and their connection to the Malveth case.',
            date: '2025-01-26',
            read: false,
            body: `
Hey. I've got some leads on the st4lk3r and their connection to the Malveth case.

I can't share them over email. Even if encrypted, we can't risk any metadata leaks or traces.

Can we meet in person soon? I'll text you the details.
`
        },
        {
            id: 4,
            from: 'st4lk3r@creepy.xyz',
            subject: 'I saw you today',
            preview: 'You were wearing that black turtle neck again.',
            date: '2025-11-22',
            read: false,
            body: `You were wearing that black turtle neck again.

I noticed you stopped at the same coffee shop. Same order, same time. 8:47 AM. Always 8:47 AM.

Your routine is beautiful in its consistency. Predictable. Safe.

I've been watching. Learning. Waiting.

Don't worry, I'm not dangerous. I just... appreciate you. From a distance.

You'll see me soon. Or maybe you won't. That's part of the fun, isn't it?

Until then.
`
        }
    ],
    trash: [
        {
            id: 3,
            from: 'theking@tribeofjudah.com',
            subject: 'Holiday Plans?',
            preview: 'David here. So, whats your holiday vibe this year?',
            date: '2025-11-21',
            read: false,
            body: `

Hey Doc,

David here. So, what's your holiday vibe this year?
I'm thinking of throwing a little king-sized feast, maybe challenge someone to a slingshot contest (not sure who's gonna step up...).

Let me know if you're free to join. Just don't expect me to dance in public again. Trust me on that.

Catch you later,
Dave
`
        },
        {
            id: 2,
            from: 'the_agent@the_agency.com',
            subject: 'Yo my dude',
            preview: 'Just checking in — are we close to seeing that script yet?',
            date: '2025-11-21',
            read: false,
            body: `

Just checking in — are we close to seeing that script yet?
I'm starting to wonder if it's just a figment of my imagination at this point. 😜

Let's make some magic happen, yeah? Can't wait to read it!
`
        }
    ]
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
