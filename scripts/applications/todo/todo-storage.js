/**
 * Todo Storage Module
 * Handles localStorage persistence for todos
 */
class TodoStorage {
    constructor() {
        this.storageKey = 'todos';
    }

    load() {
        // Always clear cache and return default todos
        localStorage.removeItem(this.storageKey);
        return this.getTodos();
    }

    getTodos() {
        const defaultTodoData = [
            { text: 'finish the first book', completed: false },
            { text: 'start the friday sermons', completed: false },
            { text: 'get ready for the best year ever yet', completed: true }
        ];

        return defaultTodoData.map(data => this.createTodo(data.text, data.completed));
    }

    createTodo(text, completed = false) {
        return {
            id: this.generateId(),
            text,
            completed,
            createdAt: new Date().toISOString()
        };
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
}

// Expose class for testing
if (typeof window !== 'undefined') {
    window.TodoStorage = TodoStorage;
}
