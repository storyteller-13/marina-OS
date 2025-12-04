/**
 * Panel Module
 * Handles top panel functionality (clock, menu)
 */
class Panel {
    // Constants
    static CLOCK_UPDATE_INTERVAL = 1000; // 1 second
    static MENU_CLOSE_DELAY = 100; // milliseconds

    constructor() {
        this.clockIntervalId = null;
        this.eventListeners = [];
        this.init();
    }

    init() {
        // Update clock immediately and set up interval
        this.updateClock();
        this.startClock();

        // Setup applications menu
        this.setupApplicationsMenu();
    }

    /**
     * Starts the clock update interval
     */
    startClock() {
        if (this.clockIntervalId !== null) {
            clearInterval(this.clockIntervalId);
        }
        this.clockIntervalId = setInterval(() => this.updateClock(), Panel.CLOCK_UPDATE_INTERVAL);
    }

    /**
     * Stops the clock update interval
     */
    stopClock() {
        if (this.clockIntervalId !== null) {
            clearInterval(this.clockIntervalId);
            this.clockIntervalId = null;
        }
    }

    /**
     * Updates the clock display with current time
     */
    updateClock() {
        const clock = document.querySelector('.clock');
        if (!clock) {
            return;
        }

        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clock.textContent = `${hours}:${minutes}:${seconds}`;
    }

    /**
     * Sets up the applications menu dropdown functionality
     */
    setupApplicationsMenu() {
        const applicationsMenuButton = document.getElementById('applications-menu-button');
        const applicationsDropdown = document.getElementById('applications-dropdown');

        if (!applicationsMenuButton || !applicationsDropdown) {
            return;
        }

        // Handle button click to toggle dropdown
        const buttonClickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isShowing = applicationsDropdown.classList.contains('show');

            // Close all other dropdowns
            this.closeAllDropdowns();

            // Toggle this dropdown
            if (!isShowing) {
                applicationsDropdown.classList.add('show');
            }
        };

        applicationsMenuButton.addEventListener('click', buttonClickHandler);
        this.eventListeners.push({
            element: applicationsMenuButton,
            event: 'click',
            handler: buttonClickHandler
        });

        // Close dropdown when clicking outside
        const documentClickHandler = (e) => {
            if (!applicationsMenuButton.contains(e.target) &&
                !applicationsDropdown.contains(e.target)) {
                applicationsDropdown.classList.remove('show');
            }
        };

        document.addEventListener('click', documentClickHandler);
        this.eventListeners.push({
            element: document,
            event: 'click',
            handler: documentClickHandler
        });

        // Close dropdown when clicking on a menu item
        const menuItems = applicationsDropdown.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const itemClickHandler = () => {
                setTimeout(() => {
                    applicationsDropdown.classList.remove('show');
                }, Panel.MENU_CLOSE_DELAY);
            };

            item.addEventListener('click', itemClickHandler);
            this.eventListeners.push({
                element: item,
                event: 'click',
                handler: itemClickHandler
            });
        });
    }

    /**
     * Closes all menu dropdowns
     */
    closeAllDropdowns() {
        document.querySelectorAll('.menu-dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }

    /**
     * Cleans up event listeners and intervals
     */
    destroy() {
        // Stop clock interval
        this.stopClock();

        // Remove all event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }
}

// Expose class constructor for testing
window.PanelClass = Panel;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Panel = new Panel();
    });
} else {
    window.Panel = new Panel();
}
