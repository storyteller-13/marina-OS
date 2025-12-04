/**
 * Wiki Window Application Module
 * Opens choices.vonsteinkirch.com in a popup window
 */
const WIKI_URL = 'https://choices.vonsteinkirch.com/';
const POPUP_WIDTH = 1200;
const POPUP_HEIGHT = 800;

class WikiApp {
    constructor() {
        this.url = WIKI_URL;
        this.popupWindow = null;
    }

    /**
     * Calculate centered window position
     */
    _getWindowPosition(width, height) {
        return {
            left: Math.floor((screen.width - width) / 2),
            top: Math.floor((screen.height - height) / 2)
        };
    }

    /**
     * Open wiki in popup window with fallback to new tab
     */
    open() {
        const { left, top } = this._getWindowPosition(POPUP_WIDTH, POPUP_HEIGHT);
        const features = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},resizable=yes,scrollbars=yes,noopener=yes`;

        this.popupWindow = window.open(this.url, 'wiki', features);

        // Fallback to new tab if popup was blocked
        if (!this.popupWindow || this.popupWindow.closed) {
            window.open(this.url, '_blank', 'noopener=yes');
        } else {
            this.popupWindow.focus();
        }
    }

    /**
     * Close the popup window if still open
     */
    close() {
        if (this.popupWindow && !this.popupWindow.closed) {
            this.popupWindow.close();
        }
    }
}

// Expose class constructor for testing
window.WikiAppClass = WikiApp;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.WikiApp = new WikiApp();
    });
} else {
    window.WikiApp = new WikiApp();
}

// Expose open function globally for onclick handlers
window.openWikiWindow = function() {
    window.WikiApp.open();
};
