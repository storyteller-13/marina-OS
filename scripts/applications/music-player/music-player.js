/**
 * Music Player Application Module
 * Handles YouTube music player functionality
 */
class MusicPlayer {
    constructor() {
        this.player = null;
        this.isReady = false;
        this.currentSongIndex = 0;
        this.songs = [];
        this.storage = new MusicPlayerStorage();
        this.playlistsData = null;
        this.selectors = {
            youtube: 'music-youtube',
            toggle: 'music-toggle',
            player: 'music-player',
            soundIcon: 'sound-icon-toggle',
            close: 'music-close',
            title: 'music-title',
            prev: 'music-prev',
            next: 'music-next',
            songList: 'music-song-list'
        };

        this.loadPlaylists();
        this.init();
    }

    loadPlaylists() {
        this.playlistsData = this.storage.load();
        
        // Ensure emo playlist exists, create it if it doesn't
        const emoPlaylist = this.storage.getPlaylist(this.playlistsData, 'emo-playlist');
        if (!emoPlaylist) {
            console.log('Creating emo playlist...');
            // Create emo playlist with the current songs
            const emoSongs = [
                { id: 'IXdNnw99-Ic', title: 'wish you were here' },
                { id: 'ujNeHIo7oTE', title: 'with or without you' },
                { id: '1lyu1KKwC74', title: 'bitter sweet symphony' },
                { id: '7jMlFXouPk8', title: 'high hopes' },
                { id: 'TFjmvfRvjTc', title: 'hey you' }
            ];
            
            if (!this.playlistsData.playlists) {
                this.playlistsData.playlists = [];
            }
            
            this.playlistsData.playlists.push({
                id: 'emo-playlist',
                name: 'emo playlist',
                songs: emoSongs
            });
            
            // Set as current playlist if no current playlist is set
            if (!this.playlistsData.currentPlaylistId) {
                this.playlistsData.currentPlaylistId = 'emo-playlist';
            }
            
            this.storage.save(this.playlistsData);
            console.log('Emo playlist created with', emoSongs.length, 'songs');
        }
        
        // Load songs from current playlist
        const currentPlaylist = this.storage.getCurrentPlaylist(this.playlistsData);
        if (currentPlaylist && currentPlaylist.songs && currentPlaylist.songs.length > 0) {
            this.songs = currentPlaylist.songs;
            console.log('Loaded playlist:', currentPlaylist.name, 'with', this.songs.length, 'songs');
        } else {
            // Fallback to emo playlist if current playlist is empty
            const emoPlaylist = this.storage.getPlaylist(this.playlistsData, 'emo-playlist');
            if (emoPlaylist && emoPlaylist.songs && emoPlaylist.songs.length > 0) {
                this.songs = emoPlaylist.songs;
                this.playlistsData.currentPlaylistId = 'emo-playlist';
                this.storage.save(this.playlistsData);
                console.log('Switched to emo playlist with', this.songs.length, 'songs');
            } else {
                // Last resort: use default data
                console.log('Using default playlist data');
                this.playlistsData = this.storage.getDefaultData();
                this.storage.save(this.playlistsData);
                this.songs = this.playlistsData.playlists[0].songs;
            }
        }
    }
    
    /**
     * Get the current playlist name
     * @returns {string} Current playlist name
     */
    getCurrentPlaylistName() {
        if (!this.playlistsData) return '';
        const currentPlaylist = this.storage.getCurrentPlaylist(this.playlistsData);
        return currentPlaylist ? currentPlaylist.name : '';
    }

    init() {
        this.setupYouTubeAPI();
        this.setupUIControls();
    }

