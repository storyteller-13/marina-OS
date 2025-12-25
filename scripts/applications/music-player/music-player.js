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
        this.expandedPlaylists = new Set(); // Track which playlists are expanded
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
        const emoPlaylist = this.storage.getPlaylist(this.playlistsData, 'dualities-playlist');
        if (!emoPlaylist) {
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
                id: 'dualities-playlist',
                name: 'dualities && healing',
                songs: emoSongs
            });
            
            // Set as current playlist if no current playlist is set
            if (!this.playlistsData.currentPlaylistId) {
                this.playlistsData.currentPlaylistId = 'dualities-playlist';
            }
            
            this.storage.save(this.playlistsData);
        }
        
        // Ensure second playlist exists, create it if it doesn't
        const playlist2 = this.storage.getPlaylist(this.playlistsData, 'afterlife && hope');
        if (!playlist2) {
            if (!this.playlistsData.playlists) {
                this.playlistsData.playlists = [];
            }
            
            this.playlistsData.playlists.push({
                id: 'afterlife && hope',
                name: 'afterlife && hope',
                songs: [
                    { id: 'MO0LdXqwDP0', title: 'afterlife' },
                    { id: '8r-bTAvYkZw', title: 'ave maria' }
                ]
            });
            
            this.storage.save(this.playlistsData);
        } else {
            // Ensure the new song is in the playlist if it exists
            const hasNewSong = playlist2.songs && playlist2.songs.some(s => s.id === '8r-bTAvYkZw');
            if (!hasNewSong) {
                if (!playlist2.songs) {
                    playlist2.songs = [];
                }
                // Find the index of 'afterlife' and insert after it
                const afterlifeIndex = playlist2.songs.findIndex(s => s.id === 'MO0LdXqwDP0');
                if (afterlifeIndex >= 0) {
                    playlist2.songs.splice(afterlifeIndex + 1, 0, { id: '8r-bTAvYkZw', title: 'ave maria' });
                } else {
                    playlist2.songs.push({ id: '8r-bTAvYkZw', title: 'ave maria' });
                }
                this.storage.save(this.playlistsData);
            }
        }
        
        // Load songs from current playlist
        const currentPlaylist = this.storage.getCurrentPlaylist(this.playlistsData);
        if (currentPlaylist && currentPlaylist.songs && currentPlaylist.songs.length > 0) {
            this.songs = currentPlaylist.songs;
        } else {
            // Fallback to emo playlist if current playlist is empty
            const emoPlaylist = this.storage.getPlaylist(this.playlistsData, 'dualities-playlist');
            if (emoPlaylist && emoPlaylist.songs && emoPlaylist.songs.length > 0) {
                this.songs = emoPlaylist.songs;
                this.playlistsData.currentPlaylistId = 'dualities-playlist';
                this.storage.save(this.playlistsData);
            } else {
                // Last resort: use default data
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
                }
            }, 100);
        }
    }

    setupPlayer() {
        // Prevent multiple initializations unless we're updating the playlist
        if (this.player && this.isReady && !this._updatingPlaylist) {
            return;
        }
        
        // Reset the flag if it was set
        this._updatingPlaylist = false;

        const youtubeElement = document.getElementById(this.selectors.youtube);
        if (!youtubeElement) {
            return;
        }

        if (typeof YT === 'undefined' || !YT.Player) {
            return;
        }

        try {
            // Ensure currentSongIndex is valid
            if (this.currentSongIndex < 0 || this.currentSongIndex >= this.songs.length) {
                this.currentSongIndex = 0;
            }
            
            const currentSong = this.songs[this.currentSongIndex];
            if (!currentSong) {
                return;
            }

            // If element is an iframe with src, replace it with a div for YT.Player
            // YT.Player works better with a div element
            if (youtubeElement.tagName === 'IFRAME') {
                const parent = youtubeElement.parentNode;
                const newDiv = document.createElement('div');
                newDiv.id = this.selectors.youtube;
                newDiv.style.display = youtubeElement.style.display;
                parent.replaceChild(newDiv, youtubeElement);
            }

            // Don't use playlist parameter - it causes YouTube to ignore videoId
            // We'll handle looping manually via onStateChange when video ends
            const playerVars = {
                'autoplay': 0,
                'loop': 0, // We'll handle looping manually via onStateChange
                'controls': 0,
                'modestbranding': 1,
                'rel': 0
            };

            this.player = new YT.Player(this.selectors.youtube, {
                videoId: currentSong.id,
                playerVars: playerVars,
                events: {
                    'onReady': () => {
                        this.isReady = true;
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

                        // YouTube error codes:
                        // 2=invalid parameter, 5=HTML5 error, 100=video not found,
                        // 101=embedding not allowed, 150=same as 101
                        if (errorCode === 100 || errorCode === 101 || errorCode === 150) {
                            setTimeout(() => {
                                this.playNextSong();
                            }, 1000);
                        } else if (errorCode === 2) {
                            // Try to continue with next song if current one fails
                            setTimeout(() => {
                                if (this.currentSongIndex < this.songs.length - 1) {
                                    this.playNextSong();
                                }
                            }, 1000);
                        }
                    }
                }
            });
        } catch (error) {
            // Failed to initialize YouTube player
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
            // When video ends, automatically play next song to create loop effect
            // Only if player is ready and we have songs
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
            // Player not ready, do nothing - user must wait for initialization
            return;
        }

        try {
            const state = this.player.getPlayerState();
            if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
                this.player.pauseVideo();
            } else if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.ENDED || state === YT.PlayerState.CUED || state === YT.PlayerState.UNSTARTED) {
                this.player.playVideo();
            }
        } catch (error) {
            // Failed to toggle play/pause
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

    updatePlayerPlaylist() {
        // Reinitialize player with new playlist when switching playlists
        if (this.player && this.isReady) {
            this._updatingPlaylist = true;
            this.isReady = false;
            // Destroy the old player
            try {
                this.player.destroy();
            } catch (e) {
                // Ignore errors if player is already destroyed
            }
            this.player = null;
            // Reinitialize with new playlist
            this.setupPlayer();
        }
    }

    loadSong() {
        if (!this.player || !this.isReady) {
            return;
        }

        const currentSong = this.songs[this.currentSongIndex];
        if (!currentSong) {
            return;
        }

        const wasPlaying = this.player.getPlayerState() === YT.PlayerState.PLAYING;

        try {
            // Load the video - loadVideoById works for individual videos
            // The playlist parameter in player initialization handles looping
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
                            } else if (attempts < 10) {
                                // Retry after 200ms if not ready yet
                                                    setTimeout(tryPlay, 200);
                                                }
                                            } catch (error) {
                                                // Failed to resume playback
                                            }
                    }
                };
                setTimeout(tryPlay, 500);
            }
        } catch (error) {
            // Failed to load song
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
                    this.storage.setCurrentPlaylist(this.playlistsData, playlistId);
                    this.loadPlaylists();
                    // Reset to first song in playlist but don't load/play it
                    this.currentSongIndex = 0;
                    // Update title to show first song name
                    this.updateSongTitle();
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
                const playlistSwitched = playlistId !== currentPlaylistId;
                if (playlistSwitched) {
                    this.storage.setCurrentPlaylist(this.playlistsData, playlistId);
                    this.loadPlaylists();
                }

                // Find the song in the current songs array
                const actualSongIndex = this.songs.findIndex(s => s.id === songId);
                if (actualSongIndex >= 0) {
                    if (actualSongIndex !== this.currentSongIndex) {
                        this.currentSongIndex = actualSongIndex;
                        
                        // Update player with new playlist AFTER setting currentSongIndex
                        if (playlistSwitched) {
                            this.updatePlayerPlaylist();
                        }
                        
                        // If we switched playlists, wait for player to be ready
                        if (playlistSwitched) {
                            const wasPlaying = false; // Don't resume if we switched playlists
                            let attempts = 0;
                            const waitAndLoad = () => {
                                attempts++;
                                if (this.player && this.isReady) {
                                    this.loadSong();
                                    // Start playing the selected song
                                    setTimeout(() => {
                                        let playAttempts = 0;
                                        const tryPlay = () => {
                                            playAttempts++;
                                            if (this.player && this.isReady) {
                                                try {
                                                    const state = this.player.getPlayerState();
                                                    if (state === YT.PlayerState.CUED ||
                                                        state === YT.PlayerState.PAUSED ||
                                                        state === YT.PlayerState.ENDED ||
                                                        state === YT.PlayerState.UNSTARTED) {
                                                        this.player.playVideo();
                                                    } else if (playAttempts < 15) {
                                                        setTimeout(tryPlay, 200);
                                                    }
                                                } catch (error) {
                                                    // Failed to play selected song
                                                }
                                            } else if (playAttempts < 30) {
                                                setTimeout(tryPlay, 200);
                                            }
                                        };
                                        tryPlay();
                                    }, 500);
                                } else if (attempts < 50) {
                                    setTimeout(waitAndLoad, 100);
                                }
                            };
                            waitAndLoad();
                        } else {
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
                                            } else if (attempts < 15) {
                                                // Retry after 200ms if not ready yet (up to 3 seconds)
                                                setTimeout(tryPlay, 200);
                                            }
                                        } catch (error) {
                                            // Failed to play selected song
                                        }
                                    }
                                };
                                setTimeout(tryPlay, 500);
                            }
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
