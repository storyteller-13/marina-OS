import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('TodoStorage', () => {
  let dom;
  let window;
  let document;
  let TodoStorage;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost' });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.localStorage = window.localStorage;

    // Load TodoStorage class
    const code = readFileSync(join(__dirname, '../../scripts/applications/todo/todo-storage.js'), 'utf8');
    const func = new Function('window', 'document', code);
    func(window, document);
    TodoStorage = window.TodoStorage;
  });

  it('should initialize with correct storage key', () => {
    const storage = new TodoStorage();
    expect(storage.storageKey).toBe('todos');
  });

  it('should load default todos when localStorage is empty', () => {
    localStorage.clear();
    const storage = new TodoStorage();
    const todos = storage.load();

    expect(Array.isArray(todos)).toBe(true);
    expect(todos.length).toBeGreaterThan(0);
  });

  it('should always load default todos, ignoring saved todos (cache disabled)', () => {
    const storage = new TodoStorage();
    const testTodos = [
      { id: '1', text: 'Test todo', completed: false, createdAt: new Date().toISOString() }
    ];

    // Manually set localStorage to simulate saved todos
    localStorage.setItem('todos', JSON.stringify(testTodos));
    const loaded = storage.load();

    // Should return default todos, not the saved ones
    expect(loaded).not.toEqual(testTodos);
    expect(loaded.length).toBeGreaterThan(0);
    // localStorage should be cleared
    expect(localStorage.getItem('todos')).toBeNull();
  });

  it('should handle invalid JSON in localStorage', () => {
    localStorage.setItem('todos', 'invalid json');
    const storage = new TodoStorage();
    const todos = storage.load();

    expect(Array.isArray(todos)).toBe(true);
  });

  it('should generate unique IDs', () => {
    const storage = new TodoStorage();
    const id1 = storage.generateId();
    const id2 = storage.generateId();

    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
  });

  it('should return default todos structure', () => {
    const storage = new TodoStorage();
    const defaultTodos = storage.getTodos();

    expect(Array.isArray(defaultTodos)).toBe(true);
    defaultTodos.forEach(todo => {
      expect(todo).toHaveProperty('id');
      expect(todo).toHaveProperty('text');
      expect(todo).toHaveProperty('completed');
      expect(todo).toHaveProperty('createdAt');
    });
  });

  it('should create todo with correct structure', () => {
    const storage = new TodoStorage();
    const todo = storage.createTodo('Test todo', true);

    expect(todo).toHaveProperty('id');
    expect(todo).toHaveProperty('text');
    expect(todo).toHaveProperty('completed');
    expect(todo).toHaveProperty('createdAt');
    expect(todo.text).toBe('Test todo');
    expect(todo.completed).toBe(true);
    expect(typeof todo.id).toBe('string');
    expect(typeof todo.createdAt).toBe('string');
  });

  it('should create todo with default completed false', () => {
    const storage = new TodoStorage();
    const todo = storage.createTodo('Test todo');

    expect(todo.completed).toBe(false);
  });
});
