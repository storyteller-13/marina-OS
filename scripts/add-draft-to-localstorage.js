/**
 * Browser console script to add draft reply to nikolai in localStorage
 *
 * Copy and paste this entire script into your browser console while on the site
 * to add the draft to your existing localStorage data.
 */

(function() {
    const storageKey = 'email-data';
    const stored = localStorage.getItem(storageKey);

    let data;
    if (stored) {
        try {
            data = JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing email data from storage:', e);
            return;
        }
    } else {
        // If no localStorage data, use default structure
        data = {
            inbox: [],
            sent: [],
            drafts: [],
            trash: []
        };
    }

    // Ensure drafts array exists
    if (!data.drafts) {
        data.drafts = [];
    }

    // Check if draft already exists (by ID or by to/subject)
    const existingDraft = data.drafts.find(d =>
        d.id === 6 ||
        (d.to === 'nikolai@drugoyepolushariye.ru' && d.subject.includes('Re: Отправляю виртуальный пирожок'))
    );

    if (existingDraft) {
        return;
    }

    // Find the highest ID in all folders
    let maxId = 0;
    ['inbox', 'sent', 'drafts', 'trash'].forEach(folder => {
        if (data[folder]) {
            data[folder].forEach(email => {
                if (email.id > maxId) {
                    maxId = email.id;
                }
            });
        }
    });

    // Create new draft
    const draftEmail = {
        id: maxId + 1,
        to: 'nikolai@drugoyepolushariye.ru',
        subject: 'Re: Отправляю виртуальный пирожок и немного заботы',
        preview: '',
        date: new Date().toISOString().split('T')[0],
        read: false,
        body: ''
    };

    // Add to drafts
    data.drafts.push(draftEmail);

    // Save back to localStorage
    try {
        localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
})();
