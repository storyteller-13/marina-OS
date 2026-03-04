/**
 * APOD (Astronomy Picture of the Day) Module
 * Fetches and displays NASA's Astronomy Picture of the Day
 */
class APODPanel {
    constructor() {
        // Use API proxy to avoid CORS and rate limiting issues (Env.isLocalhost from env.js)
        const isLocalhost = window.Env && window.Env.isLocalhost();
        if (isLocalhost) {
            // For local development, use NASA API directly with DEMO_KEY
            this.apiUrl = 'https://api.nasa.gov/planetary/apod';
            this.apiKey = 'DEMO_KEY';
        } else {
            // For production, use our API endpoint
            this.apiUrl = '/api/apod';
            this.apiKey = null; // Not needed when using proxy
        }
        
        this.cacheKey = 'apod_cache';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAPOD();
    }

    /**
     * Sets up event listeners for the APOD box
     */
    setupEventListeners() {
        const imageContainer = document.getElementById('apod-box-image-container');
        const box = document.getElementById('apod-box');
        const closeBtn = document.getElementById('apod-box-close');
        const popup = document.getElementById('apod-popup');
        const popupCloseBtn = document.getElementById('apod-close');

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
     * Loads APOD data, checking cache first
     */
    async loadAPOD() {
        // Check cache first
        const cached = this.getCachedAPOD();
        if (cached) {
            this.displayAPOD(cached);
            // Still try to fetch fresh data in background (but don't block on it)
            this.fetchAPOD().then(data => {
                if (data) {
                    this.cacheAPOD(data);
                    // Only update if we got new data
                    if (data.date !== cached.date) {
                        this.displayAPOD(data);
                    }
                }
            }).catch(() => {
                // Silently fail - we already have cached data displayed
            });
            return;
        }

        try {
            const data = await this.fetchAPOD();
            if (data) {
                this.cacheAPOD(data);
                this.displayAPOD(data);
            } else {
                this.showError('unable to load APOD; rate limit may be active.');
            }
        } catch (error) {
            // Check if we have any cached data to show (even if expired)
            const cachedData = this.getCachedAPOD();
            if (cachedData) {
                this.displayAPOD(cachedData);
            } else {
                this.showError('unable to load APOD; please try again later.');
            }
        }
    }

    /**
     * Fetches APOD data from NASA API
     */
    async fetchAPOD() {
        try {
            // Try to get today's picture
            const today = new Date().toISOString().split('T')[0];
            let url;
            
            if (this.apiKey) {
                // Direct API call (local dev)
                url = `${this.apiUrl}?api_key=${this.apiKey}&date=${today}`;
            } else {
                // API proxy (production)
                url = `${this.apiUrl}?date=${today}`;
            }

            const response = await fetch(url);
            
            // Handle rate limiting
            if (response.status === 429) {
                const cached = this.getCachedAPOD();
                if (cached) {
                    return cached;
                }
                throw new Error('rate limited and no cached data available');
            }
            
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();

            // Validate that we have an image
            if (data.media_type !== 'image') {
                // If it's a video, try yesterday's picture
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                
                let yesterdayUrl;
                if (this.apiKey) {
                    yesterdayUrl = `${this.apiUrl}?api_key=${this.apiKey}&date=${yesterdayStr}`;
                } else {
                    yesterdayUrl = `${this.apiUrl}?date=${yesterdayStr}`;
                }
                
                const yesterdayResponse = await fetch(yesterdayUrl);
                if (yesterdayResponse.ok) {
                    return await yesterdayResponse.json();
                }
            }

            return data;
        } catch (error) {
            // Try a random date from the past week as fallback (only if not rate limited)
            if (!error.message.includes('rate limited')) {
                return this.fetchRandomAPOD();
            }
            return null;
        }
    }

    /**
     * Fetches a random APOD from the past week as fallback
     */
    async fetchRandomAPOD() {
        try {
            const daysAgo = Math.floor(Math.random() * 7);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            const dateStr = date.toISOString().split('T')[0];
            
            let url;
            if (this.apiKey) {
                url = `${this.apiUrl}?api_key=${this.apiKey}&date=${dateStr}`;
            } else {
                url = `${this.apiUrl}?date=${dateStr}`;
            }

            const response = await fetch(url);
            
            // Don't retry if rate limited
            if (response.status === 429) {
                return null;
            }
            
            if (response.ok) {
                const data = await response.json();
                if (data.media_type === 'image') {
                    return data;
                }
            }
        } catch (error) {
            // Error fetching random APOD
        }
        return null;
    }

    /**
     * Displays APOD data in the box
     */
    displayAPOD(data) {
        const imageContainer = document.getElementById('apod-box-image-container');
        const titleElement = document.getElementById('apod-box-title');
        const popupImage = document.getElementById('apod-popup-image');
        const popupTitle = document.getElementById('apod-title');
        const popupExplanation = document.getElementById('apod-explanation');
        const popupDate = document.getElementById('apod-date');

        if (!imageContainer) return;

        // Clear loading state
        imageContainer.innerHTML = '';

        // Create image
        const img = document.createElement('img');
        img.src = data.url;
        img.alt = data.title || 'astronomical picture of the day';
        img.className = 'apod-box-image';
        img.onerror = () => this.showError();

        imageContainer.appendChild(img);

        // Keep title as "APOD"
        if (titleElement) {
            titleElement.textContent = 'APOD';
            titleElement.title = data.title || 'astronomical picture of the day';
        }

        // Update popup content
        if (popupImage) popupImage.src = data.url;
        if (popupTitle) popupTitle.textContent = data.title || 'astronomical picture of the day';
        if (popupExplanation) popupExplanation.textContent = data.explanation || '';
        if (popupDate) {
            const date = new Date(data.date);
            popupDate.textContent = date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    /**
     * Shows the popup with full APOD details
     */
    showPopup() {
        const popup = document.getElementById('apod-popup');
        if (popup) {
            popup.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Hides the popup
     */
    hidePopup() {
        const popup = document.getElementById('apod-popup');
        if (popup) {
            popup.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * Shows error state
     */
    showError(message = '') {
        const imageContainer = document.getElementById('apod-box-image-container');
        if (imageContainer) {
            if (message) {
                imageContainer.innerHTML = `<div class="apod-error">🌌<br><small>${message}</small></div>`;
            } else {
                imageContainer.innerHTML = '<div class="apod-error">🌌</div>';
            }
        }
    }

    /**
     * Toggles the visibility of the APOD box
     */
    toggleVisibility() {
        const box = document.getElementById('apod-box');
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
     * Shows the APOD box
     */
    showBox() {
        const box = document.getElementById('apod-box');
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

        // Reload APOD if needed
        this.loadAPOD();
    }

    /**
     * Hides the APOD box
     */
    hideBox() {
        const box = document.getElementById('apod-box');
        if (!box) return;

        box.style.opacity = '0';
        box.style.transform = 'translateY(-10px) scale(0.95)';
        setTimeout(() => {
            box.style.display = 'none';
        }, 400);
    }

    /**
     * Gets cached APOD data if still valid
     */
    getCachedAPOD() {
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
            return null;
        }
    }

    /**
     * Caches APOD data
     */
    cacheAPOD(data) {
        try {
            const cache = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cache));
        } catch (error) {
            // Error caching APOD
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
        window.APODPanel = new APODPanel();
    });
} else {
    window.APODPanel = new APODPanel();
}

// Expose class for testing
window.APODPanelClass = APODPanel;

// Expose open function globally for onclick handlers
window.openApodWindow = () => {
    if (window.APODPanel) {
        window.APODPanel.toggleVisibility();
    }
};
