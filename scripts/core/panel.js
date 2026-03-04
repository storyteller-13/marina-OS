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
        applicationsMenuButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isShowing = applicationsDropdown.classList.contains('show');
            this.closeAllDropdowns();
            if (!isShowing) {
                applicationsDropdown.classList.add('show');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!applicationsMenuButton.contains(e.target) &&
                !applicationsDropdown.contains(e.target)) {
                applicationsDropdown.classList.remove('show');
            }
        });

        // Close dropdown when clicking a menu item (event delegation)
        applicationsDropdown.addEventListener('click', (e) => {
            if (e.target.closest('.menu-item')) {
                setTimeout(() => applicationsDropdown.classList.remove('show'), Panel.MENU_CLOSE_DELAY);
            }
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
