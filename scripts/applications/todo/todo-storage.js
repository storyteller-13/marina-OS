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
            { text: 'laser focus on what has always mattered the most and continues to be one of my greatest sources of happiness: my work', completed: false },
            { text: 'be in the present, and find gratitude and fullfiment every single day', completed: false },
            { text: 'trust that G\'d is bringing the perfect partner to me, at the right time', completed: false },
            { text: 'become unomad and build a nice, safe, and perfect home', completed: false },
            { text: 'become marina v2.0: perfectly unkillable', completed: true },
            { text: 'get ready for the best year ever yet', completed: true },
            { text: 'know that i\'m safe and justice will always be served (do not waste time worrying about things i cannot control)', completed: true }
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
