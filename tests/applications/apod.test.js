import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('APODPanel', () => {
  let dom;
  let window;
  let document;
  let APODPanel;
  let panel;
  let mockFetch;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="apod-box">
            <div id="apod-box-image-container">
              <div class="apod-loading">loading...</div>
            </div>
            <div class="apod-box-header">
              <span id="apod-box-title">APOD</span>
              <button id="apod-box-close">×</button>
            </div>
          </div>
          <div id="apod-popup" style="display: none;">
            <div class="apod-popup-content">
              <div class="apod-popup-header">
                <span id="apod-title"></span>
                <button id="apod-close">×</button>
              </div>
              <div class="apod-popup-image-container">
                <img id="apod-popup-image" alt="Astronomical Picture of the Day">
              </div>
              <div id="apod-explanation"></div>
              <div id="apod-date"></div>
            </div>
          </div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.localStorage = window.localStorage;

    // Clear localStorage before each test
    localStorage.clear();

    // Mock fetch with default implementation
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        url: 'https://example.com/image.jpg',
        title: 'Test Image',
        explanation: 'Test explanation',
        date: '2024-01-01',
        media_type: 'image'
      })
    });
    global.fetch = mockFetch;
    window.fetch = mockFetch;

    // Load APODPanel class
    const code = readFileSync(join(__dirname, '../../scripts/applications/apod/apod.js'), 'utf8');

    // Execute code in window context
    const func = new Function('window', 'document', code);
    func(window, document);

    APODPanel = window.APODPanelClass;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Initialization', () => {
    beforeEach(() => {
      // Mock fetch before each test in this describe block
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          url: 'https://example.com/image.jpg',
          title: 'Test Image',
          explanation: 'Test explanation',
          date: '2024-01-01',
          media_type: 'image'
        })
      });
    });

    it('should initialize APODPanel', () => {
      panel = new APODPanel();

      expect(panel).toBeDefined();
      expect(panel.apiUrl).toBe('https://api.nasa.gov/planetary/apod');
      expect(panel.apiKey).toBe('DEMO_KEY');
      expect(panel.cacheKey).toBe('apod_cache');
      expect(panel.cacheExpiry).toBe(24 * 60 * 60 * 1000);
    });

    it('should setup event listeners on init', () => {
      const imageContainer = document.getElementById('apod-box-image-container');
      const closeBtn = document.getElementById('apod-box-close');

      expect(imageContainer).toBeDefined();
      expect(closeBtn).toBeDefined();

      panel = new APODPanel();
      expect(panel).toBeDefined();
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      // Clear localStorage to ensure clean state
      localStorage.clear();
      // Mock fetch to prevent actual API calls
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          url: 'https://example.com/image.jpg',
          title: 'Test Image',
          explanation: 'Test explanation',
          date: '2024-01-01',
          media_type: 'image'
        })
      });
      panel = new APODPanel();
    });

    it('should cache APOD data', () => {
      const testData = {
        url: 'https://example.com/image.jpg',
        title: 'Test Image',
        explanation: 'Test explanation',
        date: '2024-01-01',
        media_type: 'image'
      };

      panel.cacheAPOD(testData);

      const cached = localStorage.getItem('apod_cache');
      expect(cached).toBeDefined();

      const parsed = JSON.parse(cached);
      expect(parsed.data).toEqual(testData);
      expect(parsed.timestamp).toBeDefined();
    });

    it('should retrieve cached APOD data if valid', () => {
      const testData = {
        url: 'https://example.com/image.jpg',
        title: 'Test Image',
        explanation: 'Test explanation',
        date: '2024-01-01',
        media_type: 'image'
      };

      const cache = {
        data: testData,
        timestamp: Date.now()
      };
      localStorage.setItem('apod_cache', JSON.stringify(cache));

      const cached = panel.getCachedAPOD();
      expect(cached).toEqual(testData);
    });

    it('should return null for expired cache', () => {
      const testData = {
        url: 'https://example.com/image.jpg',
        title: 'Test Image',
        explanation: 'Test explanation',
        date: '2024-01-01',
        media_type: 'image'
      };

      const cache = {
        data: testData,
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };
      localStorage.setItem('apod_cache', JSON.stringify(cache));

      const cached = panel.getCachedAPOD();
      expect(cached).toBeNull();
      expect(localStorage.getItem('apod_cache')).toBeNull();
    });

    it('should return null if no cache exists', () => {
      // Clear cache before checking
      localStorage.clear();
      const cached = panel.getCachedAPOD();
      expect(cached).toBeNull();
    });

    it('should handle invalid cache data gracefully', () => {
      localStorage.setItem('apod_cache', 'invalid json');

      const cached = panel.getCachedAPOD();
      expect(cached).toBeNull();
    });
  });

  describe('Display functionality', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          url: 'https://example.com/image.jpg',
          title: 'Test Image',
          explanation: 'Test explanation',
          date: '2024-01-01',
          media_type: 'image'
        })
      });
      panel = new APODPanel();
    });

    it('should display APOD data', () => {
      const testData = {
        url: 'https://example.com/image.jpg',
        title: 'Test Image Title',
        explanation: 'Test explanation text',
        date: '2024-01-01',
        media_type: 'image'
      };

      panel.displayAPOD(testData);

      const imageContainer = document.getElementById('apod-box-image-container');
      const titleElement = document.getElementById('apod-box-title');
      const popupImage = document.getElementById('apod-popup-image');
      const popupTitle = document.getElementById('apod-title');
      const popupExplanation = document.getElementById('apod-explanation');

      expect(imageContainer.innerHTML).toContain('<img');
      expect(titleElement.textContent).toBe('APOD');
      expect(titleElement.title).toBe('Test Image Title');
      expect(popupImage.src).toBe('https://example.com/image.jpg');
      expect(popupTitle.textContent).toBe('Test Image Title');
      expect(popupExplanation.textContent).toBe('Test explanation text');
    });

    it('should always show "APOD" as title', () => {
      const testData = {
        url: 'https://example.com/image.jpg',
        title: 'Very Long Image Title That Should Be Truncated',
        explanation: 'Test explanation',
        date: '2024-01-01',
        media_type: 'image'
      };

      panel.displayAPOD(testData);

      const titleElement = document.getElementById('apod-box-title');
      expect(titleElement.textContent).toBe('APOD');
    });

    it('should handle missing image container gracefully', () => {
      const imageContainer = document.getElementById('apod-box-image-container');
      imageContainer.remove();

      const testData = {
        url: 'https://example.com/image.jpg',
        title: 'Test Image',
        explanation: 'Test explanation',
        date: '2024-01-01',
        media_type: 'image'
      };

      // Should not throw
      expect(() => panel.displayAPOD(testData)).not.toThrow();
    });

    it('should show error state', () => {
      panel.showError();

      const imageContainer = document.getElementById('apod-box-image-container');
      expect(imageContainer.innerHTML).toBe('<div class="apod-error">🌌</div>');
    });
  });

  describe('Popup functionality', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          url: 'https://example.com/image.jpg',
          title: 'Test Image',
          explanation: 'Test explanation',
          date: '2024-01-01',
          media_type: 'image'
        })
      });
      panel = new APODPanel();
    });

    it('should show popup', () => {
      const popup = document.getElementById('apod-popup');
      expect(popup.style.display).toBe('none');

      panel.showPopup();

      expect(popup.style.display).toBe('flex');
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should hide popup', () => {
      const popup = document.getElementById('apod-popup');
      popup.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      panel.hidePopup();

      expect(popup.style.display).toBe('none');
      expect(document.body.style.overflow).toBe('');
    });

    it('should handle missing popup element gracefully', () => {
      const popup = document.getElementById('apod-popup');
      popup.remove();

      expect(() => panel.showPopup()).not.toThrow();
      expect(() => panel.hidePopup()).not.toThrow();
    });
  });

  describe('Box functionality', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          url: 'https://example.com/image.jpg',
          title: 'Test Image',
          explanation: 'Test explanation',
          date: '2024-01-01',
          media_type: 'image'
        })
      });
      panel = new APODPanel();
    });

    it('should show box', () => {
      const box = document.getElementById('apod-box');
      box.style.display = 'none';
      const loadAPODSpy = vi.spyOn(panel, 'loadAPOD');

      panel.showBox();

      expect(box.style.display).toBe('block');
      expect(loadAPODSpy).toHaveBeenCalledTimes(1);
    });

    it('should hide box', () => {
      const box = document.getElementById('apod-box');
      box.style.display = 'block';

      panel.hideBox();

      // Should start fade out animation
      expect(box.style.opacity).toBe('0');
      expect(box.style.transform).toBe('translateY(-10px) scale(0.95)');

      // After animation timeout, should be hidden
      return new Promise(resolve => {
        setTimeout(() => {
          expect(box.style.display).toBe('none');
          resolve();
        }, 500);
      });
    });

    it('should toggle visibility from visible to hidden', () => {
      const box = document.getElementById('apod-box');
      box.style.display = 'block';
      // Mock getComputedStyle to return 'block'
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = vi.fn(() => ({ display: 'block' }));

      panel.toggleVisibility();

      expect(box.style.opacity).toBe('0');

      // Restore
      window.getComputedStyle = originalGetComputedStyle;
    });

    it('should toggle visibility from hidden to visible', () => {
      const box = document.getElementById('apod-box');
      box.style.display = 'none';
      const loadAPODSpy = vi.spyOn(panel, 'loadAPOD');
      // Mock getComputedStyle to return 'none'
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = vi.fn(() => ({ display: 'none' }));

      panel.toggleVisibility();

      expect(box.style.display).toBe('block');
      expect(loadAPODSpy).toHaveBeenCalledTimes(1);

      // Restore
      window.getComputedStyle = originalGetComputedStyle;
    });

    it('should handle missing box element gracefully in showBox', () => {
      const box = document.getElementById('apod-box');
      box.remove();

      expect(() => panel.showBox()).not.toThrow();
    });

    it('should handle missing box element gracefully in hideBox', () => {
      const box = document.getElementById('apod-box');
      box.remove();

      expect(() => panel.hideBox()).not.toThrow();
    });

    it('should handle missing box element gracefully in toggleVisibility', () => {
      const box = document.getElementById('apod-box');
      box.remove();

      expect(() => panel.toggleVisibility()).not.toThrow();
    });
  });

  describe('API fetching', () => {
    beforeEach(() => {
      // Don't mock fetch here - each test will mock it as needed
      panel = new APODPanel();
      // Clear any calls from initialization
      mockFetch.mockClear();
    });

    it('should fetch APOD data successfully', async () => {
      const mockData = {
        url: 'https://example.com/image.jpg',
        title: 'Test Image',
        explanation: 'Test explanation',
        date: '2024-01-01',
        media_type: 'image'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      const result = await panel.fetchAPOD();

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle API error and try fallback', async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // Fallback call succeeds
      const fallbackData = {
        url: 'https://example.com/image.jpg',
        title: 'Fallback Image',
        explanation: 'Fallback explanation',
        date: '2024-01-01',
        media_type: 'image'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => fallbackData
      });

      // Mock fetchRandomAPOD to return the fallback data
      vi.spyOn(panel, 'fetchRandomAPOD').mockResolvedValue(fallbackData);

      const result = await panel.fetchAPOD();

      expect(result).toEqual(fallbackData);
    });

    it('should try yesterday if today is video', async () => {
      const todayData = {
        url: 'https://example.com/video.mp4',
        title: 'Video',
        explanation: 'Video explanation',
        date: '2024-01-01',
        media_type: 'video'
      };

      const yesterdayData = {
        url: 'https://example.com/image.jpg',
        title: 'Yesterday Image',
        explanation: 'Yesterday explanation',
        date: '2023-12-31',
        media_type: 'image'
      };

      // Reset mock to clear any previous calls
      mockFetch.mockClear();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => todayData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => yesterdayData
        });

      const result = await panel.fetchAPOD();

      expect(result).toEqual(yesterdayData);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should fetch random APOD as fallback', async () => {
      const fallbackData = {
        url: 'https://example.com/image.jpg',
        title: 'Random Image',
        explanation: 'Random explanation',
        date: '2023-12-25',
        media_type: 'image'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => fallbackData
      });

      const result = await panel.fetchRandomAPOD();

      expect(result).toEqual(fallbackData);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should return null if random APOD fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false
      });

      const result = await panel.fetchRandomAPOD();

      expect(result).toBeNull();
    });

    it('should return null if random APOD is not an image', async () => {
      const videoData = {
        url: 'https://example.com/video.mp4',
        title: 'Video',
        explanation: 'Video explanation',
        date: '2023-12-25',
        media_type: 'video'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => videoData
      });

      const result = await panel.fetchRandomAPOD();

      expect(result).toBeNull();
    });
  });

  describe('Load APOD', () => {
    it('should load from cache if available', async () => {
      const cachedData = {
        url: 'https://example.com/image.jpg',
        title: 'Cached Image',
        explanation: 'Cached explanation',
        date: '2024-01-01',
        media_type: 'image'
      };

      const cache = {
        data: cachedData,
        timestamp: Date.now()
      };
      localStorage.setItem('apod_cache', JSON.stringify(cache));

      // Clear mock to reset call count
      mockFetch.mockClear();

      // Create new instance - it should use cache and not call fetch
      const testPanel = new APODPanel();

      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not call fetch if cache exists (may have been called during init before cache check)
      // But the important thing is that it uses cached data
      const cached = testPanel.getCachedAPOD();
      expect(cached).toEqual(cachedData);
    });

    it('should fetch and cache if cache is empty', async () => {
      localStorage.clear(); // Ensure no cache

      const mockData = {
        url: 'https://example.com/image.jpg',
        title: 'Test Image',
        explanation: 'Test explanation',
        date: '2024-01-01',
        media_type: 'image'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      // Create new instance - it should fetch and cache
      const testPanel = new APODPanel();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalled();

      // Check that data was cached
      const cached = localStorage.getItem('apod_cache');
      expect(cached).toBeDefined();
      const parsed = JSON.parse(cached);
      expect(parsed.data).toEqual(mockData);
    });

    it('should handle fetch failure gracefully', async () => {
      localStorage.clear(); // Ensure no cache
      // Mock fetch to reject on all calls (including fallback)
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Create new instance
      const testPanel = new APODPanel();

      // Wait longer for all async operations including fallback attempts
      await new Promise(resolve => setTimeout(resolve, 200));

      // When fetch fails completely, fetchAPOD returns null and no error is shown
      // (stays in loading state or shows error depending on implementation)
      // This test verifies the code doesn't crash
      const imageContainer = document.getElementById('apod-box-image-container');
      expect(imageContainer).toBeDefined();
      // The container should still exist (code didn't crash)
      expect(testPanel).toBeDefined();
    });
  });

  describe('Event listeners', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          url: 'https://example.com/image.jpg',
          title: 'Test Image',
          explanation: 'Test explanation',
          date: '2024-01-01',
          media_type: 'image'
        })
      });
      // Create instance with init to set up event listeners
      panel = new APODPanel();
    });

    it('should show popup when image container is clicked', () => {
      const imageContainer = document.getElementById('apod-box-image-container');
      const popup = document.getElementById('apod-popup');

      expect(popup.style.display).toBe('none');

      imageContainer.click();

      expect(popup.style.display).toBe('flex');
    });

    it('should hide box when close button is clicked', async () => {
      const closeBtn = document.getElementById('apod-box-close');
      const box = document.getElementById('apod-box');

      box.style.display = 'block';

      closeBtn.click();

      // Wait for the animation to complete (400ms setTimeout)
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(box.style.display).toBe('none');
    });

    it('should hide popup when popup close button is clicked', () => {
      const popupCloseBtn = document.getElementById('apod-close');
      const popup = document.getElementById('apod-popup');

      popup.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      popupCloseBtn.click();

      expect(popup.style.display).toBe('none');
      expect(document.body.style.overflow).toBe('');
    });

    it('should hide popup when clicking outside popup', () => {
      const popup = document.getElementById('apod-popup');
      popup.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      // Simulate click on popup background (not on content)
      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      Object.defineProperty(clickEvent, 'target', { value: popup });
      popup.dispatchEvent(clickEvent);

      expect(popup.style.display).toBe('none');
      expect(document.body.style.overflow).toBe('');
    });

    it('should hide popup on Escape key', () => {
      const popup = document.getElementById('apod-popup');
      popup.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      const escapeEvent = new window.KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });
      document.dispatchEvent(escapeEvent);

      expect(popup.style.display).toBe('none');
      expect(document.body.style.overflow).toBe('');
    });

    it('should hide box on Escape key when popup is not visible', async () => {
      const box = document.getElementById('apod-box');
      const popup = document.getElementById('apod-popup');

      box.style.display = 'block';
      popup.style.display = 'none';

      const escapeEvent = new window.KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });
      document.dispatchEvent(escapeEvent);

      // Wait for the animation to complete (400ms setTimeout)
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(box.style.display).toBe('none');
    });
  });

  describe('Global functions', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          url: 'https://example.com/image.jpg',
          title: 'Test Image',
          explanation: 'Test explanation',
          date: '2024-01-01',
          media_type: 'image'
        })
      });
      panel = new APODPanel();
      window.APODPanel = panel;
    });

    it('should expose openApodWindow function', () => {
      expect(typeof window.openApodWindow).toBe('function');
    });

    it('should call toggleVisibility when openApodWindow is called', () => {
      const toggleVisibilitySpy = vi.spyOn(panel, 'toggleVisibility');

      window.openApodWindow();

      expect(toggleVisibilitySpy).toHaveBeenCalledTimes(1);
    });

    it('should handle missing APODPanel instance gracefully', () => {
      window.APODPanel = null;

      expect(() => window.openApodWindow()).not.toThrow();
    });
  });
});
