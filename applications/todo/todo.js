/**
 * Todo Application Module
 * Self-contained todo list application
 */
class TodoApp extends BaseApp {
    constructor() {
        super({ windowId: 'todo-window', dockItemId: 'todo-dock-item' });
        this.storage = new TodoStorage();
        this.todos = [];
        this.elements = {};
        this.init();
    }

    init() {
        super.init();
        if (!this.window) return;
        this.cacheElements();
        this.loadTodos();
        this.setupEventListeners();
        this.setupVisibilityListener();
        this.render();
        this.updateBadge();
    }

    cacheElements() {
        this.elements.todoList = document.getElementById('todo-list');
        this.elements.todoFooter = document.getElementById('todo-footer');
        this.elements.todoCount = document.getElementById('todo-count');
        this.elements.badge = document.getElementById('todo-count-badge');
        this.elements.menuCount = document.getElementById('todo-menu-count');
    }

    loadTodos() {
        this.todos = this.storage.load();
    }

    getActiveCount() {
        return this.todos.filter(t => !t.completed).length;
    }

    refresh() {
        // Don't reload todos - they should only load once during initialization
        // This prevents resetting todos when refreshing
        this.render();
        this.updateBadge();
    }

    setupEventListeners() {
        super.setupEventListeners();

        // Use event delegation for todo interactions
        if (this.elements.todoList) {
            this.elements.todoList.addEventListener('click', (e) => {
                const todoId = e.target.dataset.todoId;
                if (!todoId) return;

                if (e.target.classList.contains('todo-checkbox')) {
                    e.stopPropagation();
                    this.toggleTodo(todoId);
                } else if (e.target.classList.contains('todo-delete-btn')) {
                    e.stopPropagation();
                    this.deleteTodo(todoId);
                }
            });
        }
    }

    setupVisibilityListener() {
        // Reload when page becomes visible (e.g., switching tabs back)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refresh();
            }
        });
    }

    open() {
        super.open();
        this.render();
        this.updateBadge();
    }

    addTodo(text) {
        if (!text.trim()) return;

        this.todos.push({
            id: this.storage.generateId(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        });

        this.render();
        this.updateBadge();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.render();
            this.updateBadge();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.render();
        this.updateBadge();
    }

    clearCompleted() {
        this.todos = this.todos.filter(t => !t.completed);
        this.render();
        this.updateBadge();
    }

    render() {
        const { todoList, todoFooter, todoCount } = this.elements;

        if (!todoList) return;

        const activeCount = this.getActiveCount();

        // Update count
        if (todoCount) {
            todoCount.textContent = `${activeCount} ${activeCount === 1 ? 'item' : 'items'} left`;
        }

        // Show/hide footer
        if (todoFooter) {
            todoFooter.style.display = this.todos.length > 0 ? 'flex' : 'none';
        }

        // Render todos
        if (this.todos.length === 0) {
            todoList.innerHTML = `
                <div class="todo-empty">
                    <div class="empty-icon">📋</div>
                    <div class="empty-text">no tasks yet</div>
                    <div class="empty-subtext">add a task to get started</div>
                </div>
            `;
            return;
        }

        todoList.innerHTML = this.todos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-todo-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" data-todo-id="${todo.id}"></div>
                <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                <button class="todo-delete-btn" data-todo-id="${todo.id}">delete</button>
            </div>
        `).join('');
    }

    updateBadge() {
        const { badge, menuCount } = this.elements;
        const activeCount = this.getActiveCount();
        const text = activeCount > 99 ? '99+' : activeCount.toString();

        if (badge) {
            if (activeCount > 0) {
                badge.textContent = text;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        if (menuCount) {
            if (activeCount > 0) {
                menuCount.textContent = text;
                menuCount.style.display = 'flex';
            } else {
                menuCount.style.display = 'none';
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Expose class constructor for testing
window.TodoAppClass = TodoApp;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.TodoApp = new TodoApp();
    });
} else {
    window.TodoApp = new TodoApp();
}

// Expose open function globally for onclick handlers
window.openTodoWindow = function() {
    if (window.TodoApp) {
        window.TodoApp.open();
    }
};
