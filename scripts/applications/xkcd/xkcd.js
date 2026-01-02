/**
 * XKCD Module
 * Fetches and displays the latest XKCD comic
 */
class XKCDPanel {
    constructor() {
        // Use API proxy in production, or CORS proxy for local development
        // Check if we're on localhost (local dev) or production
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
        
        if (isLocalhost) {
            // For local development, use a CORS proxy
            // Using allorigins.win as a free CORS proxy service
            this.apiUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://xkcd.com/info.0.json');
        } else {
            // For production, use our API endpoint
            this.apiUrl = '/api/xkcd';
        }
        
        this.cacheKey = 'xkcd_cache';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.init();
    }

    init() {
        try {
            this.setupEventListeners();
            // Make sure box is visible
            const box = document.getElementById('xkcd-box');
            if (box) {
                box.style.display = 'block';
                // Ensure box is visible even if CSS hides it
                const computedStyle = window.getComputedStyle(box);
                if (computedStyle.display === 'none') {
                    box.style.display = 'block';
                }
            }
            this.loadXKCD();
        } catch (error) {
            console.error('Error initializing XKCD panel:', error);
        }
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
        console.log('Loading XKCD...');
        // Check cache first
        const cached = this.getCachedXKCD();
        if (cached) {
            console.log('Using cached XKCD data:', cached);
            this.displayXKCD(cached);
            return;
        }

        try {
            console.log('Fetching XKCD from API...');
            const data = await this.fetchXKCD();
            console.log('XKCD API response:', data);
            if (data) {
                this.cacheXKCD(data);
                this.displayXKCD(data);
            } else {
                console.error('No data returned from XKCD API');
                this.showError();
            }
        } catch (error) {
            console.error('Error in loadXKCD:', error);
            this.showError();
        }
    }

