/**
 * B-Bot API Module
 * Handles LLM API interactions and fallback responses
 * Supports Ollama for local model management
 */
class BBotAPI {
    constructor() {
        this.config = {
            apiKey: window.OPENAI_API_KEY || '',
            apiUrl: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-3.5-turbo',
            maxTokens: 500,
            temperature: 0.7,
            ollamaUrl: window.OLLAMA_URL || 'http://localhost:11434',
            useOllama: true,
            ollamaModel: 'llama2'
        };
    }

    /**
     * Check if Ollama is available
     */
    async checkOllamaConnection() {
        try {
            const response = await fetch(`${this.config.ollamaUrl}/api/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
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
        try {
            const response = await fetch(`${this.config.ollamaUrl}/api/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = new Error(`HTTP error! status: ${response.status}`);
                error.status = response.status;
                throw error;
            }

            const data = await response.json();
            return data.models || [];
        } catch (error) {
            // Return empty array on error - caller will handle display
            return [];
        }
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
            const progressCallback = (progress) => {
                // Progress will be handled by the caller
            };

            let fullResponse = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        fullResponse += JSON.stringify(data) + '\n';

                        // Emit progress if callback provided
                        if (data.status) {
                            progressCallback(data.status);
                        }
                    } catch (e) {
                        // Skip invalid JSON lines
                    }
                }
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

    getFallbackResponse(userMessage) {
        const message = userMessage.toLowerCase().trim();

        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return "hello! nice to meet you. how can i help you today?";
        }
        if (message.includes('help')) {
            return "i'm here to help! you can ask me about the website, or just chat. what would you like to know?";
        }
        if (message.includes('who are you') || message.includes('what are you')) {
            return "i'm a b-bot on vonsteinkirch.com. i'm here to chat and help answer questions about the site.";
        }
        if (message.includes('bye') || message.includes('goodbye') || message.includes('see you')) {
            return "goodbye! feel free to come back anytime. have a great day!";
        }
        if (message.includes('thanks') || message.includes('thank you')) {
            return "you're welcome! happy to help.";
        }
        if (message.includes('how are you')) {
            return "i'm doing well, thanks for asking! how are you doing today?";
        }
        if (message.includes('time')) {
            const now = new Date();
            return `the current time is ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.`;
        }
        if (message.includes('date')) {
            const now = new Date();
            return `today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
        }
        if (message.includes('joke') || message.includes('funny')) {
            const jokes = [
                "why don't scientists trust atoms? because they make up everything!",
                "why did the scarecrow win an award? he was outstanding in his field!",
                "what do you call a fake noodle? an impasta!",
                "why don't eggs tell jokes? they'd crack each other up!"
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }

        const defaultResponses = [
            "that's interesting! tell me more.",
            "i see. can you elaborate on that?",
            "hmm, i'm not sure i understand. could you rephrase that?",
            "that's a good point. what else would you like to know?",
            "i'm still learning, but i'd love to hear more about that.",
            "thanks for sharing! is there anything specific you'd like to know?"
        ];

        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
}

// Expose class for testing
if (typeof window !== 'undefined') {
    window.BBotAPI = BBotAPI;
}
