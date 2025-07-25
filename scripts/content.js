// Enhanced GEM Content Script with Advanced Features
class GemAssistant {
    constructor() {
        this.isActive = false;
        this.overlay = null;
        this.apiKey = null;
        this.conversationHistory = [];
        this.pageAnalysis = null;
        this.shortcuts = {
            'KeyQ': { ctrl: true, shift: true, action: 'quick' },
            'KeyS': { ctrl: true, shift: true, action: 'summarize' },
            'KeyL': { ctrl: true, shift: true, action: 'leetcode' },
            'KeyC': { ctrl: true, shift: true, action: 'code' },
            'KeyH': { ctrl: true, shift: true, action: 'help' }
        };
        this.init();
    }

    async init() {
        const result = await chrome.storage.sync.get(['geminiApiKey']);
        this.apiKey = result.geminiApiKey;
        
        // Always setup the extension, even without API key
        this.setupKeyboardShortcuts();
        this.createOverlay();
        this.analyzePageContext();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const shortcut = this.shortcuts[e.code];
            
            if (shortcut && 
                e.ctrlKey === shortcut.ctrl && 
                e.shiftKey === shortcut.shift && 
                e.altKey === (shortcut.alt || false)) {
                
                e.preventDefault();
                this.handleShortcut(shortcut.action);
            }
            
            if (e.key === 'Escape') {
                this.hideOverlay();
            }
        });
    }

    handleShortcut(action) {
        switch (action) {
            case 'quick':
                this.showOverlay('quick');
                break;
            case 'summarize':
                this.summarizePage();
                break;
            case 'leetcode':
                this.leetcodeHelper();
                break;
            case 'code':
                this.analyzeCode();
                break;
            case 'help':
                this.showHelp();
                break;
        }
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.innerHTML = `
            <div class="gem-overlay" id="gemOverlay" style="display: none;">
                <div class="gem-container">
                    <div class="gem-header">
                        <div class="gem-title">
                            <span class="gem-logo">💎</span>
                            <span>GEM Assistant</span>
                            <span class="gem-status" id="gemStatus"></span>
                        </div>
                        <div class="gem-controls">
                            <button class="gem-control-btn" id="gemMinimize" title="Minimize">−</button>
                            <button class="gem-control-btn" id="gemClose" title="Close">×</button>
                        </div>
                    </div>
                    
                    <div class="gem-toolbar">
                        <button class="gem-tool-btn active" data-mode="chat">💬 Chat</button>
                        <button class="gem-tool-btn" data-mode="summarize">📄 Summary</button>
                        <button class="gem-tool-btn" data-mode="code">💻 Code</button>
                        <button class="gem-tool-btn" data-mode="translate">🌐 Translate</button>
                    </div>
                    
                    <div class="gem-content">
                        <div class="gem-suggestions" id="gemSuggestions">
                            <div class="gem-suggestion-title">Quick Actions:</div>
                            <div class="gem-suggestion-grid">
                                <button class="gem-suggestion" data-prompt="Explain this page in simple terms">
                                    <span class="gem-suggestion-icon">🔍</span>
                                    <span>Explain</span>
                                </button>
                                <button class="gem-suggestion" data-prompt="What are the key points?">
                                    <span class="gem-suggestion-icon">📝</span>
                                    <span>Key Points</span>
                                </button>
                                <button class="gem-suggestion" data-prompt="Find any errors or issues">
                                    <span class="gem-suggestion-icon">🐛</span>
                                    <span>Debug</span>
                                </button>
                                <button class="gem-suggestion" data-prompt="How can this be improved?">
                                    <span class="gem-suggestion-icon">⚡</span>
                                    <span>Improve</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="gem-chat" id="gemChat">
                            <div class="gem-messages" id="gemMessages"></div>
                            <div class="gem-input-container">
                                <textarea id="gemInput" placeholder="Ask me anything about this page..." rows="3"></textarea>
                                <div class="gem-input-actions">
                                    <button class="gem-btn gem-btn-secondary" id="gemClear">Clear</button>
                                    <button class="gem-btn gem-btn-primary" id="gemSend">
                                        <span id="gemSendText">Send</span>
                                        <span class="gem-spinner" id="gemSpinner" style="display: none;">⟳</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="gem-footer">
                        <div class="gem-stats">
                            <span id="gemWordCount">0 words</span> • 
                            <span id="gemPageType">Unknown page</span>
                        </div>
                        <div class="gem-shortcuts">
                            Press Ctrl+Shift+H for help
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        this.attachOverlayEvents();
        this.updatePageStats();
    }

    attachOverlayEvents() {
        // Control buttons
        document.getElementById('gemClose').addEventListener('click', () => this.hideOverlay());
        document.getElementById('gemMinimize').addEventListener('click', () => this.minimizeOverlay());
        
        // Toolbar
        document.querySelectorAll('.gem-tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });
        
        // Suggestions
        document.querySelectorAll('.gem-suggestion').forEach(btn => {
            btn.addEventListener('click', (e) => this.useSuggestion(e.currentTarget.dataset.prompt));
        });
        
        // Chat functionality
        document.getElementById('gemSend').addEventListener('click', () => this.sendMessage());
        document.getElementById('gemClear').addEventListener('click', () => this.clearChat());
        
        const input = document.getElementById('gemInput');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        input.addEventListener('input', () => this.updateWordCount());
        
        // Close on background click
        document.getElementById('gemOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'gemOverlay') {
                this.hideOverlay();
            }
        });
    }

    switchMode(mode) {
        // Update active button
        document.querySelectorAll('.gem-tool-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        const input = document.getElementById('gemInput');
        const suggestions = document.getElementById('gemSuggestions');
        
        switch (mode) {
            case 'chat':
                input.placeholder = 'Ask me anything about this page...';
                suggestions.style.display = 'block';
                break;
            case 'summarize':
                input.placeholder = 'What would you like me to summarize?';
                this.autoSummarize();
                break;
            case 'code':
                input.placeholder = 'Paste code here or select code on the page for analysis...';
                suggestions.style.display = 'none';
                break;
            case 'translate':
                input.placeholder = 'Enter text to translate or select text on the page...';
                suggestions.style.display = 'none';
                break;
        }
    }

    async analyzePageContext() {
        const url = window.location.href;
        const domain = window.location.hostname;
        
        // Detect page type
        let pageType = 'webpage';
        if (domain.includes('leetcode')) pageType = 'coding-platform';
        else if (domain.includes('github')) pageType = 'code-repository';
        else if (domain.includes('stackoverflow')) pageType = 'q-and-a';
        else if (domain.includes('wikipedia')) pageType = 'encyclopedia';
        else if (document.querySelector('pre, code')) pageType = 'technical-documentation';
        
        this.pageAnalysis = {
            type: pageType,
            domain: domain,
            title: document.title,
            hasCode: !!document.querySelector('pre, code'),
            hasFormulas: !!document.querySelector('[class*="math"], [class*="equation"]'),
            language: document.documentElement.lang || 'en',
            wordCount: this.getPageWordCount()
        };
        
        this.updatePageStats();
    }

    updatePageStats() {
        if (!this.pageAnalysis) return;
        
        const pageTypeEl = document.getElementById('gemPageType');
        const wordCountEl = document.getElementById('gemWordCount');
        
        if (pageTypeEl) {
            pageTypeEl.textContent = this.pageAnalysis.type.replace('-', ' ');
        }
        
        if (wordCountEl) {
            wordCountEl.textContent = `${this.pageAnalysis.wordCount} words`;
        }
    }

    getPageWordCount() {
        const textContent = this.getPageContext();
        return textContent.split(/\s+/).filter(word => word.length > 0).length;
    }

    updateWordCount() {
        const input = document.getElementById('gemInput');
        const words = input.value.trim().split(/\s+/).filter(word => word.length > 0).length;
        
        // Update placeholder or status
        const status = document.getElementById('gemStatus');
        if (status && input.value.trim()) {
            status.textContent = `${words} words`;
        } else if (status) {
            status.textContent = '';
        }
    }

    async useSuggestion(prompt) {
        document.getElementById('gemInput').value = prompt;
        await this.sendMessage();
    }

    async autoSummarize() {
        const pageContext = this.getPageContext();
        if (pageContext.length > 100) {
            this.addMessage('user', 'Summarize this page');
            
            const prompt = this.buildContextualPrompt('Please provide a comprehensive summary of this page, highlighting the main points and key takeaways.');
            
            try {
                const response = await this.callGeminiAPI(prompt);
                this.addMessage('assistant', response);
            } catch (error) {
                this.addMessage('assistant', 'Sorry, I couldn\'t summarize the page right now. Please try again.');
            }
        }
    }

    async sendMessage() {
        const input = document.getElementById('gemInput');
        const query = input.value.trim();
        
        if (!query) return;
        
        // Check if API key is available
        if (!this.apiKey) {
            // Try to reload API key from storage
            const result = await chrome.storage.sync.get(['geminiApiKey']);
            this.apiKey = result.geminiApiKey;
            
            if (!this.apiKey) {
                this.addMessage('assistant', `
                    🔑 **API Key Required**
                    
                    To use GEM Assistant, you need to set up your Gemini API key:
                    
                    1. Click the GEM extension icon in your toolbar
                    2. Enter your Gemini API key (get one free at https://makersuite.google.com/app/apikey)
                    3. Click "Save & Activate"
                    
                    Once configured, you'll be able to chat with me!
                `);
                return;
            }
        }
        
        this.addMessage('user', query);
        input.value = '';
        this.updateWordCount();
        
        const sendBtn = document.getElementById('gemSend');
        const sendText = document.getElementById('gemSendText');
        const spinner = document.getElementById('gemSpinner');
        
        sendBtn.disabled = true;
        sendText.style.display = 'none';
        spinner.style.display = 'inline-block';
        
        try {
            const prompt = this.buildContextualPrompt(query);
            const response = await this.callGeminiAPI(prompt);
            this.addMessage('assistant', response);
            
            // Add to conversation history
            this.conversationHistory.push({ user: query, assistant: response });
            
        } catch (error) {
            console.error('API Error:', error);
            this.addMessage('assistant', `
                ❌ **Error occurred**
                
                ${error.message || 'Unable to process your request. Please check your API key and internet connection.'}
                
                Try:
                • Refreshing the page
                • Checking your API key in the extension popup
                • Ensuring you have internet connectivity
            `);
        }
        
        sendBtn.disabled = false;
        sendText.style.display = 'inline-block';
        spinner.style.display = 'none';
    }

    buildContextualPrompt(userQuery) {
        const context = this.getPageContext();
        const recentHistory = this.conversationHistory.slice(-3);
        
        let prompt = `Page Context:\n`;
        prompt += `URL: ${window.location.href}\n`;
        prompt += `Title: ${document.title}\n`;
        prompt += `Page Type: ${this.pageAnalysis?.type || 'webpage'}\n`;
        prompt += `Content: ${context.substring(0, 2000)}\n\n`;
        
        if (recentHistory.length > 0) {
            prompt += `Recent Conversation:\n`;
            recentHistory.forEach((item, index) => {
                prompt += `User: ${item.user}\nAssistant: ${item.assistant}\n\n`;
            });
        }
        
        prompt += `Current User Query: ${userQuery}\n\n`;
        prompt += `Please provide a helpful, accurate response based on the page content and conversation context.`;
        
        return prompt;
    }

    addMessage(sender, text) {
        const messagesContainer = document.getElementById('gemMessages');
        const messageEl = document.createElement('div');
        messageEl.className = `gem-message gem-message-${sender}`;
        
        const avatar = sender === 'user' ? '👤' : '💎';
        const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageEl.innerHTML = `
            <div class="gem-message-header">
                <span class="gem-message-avatar">${avatar}</span>
                <span class="gem-message-time">${timestamp}</span>
            </div>
            <div class="gem-message-content">${this.formatResponse(text)}</div>
        `;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Hide suggestions after first message
        if (sender === 'user') {
            document.getElementById('gemSuggestions').style.display = 'none';
        }
    }

    formatResponse(text) {
        return text
            .replace(/```([\s\S]*?)```/g, '<pre class="gem-code-block"><code>$1</code></pre>')
            .replace(/`([^`]*)`/g, '<code class="gem-inline-code">$1</code>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    clearChat() {
        document.getElementById('gemMessages').innerHTML = '';
        document.getElementById('gemInput').value = '';
        document.getElementById('gemSuggestions').style.display = 'block';
        this.conversationHistory = [];
        this.updateWordCount();
    }

    showHelp() {
        this.showOverlay();
        this.addMessage('assistant', `
            **GEM Assistant Help**
            
            **Keyboard Shortcuts:**
            • Ctrl+Shift+Q - Quick query
            • Ctrl+Shift+S - Summarize page
            • Ctrl+Shift+L - LeetCode helper
            • Ctrl+Shift+C - Code analysis
            • Ctrl+Shift+H - Show this help
            • Esc - Close overlay
            
            **Features:**
            • **Chat Mode**: Ask questions about the page
            • **Summary Mode**: Get page summaries
            • **Code Mode**: Analyze and debug code
            • **Translate Mode**: Translate text
            
            **Tips:**
            • Select text on the page for context-aware analysis
            • Use Ctrl+Enter to send messages quickly
            • Try the quick action buttons for common tasks
        `);
    }

    // Rest of the methods remain the same as previous version
    async callGeminiAPI(prompt) {
        if (!this.apiKey) {
            throw new Error('API key not configured. Please set up your Gemini API key in the extension popup.');
        }
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your Gemini API key.');
            } else if (response.status === 429) {
                throw new Error('API rate limit exceeded. Please wait a moment and try again.');
            } else {
                throw new Error(`API error: ${response.status} - ${response.statusText}`);
            }
        }
        
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response from API. Please try again.');
        }
        
        return data.candidates[0].content.parts[0].text;
    }

    getPageContext() {
        const content = [];
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th, div');
        
        for (const element of textElements) {
            const text = element.textContent?.trim();
            if (text && text.length > 10 && !this.isNavigationText(text)) {
                content.push(text);
            }
        }
        
        const codeElements = document.querySelectorAll('code, pre');
        for (const element of codeElements) {
            content.push(`CODE: ${element.textContent}`);
        }
        
        return content.slice(0, 50).join('\n').substring(0, 3000);
    }

    isNavigationText(text) {
        const navKeywords = ['menu', 'navigation', 'footer', 'header', 'sidebar', 'advertisement'];
        return navKeywords.some(keyword => text.toLowerCase().includes(keyword)) || 
               text.length < 10 || 
               /^[\d\s\-\|]*$/.test(text);
    }

    showOverlay(mode = 'chat') {
        const overlay = document.getElementById('gemOverlay');
        overlay.style.display = 'flex';
        this.switchMode(mode);
        
        setTimeout(() => {
            document.getElementById('gemInput').focus();
        }, 100);
    }

    hideOverlay() {
        const overlay = document.getElementById('gemOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    minimizeOverlay() {
        const container = document.querySelector('.gem-container');
        container.classList.toggle('gem-minimized');
    }

    async refreshApiKey() {
        const result = await chrome.storage.sync.get(['geminiApiKey']);
        this.apiKey = result.geminiApiKey;
        
        // Update status if overlay is open
        const status = document.getElementById('gemStatus');
        if (status) {
            if (this.apiKey) {
                status.textContent = 'Ready';
                status.style.color = '#4ade80';
            } else {
                status.textContent = 'No API Key';
                status.style.color = '#f87171';
            }
        }
    }
}

