// GEM Background Service Worker - Safe Version
chrome.runtime.onInstalled.addListener(() => {
    console.log('GEM Assistant installed');
    
    // Optional: Create context menu only if API is available
    setTimeout(() => {
        try {
            if (chrome.contextMenus && chrome.contextMenus.create) {
                chrome.contextMenus.create({
                    id: 'gemAnalyze',
                    title: 'Analyze with GEM',
                    contexts: ['selection']
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.log('Context menu creation failed:', chrome.runtime.lastError.message);
                    } else {
                        console.log('Context menu created successfully');
                    }
                });
            }
        } catch (error) {
            console.log('Context menu not supported:', error);
        }
    }, 100);
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // Open popup is handled automatically by manifest
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
        return true; // Keep message channel open for async response
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

// Context menu click handler - only if available
try {
    if (chrome.contextMenus && chrome.contextMenus.onClicked) {
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            if (info.menuItemId === 'gemAnalyze' && tab && tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'analyzeSelection',
                    text: info.selectionText
                }).catch(error => {
                    console.log('Failed to send message to content script:', error);
                });
            }
        });
    }
} catch (error) {
    console.log('Context menu listener not supported:', error);
}
