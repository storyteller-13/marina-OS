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
            { text: 'laser focus on the only thing that always mattered the most and continues to be the only meaning afterall: my career', completed: false },
            { text: 'become unomad and build a nice and perfect home', completed: false },
            { text: 'become marina v2.0: perfectly unkillable (after dying in malaysia)', completed: true },
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
