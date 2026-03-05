/**
 * Home Window Application Module
 * Simple iframe-based window
 */
class HomeApp extends BaseApp {
    constructor() {
        super({ windowId: 'home-window', dockItemId: 'home-dock-item' });
        this.desktopIcon = null;
        this.init();
    }

    init() {
        super.init();
        if (!this.window) return;
        this.desktopIcon = document.getElementById('home-desktop-icon');
        this.setupEventListeners();
    }

    setupEventListeners() {
        super.setupEventListeners();
        if (this.desktopIcon) {
            this.desktopIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.open();
            });
        }
    }
}

// Expose class constructor for testing
window.HomeAppClass = HomeApp;

// Initialize when DOM is ready
const initHomeApp = () => {
    window.HomeApp = new HomeApp();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeApp);
} else {
    initHomeApp();
}

// Expose open function globally for onclick handlers
window.openHomeWindow = () => {
    if (window.HomeApp) {
        window.HomeApp.open();
    }
};
