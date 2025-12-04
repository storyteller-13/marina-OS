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
            { text: 'organize the research panel with sophia\'s data', completed: false },
            { text: 'work on the characters of our heroes', completed: false },
            { text: 'work on the crime scene', completed: false },
            { text: 'write to kolya', completed: false },
            { text: 'envisage the first act unfolding', completed: false },
            { text: 'get a new agent', completed: false },
            { text: 'open source the node', completed: true },
            { text: 'meet sophia', completed: true },
            { text: 'research about creepy.xyz', completed: true },
            { text: 'dive into the mind of the first antagonist', completed: true },
            { text: 'play with gemini 3', completed: true },
            { text: 'install omarchy', completed: true },
            { text: 'figure out whats that banana thing', completed: true },
            { text: 'order some orange merch and a virtuix', completed: true },
            { text: 'find a recipe for iced milo', completed: true },
            { text: 'ask the robot what drop the top mean', completed: true },
            { text: 'watch jedi search', completed: true },
            { text: 'get the dw+ blackfriday deal', completed: true },
            { text: 'buy the dip', completed: true }
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