// Initialize enhanced GEM Assistant
const gemAssistant = new GemAssistant();

// Make it globally accessible
window.gemAssistant = gemAssistant;

// Listen for messages from popup and background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'initializeGem':
            sendResponse({ status: 'initialized' });
            break;
            
        case 'showOverlay':
            gemAssistant.showOverlay('chat');
            sendResponse({ status: 'overlay shown' });
            break;
            
        case 'summarizePage':
            gemAssistant.showOverlay('summarize');
            gemAssistant.autoSummarize();
            sendResponse({ status: 'summarizing' });
            break;
            
        case 'analyzeCode':
            gemAssistant.showOverlay('code');
            if (gemAssistant.pageAnalysis?.hasCode) {
                gemAssistant.useSuggestion('Analyze the code on this page and suggest improvements');
            } else {
                gemAssistant.useSuggestion('Help me understand any code-related content on this page');
            }
            sendResponse({ status: 'analyzing code' });
            break;
            
        case 'showHelp':
            gemAssistant.showHelp();
            sendResponse({ status: 'help shown' });
            break;
            
        case 'analyzeSelection':
            if (request.text) {
                gemAssistant.showOverlay('chat');
                gemAssistant.useSuggestion(`Analyze this text: "${request.text}"`);
            }
            sendResponse({ status: 'analyzing selection' });
            break;
            
        case 'refreshApiKey':
            gemAssistant.refreshApiKey();
            sendResponse({ status: 'api key refreshed' });
            break;
            
        default:
            sendResponse({ status: 'unknown action' });
    }
    
    return true; // Keep message channel open for async response
});