    /**
     * Fetches XKCD data from XKCD API with timeout and fallbacks
     */
    async fetchXKCD() {
        const xkcdApiUrl = 'https://xkcd.com/info.0.json';
        const corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        
        // Try primary API endpoint first
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
        
        if (!isLocalhost && this.apiUrl === '/api/xkcd') {
            try {
                console.log('Fetching from API endpoint:', this.apiUrl);
                const response = await this.fetchWithTimeout(this.apiUrl, 10000);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.img) {
                        this.ensureAbsoluteImageUrl(data);
                        return data;
                    }
                }
            } catch (error) {
                console.warn('API endpoint failed, trying CORS proxies...', error);
            }
        }
        
        // Try CORS proxies
        for (const proxy of corsProxies) {
            try {
                const proxyUrl = proxy + encodeURIComponent(xkcdApiUrl);
                console.log('Trying CORS proxy:', proxyUrl);
                
                const response = await this.fetchWithTimeout(proxyUrl, 8000);
                
                if (response.ok) {
                    let data = await response.json();
                    
                    // Some proxies wrap the response, try to unwrap it
                    if (data.contents) {
                        data = JSON.parse(data.contents);
                    }
                    
                    if (data && data.img) {
                        this.ensureAbsoluteImageUrl(data);
                        console.log('Successfully fetched via CORS proxy');
                        return data;
                    }
                }
            } catch (error) {
                console.warn('CORS proxy failed:', error.message);
                continue; // Try next proxy
            }
        }
        
        console.error('All fetch methods failed');
        return null;
    }
    
    /**
     * Fetches with timeout
     */
    async fetchWithTimeout(url, timeout = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }
    
    /**
     * Ensures image URL is absolute
     */
    ensureAbsoluteImageUrl(data) {
        if (data.img && !data.img.startsWith('http')) {
            data.img = 'https://imgs.xkcd.com/comics/' + data.img;
        }
    }

    /**
     * Displays XKCD data in the box
     */
    displayXKCD(data) {
        console.log('Displaying XKCD data:', data);
        const imageContainer = document.getElementById('xkcd-box-image-container');
        const titleElement = document.getElementById('xkcd-box-title');
        const popupImage = document.getElementById('xkcd-popup-image');
        const popupTitle = document.getElementById('xkcd-title');
        const popupAlt = document.getElementById('xkcd-alt');

        if (!imageContainer) {
            console.error('XKCD image container not found!');
            return;
        }

        // Clear loading state
        imageContainer.innerHTML = '';

        // Ensure we have a valid image URL
        if (!data || !data.img) {
            console.error('No image URL in data:', data);
            this.showError();
            return;
        }
        
        // Use the image URL directly from API (should be like https://imgs.xkcd.com/comics/anyone_else_here.png)
        let imageUrl = data.img;
        
        if (!imageUrl || typeof imageUrl !== 'string') {
            console.error('Invalid image URL:', imageUrl);
            this.showError();
            return;
        }
        
        // Ensure URL is absolute (XKCD API should return full URL, but just in case)
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            // If it's just a filename, prepend the base URL
            imageUrl = 'https://imgs.xkcd.com/comics/' + imageUrl;
        }
        
        console.log('Loading XKCD image from:', imageUrl);
        
        // Create image element and set up handlers BEFORE setting src
        const img = document.createElement('img');
        img.alt = data.alt || 'XKCD Comic';
        img.className = 'xkcd-box-image';
        img.loading = 'eager'; // Use eager loading to ensure image loads even if container is not immediately visible
        
        // Force reload if image doesn't load within 5 seconds
        const loadTimeout = setTimeout(() => {
            if (!img.complete || img.naturalWidth === 0) {
                console.warn('Image load timeout, trying to reload...');
                const currentSrc = img.src;
                img.src = '';
                setTimeout(() => {
                    img.src = currentSrc;
                }, 100);
            }
        }, 5000);
        
        // Set up event handlers first
        img.onload = () => {
            clearTimeout(loadTimeout);
            console.log('✓ XKCD image loaded successfully:', imageUrl);
            console.log('  Image dimensions:', img.naturalWidth, 'x', img.naturalHeight);
            // Remove any error/loading state
            const errorDiv = imageContainer.querySelector('.xkcd-error, .xkcd-loading');
            if (errorDiv) {
                errorDiv.remove();
            }
        };
        
        img.onerror = (e) => {
            clearTimeout(loadTimeout);
            console.error('✗ Failed to load XKCD image from:', imageUrl);
            console.error('  Error event:', e);
            console.error('  Image src:', img.src);
            console.error('  Image complete:', img.complete);
            // Remove the failed image
            if (img.parentNode) {
                img.parentNode.removeChild(img);
            }
            this.showError();
        };
        
        // Add to container BEFORE setting src (some browsers need this)
        imageContainer.appendChild(img);
        
        // Now set the src to trigger loading
        img.src = imageUrl;
        
        console.log('Image element created and src set. Waiting for load...');
        
        // Log container state after a brief delay
        setTimeout(() => {
            const loadedImg = imageContainer.querySelector('img');
            console.log('Image container state:', {
                hasImage: loadedImg !== null,
                containerVisible: imageContainer.offsetWidth > 0 && imageContainer.offsetHeight > 0,
                containerWidth: imageContainer.offsetWidth,
                containerHeight: imageContainer.offsetHeight,
                imageSrc: loadedImg ? loadedImg.src : 'none',
                imageComplete: loadedImg ? loadedImg.complete : false,
                imageNaturalWidth: loadedImg ? loadedImg.naturalWidth : 0,
                imageNaturalHeight: loadedImg ? loadedImg.naturalHeight : 0
            });
        }, 500);

        // Keep title as "XKCD"
        if (titleElement) {
            titleElement.textContent = 'XKCD';
            titleElement.title = data.title || 'XKCD Comic';
        }

        // Update popup content
        if (popupImage && data.img) {
            let popupImageUrl = data.img;
            if (!popupImageUrl.startsWith('http://') && !popupImageUrl.startsWith('https://')) {
                popupImageUrl = 'https://imgs.xkcd.com/comics/' + popupImageUrl;
            }
            popupImage.src = popupImageUrl;
        }
        if (popupTitle) popupTitle.textContent = data.title || 'XKCD Comic';
        if (popupAlt) popupAlt.textContent = data.alt || '';
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
            imageContainer.innerHTML = '<div class="xkcd-error">failed to load</div>';
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
            // Error caching XKCD
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

