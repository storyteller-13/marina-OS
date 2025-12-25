/**
 * Music Player Storage Module
 * Handles localStorage persistence for playlists
 */
class MusicPlayerStorage {
    constructor() {
        this.storageKey = 'music-player-playlists';
    }

    /**
     * Load playlists from localStorage or return default data
     * @returns {Object} Playlists data object with playlists array
     */
    load() {
        const stored = localStorage.getItem(this.storageKey);
        let data;
        
        if (stored) {
            try {
                data = JSON.parse(stored);
            } catch (e) {
                data = this.getDefaultData();
                this.save(data);
                return data;
            }
        } else {
            data = this.getDefaultData();
            this.save(data);
            return data;
        }
        
        // Ensure emo playlist exists
        const emoPlaylist = this.getPlaylist(data, 'dualities-playlist');
        if (!emoPlaylist) {
            const defaultData = this.getDefaultData();
            const defaultEmoPlaylist = defaultData.playlists[0];
            
            if (!data.playlists) {
                data.playlists = [];
            }
            data.playlists.push(defaultEmoPlaylist);
            
            // Set as current if no current playlist
            if (!data.currentPlaylistId) {
                data.currentPlaylistId = 'afterlife && hope';
            }
            
            this.save(data);
        }
        
        // Ensure second playlist exists
        const playlist2 = this.getPlaylist(data, 'afterlife && hope');
        if (!playlist2) {
            if (!data.playlists) {
                data.playlists = [];
            }
            data.playlists.push({
                id: 'afterlife && hope',
                name: 'afterlife && hope',
                songs: [
                    { id: 'MO0LdXqwDP0', title: 'afterlife' },
                    { id: '8r-bTAvYkZw', title: 'ave maria' }
                ]
            });
            this.save(data);
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
                this.save(data);
            }
        }
        
        return data;
    }

    /**
     * Save playlists data to localStorage
     * @param {Object} data - Playlists data object to save
     */
    save(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            // Error saving to storage
        }
    }

    /**
     * Get default playlists data structure
     * @returns {Object} Default playlists data with emo playlist containing current songs
     */
    getDefaultData() {
        return {
            playlists: [
                {
                    id: 'dualities-playlist',
                    name: 'dualities && healing',
                    songs: [
                        { id: 'IXdNnw99-Ic', title: 'wish you were here' },
                        { id: 'ujNeHIo7oTE', title: 'with or without you' },
                        { id: '1lyu1KKwC74', title: 'bitter sweet symphony' },
                        { id: '7jMlFXouPk8', title: 'high hopes' },
                        { id: 'TFjmvfRvjTc', title: 'hey you' }
                    ]
                },
                {
                    id: 'afterlife && hope',
                    name: 'afterlife && hope',
                    songs: [
                        { id: 'MO0LdXqwDP0', title: 'afterlife' },
                        { id: '8r-bTAvYkZw', title: 'ave maria' }
                    ]
                }
            ],
            currentPlaylistId: 'afterlife && hope'
        };
    }

    /**
     * Get a playlist by ID
     * @param {Object} data - Playlists data object
     * @param {string} playlistId - ID of the playlist to get
     * @returns {Object|null} Playlist object or null if not found
     */
    getPlaylist(data, playlistId) {
        return data.playlists.find(p => p.id === playlistId) || null;
    }

    /**
     * Get the current active playlist
     * @param {Object} data - Playlists data object
     * @returns {Object|null} Current playlist or null if not found
     */
    getCurrentPlaylist(data) {
        const currentId = data.currentPlaylistId;
        if (!currentId) return null;
        return this.getPlaylist(data, currentId);
    }

    /**
     * Create a new playlist
     * @param {Object} data - Playlists data object
     * @param {string} name - Name of the playlist
     * @param {Array} songs - Array of song objects (optional)
     * @returns {Object} The created playlist
     */
    createPlaylist(data, name, songs = []) {
        const playlist = {
            id: this.generateId(),
            name: name,
            songs: songs
        };
        data.playlists.push(playlist);
        this.save(data);
        return playlist;
    }

    /**
     * Add songs to a playlist
     * @param {Object} data - Playlists data object
     * @param {string} playlistId - ID of the playlist
     * @param {Array} songs - Array of song objects to add
     */
    addSongsToPlaylist(data, playlistId, songs) {
        const playlist = this.getPlaylist(data, playlistId);
        if (playlist) {
            playlist.songs.push(...songs);
            this.save(data);
        }
    }

    /**
     * Set the current active playlist
     * @param {Object} data - Playlists data object
     * @param {string} playlistId - ID of the playlist to set as current
     */
    setCurrentPlaylist(data, playlistId) {
        if (this.getPlaylist(data, playlistId)) {
            data.currentPlaylistId = playlistId;
            this.save(data);
        }
    }

    /**
     * Generate a unique ID for playlists
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
}

// Expose class for testing
if (typeof window !== 'undefined') {
    window.MusicPlayerStorage = MusicPlayerStorage;
}
