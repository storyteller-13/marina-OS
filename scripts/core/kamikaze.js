/**
 * Kamikaze Effect Module
 * Handles the person icon explosion effect
 */
class Kamikaze {
    // Constants
    static PARTICLE_COUNT = 200;
    static ANIMATION_DURATION_MIN = 5; // seconds
    static ANIMATION_DURATION_MAX = 8; // seconds
    static ANIMATION_DELAY_MAX = 0.5; // seconds
    static CLEANUP_DELAY = 9000; // milliseconds
    static SHAKE_DURATION = 500; // milliseconds
    static SPIN_DURATION = 300; // milliseconds
    static FONT_SIZE_MIN = 50; // pixels
    static FONT_SIZE_MAX = 130; // pixels
    static KABOOM_MESSAGE = 'winter is coming';
    static KABOOM_COLOR = '#0066FF';

    static EMOJIS = [
        '❄️', '❄️', '❄️',
        '☃️', '⛄', '☃️', '⛄',
        '🧊', '🧊',
        '🌨️', '🌨️',
        '🧤', '🧤',
        '🧥', '🧥',
        '🧣', '🧣',
        '🎿', '🎿',
        '🏔️', '🏔️',
        '❄️', '❄️'
    ];

    constructor() {
        this.init();
    }

    init() {
        const personIcon = document.getElementById('person-icon-kamikaze');
        if (personIcon) {
            personIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.explode();
            });
        }
    }

    /**
     * Get the four corners of the viewport
     */
    getCorners() {
        return [
            { x: 0, y: 0 },
            { x: window.innerWidth, y: 0 },
            { x: 0, y: window.innerHeight },
            { x: window.innerWidth, y: window.innerHeight }
        ];
    }

    /**
     * Calculate target position for a particle starting from a corner
     * Particles move from corners toward opposite areas of the screen
     */
    calculateTargetPosition(startCorner) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const rand = Math.random();

        // Each corner has 3 possible target patterns (opposite corner, opposite edge, random)
        const patterns = [
            // Pattern 1: Opposite corner (33% chance)
            () => {
                if (startCorner.x === 0 && startCorner.y === 0) {
                    return { x: width, y: height };
                } else if (startCorner.x === width && startCorner.y === 0) {
                    return { x: 0, y: height };
                } else if (startCorner.x === 0 && startCorner.y === height) {
                    return { x: width, y: 0 };
                } else {
                    return { x: 0, y: 0 };
                }
            },
            // Pattern 2: Opposite edge (33% chance)
            () => {
                if (startCorner.x === 0 && startCorner.y === 0) {
                    return { x: width, y: Math.random() * height };
                } else if (startCorner.x === width && startCorner.y === 0) {
                    return { x: 0, y: Math.random() * height };
                } else if (startCorner.x === 0 && startCorner.y === height) {
                    return { x: width, y: Math.random() * height };
                } else {
                    return { x: 0, y: Math.random() * height };
                }
            },
            // Pattern 3: Random position on opposite side (34% chance)
            () => {
                if (startCorner.y === 0) {
                    return { x: Math.random() * width, y: height };
                } else {
                    return { x: Math.random() * width, y: 0 };
                }
            }
        ];

        const patternIndex = Math.floor(rand * 3);
        return patterns[patternIndex]();
    }

    /**
     * Create a single explosion particle
     */
    createParticle(explosionContainer) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';

        // Random emoji
        const emoji = Kamikaze.EMOJIS[Math.floor(Math.random() * Kamikaze.EMOJIS.length)];
        particle.textContent = emoji;

        // Random font size
        const fontSize = Kamikaze.FONT_SIZE_MIN + Math.random() * (Kamikaze.FONT_SIZE_MAX - Kamikaze.FONT_SIZE_MIN);
        particle.style.fontSize = `${fontSize}px`;

        // Start from random corner
        const corners = this.getCorners();
        const startCorner = corners[Math.floor(Math.random() * corners.length)];

        // Calculate target position
        const target = this.calculateTargetPosition(startCorner);
        const deltaX = target.x - startCorner.x;
        const deltaY = target.y - startCorner.y;

        // Set initial position
        particle.style.left = `${startCorner.x}px`;
        particle.style.top = `${startCorner.y}px`;

        // Set animation properties
        particle.style.setProperty('--tx', `${deltaX}px`);
        particle.style.setProperty('--ty', `${deltaY}px`);

        const duration = Kamikaze.ANIMATION_DURATION_MIN + Math.random() * (Kamikaze.ANIMATION_DURATION_MAX - Kamikaze.ANIMATION_DURATION_MIN);
        particle.style.animation = `particle ${duration}s ease-out forwards`;
        particle.style.animationDelay = `${Math.random() * Kamikaze.ANIMATION_DELAY_MAX}s`;

        explosionContainer.appendChild(particle);
    }

    /**
     * Create explosion container and kaboom text
     */
    createExplosionElements() {
        const explosionContainer = document.createElement('div');
        explosionContainer.className = 'explosion-container';
        document.body.appendChild(explosionContainer);

        const kaboomText = document.createElement('div');
        kaboomText.className = 'kaboom-text';
        kaboomText.innerHTML = `<span style="color: ${Kamikaze.KABOOM_COLOR};">${Kamikaze.KABOOM_MESSAGE}</span>`;
        document.body.appendChild(kaboomText);

        return { explosionContainer, kaboomText };
    }

    /**
     * Animate the icon explosion
     */
    animateIcon(icon) {
        // Spin before exploding
        icon.style.transition = 'transform 0.3s ease-out';
        icon.style.transform = 'rotate(720deg) scale(2)';

        setTimeout(() => {
            icon.style.transition = '';
        }, Kamikaze.SPIN_DURATION);

        // Explode animation
        icon.style.animation = 'explode 0.6s ease-out forwards';
        icon.style.transformOrigin = 'center';
    }

    /**
     * Shake the desktop
     */
    shakeDesktop(desktop) {
        if (!desktop) return;

        desktop.classList.add('shaking');
        setTimeout(() => {
            desktop.classList.remove('shaking');
        }, Kamikaze.SHAKE_DURATION);
    }

    /**
     * Clean up explosion elements after animation completes
     */
    scheduleCleanup(explosionContainer, kaboomText, icon) {
        setTimeout(() => {
            explosionContainer.remove();
            kaboomText.remove();
            icon.style.animation = '';
            icon.style.transform = '';
        }, Kamikaze.CLEANUP_DELAY);
    }

    explode() {
        const desktop = document.querySelector('.desktop');
        const icon = document.querySelector('#person-icon-kamikaze .tray-icon');

        if (!icon) return;

        // Create explosion elements
        const { explosionContainer, kaboomText } = this.createExplosionElements();

        // Create winter icon particles
        for (let i = 0; i < Kamikaze.PARTICLE_COUNT; i++) {
            this.createParticle(explosionContainer);
        }

        // Animate icon
        this.animateIcon(icon);

        // Shake desktop
        this.shakeDesktop(desktop);

        // Schedule cleanup
        this.scheduleCleanup(explosionContainer, kaboomText, icon);
    }
}

// Expose class constructor for testing
window.KamikazeClass = Kamikaze;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.Kamikaze = new Kamikaze();
    });
} else {
    window.Kamikaze = new Kamikaze();
}
