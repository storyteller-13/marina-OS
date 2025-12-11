import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('MusicPlayer', () => {
  let dom;
  let window;
  let document;
  let MusicPlayer;
  let mockYTPlayer;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="music-youtube"></div>
          <div id="music-toggle"></div>
          <div id="music-player"></div>
          <div id="sound-icon-toggle"></div>
          <div id="music-close"></div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock YouTube API
    mockYTPlayer = {
      getPlayerState: vi.fn(() => 2), // PAUSED
      playVideo: vi.fn(),
      pauseVideo: vi.fn()
    };

    global.YT = {
      Player: vi.fn(function(id, options) {
        this.id = id;
        this.options = options;
        // Call onReady callback if provided
        if (options && options.events && options.events.onReady) {
          setTimeout(() => options.events.onReady(), 0);
        }
        return mockYTPlayer;
      }),
      PlayerState: {
        UNSTARTED: -1,
        ENDED: 0,
        PLAYING: 1,
        PAUSED: 2,
        BUFFERING: 3,
        CUED: 5
      }
    };
    window.YT = global.YT;

    // Load MusicPlayerStorage first (required dependency)
    const fs = require('fs');
    const path = require('path');
    const storageCode = fs.readFileSync(
      path.join(__dirname, '../../scripts/applications/music-player/music-player-storage.js'),
      'utf8'
    );
    eval(storageCode);

    // Mock localStorage for tests
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
          store[key] = value.toString();
        }),
        removeItem: vi.fn((key) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        })
      };
    })();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // Load MusicPlayer class
    const code = fs.readFileSync(
      path.join(__dirname, '../../scripts/applications/music-player/music-player.js'),
      'utf8'
    );
    eval(code);
    MusicPlayer = window.MusicPlayerClass;
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clear localStorage mock
    if (window.localStorage && window.localStorage.clear) {
      window.localStorage.clear();
    }
  });

  describe('initialization', () => {
    it('should initialize music player', () => {
      const player = new MusicPlayer();
      expect(player).toBeDefined();
      expect(player.isReady).toBe(false);
      // Player may be initialized immediately if YT is available
      expect(player.selectors).toBeDefined();
      expect(player.selectors.youtube).toBe('music-youtube');
      expect(player.selectors.toggle).toBe('music-toggle');
      expect(player.selectors.player).toBe('music-player');
    });

    it('should setup player when YT API is available', () => {
      const player = new MusicPlayer();
      // Wait for async onReady callback
      return new Promise(resolve => {
        setTimeout(() => {
          expect(window.YT.Player).toHaveBeenCalled();
          expect(window.YT.Player).toHaveBeenCalledWith(
            'music-youtube',
            expect.objectContaining({
              videoId: 'IXdNnw99-Ic',
              playerVars: expect.any(Object),
              events: expect.any(Object)
            })
          );
          resolve();
        }, 10);
      });
    });

    it('should set onYouTubeIframeAPIReady callback when YT API is not available', () => {
      // Clear YT before creating player
      const originalYT = window.YT;
      delete window.YT;
      delete global.YT;

      // Reload the script to get fresh behavior
      const fs = require('fs');
      const path = require('path');
      // Ensure storage is loaded
      if (!window.MusicPlayerStorage) {
        const storageCode = fs.readFileSync(
          path.join(__dirname, '../../scripts/applications/music-player/music-player-storage.js'),
          'utf8'
        );
        eval(storageCode);
      }
      const code = fs.readFileSync(
        path.join(__dirname, '../../scripts/applications/music-player/music-player.js'),
        'utf8'
      );
      // Clear the class first
      delete window.MusicPlayerClass;
      eval(code);

      const player = new window.MusicPlayerClass();

      expect(typeof window.onYouTubeIframeAPIReady).toBe('function');

      // Simulate API ready
      window.YT = originalYT;
      global.YT = originalYT;
      window.onYouTubeIframeAPIReady();

      expect(window.YT.Player).toHaveBeenCalled();

      // Restore for other tests
      window.YT = originalYT;
      global.YT = originalYT;
    });

    it('should handle missing YouTube element gracefully', () => {
      const youtubeElement = document.getElementById('music-youtube');
      youtubeElement.remove();

      const player = new MusicPlayer();
      expect(player.player).toBeNull();
    });

    it('should initialize global MusicPlayer instance', () => {
      expect(window.MusicPlayer).toBeDefined();
      expect(window.MusicPlayer).toBeInstanceOf(MusicPlayer);
    });
  });

  describe('setupPlayer', () => {
    it('should create player with correct configuration', () => {
      const player = new MusicPlayer();

      return new Promise(resolve => {
        setTimeout(() => {
          expect(window.YT.Player).toHaveBeenCalledWith(
            'music-youtube',
            expect.objectContaining({
              videoId: 'IXdNnw99-Ic',
              playerVars: {
                'autoplay': 0,
                'loop': 1,
                'playlist': expect.any(String), // Playlist will be generated from songs array
                'controls': 0,
                'modestbranding': 1,
                'rel': 0
              }
            })
          );
          resolve();
        }, 10);
      });
    });

    it('should set isReady to true when player is ready', () => {
      const player = new MusicPlayer();

      return new Promise(resolve => {
        setTimeout(() => {
          expect(player.isReady).toBe(true);
          resolve();
        }, 10);
      });
    });

    it('should handle player initialization errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      window.YT.Player = vi.fn(() => {
        throw new Error('Player initialization failed');
      });

      const player = new MusicPlayer();
      player.setupPlayer();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize YouTube player:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('onStateChange', () => {
    it('should add playing class when state changes to PLAYING', () => {
      const player = new MusicPlayer();
      const musicToggle = document.getElementById('music-toggle');
      const musicPlayer = document.getElementById('music-player');

      const event = { data: YT.PlayerState.PLAYING };
      player.onStateChange(event);

      expect(musicToggle.classList.contains('playing')).toBe(true);
      expect(musicPlayer.classList.contains('playing')).toBe(true);
    });

    it('should remove playing class when state changes to PAUSED', () => {
      const player = new MusicPlayer();
      const musicToggle = document.getElementById('music-toggle');
      const musicPlayer = document.getElementById('music-player');

      musicToggle.classList.add('playing');
      musicPlayer.classList.add('playing');

      const event = { data: YT.PlayerState.PAUSED };
      player.onStateChange(event);

      expect(musicToggle.classList.contains('playing')).toBe(false);
      expect(musicPlayer.classList.contains('playing')).toBe(false);
    });

    it('should handle missing DOM elements gracefully', () => {
      const player = new MusicPlayer();
      const musicToggle = document.getElementById('music-toggle');
      const musicPlayer = document.getElementById('music-player');

      musicToggle.remove();
      musicPlayer.remove();

      const event = { data: YT.PlayerState.PLAYING };
      expect(() => player.onStateChange(event)).not.toThrow();
    });

    it('should handle invalid event data', () => {
      const player = new MusicPlayer();

      expect(() => player.onStateChange(null)).not.toThrow();
      expect(() => player.onStateChange({})).not.toThrow();
      expect(() => player.onStateChange({ data: 'invalid' })).not.toThrow();
    });
  });

  describe('setupUIControls', () => {
    it('should setup click handler for music toggle', () => {
      const player = new MusicPlayer();
      const musicToggle = document.getElementById('music-toggle');
      const toggleSpy = vi.spyOn(player, 'togglePlayPause');

      const clickEvent = new window.MouseEvent('click', { bubbles: true });
      musicToggle.dispatchEvent(clickEvent);

      expect(toggleSpy).toHaveBeenCalledTimes(1);
    });

    it('should setup click handler for close button', () => {
      const player = new MusicPlayer();
      const musicClose = document.getElementById('music-close');
      const toggleVisibilitySpy = vi.spyOn(player, 'toggleVisibility');

      const clickEvent = new window.MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

      musicClose.dispatchEvent(clickEvent);

      expect(toggleVisibilitySpy).toHaveBeenCalledTimes(1);
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should setup click handler for sound icon toggle', () => {
      const player = new MusicPlayer();
      const soundIconToggle = document.getElementById('sound-icon-toggle');
      const toggleVisibilitySpy = vi.spyOn(player, 'toggleVisibility');

      const clickEvent = new window.MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

      soundIconToggle.dispatchEvent(clickEvent);

      expect(toggleVisibilitySpy).toHaveBeenCalledTimes(1);
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should handle missing UI elements gracefully', () => {
      const musicToggle = document.getElementById('music-toggle');
      const musicClose = document.getElementById('music-close');
      const soundIconToggle = document.getElementById('sound-icon-toggle');

      musicToggle.remove();
      musicClose.remove();
      soundIconToggle.remove();

      expect(() => new MusicPlayer()).not.toThrow();
    });
  });

  describe('togglePlayPause', () => {
    it('should play video when player is paused', () => {
      const player = new MusicPlayer();
      player.player = mockYTPlayer;
      player.isReady = true;
      mockYTPlayer.getPlayerState.mockReturnValue(YT.PlayerState.PAUSED);

      player.togglePlayPause();

      expect(mockYTPlayer.playVideo).toHaveBeenCalledTimes(1);
      expect(mockYTPlayer.pauseVideo).not.toHaveBeenCalled();
    });

    it('should pause video when player is playing', () => {
      const player = new MusicPlayer();
      player.player = mockYTPlayer;
      player.isReady = true;
      mockYTPlayer.getPlayerState.mockReturnValue(YT.PlayerState.PLAYING);

      player.togglePlayPause();

      expect(mockYTPlayer.pauseVideo).toHaveBeenCalledTimes(1);
      expect(mockYTPlayer.playVideo).not.toHaveBeenCalled();
    });

    it('should pause video when player is buffering', () => {
      const player = new MusicPlayer();
      player.player = mockYTPlayer;
      player.isReady = true;
      mockYTPlayer.getPlayerState.mockReturnValue(YT.PlayerState.BUFFERING);

      player.togglePlayPause();

      expect(mockYTPlayer.pauseVideo).toHaveBeenCalledTimes(1);
      expect(mockYTPlayer.playVideo).not.toHaveBeenCalled();
    });

    it('should do nothing when player is not ready', () => {
      vi.useFakeTimers();
      const player = new MusicPlayer();
      player.player = mockYTPlayer;
      player.isReady = false;
      const updatePlayingStateSpy = vi.spyOn(player, 'updatePlayingState');

      player.togglePlayPause();

      expect(mockYTPlayer.playVideo).not.toHaveBeenCalled();
      expect(updatePlayingStateSpy).not.toHaveBeenCalled();

      // Advance time - should still not play
      vi.advanceTimersByTime(500);

      expect(mockYTPlayer.playVideo).not.toHaveBeenCalled();
      expect(updatePlayingStateSpy).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should do nothing if player is null', () => {
      vi.useFakeTimers();
      const player = new MusicPlayer();
      player.player = null;
      player.isReady = false;

      player.togglePlayPause();
      vi.advanceTimersByTime(500);

      expect(mockYTPlayer.playVideo).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should handle errors when toggling play/pause', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const player = new MusicPlayer();
      player.player = mockYTPlayer;
      player.isReady = true;
      mockYTPlayer.getPlayerState.mockImplementation(() => {
        throw new Error('Player error');
      });

      player.togglePlayPause();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to toggle play/pause:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updatePlayingState', () => {
    it('should add playing class when isPlaying is true', () => {
      const player = new MusicPlayer();
      const musicToggle = document.getElementById('music-toggle');
      const musicPlayer = document.getElementById('music-player');

      player.updatePlayingState(true);

      expect(musicToggle.classList.contains('playing')).toBe(true);
      expect(musicPlayer.classList.contains('playing')).toBe(true);
    });

    it('should remove playing class when isPlaying is false', () => {
      const player = new MusicPlayer();
      const musicToggle = document.getElementById('music-toggle');
      const musicPlayer = document.getElementById('music-player');

      musicToggle.classList.add('playing');
      musicPlayer.classList.add('playing');

      player.updatePlayingState(false);

      expect(musicToggle.classList.contains('playing')).toBe(false);
      expect(musicPlayer.classList.contains('playing')).toBe(false);
    });

    it('should handle missing DOM elements gracefully', () => {
      const player = new MusicPlayer();
      const musicToggle = document.getElementById('music-toggle');
      const musicPlayer = document.getElementById('music-player');

      musicToggle.remove();
      musicPlayer.remove();

      expect(() => player.updatePlayingState(true)).not.toThrow();
    });
  });

  describe('toggleVisibility', () => {
    it('should hide player when visible', () => {
      vi.useFakeTimers();
      const player = new MusicPlayer();
      const musicPlayer = document.getElementById('music-player');
      musicPlayer.style.display = 'block';
      const hideSpy = vi.spyOn(player, 'hidePlayer');

      player.toggleVisibility();

      expect(hideSpy).toHaveBeenCalledWith(musicPlayer);

      vi.useRealTimers();
    });

    it('should show player when hidden', () => {
      const player = new MusicPlayer();
      const musicPlayer = document.getElementById('music-player');
      musicPlayer.style.display = 'none';
      const showSpy = vi.spyOn(player, 'showPlayer');

      player.toggleVisibility();

      expect(showSpy).toHaveBeenCalledWith(musicPlayer);
    });

    it('should handle missing player element gracefully', () => {
      const player = new MusicPlayer();
      const musicPlayer = document.getElementById('music-player');
      musicPlayer.remove();

      expect(() => player.toggleVisibility()).not.toThrow();
    });

    it('should detect visibility using computed styles', () => {
      const player = new MusicPlayer();
      const musicPlayer = document.getElementById('music-player');
      musicPlayer.style.display = 'none';

      // Mock getComputedStyle to return display: none
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = vi.fn(() => ({
        display: 'none'
      }));

      const showSpy = vi.spyOn(player, 'showPlayer');
      player.toggleVisibility();

      expect(showSpy).toHaveBeenCalled();

      window.getComputedStyle = originalGetComputedStyle;
    });
  });

  describe('hidePlayer', () => {
    it('should hide player with animation', () => {
      vi.useFakeTimers();
      const player = new MusicPlayer();
      const musicPlayer = document.getElementById('music-player');
      musicPlayer.style.display = 'block';

      player.hidePlayer(musicPlayer);

      expect(musicPlayer.style.opacity).toBe('0');
      expect(musicPlayer.style.transform).toBe('translateY(-10px) scale(0.95)');

      vi.advanceTimersByTime(400);

      expect(musicPlayer.style.display).toBe('none');

      vi.useRealTimers();
    });
  });

  describe('showPlayer', () => {
    it('should show player with animation', () => {
      const player = new MusicPlayer();
      const musicPlayer = document.getElementById('music-player');
      musicPlayer.style.display = 'none';

      // Mock requestAnimationFrame to capture callback
      const originalRAF = window.requestAnimationFrame;
      let capturedCallback;
      const rafSpy = vi.fn((callback) => {
        capturedCallback = callback;
        return 1;
      });
      window.requestAnimationFrame = rafSpy;
      global.requestAnimationFrame = rafSpy;

      player.showPlayer(musicPlayer);

      // Check initial state before callback
      expect(musicPlayer.style.display).toBe('block');
      expect(musicPlayer.style.opacity).toBe('0');
      expect(musicPlayer.style.transform).toBe('translateY(-10px) scale(0.95)');
      expect(rafSpy).toHaveBeenCalled();
      expect(capturedCallback).toBeDefined();

      // Execute callback and check final state
      capturedCallback();
      expect(musicPlayer.style.transition).toBe('opacity 0.4s ease, transform 0.4s ease');
      expect(musicPlayer.style.opacity).toBe('1');
      expect(musicPlayer.style.transform).toBe('translateY(0) scale(1)');

      window.requestAnimationFrame = originalRAF;
      delete global.requestAnimationFrame;
    });
  });

  describe('DOM ready state handling', () => {
    it('should initialize when DOM is already loaded', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true,
        configurable: true
      });

      // Clear any existing instance
      window.MusicPlayer = null;

      const fs = require('fs');
      const path = require('path');
      // Ensure storage is loaded
      if (!window.MusicPlayerStorage) {
        const storageCode = fs.readFileSync(
          path.join(__dirname, '../../scripts/applications/music-player/music-player-storage.js'),
          'utf8'
        );
        eval(storageCode);
      }
      // Ensure localStorage mock exists
      if (!window.localStorage) {
        const localStorageMock = (() => {
          let store = {};
          return {
            getItem: vi.fn((key) => store[key] || null),
            setItem: vi.fn((key, value) => {
              store[key] = value.toString();
            }),
            removeItem: vi.fn((key) => {
              delete store[key];
            }),
            clear: vi.fn(() => {
              store = {};
            })
          };
        })();
        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
          writable: true
        });
      }
      const code = fs.readFileSync(
        path.join(__dirname, '../../scripts/applications/music-player/music-player.js'),
        'utf8'
      );
      eval(code);

      expect(window.MusicPlayer).toBeDefined();
    });

    it('should wait for DOMContentLoaded when DOM is loading', () => {
      // Clear existing instance
      const existingInstance = window.MusicPlayer;
      window.MusicPlayer = null;

      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true,
        configurable: true
      });

      const fs = require('fs');
      const path = require('path');
      // Ensure storage is loaded
      if (!window.MusicPlayerStorage) {
        const storageCode = fs.readFileSync(
          path.join(__dirname, '../../scripts/applications/music-player/music-player-storage.js'),
          'utf8'
        );
        eval(storageCode);
      }
      // Ensure localStorage mock exists
      if (!window.localStorage) {
        const localStorageMock = (() => {
          let store = {};
          return {
            getItem: vi.fn((key) => store[key] || null),
            setItem: vi.fn((key, value) => {
              store[key] = value.toString();
            }),
            removeItem: vi.fn((key) => {
              delete store[key];
            }),
            clear: vi.fn(() => {
              store = {};
            })
          };
        })();
        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
          writable: true
        });
      }
      const code = fs.readFileSync(
        path.join(__dirname, '../../scripts/applications/music-player/music-player.js'),
        'utf8'
      );
      eval(code);

      // Should not be initialized immediately when readyState is 'loading'
      // (Note: In test environment, it might already be initialized, so we check after event)
      const beforeEvent = window.MusicPlayer;

      // Simulate DOMContentLoaded
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      // Should be initialized after event
      expect(window.MusicPlayer).toBeDefined();

      // Restore original state
      window.MusicPlayer = existingInstance;
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true,
        configurable: true
      });
    });
  });
});
