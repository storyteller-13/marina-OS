/**
 * Home Window Application Module
 * Simple iframe-based window
 */
class HomeApp {
    constructor() {
        this.windowId = 'home-window';
        this.dockItemId = 'home-dock-item';

        this.window = null;
        this.dockItem = null;
        this.desktopIcon = null;

        this.init();
    }

    init() {
        this.window = document.getElementById(this.windowId);
        this.dockItem = document.getElementById(this.dockItemId);
        this.desktopIcon = document.getElementById('home-desktop-icon');

        if (!this.window) {
            console.error('Home window not found');
            return;
        }

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

    open() {
        if (!this.window) return;

        // Use WindowManager if available, otherwise fallback for testing/compatibility
        if (window.WindowManager) {
            window.WindowManager.open(this.window, this.dockItem);
        } else {
            // Fallback for testing or when WindowManager isn't initialized
            const dockItems = document.querySelectorAll('.dock-item');
            dockItems.forEach(di => di.classList.remove('active'));
            if (this.dockItem) {
                this.dockItem.classList.add('active');
            }
            this.window.style.display = 'block';
        }
    }

    close() {
        if (window.WindowManager && this.window) {
            window.WindowManager.close(this.window, this.dockItem);
        } else if (this.dockItem) {
            this.dockItem.classList.remove('active');
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
