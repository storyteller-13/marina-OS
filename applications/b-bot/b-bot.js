/**
 * B-Bot Application Module
 * Self-contained chatbot application
 */
class BBotApp extends BaseApp {
    constructor() {
        super({ windowId: 'b-bot-window', dockItemId: 'b-bot-dock-item' });
        this.api = new BBotAPI();
        this.input = null;
        this.sendBtn = null;
        this.messages = null;
        this.settingsBtn = null;
        this.ollamaToggle = null;
        this.modelSelect = null;
        this.downloadBtn = null;
        this.downloadInput = null;
        this.downloadStatus = null;
        this.settingsPanel = null;

        this.init();
    }

    init() {
        super.init();
        if (!this.window) return;

        this.input = document.getElementById('b-bot-input');
        this.sendBtn = document.getElementById('b-bot-send-btn');
        this.messages = document.getElementById('b-bot-messages');
        this.settingsBtn = document.getElementById('b-bot-settings-btn');
        this.ollamaToggle = document.getElementById('b-bot-ollama-toggle');
        this.modelSelect = document.getElementById('b-bot-model-select');
        this.downloadBtn = document.getElementById('b-bot-download-btn');
        this.downloadInput = document.getElementById('b-bot-download-input');
        this.downloadStatus = document.getElementById('b-bot-download-status');
        this.settingsPanel = document.getElementById('b-bot-settings-panel');

        this.setupEventListeners();
        // Initialize toggle state to match default config
        if (this.ollamaToggle) {
            this.ollamaToggle.checked = this.api.config.useOllama;
        }
        if (this.modelSelect) {
            this.modelSelect.disabled = !this.api.config.useOllama;
        }
        this.loadModels();
    }

    setupEventListeners() {
        super.setupEventListeners();

        // Setup message sending
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        if (this.input) {
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        // Setup settings button
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => {
                this.toggleSettings();
            });
        }

        // Setup Ollama toggle
        if (this.ollamaToggle) {
            this.ollamaToggle.addEventListener('change', (e) => {
                this.toggleOllama(e.target.checked);
            });
        }

        // Setup model selector
        if (this.modelSelect) {
            this.modelSelect.addEventListener('change', (e) => {
                this.selectModel(e.target.value);
            });
        }

