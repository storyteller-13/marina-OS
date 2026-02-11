/**
 * Philosophy Quotes Panel
 * Shows a random quote from the curated list in a panel above the XKCD box.
 */
class PhilosophyQuotesPanel {
    constructor() {
        this.quotes = typeof window.PHILOSOPHY_QUOTES !== 'undefined' ? window.PHILOSOPHY_QUOTES : [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        const box = document.getElementById('philosophy-box');
        if (box) {
            box.style.display = 'none';
        }
    }

    setupEventListeners() {
        const box = document.getElementById('philosophy-box');
        const closeBtn = document.getElementById('philosophy-box-close');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideBox());
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && box && box.style.display !== 'none') {
                this.hideBox();
            }
        });
    }

    getRandomQuote() {
        if (!this.quotes.length) {
            return { text: 'No quotes loaded.', author: '' };
        }
        return this.quotes[Math.floor(Math.random() * this.quotes.length)];
    }

    displayQuote() {
        const container = document.getElementById('philosophy-quote-container');
        const authorEl = document.getElementById('philosophy-quote-author');
        if (!container) return;

        const { text, author } = this.getRandomQuote();
        container.textContent = text;
        if (authorEl) authorEl.textContent = author ? `— ${author}` : '';
    }

    toggleVisibility() {
        const box = document.getElementById('philosophy-box');
        if (!box) return;

        const isVisible = box.style.display !== 'none' &&
            window.getComputedStyle(box).display !== 'none';

        if (isVisible) {
            this.hideBox();
        } else {
            this.showBox();
        }
    }

    showBox() {
        const box = document.getElementById('philosophy-box');
        if (!box) return;

        this.displayQuote();
        box.style.display = 'block';
        box.style.opacity = '0';
        box.style.transform = 'translateY(-10px) scale(0.95)';
        void box.offsetHeight;
        requestAnimationFrame(() => {
            box.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            box.style.opacity = '1';
            box.style.transform = 'translateY(0) scale(1)';
        });
    }

    hideBox() {
        const box = document.getElementById('philosophy-box');
        if (!box) return;

        box.style.opacity = '0';
        box.style.transform = 'translateY(-10px) scale(0.95)';
        setTimeout(() => {
            box.style.display = 'none';
        }, 400);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.PhilosophyQuotesPanel = new PhilosophyQuotesPanel();
    });
} else {
    window.PhilosophyQuotesPanel = new PhilosophyQuotesPanel();
}

window.openPhilosophyWindow = () => {
    if (window.PhilosophyQuotesPanel) {
        window.PhilosophyQuotesPanel.toggleVisibility();
    }
};
