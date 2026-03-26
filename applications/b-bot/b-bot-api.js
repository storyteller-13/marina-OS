/**
 * B-Bot API Module
 * Handles Ollama API (local LLM) and model management
 */
class BBotAPI {
    constructor() {
        this.config = {
            maxTokens: 500,
            temperature: 0.7,
            ollamaUrl: window.OLLAMA_URL || 'http://localhost:11434',
            useOllama: false,
            ollamaModel: 'llama2'
        };
    }

    /**
     * Fetch Ollama /api/tags once. Returns { ok, models } for reuse.
     */
    async getOllamaTags() {
        try {
            const response = await fetch(`${this.config.ollamaUrl}/api/tags`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = response.ok ? await response.json() : null;
            return {
                ok: response.ok,
                models: (data && data.models) ? data.models : []
            };
        } catch (error) {
            return { ok: false, models: [] };
        }
    }

    /**
     * Check if Ollama is available
     */
    async checkOllamaConnection() {
        const { ok } = await this.getOllamaTags();
        return ok;
    }

    /**
     * Get a user-friendly error message from an error
     */
    getErrorMessage(error) {
        if (!error) {
            return 'unknown error';
        }

        // Network errors (CORS, connection refused, etc.)
        if (error.message && error.message.includes('Failed to fetch')) {
            return 'cannot connect to ollama. make sure ollama is running on ' + this.config.ollamaUrl + ' (check for CORS issues)';
        }

        if (error.message && error.message.includes('NetworkError')) {
            return 'network error. check if ollama is running and accessible';
        }

        // HTTP errors
        if (error.message && error.message.includes('HTTP error')) {
            return error.message;
        }

        // Status code errors
        if (error.status) {
            if (error.status === 404) {
                return 'ollama endpoint not found. check if ollama is running on ' + this.config.ollamaUrl;
            }
            if (error.status === 0) {
                return 'connection refused. make sure ollama is running on ' + this.config.ollamaUrl;
            }
            return `HTTP error ${error.status}`;
        }

        // Generic error message
        return error.message || error.toString() || 'unknown error';
    }

    /**
     * List available Ollama models
     */
    async listOllamaModels() {
        const { ok, models } = await this.getOllamaTags();
        return ok ? models : [];
    }

    /**
     * Download/pull an Ollama model
     */
    async pullOllamaModel(modelName) {
        try {
            const response = await fetch(`${this.config.ollamaUrl}/api/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: modelName,
                    stream: true
                })
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    // Ignore JSON parse errors
                }
                const error = new Error(errorMessage);
                error.status = response.status;
                throw error;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            /* eslint-disable-next-line no-constant-condition */
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                decoder.decode(value);
            }

            return { success: true, model: modelName };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    /**
     * Get response from Ollama
     */
    async getOllamaResponse(userMessage) {
        try {
            const response = await fetch(`${this.config.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.config.ollamaModel,
                    prompt: userMessage,
                    stream: false,
                    options: {
                        temperature: this.config.temperature,
                        num_predict: this.config.maxTokens
                    }
                })
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    // Ignore JSON parse errors
                }
                const error = new Error(errorMessage);
                error.status = response.status;
                throw error;
            }

            const data = await response.json();
            return data.response || "i couldn't generate a response";
        } catch (error) {
            // Re-throw with better error message
            const friendlyError = new Error(this.getErrorMessage(error));
            friendlyError.originalError = error;
            throw friendlyError;
        }
    }

    async getResponse(userMessage) {
        // If using Ollama, try to get response from Ollama
        if (this.config.useOllama) {
            try {
                const isConnected = await this.checkOllamaConnection();
                if (isConnected) {
                    return await this.getOllamaResponse(userMessage);
                } else {
                    return "ollama is not available. make sure ollama is running on " + this.config.ollamaUrl + ". if you're using a browser, you may need to configure CORS.";
                }
            } catch (error) {
                const errorMsg = this.getErrorMessage(error);
                return "error connecting to ollama: " + errorMsg;
            }
        }

        // Bot is sleeping - always return the same message
        return "i'm sleeping for now, come back later";
    }
}

// Expose class for testing
if (typeof window !== 'undefined') {
    window.BBotAPI = BBotAPI;
}