        // Setup download button
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => {
                this.downloadModel();
            });
        }

        // Setup download input enter key
        if (this.downloadInput) {
            this.downloadInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.downloadModel();
                }
            });
        }
    }

    open() {
        super.open();
        if (this.input) {
            setTimeout(() => this.input.focus(), 300);
        }
    }

    addMessage(text, isBot = false) {
        if (!this.messages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `b-bot-message ${isBot ? 'bot-message' : 'user-message'}`;

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.escapeHtml(text)}</div>
                <div class="message-time">${timeStr}</div>
            </div>
        `;

        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    async sendMessage() {
        if (!this.input) return;

        const message = this.input.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, false);

        // Clear input
        this.input.value = '';

        // Show thinking indicator
        this.showThinking();

        // Get bot response
        try {
            const botResponse = await this.api.getResponse(message);
            // Hide thinking indicator and show response
            this.hideThinking();
            setTimeout(() => {
                this.addMessage(botResponse, true);
            }, 100);
        } catch (error) {
            // Hide thinking indicator even on error
            this.hideThinking();
            setTimeout(() => {
                this.addMessage("sorry, i encountered an error: " + (error.message || "unknown error"), true);
            }, 100);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show thinking indicator
     */
    showThinking() {
        if (!this.messages) return;

        // Remove any existing thinking indicator
        this.hideThinking();

        const thinkingDiv = document.createElement('div');
        thinkingDiv.id = 'b-bot-thinking-indicator';
        thinkingDiv.className = 'b-bot-message bot-message';

        thinkingDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text thinking-indicator">
                    <span class="thinking-dot"></span>
                    <span class="thinking-dot"></span>
                    <span class="thinking-dot"></span>
                </div>
            </div>
        `;

        this.messages.appendChild(thinkingDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    /**
     * Hide thinking indicator
     */
    hideThinking() {
        if (!this.messages) return;

        const thinkingIndicator = document.getElementById('b-bot-thinking-indicator');
        if (thinkingIndicator) {
            thinkingIndicator.remove();
        }
    }

    /**
     * Toggle settings panel visibility
     */
    toggleSettings() {
        if (this.settingsPanel) {
            const isVisible = this.settingsPanel.style.display !== 'none';
            this.settingsPanel.style.display = isVisible ? 'none' : 'block';

            if (!isVisible) {
                this.loadModels();
                // Update toggle state
                if (this.ollamaToggle) {
                    this.ollamaToggle.checked = this.api.config.useOllama;
                }
            }
        }
    }

    /**
     * Toggle Ollama on/off
     */
    toggleOllama(enabled) {
        this.api.config.useOllama = enabled;
        if (this.modelSelect) {
            this.modelSelect.disabled = !enabled;
        }
        if (enabled) {
            this.loadModels();
            this.addMessage('ollama enabled', true);
        } else {
            this.addMessage('ollama disabled', true);
        }
    }

    /**
     * Load available Ollama models
     */
    async loadModels() {
        if (!this.modelSelect) return;

        this.modelSelect.innerHTML = '<option value="">checking connection...</option>';
        this.modelSelect.disabled = true;

        try {
            const { ok, models } = await this.api.getOllamaTags();
            if (!ok) {
                this.modelSelect.innerHTML = '<option value="">Ollama not available - check if running</option>';
                this.modelSelect.disabled = true;
                return;
            }

            this.modelSelect.innerHTML = '';
            this.modelSelect.disabled = false;

            if (models.length === 0) {
                this.modelSelect.innerHTML = '<option value="">No models available - download one below</option>';
                return;
            }

            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = model.name;
                if (model.name === this.api.config.ollamaModel) {
                    option.selected = true;
                }
                this.modelSelect.appendChild(option);
            });
        } catch (error) {
            this.modelSelect.innerHTML = '<option value="">Error loading models</option>';
            this.modelSelect.disabled = true;
        }
    }

    /**
     * Select a model to use
     */
    selectModel(modelName) {
        if (!modelName) return;

        this.api.config.ollamaModel = modelName;
        this.api.config.useOllama = true;
        this.addMessage(`switched to model: ${modelName}`, true);
    }

    /**
     * Download/pull an Ollama model
     */
    async downloadModel() {
        if (!this.downloadInput || !this.downloadStatus) return;

        const modelName = this.downloadInput.value.trim();
        if (!modelName) {
            this.downloadStatus.textContent = 'please enter a model name';
            this.downloadStatus.style.color = '#ff6b6b';
            return;
        }

        this.downloadBtn.disabled = true;
        this.downloadStatus.textContent = `downloading ${modelName}...`;
        this.downloadStatus.style.color = '#a855f7';

        try {
            const result = await this.api.pullOllamaModel(modelName);

            if (result.success) {
                this.downloadStatus.textContent = `successfully downloaded ${modelName}`;
                this.downloadStatus.style.color = '#51cf66';
                this.downloadInput.value = '';
                // Reload models list
                await this.loadModels();
            } else {
                this.downloadStatus.textContent = `error: ${result.error || 'download failed'}`;
                this.downloadStatus.style.color = '#ff6b6b';
            }
        } catch (error) {
            this.downloadStatus.textContent = `error: ${error.message}`;
            this.downloadStatus.style.color = '#ff6b6b';
        } finally {
            this.downloadBtn.disabled = false;
        }
    }
}

// Expose class constructor for testing
window.BBotAppClass = BBotApp;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.BBotApp = new BBotApp();
    });
} else {
    window.BBotApp = new BBotApp();
}

// Expose open function globally for onclick handlers
window.openBBotWindow = function() {
    if (window.BBotApp) {
        window.BBotApp.open();
    }
};
