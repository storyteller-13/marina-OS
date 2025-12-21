/**
 * XKCD Module
 * Fetches and displays XKCD comics
 */
class XKCDPanel {
    constructor() {
        this.apiUrl = 'https://xkcd.com';
        this.cacheKey = 'xkcd_cache';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadXKCD();
    }

    /**
     * Sets up event listeners for the XKCD box
     */
    setupEventListeners() {
        const imageContainer = document.getElementById('xkcd-box-image-container');
        const box = document.getElementById('xkcd-box');
        const closeBtn = document.getElementById('xkcd-box-close');
        const popup = document.getElementById('xkcd-popup');
        const popupCloseBtn = document.getElementById('xkcd-close');

        // Click on image container to show popup
        if (imageContainer) {
            imageContainer.addEventListener('click', () => this.showPopup());
        }

        // Close box button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideBox());
        }

        // Close popup button
        if (popupCloseBtn) {
            popupCloseBtn.addEventListener('click', () => this.hidePopup());
        }

        // Close popup when clicking outside
        if (popup) {
            popup.addEventListener('click', (e) => {
                if (e.target === popup) {
                    this.hidePopup();
                }
            });
        }

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (popup && popup.style.display !== 'none') {
                    this.hidePopup();
                } else if (box && box.style.display !== 'none') {
                    this.hideBox();
                }
            }
        });
    }

    /**
     * Loads XKCD data, checking cache first
     */
    async loadXKCD() {
        // Check cache first
        const cached = this.getCachedXKCD();
        if (cached) {
            this.displayXKCD(cached);
            return;
        }

        try {
            const data = await this.fetchXKCD();
            if (data) {
                this.cacheXKCD(data);
                this.displayXKCD(data);
            }
        } catch (error) {
            console.error('Error loading XKCD:', error);
            this.showError();
        }
    }

    /**
     * Fetches XKCD data from XKCD API
     */
    async fetchXKCD() {
        try {
            // Get the latest comic
            const url = `${this.apiUrl}/info.0.json`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            
            // Validate response has required fields
            if (!data || !data.img) {
                throw new Error('Invalid response from XKCD API');
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching XKCD:', error);
            // Try to return a fallback or null
            return null;
        }
    }

    /**
     * Displays XKCD data in the box
     */
    displayXKCD(data) {
        const imageContainer = document.getElementById('xkcd-box-image-container');
        const titleElement = document.getElementById('xkcd-box-title');
        const popupImage = document.getElementById('xkcd-popup-image');
        const popupTitle = document.getElementById('xkcd-title');
        const popupAlt = document.getElementById('xkcd-alt');
        const popupDate = document.getElementById('xkcd-date');

        if (!imageContainer) return;

        // Clear loading state
        imageContainer.innerHTML = '';

        // Create image
        const img = document.createElement('img');
        img.src = data.img;
        img.alt = data.alt || data.title || 'XKCD Comic';
        img.className = 'xkcd-box-image';
        img.onerror = () => this.showError();

        imageContainer.appendChild(img);

        // Keep title as "XKCD"
        if (titleElement) {
            titleElement.textContent = 'XKCD';
            titleElement.title = data.title || 'XKCD Comic';
        }

        // Update popup content
        if (popupImage) popupImage.src = data.img;
        if (popupTitle) popupTitle.textContent = data.title || 'XKCD Comic';
        if (popupAlt) popupAlt.textContent = data.alt || '';
        if (popupDate) {
            const date = new Date(data.year, data.month - 1, data.day);
            popupDate.textContent = date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    /**
     * Shows the popup with full XKCD details
     */
    showPopup() {
        const popup = document.getElementById('xkcd-popup');
        if (popup) {
            popup.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Hides the popup
     */
    hidePopup() {
        const popup = document.getElementById('xkcd-popup');
        if (popup) {
            popup.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * Shows error state
     */
    showError() {
        const imageContainer = document.getElementById('xkcd-box-image-container');
        if (imageContainer) {
            imageContainer.innerHTML = '<div class="xkcd-error">😄</div>';
        }
    }

    /**
     * Toggles the visibility of the XKCD box
     */
    toggleVisibility() {
        const box = document.getElementById('xkcd-box');
        if (!box) return;

        const isVisible = box.style.display !== 'none' &&
                         window.getComputedStyle(box).display !== 'none';

        if (isVisible) {
            this.hideBox();
        } else {
            this.showBox();
        }
    }

    /**
     * Shows the XKCD box
     */
    showBox() {
        const box = document.getElementById('xkcd-box');
        if (!box) return;

        box.style.display = 'block';
        box.style.opacity = '0';
        box.style.transform = 'translateY(-10px) scale(0.95)';
        void box.offsetHeight; // Force reflow
        requestAnimationFrame(() => {
            box.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            box.style.opacity = '1';
            box.style.transform = 'translateY(0) scale(1)';
        });

        // Reload XKCD if needed
        this.loadXKCD();
    }

    /**
     * Hides the XKCD box
     */
    hideBox() {
        const box = document.getElementById('xkcd-box');
        if (!box) return;

        box.style.opacity = '0';
        box.style.transform = 'translateY(-10px) scale(0.95)';
        setTimeout(() => {
            box.style.display = 'none';
        }, 400);
    }

    /**
     * Gets cached XKCD data if still valid
     */
    getCachedXKCD() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();

            if (now - timestamp < this.cacheExpiry) {
                return data;
            }

            // Cache expired
            localStorage.removeItem(this.cacheKey);
            return null;
        } catch (error) {
            console.error('Error reading XKCD cache:', error);
            return null;
        }
    }

    /**
     * Caches XKCD data
     */
    cacheXKCD(data) {
        try {
            const cache = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cache));
        } catch (error) {
            console.error('Error caching XKCD:', error);
        }
    }

    /**
     * Cleans up event listeners
     */
    destroy() {
        // Event listeners will be cleaned up automatically when elements are removed
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.XKCDPanel = new XKCDPanel();
    });
} else {
    window.XKCDPanel = new XKCDPanel();
}

// Expose class for testing
window.XKCDPanelClass = XKCDPanel;

// Expose open function globally for onclick handlers
window.openXkcdWindow = () => {
    if (window.XKCDPanel) {
        window.XKCDPanel.toggleVisibility();
    }
};

