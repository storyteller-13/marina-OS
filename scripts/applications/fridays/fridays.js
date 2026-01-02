/**
 * Fridays Window Application Module
 * Simple iframe-based window
 */
class FridaysApp {
    constructor() {
        this.windowId = 'fridays-window';
        this.dockItemId = 'fridays-dock-item';

        this.window = null;
        this.dockItem = null;
        this.desktopIcon = null;

        this.init();
    }

    init() {
        this.window = document.getElementById(this.windowId);
        this.dockItem = document.getElementById(this.dockItemId);
        this.desktopIcon = document.getElementById('fridays-desktop-icon');

        if (!this.window) {
            return;
        }

        this.setupEventListeners();
        this.setupAlwaysOnTop();
    }

    setupAlwaysOnTop() {
        // Monitor for any window being opened and ensure fridays stays on top
        const originalOpen = window.WindowManager?.open.bind(window.WindowManager);
        if (window.WindowManager && originalOpen) {
            window.WindowManager.open = (windowElement, dockItem) => {
                originalOpen(windowElement, dockItem);
                // If fridays window is visible, bring it to front
                if (this.window && this.window.style.display !== 'none') {
                    this.window.style.zIndex = '10000';
                    if (window.WindowManager) {
                        window.WindowManager.highestZIndex = 10000;
                    }
                }
            };
        }
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

        // Ensure fridays window stays on top when clicked
        if (this.window) {
            const windowContent = this.window.querySelector('.window-content');
            if (windowContent) {
                windowContent.addEventListener('click', () => {
                    if (window.WindowManager) {
                        this.window.style.zIndex = '10000';
                        window.WindowManager.highestZIndex = 10000;
                    }
                });
            }

            // Also bring to front when window header is clicked
            const windowHeader = this.window.querySelector('.window-header');
            if (windowHeader) {
                windowHeader.addEventListener('click', () => {
                    if (window.WindowManager) {
                        this.window.style.zIndex = '10000';
                        window.WindowManager.highestZIndex = 10000;
                    }
                });
            }
        }
    }

    open() {
        if (!this.window) return;

        // Use WindowManager if available, otherwise fallback for testing/compatibility
        if (window.WindowManager) {
            window.WindowManager.open(this.window, this.dockItem);
            // Ensure fridays window is always on top
            this.window.style.zIndex = '10000';
            window.WindowManager.highestZIndex = 10000;
        } else {
            // Fallback for testing or when WindowManager isn't initialized
            const dockItems = document.querySelectorAll('.dock-item');
            dockItems.forEach(di => di.classList.remove('active'));
            if (this.dockItem) {
                this.dockItem.classList.add('active');
            }
            this.window.style.display = 'block';
            this.window.style.zIndex = '10000';
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
window.FridaysAppClass = FridaysApp;

// Initialize when DOM is ready
const initFridaysApp = () => {
    window.FridaysApp = new FridaysApp();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFridaysApp);
} else {
    initFridaysApp();
}

// Expose open function globally for onclick handlers
window.openFridaysWindow = () => {
    if (window.FridaysApp) {
        window.FridaysApp.open();
    }
};