    setupYouTubeAPI() {
        if (typeof YT !== 'undefined' && YT.Player) {
            this.setupPlayer();
        } else {
            // Store existing callback if any, then chain it
            const existingCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (existingCallback) {
                    existingCallback();
                }
                this.setupPlayer();
            };

            // Also check periodically in case the API loads but doesn't call the callback
            let checkCount = 0;
            const checkInterval = setInterval(() => {
                checkCount++;
                if (typeof YT !== 'undefined' && YT.Player && !this.player) {
                    clearInterval(checkInterval);
                    this.setupPlayer();
                } else if (checkCount > 50) { // Stop checking after ~5 seconds
                    clearInterval(checkInterval);
                    if (!this.player) {
                        console.warn('YouTube API did not load within expected time');
                    }
                }
            }, 100);
        }
    }

    setupPlayer() {
        // Prevent multiple initializations
        if (this.player && this.isReady) {
            return;
        }

        const youtubeElement = document.getElementById(this.selectors.youtube);
        if (!youtubeElement) {
            console.warn('YouTube element not found:', this.selectors.youtube);
            return;
        }

        if (typeof YT === 'undefined' || !YT.Player) {
            console.warn('YouTube API not available');
            return;
        }

        try {
            const currentSong = this.songs[this.currentSongIndex];
            const playlist = this.songs.map(song => song.id).join(',');

            // If element is an iframe with src, replace it with a div for YT.Player
            // YT.Player works better with a div element
            if (youtubeElement.tagName === 'IFRAME') {
                const parent = youtubeElement.parentNode;
                const newDiv = document.createElement('div');
                newDiv.id = this.selectors.youtube;
                newDiv.style.display = youtubeElement.style.display;
                parent.replaceChild(newDiv, youtubeElement);
            }

            this.player = new YT.Player(this.selectors.youtube, {
                videoId: currentSong.id,
                playerVars: {
                    'autoplay': 0,
                    'loop': 1,
                    'playlist': playlist,
                    'controls': 0,
                    'modestbranding': 1,
                    'rel': 0
                },
                events: {
                    'onReady': () => {
                        this.isReady = true;
                        console.log('YouTube player ready');
                        // Player is initialized with autoplay: 0, so it won't start automatically
                        this.updateSongTitle();
                        this.renderSongList();
                    },
                    'onStateChange': (event) => {
                        this.onStateChange(event);
                    },
                    'onError': (event) => {
                        const errorCode = event.data;
                        const currentSong = this.songs[this.currentSongIndex];
                        const errorMessages = {
                            2: 'Invalid parameter - check video ID',
                            5: 'HTML5 player error - browser may not support playback',
                            100: 'Video not found',
                            101: 'Embedding not allowed',
                            150: 'Embedding not allowed (same as 101)'
                        };

                        console.error(`YouTube player error for "${currentSong.title}" (${currentSong.id}):`,
                            errorCode, '-', errorMessages[errorCode] || 'Unknown error');

                        // YouTube error codes:
                        // 2=invalid parameter, 5=HTML5 error, 100=video not found,
                        // 101=embedding not allowed, 150=same as 101
                        if (errorCode === 100 || errorCode === 101 || errorCode === 150) {
                            console.warn(`Video "${currentSong.title}" unavailable or embedding restricted, skipping to next song`);
                            setTimeout(() => {
                                this.playNextSong();
                            }, 1000);
                        } else if (errorCode === 2) {
                            console.error('Invalid parameter - check video ID:', currentSong.id);
                            // Try to continue with next song if current one fails
                            setTimeout(() => {
                                if (this.currentSongIndex < this.songs.length - 1) {
                                    this.playNextSong();
                                }
                            }, 1000);
                        } else if (errorCode === 5) {
                            console.error('HTML5 player error - browser may not support playback');
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Failed to initialize YouTube player:', error);
        }
    }

    onStateChange(event) {
        if (!event || typeof event.data !== 'number') return;

        const musicToggle = document.getElementById(this.selectors.toggle);
        const musicPlayer = document.getElementById(this.selectors.player);

        if (event.data === YT.PlayerState.PLAYING) {
            if (musicToggle) musicToggle.classList.add('playing');
            if (musicPlayer) musicPlayer.classList.add('playing');
        } else if (event.data === YT.PlayerState.PAUSED) {
            if (musicToggle) musicToggle.classList.remove('playing');
            if (musicPlayer) musicPlayer.classList.remove('playing');
        }
    }

    setupUIControls() {
        const musicToggle = document.getElementById(this.selectors.toggle);
        const musicClose = document.getElementById(this.selectors.close);
        const soundIconToggle = document.getElementById(this.selectors.soundIcon);
        const musicPlayer = document.getElementById(this.selectors.player);
        const prevButton = document.getElementById(this.selectors.prev);
        const nextButton = document.getElementById(this.selectors.next);

        if (musicToggle) {
            musicToggle.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }

        if (musicClose) {
            musicClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleVisibility();
            });
        }

        if (soundIconToggle && musicPlayer) {
            soundIconToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleVisibility();
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.playPreviousSong();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.playNextSong();
            });
        }
    }

    togglePlayPause() {
        if (!this.player || !this.isReady) {
            // Player not ready, do nothing - user must wait for initialization
            console.warn('Music player not ready yet', {
                hasPlayer: !!this.player,
                isReady: this.isReady,
                ytAvailable: typeof YT !== 'undefined'
            });
            return;
        }

        try {
            const state = this.player.getPlayerState();
            console.log('Current player state:', state);
            if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
                this.player.pauseVideo();
            } else if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.ENDED || state === YT.PlayerState.CUED || state === YT.PlayerState.UNSTARTED) {
                this.player.playVideo();
            }
        } catch (error) {
            console.error('Failed to toggle play/pause:', error);
        }
    }

    updatePlayingState(isPlaying) {
        const musicToggle = document.getElementById(this.selectors.toggle);
        const musicPlayer = document.getElementById(this.selectors.player);

        if (isPlaying) {
            if (musicToggle) musicToggle.classList.add('playing');
            if (musicPlayer) musicPlayer.classList.add('playing');
        } else {
            if (musicToggle) musicToggle.classList.remove('playing');
            if (musicPlayer) musicPlayer.classList.remove('playing');
        }
    }

    toggleVisibility() {
        const musicPlayer = document.getElementById(this.selectors.player);
        if (!musicPlayer) return;

        const isVisible = musicPlayer.style.display !== 'none' &&
                         window.getComputedStyle(musicPlayer).display !== 'none';

        if (isVisible) {
            this.hidePlayer(musicPlayer);
        } else {
            this.showPlayer(musicPlayer);
        }
    }

    hidePlayer(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px) scale(0.95)';
        setTimeout(() => {
            element.style.display = 'none';
        }, 400);
    }

    showPlayer(element) {
        element.style.display = 'block';
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px) scale(0.95)';
        void element.offsetHeight; // Force reflow
        requestAnimationFrame(() => {
            element.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0) scale(1)';
        });
    }

    playNextSong() {
        this.currentSongIndex = (this.currentSongIndex + 1) % this.songs.length;
        this.loadSong();
    }

    playPreviousSong() {
        this.currentSongIndex = (this.currentSongIndex - 1 + this.songs.length) % this.songs.length;
        this.loadSong();
    }

    loadSong() {
        if (!this.player || !this.isReady) {
            console.warn('Cannot load song: player not ready');
            return;
        }

        const currentSong = this.songs[this.currentSongIndex];
        if (!currentSong) {
            console.error('No song found at index:', this.currentSongIndex);
            return;
        }

        console.log('Loading song:', currentSong.title, 'ID:', currentSong.id);
        const wasPlaying = this.player.getPlayerState() === YT.PlayerState.PLAYING;

        try {
            this.player.loadVideoById({
                videoId: currentSong.id,
                startSeconds: 0
            });
            this.updateSongTitle();

            // Only resume playing if it was already playing (user-initiated)
            // This prevents auto-play when switching songs, but allows continuation if user was playing
            if (wasPlaying) {
                // Wait for video to load before playing
                let attempts = 0;
                const tryPlay = () => {
                    attempts++;
                    if (this.player && this.isReady) {
                        try {
                            const state = this.player.getPlayerState();
                            // Check if video is loaded (CUED, PAUSED, or ENDED means it's ready)
                            if (state === YT.PlayerState.CUED ||
                                state === YT.PlayerState.PAUSED ||
                                state === YT.PlayerState.ENDED ||
                                state === YT.PlayerState.UNSTARTED) {
                                this.player.playVideo();
                                console.log('Playing song:', currentSong.title);
                            } else if (attempts < 10) {
                                // Retry after 200ms if not ready yet
                                setTimeout(tryPlay, 200);
                            } else {
                                console.warn('Video did not load in time for:', currentSong.title);
                            }
                        } catch (error) {
                            console.error('Failed to resume playback:', error);
                        }
                    }
                };
                setTimeout(tryPlay, 500);
            }
        } catch (error) {
            console.error('Failed to load song:', currentSong.title, error);
        }
    }

    updateSongTitle() {
        const titleElement = document.getElementById(this.selectors.title);
        if (titleElement && this.songs[this.currentSongIndex]) {
            titleElement.textContent = this.songs[this.currentSongIndex].title;
        }
        this.renderSongList();
    }

    renderSongList() {
        const songListElement = document.getElementById(this.selectors.songList);
        if (!songListElement || !this.playlistsData || !this.playlistsData.playlists) return;

        const currentPlaylistId = this.playlistsData.currentPlaylistId;
        
        // Build HTML for all playlists
        songListElement.innerHTML = this.playlistsData.playlists.map(playlist => {
            const isCurrentPlaylist = playlist.id === currentPlaylistId;
            const songsHtml = (playlist.songs || []).map((song, index) => {
                // Find the song index in the current songs array
                const globalSongIndex = this.songs.findIndex(s => s.id === song.id);
                const isActive = isCurrentPlaylist && globalSongIndex === this.currentSongIndex;
                return `
                    <div class="music-song-item-small ${isActive ? 'active' : ''}" 
                         data-playlist-id="${playlist.id}" 
                         data-song-id="${song.id}"
                         data-song-index="${globalSongIndex >= 0 ? globalSongIndex : index}">
                        <span class="music-song-title-small">${song.title}</span>
                    </div>
                `;
            }).join('');

            return `
                <div class="music-playlist-container">
                    <div class="music-playlist-header ${isCurrentPlaylist ? 'active' : ''}" 
                         data-playlist-id="${playlist.id}">
                        <span class="music-playlist-name">${playlist.name}</span>
                    </div>
                    <div class="music-playlist-songs">
                        ${songsHtml}
                    </div>
                </div>
            `;
        }).join('');

        // Attach click handlers for playlist headers
        songListElement.querySelectorAll('.music-playlist-header').forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const playlistId = header.getAttribute('data-playlist-id');
                if (playlistId !== currentPlaylistId) {
                    this.storage.setCurrentPlaylist(this.playlistsData, playlistId);
                    this.loadPlaylists();
                    // Reset to first song in playlist but don't load/play it
                    this.currentSongIndex = 0;
                    // Update title to show first song name
                    this.updateSongTitle();
                    // Re-render to update active states
                    this.renderSongList();
                }
            });
        });

        // Attach click handlers for songs
        songListElement.querySelectorAll('.music-song-item-small').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const playlistId = item.getAttribute('data-playlist-id');
                const songId = item.getAttribute('data-song-id');

                // Switch to the playlist if not current
                if (playlistId !== currentPlaylistId) {
                    this.storage.setCurrentPlaylist(this.playlistsData, playlistId);
                    this.loadPlaylists();
                }

                // Find the song in the current songs array
                const actualSongIndex = this.songs.findIndex(s => s.id === songId);
                if (actualSongIndex >= 0) {
                    if (actualSongIndex !== this.currentSongIndex) {
                        this.currentSongIndex = actualSongIndex;
                        const wasPlaying = this.player && this.isReady &&
                            this.player.getPlayerState() === YT.PlayerState.PLAYING;
                        this.loadSong();
                        // If nothing was playing, start playing the selected song
                        if (!wasPlaying && this.player && this.isReady) {
                            // Wait for video to load before playing
                            let attempts = 0;
                            const tryPlay = () => {
                                attempts++;
                                if (this.player && this.isReady) {
                                    try {
                                        const state = this.player.getPlayerState();
                                        // Check if video is loaded (CUED, PAUSED, or ENDED means it's ready)
                                        if (state === YT.PlayerState.CUED ||
                                            state === YT.PlayerState.PAUSED ||
                                            state === YT.PlayerState.ENDED ||
                                            state === YT.PlayerState.UNSTARTED) {
                                            this.player.playVideo();
                                            console.log('Playing selected song:', this.songs[actualSongIndex].title);
                                        } else if (attempts < 15) {
                                            // Retry after 200ms if not ready yet (up to 3 seconds)
                                            setTimeout(tryPlay, 200);
                                        } else {
                                            console.warn('Video did not load in time for:', this.songs[actualSongIndex].title);
                                        }
                                    } catch (error) {
                                        console.error('Failed to play selected song:', error);
                                    }
                                }
                            };
                            setTimeout(tryPlay, 500);
                        }
                    } else {
                        // If clicking the same song, toggle play/pause
                        this.togglePlayPause();
                    }
                    // Re-render to update active states
                    this.renderSongList();
                }
            });
        });
    }
}

// Expose class constructor for testing
window.MusicPlayerClass = MusicPlayer;

// Initialize when DOM is ready
const initMusicPlayer = () => {
    window.MusicPlayer = new MusicPlayer();
    
    // Expose method to check current playlist
    window.getCurrentPlaylist = () => {
        if (window.MusicPlayer && window.MusicPlayer.playlistsData) {
            const storage = window.MusicPlayer.storage;
            const currentPlaylist = storage.getCurrentPlaylist(window.MusicPlayer.playlistsData);
            console.log('Current playlist:', currentPlaylist);
            return currentPlaylist;
        }
        return null;
    };
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMusicPlayer);
} else {
    initMusicPlayer();
}
