/**
 * Astro Charts Module
 * Embeds the Chart of the Moment from astro-charts.com
 */
class AstroChartsPanel {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadChart();
    }

    /**
     * Sets up event listeners for the Astro Charts box
     */
    setupEventListeners() {
        const iframeContainer = document.getElementById('astro-charts-box-iframe-container');
        const box = document.getElementById('astro-charts-box');
        const closeBtn = document.getElementById('astro-charts-box-close');
        const popup = document.getElementById('astro-charts-popup');
        const popupCloseBtn = document.getElementById('astro-charts-close');

        // Click on iframe container to show popup
        if (iframeContainer) {
            iframeContainer.addEventListener('click', () => this.showPopup());
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
     * Loads the astro charts iframe
     */
    loadChart() {
        const iframeContainer = document.getElementById('astro-charts-box-iframe-container');
        if (!iframeContainer) return;

        // Clear loading state
        iframeContainer.innerHTML = '';

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = 'https://astro-charts.com/chart-of-moment/';
        iframe.className = 'astro-charts-box-iframe';
        iframe.allow = 'fullscreen';
        iframe.title = 'Chart of the Moment - Astro Charts';
        iframe.onerror = () => this.showError();

        iframeContainer.appendChild(iframe);

        // Also update popup iframe
        const popupIframe = document.getElementById('astro-charts-popup-iframe');
        if (popupIframe) {
            popupIframe.src = 'https://astro-charts.com/chart-of-moment/';
        }
    }

    /**
     * Shows the popup with full astro charts view
     */
    showPopup() {
        const popup = document.getElementById('astro-charts-popup');
        if (popup) {
            popup.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Ensure popup iframe is loaded
            const popupIframe = document.getElementById('astro-charts-popup-iframe');
            if (popupIframe && !popupIframe.src) {
                popupIframe.src = 'https://astro-charts.com/chart-of-moment/';
            }
        }
    }

    /**
     * Hides the popup
     */
    hidePopup() {
        const popup = document.getElementById('astro-charts-popup');
        if (popup) {
            popup.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * Shows error state
     */
    showError(message = '') {
        const iframeContainer = document.getElementById('astro-charts-box-iframe-container');
        if (iframeContainer) {
            if (message) {
                iframeContainer.innerHTML = `<div class="astro-charts-error">🔮<br><small>${message}</small></div>`;
            } else {
                iframeContainer.innerHTML = '<div class="astro-charts-error">🔮<br><small>Unable to load chart</small></div>';
            }
        }
    }

    /**
     * Toggles the visibility of the Astro Charts box
     */
    toggleVisibility() {
        const box = document.getElementById('astro-charts-box');
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
     * Shows the Astro Charts box
     */
    showBox() {
        const box = document.getElementById('astro-charts-box');
        if (!box) return;

        box.style.display = 'block';
        box.style.opacity = '0';
        box.style.transform = 'translateY(-10px) scale(0.95)';
        box.style.transition = 'none';
        void box.offsetHeight; // Force reflow
        requestAnimationFrame(() => {
            box.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            box.style.opacity = '1';
            box.style.transform = 'translateY(0) scale(1)';
        });

        // Reload chart if needed
        this.loadChart();
    }

    /**
     * Hides the Astro Charts box
     */
    hideBox() {
        const box = document.getElementById('astro-charts-box');
        if (!box) return;

        box.style.opacity = '0';
        box.style.transform = 'translateY(-10px) scale(0.95)';
        setTimeout(() => {
            box.style.display = 'none';
        }, 400);
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
        window.AstroChartsPanel = new AstroChartsPanel();
    });
} else {
    window.AstroChartsPanel = new AstroChartsPanel();
}

// Expose class for testing
window.AstroChartsPanelClass = AstroChartsPanel;

// Expose open function globally for onclick handlers
window.openAstroChartsWindow = () => {
    if (window.AstroChartsPanel) {
        window.AstroChartsPanel.toggleVisibility();
    }
};

