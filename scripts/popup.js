document.addEventListener('DOMContentLoaded', async () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    const status = document.getElementById('status');
    const apiSetup = document.getElementById('apiSetup');
    const features = document.getElementById('features');
    
    // Load saved API key
    const result = await chrome.storage.sync.get(['geminiApiKey']);
    if (result.geminiApiKey) {
        apiKeyInput.value = result.geminiApiKey;
        showFeatures();
    }
    
    saveBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showStatus('Please enter your API key', 'error');
            return;
        }
        
        saveBtn.disabled = true;
        saveBtn.textContent = 'Validating...';
        
        // Test API key
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            
            if (response.ok) {
                await chrome.storage.sync.set({ geminiApiKey: apiKey });
                showStatus('API key saved successfully!', 'success');
                
                // Notify all tabs to refresh their API key
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, { action: 'refreshApiKey' }, () => {
                            // Ignore errors for tabs that don't have content script
                            chrome.runtime.lastError;
                        });
                    });
                });
                
                setTimeout(showFeatures, 1500);
            } else {
                showStatus('Invalid API key. Please check and try again.', 'error');
            }
        } catch (error) {
            showStatus('Network error. Please check your connection.', 'error');
        }
        
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save & Activate';
    });
    
    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type}`;
    }
    
    function showFeatures() {
        apiSetup.style.display = 'none';
        features.style.display = 'block';
        
        // Setup feature buttons
        document.getElementById('openGemBtn').addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'showOverlay' });
                window.close();
            });
        });
        
        document.getElementById('summarizeBtn').addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'summarizePage' });
                window.close();
            });
        });
        
        document.getElementById('codeAnalyzeBtn').addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'analyzeCode' });
                window.close();
            });
        });
        
        document.getElementById('helpBtn').addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'showHelp' });
                window.close();
            });
        });
        
        // Auto-inject content script and enable features
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'initializeGem' }, (response) => {
                if (chrome.runtime.lastError) {
                    // Content script not loaded, inject it
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        files: ['scripts/content.js']
                    });
                }
            });
        });
    }
});