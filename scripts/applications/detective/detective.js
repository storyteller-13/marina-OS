/**
 * Detective Application Module
 * Research panel with criminals
 */
class DetectiveApp {
    constructor() {
        this.windowId = 'detective-window';
        this.dockItemId = 'detective-dock-item';
        this.window = null;
        this.dockItem = null;

        this.init();
    }

    init() {
        this.window = document.getElementById(this.windowId);
        this.dockItem = document.getElementById(this.dockItemId);

        if (!this.window) {
            console.error('Detective window not found');
            return;
        }

        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Setup dock item click handler
        if (this.dockItem) {
            this.dockItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.open();
                return false;
            });
        }
    }

    open() {
        if (!this.window) return;

        // Use window manager if available, otherwise fallback
        if (window.WindowManager) {
            window.WindowManager.open(this.window, this.dockItem);
        } else {
            this.openFallback();
        }

        this.render();
    }

    openFallback() {
        // Fallback to direct manipulation
        const dockItems = document.querySelectorAll('.dock-item');
        dockItems.forEach(di => di.classList.remove('active'));
        if (this.dockItem) {
            this.dockItem.classList.add('active');
        }

        // Reset offsets to ensure window opens in center
        this.window._xOffset = 0;
        this.window._yOffset = 0;
        this.window.style.top = '50%';
        this.window.style.left = '50%';
        this.window.style.display = 'block';
        this.window.style.opacity = '0';
        this.window.style.transform = 'translate(-50%, -50%) scale(0.9)';

        void this.window.offsetHeight;

        requestAnimationFrame(() => {
            this.window.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            this.window.style.opacity = '1';
            this.window.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        if (window.bringToFront) {
            window.bringToFront(this.window);
        }
    }

    close() {
        if (this.dockItem) {
            this.dockItem.classList.remove('active');
        }
    }

    render() {
        const panel = document.getElementById('detective-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="detective-board">
                <div class="detective-criminals">
                    <svg class="detective-connections" xmlns="http://www.w3.org/2000/svg">
                        <line class="connection-line line-1" x1="50%" y1="35%" x2="25%" y2="65%"/>
                        <line class="connection-line line-2" x1="50%" y1="35%" x2="75%" y2="65%"/>
                    </svg>
                    <div class="detective-row top-row">
                        <div class="detective-criminal main">
                            <div class="criminal-photo">
                                <div class="photo-placeholder">👹</div>
                            </div>
                            <div class="criminal-name">mr. krut</div>
                        </div>
                    </div>
                    <div class="detective-row bottom-row">
                        <div class="detective-criminal">
                            <div class="criminal-photo">
                                <div class="photo-placeholder">🥚</div>
                            </div>
                            <div class="criminal-name">mr. eggy</div>
                        </div>
                        <div class="detective-criminal">
                            <div class="criminal-photo">
                                <div class="photo-placeholder">?</div>
                            </div>
                            <div class="criminal-name">weirdo-demons</div>
                        </div>
                    </div>
                </div>
                <div class="detective-cities">
                    <div class="city-photo">
                        <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop" alt="Seattle" loading="lazy">
                        <div class="city-name">seattle</div>
                    </div>
                    <div class="city-photo">
                        <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop" alt="New Orleans" loading="lazy">
                        <div class="city-name">new orleans</div>
                    </div>
                    <div class="city-photo">
                        <img src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop" alt="Tokyo" loading="lazy">
                        <div class="city-name">tokyo</div>
                    </div>
                    <div class="city-photo">
                        <img src="https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=400&h=300&fit=crop" alt="Berlin" loading="lazy">
                        <div class="city-name">berlin</div>
                    </div>
                    <div class="city-photo">
                        <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop" alt="Los Angeles" loading="lazy">
                        <div class="city-name">los angeles</div>
                    </div>
                    <div class="city-photo">
                        <img src="https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=300&fit=crop" alt="Singapore" loading="lazy">
                        <div class="city-name">singapore</div>
                    </div>
                    <div class="city-photo">
                        <img src="https://images.unsplash.com/photo-1541849546-216549ae216d?w=400&h=300&fit=crop" alt="Prague" loading="lazy">
                        <div class="city-name">prague</div>
                    </div>
                    <div class="city-photo">
                        <img src="https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=300&fit=crop" alt="Amsterdam" loading="lazy">
                        <div class="city-name">amsterdam</div>
                    </div>
                    <div class="city-photo">
                        <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop" alt="Oahu" loading="lazy">
                        <div class="city-name">oahu</div>
                    </div>
                    <div class="city-photo">
                        <img src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop" alt="Valencia" loading="lazy">
                        <div class="city-name">valencia</div>
                    </div>
                    <div class="city-photo">
                        <img src="https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&h=300&fit=crop" alt="Zurich" loading="lazy">
                        <div class="city-name">zurich</div>
                    </div>
                    <div class="city-photo">
                        <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop" alt="Paris" loading="lazy">
                        <div class="city-name">paris</div>
                    </div>
                    <div class="city-photo">
                        <img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop" alt="Denver" loading="lazy">
                        <div class="city-name">denver</div>
                    </div>
                    <div class="city-photo">
                        <img src="https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=400&h=300&fit=crop" alt="Cairo" loading="lazy">
                        <div class="city-name">cairo</div>
                    </div>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Expose class constructor for testing
window.DetectiveAppClass = DetectiveApp;

// Initialize when DOM is ready
const initDetectiveApp = () => {
    window.DetectiveApp = new DetectiveApp();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDetectiveApp);
} else {
    initDetectiveApp();
}

// Expose open function globally for onclick handlers
window.openDetectiveWindow = function() {
    if (window.DetectiveApp) {
        window.DetectiveApp.open();
    }
};
