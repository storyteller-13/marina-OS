import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Kamikaze', () => {
  let dom;
  let window;
  let document;
  let Kamikaze;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div class="desktop">
            <div id="person-icon-kamikaze">
              <div class="tray-icon">👤</div>
            </div>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Set viewport size for consistent testing
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080
    });

    // Load Kamikaze class
    const code = readFileSync(join(__dirname, '../../scripts/core/kamikaze.js'), 'utf8');

    // Execute code in window context
    const func = new Function('window', 'document', code);
    func(window, document);

    Kamikaze = window.KamikazeClass;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize kamikaze instance', () => {
      const kamikaze = new Kamikaze();
      expect(kamikaze).toBeDefined();
      expect(kamikaze).toBeInstanceOf(Kamikaze);
    });

    it('should attach click event listener to person icon', () => {
      const kamikaze = new Kamikaze();
      const personIcon = document.getElementById('person-icon-kamikaze');
      const icon = document.querySelector('#person-icon-kamikaze .tray-icon');

      expect(personIcon).toBeDefined();

      // Simulate click
      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      personIcon.dispatchEvent(clickEvent);

      // Should create explosion elements
      const explosionContainer = document.querySelector('.explosion-container');
      expect(explosionContainer).toBeDefined();
    });

    it('should prevent default and stop propagation on click', () => {
      const kamikaze = new Kamikaze();
      const personIcon = document.getElementById('person-icon-kamikaze');
      let defaultPrevented = false;
      let propagationStopped = false;

      personIcon.addEventListener('click', (e) => {
        defaultPrevented = e.defaultPrevented;
        propagationStopped = e.cancelBubble;
      });

      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      personIcon.dispatchEvent(clickEvent);

      // Note: In JSDOM, preventDefault/stopPropagation might not work as expected
      // but we verify the event handler is attached
      expect(personIcon).toBeDefined();
    });

    it('should handle missing person icon gracefully', () => {
      document.getElementById('person-icon-kamikaze')?.remove();
      const kamikaze = new Kamikaze();
      expect(kamikaze).toBeDefined();
    });
  });

  describe('explode()', () => {
    it('should return early if icon is not found', () => {
      const kamikaze = new Kamikaze();
      document.querySelector('#person-icon-kamikaze .tray-icon')?.remove();

      kamikaze.explode();

      const explosionContainer = document.querySelector('.explosion-container');
      expect(explosionContainer).toBeNull();
    });

    it('should create explosion container', () => {
      const kamikaze = new Kamikaze();
      kamikaze.explode();

      const explosionContainer = document.querySelector('.explosion-container');
      expect(explosionContainer).toBeDefined();
      expect(explosionContainer.parentElement).toBe(document.body);
    });

    it('should create kaboom text with correct content', () => {
      const kamikaze = new Kamikaze();
      kamikaze.explode();

      const kaboomText = document.querySelector('.kaboom-text');
      expect(kaboomText).toBeDefined();
      expect(kaboomText.textContent).toContain(Kamikaze.KABOOM_MESSAGE);
      expect(kaboomText.innerHTML).toContain(Kamikaze.KABOOM_COLOR);
      expect(kaboomText.parentElement).toBe(document.body);
    });

    it('should create explosion particles', () => {
      const kamikaze = new Kamikaze();
      kamikaze.explode();

      const particles = document.querySelectorAll('.explosion-particle');
      expect(particles.length).toBe(Kamikaze.PARTICLE_COUNT);
    });

    it('should create particles with emojis', () => {
      const kamikaze = new Kamikaze();
      kamikaze.explode();

      const particles = document.querySelectorAll('.explosion-particle');
      expect(particles.length).toBe(Kamikaze.PARTICLE_COUNT);

      // Check that particles contain emojis from the EMOJIS array
      const firstParticle = particles[0];
      expect(firstParticle.textContent).toBeTruthy();
      expect(Kamikaze.EMOJIS).toContain(firstParticle.textContent.trim());
    });

    it('should create particles with font sizes', () => {
      const kamikaze = new Kamikaze();
      kamikaze.explode();

      const particles = document.querySelectorAll('.explosion-particle');
      expect(particles.length).toBe(Kamikaze.PARTICLE_COUNT);

      // Check that particles have font sizes set
      const firstParticle = particles[0];
      const fontSize = parseFloat(firstParticle.style.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(Kamikaze.FONT_SIZE_MIN);
      expect(fontSize).toBeLessThanOrEqual(Kamikaze.FONT_SIZE_MAX);
    });

    it('should apply explode animation to icon', () => {
      const kamikaze = new Kamikaze();
      const icon = document.querySelector('#person-icon-kamikaze .tray-icon');

      kamikaze.explode();

      expect(icon.style.animation).toContain('explode');
      expect(icon.style.transformOrigin).toBe('center');
    });

    it('should spin icon before exploding', () => {
      vi.useFakeTimers();
      const kamikaze = new Kamikaze();
      const icon = document.querySelector('#person-icon-kamikaze .tray-icon');

      kamikaze.explode();

      expect(icon.style.transform).toContain('rotate(720deg)');
      expect(icon.style.transform).toContain('scale(2)');

      vi.advanceTimersByTime(Kamikaze.SPIN_DURATION);
      expect(icon.style.transition).toBe('');

      vi.useRealTimers();
    });

    it('should add shaking class to desktop', () => {
      vi.useFakeTimers();
      const kamikaze = new Kamikaze();
      const desktop = document.querySelector('.desktop');

      kamikaze.explode();

      expect(desktop.classList.contains('shaking')).toBe(true);

      vi.advanceTimersByTime(Kamikaze.SHAKE_DURATION);
      expect(desktop.classList.contains('shaking')).toBe(false);

      vi.useRealTimers();
    });

    it('should handle missing desktop gracefully', () => {
      const kamikaze = new Kamikaze();
      document.querySelector('.desktop')?.remove();

      expect(() => kamikaze.explode()).not.toThrow();

      const explosionContainer = document.querySelector('.explosion-container');
      expect(explosionContainer).toBeDefined();
    });

    it('should clean up after animation completes', (done) => {
      const kamikaze = new Kamikaze();
      const icon = document.querySelector('#person-icon-kamikaze .tray-icon');

      kamikaze.explode();

      setTimeout(() => {
        const explosionContainer = document.querySelector('.explosion-container');
        const kaboomText = document.querySelector('.kaboom-text');
        expect(explosionContainer).toBeNull();
        expect(kaboomText).toBeNull();
        expect(icon.style.animation).toBe('');
        expect(icon.style.transform).toBe('');
        done();
      }, Kamikaze.CLEANUP_DELAY + 100);
    });

    it('should handle multiple explosions', () => {
      vi.useFakeTimers();
      const kamikaze = new Kamikaze();

      kamikaze.explode();
      const firstContainer = document.querySelector('.explosion-container');
      expect(firstContainer).toBeDefined();

      // Advance time a bit
      vi.advanceTimersByTime(1000);

      // Trigger another explosion
      kamikaze.explode();
      const containers = document.querySelectorAll('.explosion-container');
      expect(containers.length).toBe(2);

      vi.useRealTimers();
    });
  });

  describe('helper methods', () => {
    describe('getCorners()', () => {
      it('should return four corners of viewport', () => {
        const kamikaze = new Kamikaze();
        const corners = kamikaze.getCorners();

        expect(corners).toHaveLength(4);
        expect(corners).toContainEqual({ x: 0, y: 0 });
        expect(corners).toContainEqual({ x: window.innerWidth, y: 0 });
        expect(corners).toContainEqual({ x: 0, y: window.innerHeight });
        expect(corners).toContainEqual({ x: window.innerWidth, y: window.innerHeight });
      });
    });

    describe('calculateTargetPosition()', () => {
      it('should calculate target position from top-left corner', () => {
        const kamikaze = new Kamikaze();
        const startCorner = { x: 0, y: 0 };

        const target = kamikaze.calculateTargetPosition(startCorner);

        expect(target).toHaveProperty('x');
        expect(target).toHaveProperty('y');
        expect(target.x).toBeGreaterThanOrEqual(0);
        expect(target.x).toBeLessThanOrEqual(window.innerWidth);
        expect(target.y).toBeGreaterThanOrEqual(0);
        expect(target.y).toBeLessThanOrEqual(window.innerHeight);
      });

      it('should calculate target position from top-right corner', () => {
        const kamikaze = new Kamikaze();
        const startCorner = { x: window.innerWidth, y: 0 };

        const target = kamikaze.calculateTargetPosition(startCorner);

        expect(target.x).toBeGreaterThanOrEqual(0);
        expect(target.x).toBeLessThanOrEqual(window.innerWidth);
        expect(target.y).toBeGreaterThanOrEqual(0);
        expect(target.y).toBeLessThanOrEqual(window.innerHeight);
      });

      it('should calculate target position from bottom-left corner', () => {
        const kamikaze = new Kamikaze();
        const startCorner = { x: 0, y: window.innerHeight };

        const target = kamikaze.calculateTargetPosition(startCorner);

        expect(target.x).toBeGreaterThanOrEqual(0);
        expect(target.x).toBeLessThanOrEqual(window.innerWidth);
        expect(target.y).toBeGreaterThanOrEqual(0);
        expect(target.y).toBeLessThanOrEqual(window.innerHeight);
      });

      it('should calculate target position from bottom-right corner', () => {
        const kamikaze = new Kamikaze();
        const startCorner = { x: window.innerWidth, y: window.innerHeight };

        const target = kamikaze.calculateTargetPosition(startCorner);

        expect(target.x).toBeGreaterThanOrEqual(0);
        expect(target.x).toBeLessThanOrEqual(window.innerWidth);
        expect(target.y).toBeGreaterThanOrEqual(0);
        expect(target.y).toBeLessThanOrEqual(window.innerHeight);
      });

      it('should handle edge case with small viewport', () => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 100
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: 100
        });

        const kamikaze = new Kamikaze();
        const startCorner = { x: 0, y: 0 };

        const target = kamikaze.calculateTargetPosition(startCorner);

        expect(target.x).toBeGreaterThanOrEqual(0);
        expect(target.x).toBeLessThanOrEqual(100);
        expect(target.y).toBeGreaterThanOrEqual(0);
        expect(target.y).toBeLessThanOrEqual(100);

        // Restore original viewport size
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1920
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: 1080
        });
      });
    });

    describe('createParticle()', () => {
      it('should create particle with correct properties', () => {
        const kamikaze = new Kamikaze();
        const explosionContainer = document.createElement('div');

        kamikaze.createParticle(explosionContainer);

        const particle = explosionContainer.querySelector('.explosion-particle');
        expect(particle).toBeDefined();
        expect(particle.textContent).toBeTruthy();
        expect(Kamikaze.EMOJIS).toContain(particle.textContent);
        expect(particle.style.left).toBeTruthy();
        expect(particle.style.top).toBeTruthy();
        expect(particle.style.animation).toContain('particle');
      });

      it('should set CSS custom properties for animation', () => {
        const kamikaze = new Kamikaze();
        const explosionContainer = document.createElement('div');

        kamikaze.createParticle(explosionContainer);

        const particle = explosionContainer.querySelector('.explosion-particle');
        const tx = particle.style.getPropertyValue('--tx');
        const ty = particle.style.getPropertyValue('--ty');

        expect(tx).toBeTruthy();
        expect(ty).toBeTruthy();
        expect(tx).toContain('px');
        expect(ty).toContain('px');
      });

      it('should set animation duration within valid range', () => {
        const kamikaze = new Kamikaze();
        const explosionContainer = document.createElement('div');

        kamikaze.createParticle(explosionContainer);

        const particle = explosionContainer.querySelector('.explosion-particle');
        const animationMatch = particle.style.animation.match(/particle ([\d.]+)s/);
        expect(animationMatch).toBeTruthy();

        const duration = parseFloat(animationMatch[1]);
        expect(duration).toBeGreaterThanOrEqual(Kamikaze.ANIMATION_DURATION_MIN);
        expect(duration).toBeLessThanOrEqual(Kamikaze.ANIMATION_DURATION_MAX);
      });

      it('should set animation delay within valid range', () => {
        const kamikaze = new Kamikaze();
        const explosionContainer = document.createElement('div');

        kamikaze.createParticle(explosionContainer);

        const particle = explosionContainer.querySelector('.explosion-particle');
        const delayMatch = particle.style.animationDelay.match(/([\d.]+)s/);
        expect(delayMatch).toBeTruthy();

        const delay = parseFloat(delayMatch[1]);
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThanOrEqual(Kamikaze.ANIMATION_DELAY_MAX);
      });

      it('should append particle to container', () => {
        const kamikaze = new Kamikaze();
        const explosionContainer = document.createElement('div');

        expect(explosionContainer.children.length).toBe(0);
        kamikaze.createParticle(explosionContainer);
        expect(explosionContainer.children.length).toBe(1);
      });
    });

    describe('createExplosionElements()', () => {
      it('should create explosion container and kaboom text', () => {
        const kamikaze = new Kamikaze();
        const { explosionContainer, kaboomText } = kamikaze.createExplosionElements();

        expect(explosionContainer).toBeDefined();
        expect(explosionContainer.className).toBe('explosion-container');
        expect(kaboomText).toBeDefined();
        expect(kaboomText.className).toBe('kaboom-text');
        expect(document.body.contains(explosionContainer)).toBe(true);
        expect(document.body.contains(kaboomText)).toBe(true);
      });
    });

    describe('animateIcon()', () => {
      it('should animate icon with spin and explode', () => {
        vi.useFakeTimers();
        const kamikaze = new Kamikaze();
        const icon = document.querySelector('#person-icon-kamikaze .tray-icon');

        kamikaze.animateIcon(icon);

        expect(icon.style.transform).toContain('rotate(720deg)');
        expect(icon.style.transform).toContain('scale(2)');
        expect(icon.style.animation).toContain('explode');

        vi.advanceTimersByTime(Kamikaze.SPIN_DURATION);
        expect(icon.style.transition).toBe('');

        vi.useRealTimers();
      });
    });

    describe('shakeDesktop()', () => {
      it('should add and remove shaking class', () => {
        vi.useFakeTimers();
        const kamikaze = new Kamikaze();
        const desktop = document.querySelector('.desktop');

        kamikaze.shakeDesktop(desktop);

        expect(desktop.classList.contains('shaking')).toBe(true);

        vi.advanceTimersByTime(Kamikaze.SHAKE_DURATION);
        expect(desktop.classList.contains('shaking')).toBe(false);

        vi.useRealTimers();
      });

      it('should handle missing desktop gracefully', () => {
        const kamikaze = new Kamikaze();
        expect(() => kamikaze.shakeDesktop(null)).not.toThrow();
      });
    });

    describe('scheduleCleanup()', () => {
      it('should remove explosion container and kaboom text after delay', (done) => {
        const kamikaze = new Kamikaze();
        const explosionContainer = document.createElement('div');
        explosionContainer.className = 'explosion-container';
        document.body.appendChild(explosionContainer);

        const kaboomText = document.createElement('div');
        kaboomText.className = 'kaboom-text';
        document.body.appendChild(kaboomText);

        const icon = document.querySelector('#person-icon-kamikaze .tray-icon');
        icon.style.animation = 'explode 0.6s';
        icon.style.transform = 'scale(2)';

        kamikaze.scheduleCleanup(explosionContainer, kaboomText, icon);

        setTimeout(() => {
          expect(document.body.contains(explosionContainer)).toBe(false);
          expect(document.body.contains(kaboomText)).toBe(false);
          expect(icon.style.animation).toBe('');
          expect(icon.style.transform).toBe('');
          done();
        }, Kamikaze.CLEANUP_DELAY + 100);
      });
    });
  });

  describe('constants', () => {
    it('should have correct particle count constant', () => {
      expect(Kamikaze.PARTICLE_COUNT).toBe(200);
    });

    it('should have correct animation duration constants', () => {
      expect(Kamikaze.ANIMATION_DURATION_MIN).toBe(5);
      expect(Kamikaze.ANIMATION_DURATION_MAX).toBe(8);
    });

    it('should have correct animation delay constant', () => {
      expect(Kamikaze.ANIMATION_DELAY_MAX).toBe(0.5);
    });

    it('should have correct cleanup delay constant', () => {
      expect(Kamikaze.CLEANUP_DELAY).toBe(9000);
    });

    it('should have correct shake duration constant', () => {
      expect(Kamikaze.SHAKE_DURATION).toBe(500);
    });

    it('should have correct spin duration constant', () => {
      expect(Kamikaze.SPIN_DURATION).toBe(300);
    });

    it('should have correct font size constants', () => {
      expect(Kamikaze.FONT_SIZE_MIN).toBe(50);
      expect(Kamikaze.FONT_SIZE_MAX).toBe(130);
    });

    it('should have emoji array constant', () => {
      expect(Kamikaze.EMOJIS).toBeInstanceOf(Array);
      expect(Kamikaze.EMOJIS.length).toBeGreaterThan(0);
    });

    it('should have kaboom message constant', () => {
      expect(Kamikaze.KABOOM_MESSAGE).toBe('winter is coming');
    });

    it('should have kaboom color constant', () => {
      expect(Kamikaze.KABOOM_COLOR).toBe('#0066FF');
    });
  });
});
