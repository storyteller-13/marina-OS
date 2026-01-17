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
        this.expandedPlaylists = new Set();
        this.isLoadingSong = false;
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

    /**
     * Initialize playlists and ensure required playlists exist
     */
    loadPlaylists() {
        this.playlistsData = this.storage.load();
        
        // Ensure playlists array exists
        if (!this.playlistsData.playlists) {
            this.playlistsData.playlists = [];
        }

        // Define required playlists with their songs
        const requiredPlaylists = [
            {
                id: 'flow',
                name: '2026 floater',
                songs: [{ id: 'FoYdeEDdtK4', title: 'peaches in regalia' }],
                position: 0
            },
            {
                id: 'renewal',
                name: '2026 renewal',
                songs: [
                    { id: 'X2959NkomEc', title: 'up all night' },
                    { id: 'ya7L3A1DOlg', title: 'all is violent, all is bright' },
                    { id: 'kryV3E4QKGk', title: 'secret smile' },
                    { id: 'b9WKC5sT9Z4', title: 'gymnopedies' }
                ],
                position: 1
            },
            {
                id: 'dualities-playlist',
                name: '2025 dualities',
                songs: [
                    { id: 'IXdNnw99-Ic', title: 'wish you were here' },
                    { id: 'ujNeHIo7oTE', title: 'with or without you' },
                    { id: '1lyu1KKwC74', title: 'bitter sweet symphony' },
                    { id: '7jMlFXouPk8', title: 'high hopes' },
                    { id: 'TFjmvfRvjTc', title: 'hey you' }
                ],
                position: -1 // Append to end
            },
            {
                id: 'afterlife 2025',
                name: '2025 afterlife',
                songs: [
                    { id: 'MO0LdXqwDP0', title: 'afterlife' },
                    { id: '8r-bTAvYkZw', title: 'ave maria' },
                    { id: 'yB9_ImBoazY', title: 'leviticus' }
                ],
                position: -1 // Append to end
            }
        ];

        // Ensure all required playlists exist and are properly configured
        requiredPlaylists.forEach(required => {
            let playlist = this.storage.getPlaylist(this.playlistsData, required.id);
            
            if (!playlist) {
                // Create new playlist
                playlist = {
                    id: required.id,
                    name: required.name,
                    songs: [...required.songs]
                };
                
                if (required.position >= 0) {
                    this.playlistsData.playlists.splice(required.position, 0, playlist);
                } else {
                    this.playlistsData.playlists.push(playlist);
                }
            } else {
                // Ensure all required songs exist in the playlist
                if (!playlist.songs) {
                    playlist.songs = [];
                }
                
                required.songs.forEach(requiredSong => {
                    if (!playlist.songs.some(s => s.id === requiredSong.id)) {
                        playlist.songs.push({ ...requiredSong });
                    }
                });
                
                // Ensure playlist is in correct position
                const currentIndex = this.playlistsData.playlists.findIndex(p => p.id === required.id);
                if (required.position >= 0 && currentIndex !== required.position) {
                    this.playlistsData.playlists.splice(currentIndex, 1);
                    this.playlistsData.playlists.splice(required.position, 0, playlist);
                }
            }
        });

        // Set default playlist if none is set
        if (!this.playlistsData.currentPlaylistId) {
            const flowPlaylist = this.storage.getPlaylist(this.playlistsData, 'flow');
            if (flowPlaylist && flowPlaylist.songs && flowPlaylist.songs.length > 0) {
                this.playlistsData.currentPlaylistId = 'flow';
            } else {
                this.playlistsData.currentPlaylistId = 'renewal';
            }
        }

        // Migrate old playlist ID if needed
        if (this.playlistsData.currentPlaylistId === 'dualities-playlist') {
            this.playlistsData.currentPlaylistId = 'renewal';
        }

        // Save any changes
        this.storage.save(this.playlistsData);

        // Load songs from current playlist
        const currentPlaylist = this.storage.getCurrentPlaylist(this.playlistsData);
        if (currentPlaylist && currentPlaylist.songs && currentPlaylist.songs.length > 0) {
            this.songs = [...currentPlaylist.songs]; // Create a copy
            this.currentSongIndex = Math.max(0, Math.min(this.currentSongIndex, this.songs.length - 1));
        } else {
            // Fallback to renewal playlist
            const renewalPlaylist = this.storage.getPlaylist(this.playlistsData, 'renewal');
            if (renewalPlaylist && renewalPlaylist.songs && renewalPlaylist.songs.length > 0) {
                this.songs = [...renewalPlaylist.songs];
                this.playlistsData.currentPlaylistId = 'renewal';
                this.storage.save(this.playlistsData);
            } else {
                // Last resort: use default data
                this.playlistsData = this.storage.getDefaultData();
                this.storage.save(this.playlistsData);
                this.songs = [...this.playlistsData.playlists[0].songs];
            }
            this.currentSongIndex = 0;
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
                } else if (checkCount > 50) {
                    clearInterval(checkInterval);
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
            return;
        }

        if (typeof YT === 'undefined' || !YT.Player) {
            return;
        }

        // Ensure we have songs loaded
        if (!this.songs || this.songs.length === 0) {
            this.loadPlaylists();
        }

        // Validate and fix currentSongIndex
        if (this.currentSongIndex < 0 || this.currentSongIndex >= this.songs.length) {
            this.currentSongIndex = 0;
        }

        const currentSong = this.songs[this.currentSongIndex];
        if (!currentSong) {
            this.loadPlaylists();
            if (this.songs.length > 0) {
                this.currentSongIndex = 0;
            } else {
                return;
            }
        }

        // If element is an iframe with src, replace it with a div for YT.Player
        if (youtubeElement.tagName === 'IFRAME') {
            const parent = youtubeElement.parentNode;
            const newDiv = document.createElement('div');
            newDiv.id = this.selectors.youtube;
            newDiv.style.display = youtubeElement.style.display;
            parent.replaceChild(newDiv, youtubeElement);
        }

        const playerVars = {
            'autoplay': 0,
            'loop': 0,
            'controls': 0,
            'modestbranding': 1,
            'rel': 0
        };

        try {
            this.player = new YT.Player(this.selectors.youtube, {
                videoId: this.songs[this.currentSongIndex].id,
                playerVars: playerVars,
                events: {
                    'onReady': () => {
                        this.isReady = true;
                        this.updateSongTitle();
                        this.renderSongList();
                    },
                    'onStateChange': (event) => {
                        this.onStateChange(event);
                    },
                    'onError': (event) => {
                        this.handlePlayerError(event);
                    }
                }
            });
        } catch (error) {
            console.error('Failed to initialize YouTube player:', error);
        }
    }

    handlePlayerError(event) {
        const errorCode = event.data;
        const errorMessages = {
            2: 'Invalid parameter - check video ID',
            5: 'HTML5 player error - browser may not support playback',
            100: 'Video not found',
            101: 'Embedding not allowed',
            150: 'Embedding not allowed (same as 101)'
        };

        // Auto-skip to next song on certain errors
        if (errorCode === 100 || errorCode === 101 || errorCode === 150) {
            setTimeout(() => {
                this.playNextSong();
            }, 1000);
        } else if (errorCode === 2) {
            // Invalid parameter - try next song
            setTimeout(() => {
                if (this.currentSongIndex < this.songs.length - 1) {
                    this.playNextSong();
                }
            }, 1000);
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
        } else if (event.data === YT.PlayerState.ENDED) {
            // When video ends, automatically play next song
            if (this.isReady && this.songs.length > 0) {
                this.playNextSong();
            }
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
            return;
        }

        try {
            const state = this.player.getPlayerState();
            if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
                this.player.pauseVideo();
            } else if (state === YT.PlayerState.PAUSED || 
                       state === YT.PlayerState.ENDED || 
                       state === YT.PlayerState.CUED || 
                       state === YT.PlayerState.UNSTARTED) {
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
        if (this.songs.length === 0) return;
        this.currentSongIndex = (this.currentSongIndex + 1) % this.songs.length;
        this.loadSong();
    }

    playPreviousSong() {
        if (this.songs.length === 0) return;
        this.currentSongIndex = (this.currentSongIndex - 1 + this.songs.length) % this.songs.length;
        this.loadSong();
    }

    /**
     * Switch to a different playlist
     */
    switchPlaylist(playlistId) {
        if (!this.playlistsData) return;
        
        const playlist = this.storage.getPlaylist(this.playlistsData, playlistId);
        if (!playlist || !playlist.songs || playlist.songs.length === 0) return;

        // Update current playlist
        this.storage.setCurrentPlaylist(this.playlistsData, playlistId);
        this.loadPlaylists(); // Reload to get fresh data
        
        // Reset to first song
        this.currentSongIndex = 0;
        
        // Update player if it exists
        if (this.player && this.isReady) {
            this.loadSong();
        } else if (!this.player) {
            // Player not initialized yet, it will load the correct song on init
            this.setupPlayer();
        }
    }

    /**
     * Load and play a specific song
     */
    loadSong(shouldPlay = false) {
        if (this.isLoadingSong) return; // Prevent concurrent loads
        if (!this.player || !this.isReady) return;
        if (!this.songs || this.songs.length === 0) return;

        // Validate song index
        if (this.currentSongIndex < 0 || this.currentSongIndex >= this.songs.length) {
            this.currentSongIndex = 0;
        }

        const currentSong = this.songs[this.currentSongIndex];
        if (!currentSong) return;

        this.isLoadingSong = true;

        try {
            const wasPlaying = this.player.getPlayerState() === YT.PlayerState.PLAYING;
            
            // Load the video
            this.player.loadVideoById({
                videoId: currentSong.id,
                startSeconds: 0
            });
            
            this.updateSongTitle();

            // Determine if we should play
            const shouldAutoPlay = shouldPlay || wasPlaying;

            if (shouldAutoPlay) {
                // Wait for video to be ready, then play
                this.waitForVideoReady(() => {
                    try {
                        if (this.player && this.isReady) {
                            this.player.playVideo();
                        }
                    } catch (error) {
                        console.error('Failed to play video:', error);
                    } finally {
                        this.isLoadingSong = false;
                    }
                });
            } else {
                this.isLoadingSong = false;
            }
        } catch (error) {
            console.error('Failed to load song:', error);
            this.isLoadingSong = false;
        }
    }

    /**
     * Wait for video to be ready to play
     */
    waitForVideoReady(callback, maxAttempts = 20) {
        let attempts = 0;
        
        const checkReady = () => {
            attempts++;
            
            if (!this.player || !this.isReady) {
                if (attempts < maxAttempts) {
                    setTimeout(checkReady, 200);
                } else {
                    callback();
                }
                return;
            }

            try {
                const state = this.player.getPlayerState();
                // Video is ready if it's CUED, PAUSED, ENDED, or UNSTARTED
                if (state === YT.PlayerState.CUED ||
                    state === YT.PlayerState.PAUSED ||
                    state === YT.PlayerState.ENDED ||
                    state === YT.PlayerState.UNSTARTED) {
                    callback();
                } else if (attempts < maxAttempts) {
                    setTimeout(checkReady, 200);
                } else {
                    // Timeout - try anyway
                    callback();
                }
            } catch (error) {
                if (attempts < maxAttempts) {
                    setTimeout(checkReady, 200);
                } else {
                    callback();
                }
            }
        };

        // Start checking after a short delay
        setTimeout(checkReady, 100);
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
            const isExpanded = this.expandedPlaylists.has(playlist.id);
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
                    <div class="music-playlist-header ${isCurrentPlaylist ? 'active' : ''} ${isExpanded ? 'expanded' : ''}" 
                         data-playlist-id="${playlist.id}">
                        <span class="music-playlist-name">${playlist.name}</span>
                    </div>
                    <div class="music-playlist-songs ${isExpanded ? 'expanded' : 'collapsed'}">
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
                
                // Toggle expansion
                if (this.expandedPlaylists.has(playlistId)) {
                    this.expandedPlaylists.delete(playlistId);
                } else {
                    this.expandedPlaylists.add(playlistId);
                }
                
                // Switch to the playlist if not current
                if (playlistId !== currentPlaylistId) {
                    this.switchPlaylist(playlistId);
                }
                
                // Re-render to update active states and expansion
                this.renderSongList();
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
                    this.switchPlaylist(playlistId);
                    // Wait for playlist to switch, then find and play the song
                    setTimeout(() => {
                        this.playSongById(songId);
                    }, 100);
                } else {
                    // Play the song in current playlist
                    this.playSongById(songId);
                }
            });
        });
    }

    /**
     * Play a song by its ID in the current playlist
     */
    playSongById(songId) {
        if (!this.songs || this.songs.length === 0) return;

        const songIndex = this.songs.findIndex(s => s.id === songId);
        if (songIndex < 0) return;

        // If clicking the same song, toggle play/pause
        if (songIndex === this.currentSongIndex && this.player && this.isReady) {
            try {
                const state = this.player.getPlayerState();
                if (state === YT.PlayerState.PLAYING) {
                    this.player.pauseVideo();
                } else {
                    this.player.playVideo();
                }
            } catch (error) {
                console.error('Failed to toggle play/pause:', error);
            }
        } else {
            // Switch to the new song
            this.currentSongIndex = songIndex;
            this.loadSong(true); // Load and play the song
        }

        // Re-render to update active states
        this.renderSongList();
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
