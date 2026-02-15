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
        // Clear cache from previous sessions only once per browser session
        const sessionClearedKey = 'music-player-session-cleared';
        if (!sessionStorage.getItem(sessionClearedKey)) {
            localStorage.removeItem(this.storageKey);
            sessionStorage.setItem(sessionClearedKey, 'true');
        }
        
        // Load from localStorage or return default data
        const stored = localStorage.getItem(this.storageKey);
        let data;
        
        if (stored) {
            try {
                data = JSON.parse(stored);
            } catch (e) {
                data = this.getDefaultData();
                this.save(data);
            }
        } else {
            data = this.getDefaultData();
            this.save(data);
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
                    id: '2026-reward',
                    name: '2026 reward',
                    songs: [
                        { id: 'ZbZSe6N_BXs', title: 'happy (pharrell williams)' },
                        { id: 'G2dR2DV-eGc', title: 'hard to concentrate (rhcp)' },
                        { id: 'NH8uI4EJ0bo', title: 'romantic jazz (lofi girl)' }
                    ]
                },
                {
                    id: 'renewal',
                    name: '2026 renewal',
                    songs: [
                        { id: 'ya7L3A1DOlg', title: 'all is violent, all is bright (god is an astronaut)' },
                        { id: 'X2959NkomEc', title: 'up all night (meltt)' },
                        { id: 'wpWOQSgsetk', title: 'butterfly (anees)' }
                        { id: 'flPvsybvwQo', title: 'last dance (the cure)' },
                        { id: 'b9WKC5sT9Z4', title: 'gymnopedies (erik satie)' },
                        { id: 'FoYdeEDdtK4', title: 'peaches in regalia (frank zappa)' },
                        { id: 'fhOAsDVg8pY', title: 'round && round (bob moses)' },
                    ]
                },
                {
                    id: 'afterlife 2025',
                    name: '2025 afterlife',
                    songs: [
                        { id: 'MO0LdXqwDP0', title: 'afterlife (evanescence)' },
                        { id: '8r-bTAvYkZw', title: 'ave maria (alanis morissette)' },
                        { id: 'yB9_ImBoazY', title: 'leviticus ($uicideboy$)' },
                        { id: 'pf3KyEnacJ8', title: 'zombie (yungblud + the smashing pumpkins)' }
                    ]
                },
                {
                    id: 'dualities-playlist',
                    name: '2025 dualities',
                    songs: [
                        { id: 'IXdNnw99-Ic', title: 'wish you were here (pink floyd)' },
                        { id: 'ujNeHIo7oTE', title: 'with or without you (u2)' },
                        { id: '1lyu1KKwC74', title: 'bitter sweet symphony (the verve)' },
                        { id: '7jMlFXouPk8', title: 'high hopes (pink floyd)' },
                        { id: 'TFjmvfRvjTc', title: 'hey you (pink floyd)' }
                    ]
                }
            ],
            currentPlaylistId: 'renewal'
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
