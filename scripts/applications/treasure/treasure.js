/**
 * Treasure Window Application Module
 * Simple iframe-based window
 */
class TreasureApp {
    constructor() {
        this.windowId = 'treasure-window';
        this.dockItemId = 'treasure-dock-item';

        this.window = null;
        this.dockItem = null;
        this.desktopIcon = null;
        this.iframe = null;
        this.originalSrc = 'https://www.youtube.com/embed/wpWOQSgsetk';

        this.init();
    }

    init() {
        this.window = document.getElementById(this.windowId);
        this.dockItem = document.getElementById(this.dockItemId);
        this.desktopIcon = document.getElementById('treasure-desktop-icon');
        this.iframe = document.getElementById('treasure-iframe');

        if (!this.window) {
            return;
        }

        this.setupEventListeners();
        this.setupWindowObserver();
    }

    setupWindowObserver() {
        // Watch for when window is hidden to stop video
        if (this.window && this.iframe) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const display = window.getComputedStyle(this.window).display;
                        if (display === 'none' && this.iframe.src && this.iframe.src !== 'about:blank') {
                            // Window was hidden, stop the video
                            this.iframe.src = 'about:blank';
                        }
                    }
                });
            });

            observer.observe(this.window, {
                attributes: true,
                attributeFilter: ['style']
            });
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

        // Listen for close button clicks to stop video
        if (this.window) {
            const closeButton = this.window.querySelector('.control.close');
            if (closeButton) {
                closeButton.addEventListener('click', (e) => {
                    // Stop the video immediately when close button is clicked
                    if (this.iframe) {
                        this.iframe.src = 'about:blank';
                    }
                }, true); // Use capture phase to run before WindowManager
            }
        }
    }

    open() {
        if (!this.window) return;

        // Restore iframe src if it was cleared or set to about:blank
        if (this.iframe && (!this.iframe.src || this.iframe.src === 'about:blank')) {
            this.iframe.src = this.originalSrc;
        }

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
        // Stop the video by setting iframe src to about:blank
        if (this.iframe) {
            this.iframe.src = 'about:blank';
        }

        if (window.WindowManager && this.window) {
            window.WindowManager.close(this.window, this.dockItem);
        } else if (this.dockItem) {
            this.dockItem.classList.remove('active');
        }
    }
}

// Expose class constructor for testing
window.TreasureAppClass = TreasureApp;

// Initialize when DOM is ready
const initTreasureApp = () => {
    window.TreasureApp = new TreasureApp();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTreasureApp);
} else {
    initTreasureApp();
}

// Expose open function globally for onclick handlers
window.openTreasureWindow = () => {
    if (window.TreasureApp) {
        window.TreasureApp.open();
    }
};


