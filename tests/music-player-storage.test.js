/**
 * MusicPlayerStorage tests – load/save, getDefaultData, getPlaylist, ensureDefaultPlaylists
 */
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, '../applications/music-player/music-player-storage.js');
const script = readFileSync(scriptPath, 'utf8');

function makeFakeStorage() {
    const store = {};
    return {
        getItem(k) { return store[k] ?? null; },
        setItem(k, v) { store[k] = String(v); },
        removeItem(k) { delete store[k]; },
        clear() { for (const k of Object.keys(store)) delete store[k]; },
        get length() { return Object.keys(store).length; },
        key(i) { return Object.keys(store)[i] ?? null; },
    };
}

const STORAGE_KEY = 'music-player-playlists';

describe('MusicPlayerStorage', () => {
    beforeAll(() => {
        vi.stubGlobal('localStorage', makeFakeStorage());
        eval(script);
    });

    beforeEach(() => {
        localStorage.removeItem(STORAGE_KEY);
    });

    it('exposes MusicPlayerStorage on window', () => {
        expect(window.MusicPlayerStorage).toBeDefined();
    });

    it('load() returns object with playlists array and currentPlaylistId', () => {
        const storage = new window.MusicPlayerStorage();
        const data = storage.load();
        expect(data).toHaveProperty('playlists');
        expect(Array.isArray(data.playlists)).toBe(true);
        expect(data.playlists.length).toBeGreaterThan(0);
        expect(data).toHaveProperty('currentPlaylistId');
        expect(data.playlists[0]).toHaveProperty('id');
        expect(data.playlists[0]).toHaveProperty('name');
        expect(data.playlists[0]).toHaveProperty('songs');
    });

    it('getDefaultData() returns expected shape', () => {
        const storage = new window.MusicPlayerStorage();
        const data = storage.getDefaultData();
        expect(data.currentPlaylistId).toBe('2026 reward');
        const playlist = data.playlists.find(p => p.id === '2026 reward');
        expect(playlist).toBeDefined();
        expect(playlist.songs.length).toBeGreaterThan(0);
        expect(playlist.songs[0]).toHaveProperty('id');
        expect(playlist.songs[0]).toHaveProperty('title');
    });

    it('save() persists and load() returns saved data', () => {
        const storage = new window.MusicPlayerStorage();
        const data = storage.load();
        data.currentPlaylistId = '2025 dualities';
        storage.save(data);
        const loaded = storage.load();
        expect(loaded.currentPlaylistId).toBe('2025 dualities');
    });

    it('getPlaylist returns playlist by id or null', () => {
        const storage = new window.MusicPlayerStorage();
        const data = storage.load();
        const p = storage.getPlaylist(data, '2026 reward');
        expect(p).toBeDefined();
        expect(p.id).toBe('2026 reward');
        expect(storage.getPlaylist(data, 'nonexistent')).toBeNull();
    });

    it('getCurrentPlaylist returns current playlist', () => {
        const storage = new window.MusicPlayerStorage();
        const data = storage.load();
        const current = storage.getCurrentPlaylist(data);
        expect(current).toBeDefined();
        expect(current.id).toBe(data.currentPlaylistId);
    });

    it('setCurrentPlaylist updates currentPlaylistId and saves', () => {
        const storage = new window.MusicPlayerStorage();
        const data = storage.load();
        storage.setCurrentPlaylist(data, '2025 dualities');
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = JSON.parse(raw);
        expect(parsed.currentPlaylistId).toBe('2025 dualities');
    });

    it('ensureDefaultPlaylists merges defaults and preserves order', () => {
        const storage = new window.MusicPlayerStorage();
        const data = { playlists: [], currentPlaylistId: null };
        storage.ensureDefaultPlaylists(data);
        expect(data.playlists.length).toBeGreaterThan(0);
        expect(data.currentPlaylistId).toBe('2026 reward');
    });
});
