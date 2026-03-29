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
     * @returns {Object} Default playlists data
     */
    getDefaultData() {
        return {
            playlists: [
                {
                    id: '2026 dream bliss',
                    name: '2026 dream bliss',
                    songs: [
                        { id: 'YBioStgspO8', title: 'classical for happy moments (essential)' },
                        { id: 'NH8uI4EJ0bo', title: 'romantic jazz (lofi girl)' },
                        { id: 'b9WKC5sT9Z4', title: 'gymnopedies (erik satie)' },
                        { id: 'aA4Kub9flag', title: 'dreamer (luke faulkner)' },
                        { id: 'bTvOEXAuIEU', title: 'frailed (flea)' }
                    ]
                },
                {
                    id: '2026 future hubby',
                    name: '2026 future hubby',
                    songs: [
                        { id: 'G2dR2DV-eGc', title: 'hard to concentrate (rhcp)' },
                        { id: 'x11NA63gLDM', title: 'change the world (eric clapton)' },
                        { id: 'ozXZnwYTMbs', title: 'nothing else matters (metallica)' },
                        { id: 'fF8GARU44iY', title: 'wild mountain honey (steve miller)' },
                        { id: 'pGNDncTbJRU', title: 'a place to call home (world of warcraft)' }
                    ]
                },
                {
                    id: '2025 beyond afterlife',
                    name: '2025 beyond afterlife',
                    songs: [
                        { id: 'ya7L3A1DOlg', title: 'all is violent, bright (god is an astronaut)' },
                        { id: 'MAmqJjyDH48', title: 'a song for our fathers (explosion in the sky)' },
                        { id: 'X2959NkomEc', title: 'up all night (meltt)' },
                        { id: 'wpWOQSgsetk', title: 'butterfly (anees)' },
                        { id: 'fhOAsDVg8pY', title: 'round && round (bob moses)' },
                        { id: 'CevxZvSJLk8', title: 'roar (kate perry)' },
                        { id: 'ZbZSe6N_BXs', title: 'happy (pharrell williams)' },
                        { id: 'Z4A9ZZo_rAE', title: 'shake it off (taylor swift)' },
                        { id: 'vRQb_-mRcAc', title: 'unwritten (natasha bedingfield)' },
                        { id: 'ux2P_nU8aD0', title: 'bridge to my heart (powfu)' },
                        { id: 'UVpcupE1xEo', title: 'seven (david bowie)' },
                        { id: 'iGTN1xz0f84', title: 'old dog (j. cole)' },
                        { id: '94UmYrW5oto', title: 'what up gangsta (50 cent)' },
                        { id: 'hT_nvWreIhg', title: 'counting stars (onerepublic)' },
                        { id: 'ln7Vn_WKkWU', title: 'stuck in the middle (stealers wheel)' },
                        { id: 'ds18Ozzp8h0', title: 'honey, are you coming (måneskin)' },
                        { id: 'MO0LdXqwDP0', title: 'afterlife (evanescence)' },
                        { id: 'yB9_ImBoazY', title: 'leviticus ($uicideboy$)' },
                        { id: '8r-bTAvYkZw', title: 'ave maria (alanis morissette)' },
                        { id: 'pTF5azM4w5E', title: "miss me when i'm gone (will sass)" },
                        { id: 'cfjDrutsfRQ', title: 'sympathy magic (florence + the machine)' },
                        { id: 'pf3KyEnacJ8', title: 'zombie (yungblud + the smashing pumpkins)' },
                        { id: 'pe3jFvJ0qjs', title: "don't fear the reaper (blue oyster cult)" },
                        { id: 'IXdNnw99-Ic', title: 'wish you were here (pink floyd)' },
                        { id: 'ujNeHIo7oTE', title: 'with or without you (u2)' },
                        { id: '1lyu1KKwC74', title: 'bitter sweet symphony (the verve)' },
                        { id: '7jMlFXouPk8', title: 'high hopes (pink floyd)' },
                        { id: 'TFjmvfRvjTc', title: 'hey you (pink floyd)' }
                    ]
                }
            ],
            currentPlaylistId: '2026 dream bliss'
        };
    }

    /**
     * Ensure default playlists exist in data (merge in missing playlists/songs, enforce order).
     * Mutates data. Call save(data) after if you need to persist.
     * @param {Object} data - Playlists data object
     */
    ensureDefaultPlaylists(data) {
        if (!data.playlists) {
            data.playlists = [];
        }
        const defaultData = this.getDefaultData();
        const defaultPlaylistIds = new Set(defaultData.playlists.map(p => p.id));
        // Remove deprecated default playlist ids from saved data.
        data.playlists = data.playlists.filter(p => p.id !== '2026 memories');

        defaultData.playlists.forEach((defaultPlaylist, position) => {
            let playlist = this.getPlaylist(data, defaultPlaylist.id);
            if (!playlist) {
                playlist = {
                    id: defaultPlaylist.id,
                    name: defaultPlaylist.name,
                    songs: defaultPlaylist.songs.map(s => ({ ...s }))
                };
                data.playlists.splice(position, 0, playlist);
            } else {
                if (!playlist.songs) playlist.songs = [];
                defaultPlaylist.songs.forEach(defaultSong => {
                    if (!playlist.songs.some(s => s.id === defaultSong.id)) {
                        playlist.songs.push({ ...defaultSong });
                    }
                });
                const currentIndex = data.playlists.findIndex(p => p.id === defaultPlaylist.id);
                if (currentIndex !== position) {
                    data.playlists.splice(currentIndex, 1);
                    data.playlists.splice(position, 0, playlist);
                }
            }
        });
        if (!data.currentPlaylistId || !defaultPlaylistIds.has(data.currentPlaylistId)) {
            data.currentPlaylistId = '2026 dream bliss';
        }
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
}

// Expose class for testing
if (typeof window !== 'undefined') {
    window.MusicPlayerStorage = MusicPlayerStorage;
}
