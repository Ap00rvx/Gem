// GEM Background Service Worker - Minimal Version (No Context Menu)
chrome.runtime.onInstalled.addListener(() => {
    console.log('GEM Assistant installed successfully');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked');
});

// Listen for commands from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    if (request.action === 'getPageContent') {
        // Forward request to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, request, sendResponse);
            }
        });
        return true;
    }
    
    if (request.action === 'openGemOverlay') {
        // Inject content script if not already present
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: () => {
                        if (window.gemAssistant) {
                            window.gemAssistant.showOverlay();
                        } else {
                            console.log('GEM Assistant not loaded');
                        }
                    }
                }).catch(error => {
                    console.log('Script injection failed:', error);
                });
            }
        });
    }
    
    sendResponse({ status: 'processed' });
});
