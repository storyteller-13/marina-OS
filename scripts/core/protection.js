/**
 * Basic client-side protection
 * NOTE: This cannot fully prevent source code viewing - it only makes it harder.
 * Determined users can always bypass these protections.
 */
(function() {
    'use strict';

    // Constants
    const DEVTOOLS_THRESHOLD = 160;
    const DEVTOOLS_CHECK_INTERVAL = 500;

    // Keyboard shortcuts to block
    const BLOCKED_KEYS = {
        F12: true,
        'Ctrl+Shift+I': (e) => e.ctrlKey && e.shiftKey && e.key === 'I',
        'Ctrl+Shift+J': (e) => e.ctrlKey && e.shiftKey && e.key === 'J',
        'Ctrl+Shift+C': (e) => e.ctrlKey && e.shiftKey && e.key === 'C',
        'Ctrl+U': (e) => e.ctrlKey && e.key === 'u',
        'Ctrl+S': (e) => e.ctrlKey && e.key === 's'
    };

    /**
     * Prevents right-click context menu
     */
    function preventContextMenu() {
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
    }

    /**
     * Prevents common developer keyboard shortcuts
     */
    function preventKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Block F12
            if (e.key === 'F12') {
                e.preventDefault();
                return;
            }

            // Block Ctrl+Shift+I (DevTools)
            if (BLOCKED_KEYS['Ctrl+Shift+I'](e)) {
                e.preventDefault();
                return;
            }

            // Block Ctrl+Shift+J (Console)
            if (BLOCKED_KEYS['Ctrl+Shift+J'](e)) {
                e.preventDefault();
                return;
            }

            // Block Ctrl+Shift+C (Element Inspector)
            if (BLOCKED_KEYS['Ctrl+Shift+C'](e)) {
                e.preventDefault();
                return;
            }

            // Block Ctrl+U (View Source)
            if (BLOCKED_KEYS['Ctrl+U'](e)) {
                e.preventDefault();
                return;
            }

            // Block Ctrl+S (Save Page)
            if (BLOCKED_KEYS['Ctrl+S'](e)) {
                e.preventDefault();
                return;
            }
        });
    }

    /**
     * Monitors for DevTools opening (basic detection)
     */
    function monitorDevTools() {
        let devtoolsOpen = false;

        setInterval(function() {
            const heightDiff = window.outerHeight - window.innerHeight;
            const widthDiff = window.outerWidth - window.innerWidth;
            const isOpen = heightDiff > DEVTOOLS_THRESHOLD || widthDiff > DEVTOOLS_THRESHOLD;

            if (isOpen && !devtoolsOpen) {
                devtoolsOpen = true;
            } else if (!isOpen) {
                devtoolsOpen = false;
            }
        }, DEVTOOLS_CHECK_INTERVAL);
    }

    /**
     * Prevents image dragging
     */
    function preventImageDragging() {
        document.addEventListener('dragstart', function(e) {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
            }
        });
    }

    /**
     * Clears console on page load
     */
    function clearConsole() {
        console.clear();
    }

    // Initialize all protection features
    preventContextMenu();
    preventKeyboardShortcuts();
    monitorDevTools();
    preventImageDragging();
    clearConsole();
})();
