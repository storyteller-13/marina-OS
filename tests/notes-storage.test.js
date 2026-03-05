/**
 * NotesStorage tests – load script in jsdom and assert load/save contract
 */
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, '../scripts/applications/notes/notes-storage.js');
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

function loadNotesStorage() {
    const run = new Function(script + '\nreturn NotesStorage;');
    return run();
}

const NOTES_KEY = 'notes-entries';

describe('NotesStorage', () => {
    beforeAll(() => {
        vi.stubGlobal('localStorage', makeFakeStorage());
    });

    beforeEach(() => {
        localStorage.removeItem(NOTES_KEY);
    });

    it('defines NotesStorage class with load and save', () => {
        const NotesStorage = loadNotesStorage();
        expect(NotesStorage).toBeDefined();
        expect(typeof NotesStorage.prototype.load).toBe('function');
        expect(typeof NotesStorage.prototype.save).toBe('function');
    });

    it('load() returns an array of entries with expected shape', () => {
        const NotesStorage = loadNotesStorage();
        const storage = new NotesStorage();
        const entries = storage.load();
        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBeGreaterThan(0);
        const first = entries[0];
        expect(first).toHaveProperty('id');
        expect(first).toHaveProperty('title');
        expect(first).toHaveProperty('content');
        expect(first).toHaveProperty('createdAt');
    });

    it('save() accepts array without throwing', () => {
        const NotesStorage = loadNotesStorage();
        const storage = new NotesStorage();
        const entries = storage.load();
        expect(() => storage.save(entries)).not.toThrow();
    });
});
