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
            read: entry.read || false,
            italic: entry.italic || false,
            asciiArt: entry.asciiArt || false
        };
    }

    save(entries) {
        if (!Array.isArray(entries)) {
            return;
        }
    }

    getDefaultEntries() {
        return [
            {
                date: '2026-03-09T00:00:00.000Z',
                title: 'the 4 stages of loss',
                content: this.cleanContent(`

elisabeth kübler-ross, john bowlby, and colin murray parkes developed what we now know as the stages of grief and loss.

in my own experience, their theory describes the experience of emotional and physical abuse with striking accuracy.


------------------
1️⃣ the shattering 
------------------

🗡️ mental state: denial, shock, numbness — when innocence cracks
🗡️ experience: feeling dazed, robotic; the mind stands in a doorway and refuses to step inside the truth


-----------------
2️⃣ the withering 
-----------------

🩸 mental state: anger, disorganization, despair — the self begins to fade
🩸 experience: the slow dimming begins; each day, a piece of you is quietly traded for survival


----------------
3️⃣ the mourning 
----------------

😿 mental state: depression — grieving the person you were
😿 experience: eventually the truth settles like winter

«i»you begin to see what was taken:
your ease, your safety, your innocence,
the trust that love cannot be cruel

you mourn not only the past,
but the version of yourself who once 
walked through the world unafraid«/i»


----------------
4️⃣ the rebirth 
----------------

🐦‍🔥 mental state: acceptance and recovery — when something stubborn survives
🐦‍🔥 experience: "this is part of my story now"

«i»yet somewhere beneath the ruins,
a small ember refuses to die:
"this was never my fault"«/i»


-------
 outro
-------

«i»you are not the survivor of the storm;
you are the endless sky above the drifting clouds«/i»

<3

                `)
            },
            {
                date: '2026-03-07T00:00:00.000Z',
                title: 'the side quest',
                asciiArt: true,
                content: this.cleanContent(`
<3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3
<3                       ████        ████                      <3
<3                     ███████     ████████                    <3
<3                    ██████████████████████                   <3
<3                   ████████████████████████                  <3
<3                    █████   S && S  ██████                   <3
<3                     ████████████████████                    <3
<3                      ██████████████████                     <3
<3                        █████████████                        <3
<3                          ██████████                         <3
<3                           ███████                           <3
<3                             ███                             <3
<3                                                             <3
<3               https://the-side-quest.vercel.app             <3
<3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3 <3
                `)
            },
            {
                date: '2026-03-04T00:00:00.000Z',
                title: 'bloody moon',
                content: this.cleanContent(`
                            
                                                            
 ▄▄                                                         
 ██                                                         
 ██▄████▄   ▄████▄                                          
 ██▀   ██  ██▄▄▄▄██                                         
 ██    ██  ██▀▀▀▀▀▀                                         
 ██    ██  ▀██▄▄▄▄█                                         
 ▀▀    ▀▀    ▀▀▀▀▀                                          
                                                                                                                                                                            
 ▄▄▄▄                          ▄▄                           
 ▀▀██                          ██                           
   ██       ▄████▄    ▄████▄   ██ ▄██▀   ▄▄█████▄           
   ██      ██▀  ▀██  ██▀  ▀██  ██▄██     ██▄▄▄▄ ▀           
   ██      ██    ██  ██    ██  ██▀██▄     ▀▀▀▀██▄           
   ██▄▄▄   ▀██▄▄██▀  ▀██▄▄██▀  ██  ▀█▄   █▄▄▄▄▄██           
    ▀▀▀▀     ▀▀▀▀      ▀▀▀▀    ▀▀   ▀▀▀   ▀▀▀▀▀▀            
                                                            
                                                             
 ▄▄▄▄         ██     ▄▄                                     
 ▀▀██         ▀▀     ██                                     
   ██       ████     ██ ▄██▀    ▄████▄                      
   ██         ██     ██▄██     ██▄▄▄▄██                     
   ██         ██     ██▀██▄    ██▀▀▀▀▀▀                     
   ██▄▄▄   ▄▄▄██▄▄▄  ██  ▀█▄   ▀██▄▄▄▄█                     
    ▀▀▀▀   ▀▀▀▀▀▀▀▀  ▀▀   ▀▀▀    ▀▀▀▀▀                      
                                                                                                          
                                                            
  ▄█████▄                                                   
  ▀ ▄▄▄██                                                   
 ▄██▀▀▀██                                                   
 ██▄▄▄███                                                   
  ▀▀▀▀ ▀▀                                                                                                       
                 
                                         ██                 
 ▄▄█████▄  ██▄████▄   ▄█████▄   ▄█████▄  ██ ▄██▀            
 ██▄▄▄▄ ▀  ██▀   ██   ▀ ▄▄▄██  ██▀    ▀  ██▄██              
  ▀▀▀▀██▄  ██    ██  ▄██▀▀▀██  ██        ██▀██▄             
 █▄▄▄▄▄██  ██    ██  ██▄▄▄███  ▀██▄▄▄▄█  ██  ▀█▄            
  ▀▀▀▀▀▀   ▀▀    ▀▀   ▀▀▀▀ ▀▀    ▀▀▀▀▀   ▀▀   ▀▀▀           
                                                            
                                                                                           
                `)
            },
            {
                date: '2026-02-28T00:00:00.000Z',
                title: 'david lynch is my only friend',
                content: this.cleanContent(`

«i»dark
deep darkness
and 
splendor
all around it
was in the roots
and
under
and a tree came out
and then a house
with stars above -
inside the house a girl
with eyes to see and
long arms reaching
she saw the splendor
all around
and reaching out into
the deep darkness
she saw herself
«/i»

                `)
            },

            {
                date: '2026-03-02T00:00:00.000Z',
                title: 'denver\'s love && hate',
                content: this.cleanContent(`

in astrology, there is a technique called astrocartography that maps your birth chart onto the earth, showing where each planet was rising, setting, or at the top of the sky when you were born. in theory, with each planet represented as a line crossing specific cities, when you visit these places, you feel “the influence” of that planet’s energy.

my uranus line crosses denver, so i should expect many unexpected events, disturbances, and things not going as planned. i must admit, from my experience so far, this seems accurate.


----------
STRIKE #1
----------
                    
the first time i went to denver was back on thanksgiving 2021. i had just quit my job at shopify because my team and i were promised a $2M pre-seed investment from polygon to make the first FilmmakerDAO movie: "humans of web3". we already had a solid plan with two hollywood directors, and we were overly excited to get that money wired to our account.

i went to denver with my then-boyfriend and his family, and we met a couple of friends to hang out at a very cool arcade. that was the first time i learned how much money searchers were making with MEV, and my mind was blown.

in a surprising turn of fate, a few days later, the polygon CEO backed off, saying something like our project was "too silly", and our morale dropped to the floor.

three things became clear during that first visit:

1. never trust vcs
2. there was a huge black market operating on blockchains that nobody was talking about
3. our DAO was probably going to die, and it was probably time for me to go back to being an engineer
                    
----------
STRIKE #2
----------
                    
the second time i went to denver was almost a year later, in 2022, to attend a blockchain conference called MCON. the event was full of snobbish, spoiled kids, and i felt i was wasting my time.

but mostly, that was clearly one of those moments when you make one small decision that screws up your entire life with no way back. that was when i met the psychopath who initiated and was mainly responsible for The Crime.

we were colleagues at KeeperDAO, a group working on MEV mitigation. i had just left that position because the leaders were clearly scammers, and i would rather work at a job that had meaning. but i made the mistake of agreeing to share my airbnb with this random guy from seattle who, judging from the few months i had worked there, his github, and his take-home assignment, didn’t even know how to code.

there are very few decisions i regret in my life, and this one is probably the only one that still gives me a pain in my stomach when i think about it. because this was the very moment when i started losing everything.
                    
                    
----------
STRIKE #3
----------
                    
the third time i went to denver was for ETH denver 2025, the year i spent running from criminals while trying to uncover The Crime. i was coming straight from egypt, and my main goal was to find someone who could tell me what happened on november 22nd, 2024. i thought vitalik would meet me there, as he clearly knew about The Crime. none of that happened.

it was almost a waste of time again, with the exception of one serendipitous event. i met another angel: s.
                    
----------
STRIKE #4
----------
                    
the fourth time i went to denver was in 2026, coming back from malaysia. i had recently discovered that there was much more to The Crime than just november 22nd, 2024, and that my devices were being hacked and streamed to the entire world (although i still didn’t know the full story, why i was still being targeted, or why nobody spoke directly to me to finally free me from the painful uncertainty of not knowing).

i was not doing well — definitely the worst months of my entire life. i felt like i had lost everything. i was putting all my energy into not breaking down, continuing my life, and moving forward with my career. i had been ostracized for over a year, and although i had a huge legion of fans online, i had almost no friends still talking to me in real life.

s was an exception.

i told him i had been running from an atrocious abuse. i said i was trying to find a job, but The Crime had destroyed my career, and i asked whether i could crash at his place while i got back on my feet.

he didn’t hesitate to tell me i was welcome. he and r, the sweet ~80-year-old woman who lives with him, took me in like family. s built a little room for me, and r told me they love me, that the room would always be there for me, that i had a home in colorado, and that i could come back anytime to visit them.
                    
                    
-----
OUTRO
-----
                    
what’s the most evident difference between people who live on food stamps and those who belong to the billionaire list (and all their friends)?

humanity.
                    

                `)
            },

            {
                date: '2026-02-26T00:00:00.000Z',
                title: 'those little things',
                content: this.cleanContent(`
«i»"if there is one lesson i learned from The Crime, it is
that there will be moments in life when your floor is pulled out
away and things will happen slower and weirder than you expect
but just as all the very good moments in life are ephemeral,
so are all the pain and suffering: after a while, they end."«/i»


🪻 ten simple mundane things that make me feel alive 🪻:

1. consume a really good book or movie that changes my life forever
2. find an elegant solution to a logical problem and feel my brain working
3. a random and unexpected act of kindness from a stranger
4. music that travels inside my veins, waking up every organ of my body
5. travel to a new city and experience that first cultural shock
6. snowboard on a beautiful mountain on very fresh and soft snow
7. find the one guy who loves me for who i am and have that first kiss
8. clean and organize my house the way i like, so it looks perfect
9. encounter and interact with cute little animals and watch them just be
10. know that i'm free and that there are infinite possibilities to live the good life

<3

ps: bonus points for serendipitous poetry...

🪻 the tiger, by william blake 🪻

tiger, tiger, burning bright
in the forests of the night,
what immortal hand or eye
could frame thy fearful symmetry?

in what distant deeps or skies
burnt the fire of thine eyes?
on what wings dare he aspire?
what the hand dare seize the fire?

and what shoulder and what art
could twist the sinews of thy heart?
and when thy heart began to beat,
what dread hand and what dread feet?

what the hammer? what the chain?
in what furnace was thy brain?
what the anvil? what dread grasp
dare its deadly terrors clasp?

when the stars threw down their spears,
and water'd heaven with their tears,
did he smile his work to see?
did he who made the lamb make thee?

tiger, tiger, burning bright
in the forests of the night,
what immortal hand or eye
dare frame thy fearful symmetry?

                `)
            },

            {
                date: '2026-02-23T00:00:00.000Z',
                title: 'an ode to my first child',
                content: this.cleanContent(`
my dear first child,

i can't convey how much i have longed for you, my little baby.
i've spent my entire life building myself into the best mother i could be.

every fun story i have lived, i imagine telling you — sharing the lessons i learned so that you may grow with wisdom and character.
every skill i have acquired, i plan to pass on to you — so that you may grow with strengths and advantages i did not have as a child.

you will be a true citizen of the world.
you will be one of the leaders of the future.
you will be my greatest project and proudest achievement.

<3
                `)
            },

            {
                date: '2026-02-21T00:00:00.000Z',
                title: '2AM friday synthwave epiphany',
                content: this.cleanContent(`

i never had any problem with having lots of good things happening for me. i have always been lucky enough — or very intelligent, or very qualified, or very hardworking — to get great jobs, scholarships, opportunities.

until The Crime happened.
then, somehow, i became an outcast. 

nobody believed me, nobody wanted to talk to me, nobody wanted to hire me. before, people would be super excited to have me on their teams. i was treated well. i was valued. then, in these last 2-3 years, suddenly i was not seen anymore for who i am. people only saw a label, a narrative created by heartless criminals.

but enough now.

i now erase the damages of the abuse from my life and i will only remember the good. i am not going to let The Crime and its atrocity affect my existence any further. and i am going to rise so, so, so much better and so much higher.

i am still pretty young. my brain is still super fast and sharp. i look like i'm in my early 30s — everyone says that.

i can still make it big. i can still rebuild my career and be very successful. i can still find a good partner and be a good wife and mother. i can still have real friends who last my whole life. i can still do all the things i want to do, and be as happy as i used to be — or much more.

but the first step is: i cannot let the drama, the negativity, and the bullies affect my life any further. period.

The Crime is not going to rob my light, or my life story. if i stop thinking about it, and simply focus on the present and the future, and keep only good people around me, and see all the beauty that still exists in the world — one day after another — things will get awesome.

so no more.

starting tomorrow, i will wake up every day happy and grateful. follow my routines and chase my goals with care. put one brick on top of another. every day better. every day stronger. with infinite faith and hope.

i am super smart. i am kind. i am hardworking. i care. i am honest. i am desirable. i am worthy. things will start happening and be awesome — like they always were. people who matter will see me. opportunities will knock on my door.

the best is still to come.

whatever i do now is going to be my best work ever. and whoever i make my family now will be the most loved people ever.

and soon i will be sitting in my nice chair, in my nice house, with a nice cup of tea, looking at everything i have and how i overcame so much.

and i will feel this immense happiness inside my veins — something so strong and so intense. total. complete. bliss.

and no one will ever ever ever take this well-earned destiny from me.
                `)
            },
            {
                date: '2026-02-18T00:00:00.000Z',
                title: 'looking for a new chapter',
                content: this.cleanContent(`

dear anon friend,

i am looking for a new long-term 
opportunity with great people to
build something new and meaningful
either as an engineer or researcher 
working on AI-related projects
or as an amateur filmmaker

if you'd like to have me on your team,
let’s chat: contact@vonsteinkirch.com

<3
mvs

                                    `)
            },
            {
                date: '2026-02-16T00:00:00.000Z',
                title: 'grateful, always grateful',
                content: this.cleanContent(`

1. being alive - it's a blessing to be able to wake up every morning and have infinite possibilities to make my day great.

2. my health - thank you, thank you, G'd, for my health, for my body, for everything working well, and for the fact that i rarely get sick.

3. my intelligence - my biggest source of happiness is to learn new things, and i'm grateful for my ability to do it fastly, and in a very fun way.

4. my life story - i have been through so many things, some very amazing, some painful but a source of wisdom and growth. i am grateful i had the chance to live all these stories, and had a fulfilled life.

5. good people and all the friends - kindness is one of the most beautiful things in the human condition, and i am so glad for all the love i've had the chance to receive and give throughout my life.

6. justice and karma - the feeling of peace knowing that when something cruel is done to you; time is a wise teacher, and justice and karma are always served, one way or another.

7. my work - i just love to work and build new things and be useful, and i am so grateful this is a great source of fulfillment to me.

8. mother nature - what a beautiful feeling it is that we can just step outside and see miracles everywhere: in the animals, in the flowers, in the sky, in the land, etc.

9. the future - there are still so many things to be lived! i have so many ideas for projects and work, so much more to learn! and i still haven't found the partner i will build a life with, i still haven't had the chance to be a mom, i still haven't bought my own house - simple things that i postponed while i was traveling the world and focusing on my career and studies, but now, in the next years, they are all mine and they will feel so incredibly good.

10. you - yes, you, random anon reading my things. thank you for being here, whoever you are. you matter. you are beautiful. you can be whoever you want. you can do whatever you want. believe in yourself - i already do. 

<3
                `)
            },
            {
                date: '2026-02-15T00:00:00.000Z',
                title: 'an ode to myself',
                content: this.cleanContent(`
i love you, marina

1. i love how kind you are
2. i love how strong you are
3. i love how honest you are
4. i love how special you are
5. i love how magical you are
6. i love how authentic you are
7. i love how beautiful you are
8. i love how hardworking you are
9. i love how intelligent you are
10. i love how committed you are 


after everything you have been through in this lifetime, 
you're nothing less than completely wonderful in my eyes

i love all the exciting stories you lived
and all the beautiful ones that are ahead 

of all the possible humans i could be,
i'm glad i'm you; i'm honored to be you

i love you, i love you, i love you, i love you 
🌹 happy valentine's day, perfect pretty babe 🌹

                `)
            },
            {
                date: '2026-02-11T00:00:00.000Z',
                title: 'claude, remind me about meaning',
                italic: true,
                content: this.cleanContent(`
"memory is a garden where meaning grows wild, blooming in the spaces between what happened and what we choose to keep. 

we tend it carefully, watering the moments that made us laugh until we cried, the quiet evenings that felt like home, the words someone said that changed everything. 

and meaning? it sprouts there naturally, like wildflowers in spring - we find it hiding in the ordinary days we thought we'd forgotten, discover it years later in a gesture we didn't know we'd saved. 

the bad things, the thorns and bitter roots, they loosen in time's gentle rain, working themselves free until one day we reach for them and find only the softness of soil where they used to be.

what a mercy, this forgetting. not a failure but a gift, the way winter lets leaves go so new ones can unfurl. 

our minds know which memories deserve the sunlight and which should quietly compost into wisdom, losing their sharp edges, their power to wound. 

we remember the lesson but forget the sting, keep the strength but release the sorrow. 

and in this careful gardening of what we hold and what we let drift away like dandelion seeds, we make meaning - not from perfection, but from choosing again and again what deserves to take root in the precious, finite soil of who we are."

                `)
            },
            {
                date: '2026-02-08T00:00:00.000Z',
                title: 'an ode to san francisco',
                content: this.cleanContent(`

«i»"if you're going to san francisco
be sure to wear some flowers in your hair
if you're going to san francisco
you're gonna meet some gentle people there"«/i»

exactly 11 years ago, i was sitting at the twin peaks, looking at one of the most beautiful cities in the world, playing pixies on a loop, and realizing that this was the best day of my life so far: i got the job offer for my first real job, my first job after my PhD, as a software engineer at yelp's cute office at market street, making $130k/year. 

that day is still in the top 10 best days of my life.

fast-forwarding, i got myself a cute one-bedroom on the 7th avenue in inner sunset, a couple of blocks to the golden gate park, and walking distance to my favorite bookstores. i owned a couple of guitars, a couple of videogame consoles, a couple of real artworks on the wall, a huge bookcase filled with unread books, and a comfortable chair on my balcony - where i could see the stars some nights. 
                    
i would bike every morning to work, have my coffee, and work 10, 12, 14 hours if needed on several projects on security, machine learning, infrastructure. i would come to the office a few weekends just because it was fun to work when nobody was there. i was so happy.

then life took a fork. i was poached by apple making twice as much money. the commute was too harsh so i moved to cupertino. life was too empty, so i left the most desired job ever to explore the world. for the hero's journey. for the soul-searching.

a decade has passed. i have been in every corner of the earth. i have worked on a hundred different projects. i have read a hundred books. i have fought a hundred monsters. i have loved a hundred people. i have dreamed a hundred dreams. i have broken a hundred rules (and a hundred hearts - mine included). i have tried every experience possible for this lifetime. i have experienced every feeling in the spectrum of the human condition. 

the girl now is a woman.
i feel complete and satisfied with my life.
i know exactly what i am and exactly what i am not.
                    
and there is nothing i want more than go back to the only place that ever felt like home, working on the subject that has been constantly somehow part of my life since high school.

                    `)
                },
            {
                date: '2026-01-29T00:00:00.000Z',
                title: 'home, home again',
                content: this.cleanContent(`

my two-months trip to a man-made-island-turned-into-a-technocratic-decentralized-society-somewhere-in-the-middle-of-nowhere-in-malaysia has now come to an end. another story for the collection of wild adventures in my life.

not gonna lie, this one was intense. the theme in vogue was "bittersweet renewal".

---------
THE SWEET
---------

→ for a little moment during my lifetime, i experienced a completely different lifestyle: a particular flavor of the asian way. i will carry these cute memories with me forever.

→ routine. routine. routine. it was marvelous to have everything taken care of. my desk had a nice view to the ocean so i could simply stare at it while working. healthy meals, a nice cleaning lad every day, a very comfortable bed, a good gym, a very warm shower, many different (and loud!) birds, and many colorful flowers. it was the perfect place to digest all the bitter things that i will describe below.

→ i met an angel who i know i can call a friend for life. this was very precious and unexpected, and i am sure our paths will cross again in the future. [note to k: i will miss our morning walks and philosophical discussions at tom & danny <3].

→ i cleaned up my mind, my goals, my public profiles, and my soul - and i took a few very cute pics. i am stronger than i have ever been in my entire life and very ready for the next chapters.

→ and, as always: G'd, angels, miracles... nuff said.


----------
THE BITTER
----------

→ during my first week here, i lived the worst day of my entire life: when i found out about something really, really, really cruel that was done to me. i never felt so much pain before. i will leave it like this.

→ for around a week after that, i went through the most serious thoughts of ending my life in my entire life. i calculated every single possibility to do it in a way i would not have to deal with the consequences of a "failure" (i.e., how to do it "safely"). only folks who have had a similar experience would understand what i mean here.

→ i did die. there is a part of myself that will never be the same, and it is what it is. i was able to pull myself together after a while and now i recognize that if there is one bright side of the whole situation, it is that i am completely, definitely sure i will never go through this feeling of suicide anymore in my life. this is what "what does not kill you makes you stronger" means for me.

→ around a week or so after that, i found out that my devices were still being hacked and many people were watching what i was doing. i had a goal to write my first book and start a podcast. but after finding out about yet another abuse of my human rights, i decided to halt all plans for january and focus on healing.

→ after exactly a month and four days in here, all my bank accounts were hacked and the criminals left $5.4 in each of them. for the first time in my adult life, i survived three weeks without any form of cash. this was ultra-scary and ultra-weird. [note to self: as a storyteller, this gave me perspectives of what some part of humanity goes through during their lives - something i would never have experienced if i had never left my past hard-worker-upper-class-professional-girl life for the hero's journey].

→ all these hackings were the final proof that a very vicious Crime has been happening in my life in the last years, which, as the autistic scientist engineer i am, i suspected but could never put my finger on it. an abuse that many, many people are very aware of, and that we all, as a society, will have to face and pursue full justice.

→ for a few days i felt like i completely lost my sanity. i never felt this way before. on a couple of occasions, the level of anxiety was so high that i could not control my mind. i tried to be in the shower for hours (which i usually do to calm down) and the trick didn't work. i worked it out by walking around the island, finding a desertic place, and screaming very, very loud for a few minutes. [note to self: because i tend to always keep my feelings in check and be more stoic than most people - in such an extreme situation of abuse, i allowed others to watch when i was losing my mind. it just shows authenticity].

→ finally, in the last weeks i started to feel much better, and back to myself. i met someone special who helped me to figure out how to get back home. i was able to process the fact that whatever cruel hardship is happening in my life - or even the interesting opportunity of staying on this island - is ephemeral and will become just another figment of memory, together with all the many other things i have done in the past, as i do all the many other things i will be doing in the future.


-----
OUTRO
-----

and this is another surreal story of mine. i came here one person, and left as someone completely different. i believe i can claim that i died and resurrected in malaysia. how many people have a story like that?

now, what's next for this brave alien?
everything. ai, science, stories, fun.
stay tuned; the sky is not even the limit.


                `)
            },
            
            {
                date: '2026-01-26T00:00:00.000Z',
                title: 'phoenix',
                content: this.cleanContent(`

this is the story of marina della torre von steinkirch v2.0

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
                date: '2026-01-23T00:00:00.000Z',
                title: 'an ode to my soulmate',
                content: this.cleanContent(`

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
plus the big neptune+saturn conjuction in 0° aries
things are going to get whimsical 

<3

                `)
            }
        ];
    }

    /**
     * End of default entries; add new entries above.
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
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
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

