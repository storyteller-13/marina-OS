import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('WindowManager', () => {
  let dom;
  let window;
  let document;
  let WindowManager;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div class="window" id="test-window">
            <div class="window-header">Test Window</div>
            <div class="window-content">Content</div>
          </div>
          <div class="control close"></div>
          <div class="control minimize"></div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Load WindowManager class
    const code = readFileSync(join(__dirname, '../../scripts/core/window-manager.js'), 'utf8');

    // Execute code in window context
    const func = new Function('window', 'document', code);
    func(window, document);

    WindowManager = window.WindowManagerClass;
  });

  it('should initialize with correct default values', () => {
    const manager = new WindowManager();
    expect(manager.highestZIndex).toBeGreaterThanOrEqual(100);
    expect(manager.windows).toBeInstanceOf(Map);
  });

  it('should register a window', () => {
    const manager = new WindowManager();
    const windowElement = document.querySelector('.window');

    manager.registerWindow(windowElement);

    expect(manager.windows.has('test-window')).toBe(true);
    const windowData = manager.windows.get('test-window');
    expect(windowData.element).toBe(windowElement);
    expect(windowData.isDraggable).toBe(true);
  });

  it('should not register null window', () => {
    const manager = new WindowManager();
    const initialSize = manager.windows.size; // May have windows from init()
    manager.registerWindow(null);
    expect(manager.windows.size).toBe(initialSize); // Should not change
  });

  it('should bring window to front', () => {
    const manager = new WindowManager();
    const windowElement = document.querySelector('.window');

    manager.bringToFront(windowElement);

    const zIndex = parseInt(windowElement.style.zIndex);
    expect(zIndex).toBeGreaterThan(100);
  });

  it('should increment z-index when bringing to front', () => {
    const manager = new WindowManager();
    const windowElement = document.querySelector('.window');

    const initialZIndex = manager.highestZIndex;
    manager.bringToFront(windowElement);
    const firstZIndex = parseInt(windowElement.style.zIndex);

    manager.bringToFront(windowElement);
    const secondZIndex = parseInt(windowElement.style.zIndex);

    expect(secondZIndex).toBeGreaterThan(firstZIndex);
  });

  it('should open window with correct styles', () => {
    const manager = new WindowManager();
    const windowElement = document.querySelector('.window');

    manager.open(windowElement);

    expect(windowElement.style.display).toBe('block');
  });

  it('should close window', (done) => {
    const manager = new WindowManager();
    const windowElement = document.querySelector('.window');
    windowElement.style.display = 'block';

    manager.close(windowElement);

    setTimeout(() => {
      expect(windowElement.style.display).toBe('none');
      done();
    }, 250);
  });

  it('should minimize window', (done) => {
    const manager = new WindowManager();
    const windowElement = document.querySelector('.window');

    manager.minimize(windowElement);

    setTimeout(() => {
      expect(windowElement.style.opacity).toBe('0.5');
      done();
    }, 250);
  });
});
