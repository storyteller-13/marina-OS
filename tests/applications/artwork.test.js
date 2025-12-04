import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('ArtworkApp', () => {
  let dom;
  let window;
  let document;
  let ArtworkApp;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="artwork-window">
            <div class="file-list"></div>
          </div>
          <div id="artwork-dock-item"></div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Load ArtworkApp
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/artwork/artwork.js'), 'utf8');
    eval(code);
    ArtworkApp = window.ArtworkAppClass;
  });

  it('should initialize artwork app', () => {
    const app = new ArtworkApp();
    expect(app).toBeDefined();
    expect(app.windowId).toBe('artwork-window');
    expect(app.dockItemId).toBe('artwork-dock-item');
    expect(Array.isArray(app.images)).toBe(true);
  });

  it('should load images when opening', () => {
    const app = new ArtworkApp();
    app.open();

    expect(app.imagesLoaded).toBe(true);
  });

  it('should open image modal', () => {
    const app = new ArtworkApp();
    app.openImage('pages/artwork/nola.jpg');

    const modal = document.getElementById('artwork-image-modal');
    expect(modal).toBeDefined();
  });

  it('should close image modal', async () => {
    const app = new ArtworkApp();
    app.openImage('pages/artwork/nola.jpg');
    app.closeImage();

    // Wait for the setTimeout in closeImage (300ms)
    await new Promise(resolve => setTimeout(resolve, 350));

    const modal = document.getElementById('artwork-image-modal');
    expect(modal.style.display).toBe('none');
  });
});
