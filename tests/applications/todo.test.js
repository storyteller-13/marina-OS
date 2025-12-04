import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('TodoApp', () => {
  let dom;
  let window;
  let document;
  let TodoApp;
  let TodoStorage;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="todo-window">
            <div id="todo-list"></div>
            <div id="todo-footer">
              <div id="todo-count"></div>
            </div>
          </div>
          <div id="todo-dock-item"></div>
          <div id="todo-count-badge"></div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.localStorage = window.localStorage;

    // Load dependencies
    const fs = require('fs');
    const path = require('path');

    // Load TodoStorage first
    const storageCode = fs.readFileSync(path.join(__dirname, '../../scripts/applications/todo/todo-storage.js'), 'utf8');
    eval(storageCode);
    TodoStorage = window.TodoStorage;

    // Load TodoApp
    const code = fs.readFileSync(path.join(__dirname, '../../scripts/applications/todo/todo.js'), 'utf8');
    eval(code);
    TodoApp = window.TodoAppClass;
  });

  it('should initialize todo app', () => {
    const app = new TodoApp();
    expect(app).toBeDefined();
    expect(app.windowId).toBe('todo-window');
    expect(app.dockItemId).toBe('todo-dock-item');
  });

  it('should add a todo', () => {
    const app = new TodoApp();
    const initialCount = app.todos.length;

    app.addTodo('New todo item');

    expect(app.todos.length).toBe(initialCount + 1);
    expect(app.todos[app.todos.length - 1].text).toBe('New todo item');
    expect(app.todos[app.todos.length - 1].completed).toBe(false);
  });

  it('should not add empty todo', () => {
    const app = new TodoApp();
    const initialCount = app.todos.length;

    app.addTodo('   ');

    expect(app.todos.length).toBe(initialCount);
  });

  it('should toggle todo completion', () => {
    const app = new TodoApp();
    app.addTodo('Test todo');
    const todo = app.todos[app.todos.length - 1];
    const initialCompleted = todo.completed;

    app.toggleTodo(todo.id);

    expect(todo.completed).toBe(!initialCompleted);
  });

  it('should delete a todo', () => {
    const app = new TodoApp();
    app.addTodo('Test todo');
    const todoId = app.todos[app.todos.length - 1].id;
    const initialCount = app.todos.length;

    app.deleteTodo(todoId);

    expect(app.todos.length).toBe(initialCount - 1);
    expect(app.todos.find(t => t.id === todoId)).toBeUndefined();
  });

  it('should clear completed todos', () => {
    const app = new TodoApp();
    app.addTodo('Todo 1');
    app.addTodo('Todo 2');
    app.todos[0].completed = true;
    const completedCount = app.todos.filter(t => t.completed).length;

    app.clearCompleted();

    expect(app.todos.every(t => !t.completed)).toBe(true);
  });

  it('should render todos', () => {
    const app = new TodoApp();
    app.addTodo('Test todo');
    app.render();

    const todoList = document.getElementById('todo-list');
    expect(todoList.innerHTML).toContain('Test todo');
  });

  it('should update badge count', () => {
    // Clear localStorage to avoid default todos
    localStorage.clear();
    const app = new TodoApp();
    // Clear todos that were loaded from defaults
    app.todos = [];
    app.addTodo('Todo 1');
    app.addTodo('Todo 2');
    app.updateBadge();

    const badge = document.getElementById('todo-count-badge');
    expect(badge.textContent).toBe('2');
  });

  it('should hide badge when no active todos', () => {
    const app = new TodoApp();
    app.todos.forEach(todo => todo.completed = true);
    app.updateBadge();

    const badge = document.getElementById('todo-count-badge');
    expect(badge.style.display).toBe('none');
  });

  it('should escape HTML in todo text', () => {
    const app = new TodoApp();
    const escaped = app.escapeHtml('<script>alert("xss")</script>');

    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;');
  });

  it('should get active count', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    app.addTodo('Todo 1');
    app.addTodo('Todo 2');
    app.todos[0].completed = true;

    expect(app.getActiveCount()).toBe(1);
  });

  it('should always load default todos, ignoring storage (cache disabled)', () => {
    localStorage.clear();
    const storage = new TodoStorage();
    const testTodos = [
      { id: '1', text: 'Loaded todo', completed: false, createdAt: new Date().toISOString() }
    ];
    // Manually set localStorage to simulate saved todos
    localStorage.setItem('todos', JSON.stringify(testTodos));

    const app = new TodoApp();
    expect(app.todos.length).toBeGreaterThan(0);
    // Should load default todos, not the saved ones
    expect(app.todos.some(t => t.text === 'Loaded todo')).toBe(false);
    // localStorage should be cleared
    expect(localStorage.getItem('todos')).toBeNull();
  });

  it('should not save todos to storage (cache disabled)', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    app.addTodo('Test save');

    // Should not be saved to localStorage
    const saved = localStorage.getItem('todos');
    expect(saved).toBeNull();
  });

  it('should refresh todos (re-render without reloading from storage)', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    app.addTodo('Original');

    // Refresh should re-render current todos, not reload from storage
    const originalCount = app.todos.length;
    app.refresh();

    // Todos should remain the same (not reloaded from storage)
    expect(app.todos.length).toBe(originalCount);
    expect(app.todos.some(t => t.text === 'Original')).toBe(true);
  });

  it('should open window and render', () => {
    const app = new TodoApp();
    const renderSpy = vi.spyOn(app, 'render');
    const updateBadgeSpy = vi.spyOn(app, 'updateBadge');

    app.open();

    // Should render and update badge, but not refresh (which would reload from storage)
    expect(renderSpy).toHaveBeenCalled();
    expect(updateBadgeSpy).toHaveBeenCalled();
    renderSpy.mockRestore();
    updateBadgeSpy.mockRestore();
  });

  it('should close window', () => {
    const app = new TodoApp();
    if (app.dockItem) {
      app.dockItem.classList.add('active');
    }

    app.close();

    if (app.dockItem) {
      expect(app.dockItem.classList.contains('active')).toBe(false);
    }
  });

  it('should render empty state when no todos', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    app.render();

    const todoList = document.getElementById('todo-list');
    expect(todoList.innerHTML).toContain('no tasks yet');
    expect(todoList.innerHTML).toContain('add a task to get started');
  });

  it('should render completed todos with completed class', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    app.addTodo('Test todo');
    app.todos[0].completed = true;
    app.render();

    const todoList = document.getElementById('todo-list');
    expect(todoList.innerHTML).toContain('completed');
    expect(todoList.innerHTML).toContain('checked');
  });

  it('should show footer when todos exist', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    app.addTodo('Test todo');
    app.render();

    const footer = document.getElementById('todo-footer');
    expect(footer.style.display).toBe('flex');
  });

  it('should hide footer when no todos', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    app.render();

    const footer = document.getElementById('todo-footer');
    expect(footer.style.display).toBe('none');
  });

  it('should display correct count format for single item', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    app.addTodo('Single todo');
    app.render();

    const count = document.getElementById('todo-count');
    expect(count.textContent).toBe('1 item left');
  });

  it('should display correct count format for multiple items', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    app.addTodo('Todo 1');
    app.addTodo('Todo 2');
    app.render();

    const count = document.getElementById('todo-count');
    expect(count.textContent).toBe('2 items left');
  });

  it('should show badge as 99+ when count exceeds 99', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    // Add 100 todos
    for (let i = 0; i < 100; i++) {
      app.addTodo(`Todo ${i}`);
    }
    app.updateBadge();

    const badge = document.getElementById('todo-count-badge');
    expect(badge.textContent).toBe('99+');
  });

  it('should handle toggle of non-existent todo', () => {
    const app = new TodoApp();
    const initialCount = app.todos.length;

    app.toggleTodo('non-existent-id');

    expect(app.todos.length).toBe(initialCount);
  });

  it('should handle delete of non-existent todo', () => {
    const app = new TodoApp();
    const initialCount = app.todos.length;

    app.deleteTodo('non-existent-id');

    expect(app.todos.length).toBe(initialCount);
  });

  it('should handle checkbox click event', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    app.addTodo('Test todo');
    const todo = app.todos[0];
    app.render();

    const checkbox = document.querySelector('.todo-checkbox');
    checkbox.click();

    expect(todo.completed).toBe(true);
  });

  it('should handle delete button click event', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    app.addTodo('Test todo');
    const todoId = app.todos[0].id;
    app.render();

    const deleteBtn = document.querySelector('.todo-delete-btn');
    deleteBtn.click();

    expect(app.todos.find(t => t.id === todoId)).toBeUndefined();
  });

  it('should handle dock item click event', () => {
    const app = new TodoApp();
    const openSpy = vi.spyOn(app, 'open');

    const dockItem = document.getElementById('todo-dock-item');
    const clickEvent = new window.MouseEvent('click', { bubbles: true });
    dockItem.dispatchEvent(clickEvent);

    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('should not listen to storage change events (storage disabled)', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    const refreshSpy = vi.spyOn(app, 'refresh');

    const storageEvent = new window.StorageEvent('storage', {
      key: 'todos',
      newValue: JSON.stringify([{ id: '1', text: 'New', completed: false, createdAt: new Date().toISOString() }])
    });
    window.dispatchEvent(storageEvent);

    // Storage listener was removed since we don't save to localStorage
    expect(refreshSpy).not.toHaveBeenCalled();
    refreshSpy.mockRestore();
  });

  it('should refresh on visibility change', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    const refreshSpy = vi.spyOn(app, 'refresh');

    // Simulate visibility change
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false
    });

    const visibilityEvent = new window.Event('visibilitychange');
    document.dispatchEvent(visibilityEvent);

    expect(refreshSpy).toHaveBeenCalled();
    refreshSpy.mockRestore();
  });

  it('should handle render when elements are missing', () => {
    localStorage.clear();
    const app = new TodoApp();
    app.todos = [];
    app.addTodo('Test');

    // Remove elements
    const todoList = document.getElementById('todo-list');
    todoList.remove();
    app.elements.todoList = null;

    // Should not throw
    expect(() => app.render()).not.toThrow();
  });

  it('should handle updateBadge when badge element is missing', () => {
    const app = new TodoApp();
    app.elements.badge = null;

    // Should not throw
    expect(() => app.updateBadge()).not.toThrow();
  });
});
