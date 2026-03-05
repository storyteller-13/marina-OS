/**
 * TodoStorage tests – load script in jsdom and assert load/save contract
 */
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, '../scripts/applications/todo/todo-storage.js');
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

function loadTodoStorage() {
    const run = new Function(script + '\nreturn TodoStorage;');
    return run();
}

const TODOS_KEY = 'todos';

describe('TodoStorage', () => {
    beforeAll(() => {
        vi.stubGlobal('localStorage', makeFakeStorage());
    });

    beforeEach(() => {
        localStorage.removeItem(TODOS_KEY);
    });

    it('defines TodoStorage class with load and save', () => {
        const TodoStorage = loadTodoStorage();
        expect(TodoStorage).toBeDefined();
        expect(typeof TodoStorage.prototype.load).toBe('function');
        expect(typeof TodoStorage.prototype.save).toBe('function');
    });

    it('load() returns an array of todos with expected shape', () => {
        const TodoStorage = loadTodoStorage();
        const storage = new TodoStorage();
        const todos = storage.load();
        expect(Array.isArray(todos)).toBe(true);
        expect(todos.length).toBeGreaterThan(0);
        const first = todos[0];
        expect(first).toHaveProperty('id');
        expect(first).toHaveProperty('text');
        expect(first).toHaveProperty('completed');
        expect(first).toHaveProperty('createdAt');
    });

    it('save() persists and load() returns saved data', () => {
        const TodoStorage = loadTodoStorage();
        const storage = new TodoStorage();
        const todos = storage.load();
        todos[0].text = 'updated';
        storage.save(todos);
        const loaded = storage.load();
        expect(loaded[0].text).toBe('updated');
    });
});
