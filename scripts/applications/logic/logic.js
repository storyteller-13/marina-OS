/**
 * Logic Window Application Module
 * Opens 13.vonsteinkirch.com in a popup window
 */
const LOGIC_URL = 'https://13.vonsteinkirch.com/';
const POPUP_WIDTH = 1200;
const POPUP_HEIGHT = 800;

class LogicApp {
    constructor() {
        this.url = LOGIC_URL;
        this.popupWindow = null;
        this.dockItemId = 'logic-dock-item';
        this.dockItem = null;
        this.desktopIcon = null;

        this.init();
    }

    init() {
        this.dockItem = document.getElementById(this.dockItemId);
        this.desktopIcon = document.getElementById('logic-desktop-icon');

        this.setupEventListeners();
    }

    setupEventListeners() {
        const handleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.open();
        };

        if (this.dockItem) {
            this.dockItem.addEventListener('click', handleClick);
        }

        if (this.desktopIcon) {
            this.desktopIcon.addEventListener('click', handleClick);
        }
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
     * Open logic in popup window with fallback to new tab
     */
    open() {
        const { left, top } = this._getWindowPosition(POPUP_WIDTH, POPUP_HEIGHT);
        const features = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},resizable=yes,scrollbars=yes,noopener=yes`;

        this.popupWindow = window.open(this.url, 'logic', features);

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
window.LogicAppClass = LogicApp;

// Initialize when DOM is ready
const initLogicApp = () => {
    window.LogicApp = new LogicApp();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogicApp);
} else {
    initLogicApp();
}

// Expose open function globally for onclick handlers
window.openLogicWindow = () => {
    if (window.LogicApp) {
        window.LogicApp.open();
    }
};

