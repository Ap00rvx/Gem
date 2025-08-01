# GEM Chrome Extension - Installation Guide

## How to Install and Run the Extension

### Step 1: Enable Developer Mode
1. Open Google Chrome
2. Go to `chrome://extensions/`
3. Toggle **"Developer mode"** on (top-right corner)

### Step 2: Load the Extension
1. Click **"Load unpacked"** button
2. Navigate to and select the `d:\gem` folder
3. Click **"Select Folder"**

### Step 3: Verify Installation
- The GEM extension should appear in your extensions list
- You should see the GEM icon in your Chrome toolbar
- If you don't see the icon, click the puzzle piece icon and pin GEM

### Step 4: Setup API Key
1. Click the GEM extension icon in your toolbar
2. Enter your Google Gemini API Key
   - Get your free API key from: https://makersuite.google.com/app/apikey
3. Click "Save & Activate"

### Step 5: Start Using GEM
**Keyboard Shortcuts:**
- `Ctrl+Shift+Q` - Quick query
- `Ctrl+Shift+S` - Summarize page
- `Ctrl+Shift+L` - LeetCode helper
- `Ctrl+Shift+C` - Code analysis
- `Ctrl+Shift+H` - Show help

**Features:**
- AI-powered chat interface
- Page summarization
- Code analysis and debugging
- LeetCode problem assistance
- Multi-language translation

## Troubleshooting

### Extension Won't Load
- Make sure all files are in the correct folders
- Check the Developer Tools console for errors
- Reload the extension from chrome://extensions/

### Features Not Working
- Ensure you've entered a valid Gemini API key
- Check your internet connection
- Try refreshing the webpage

### Keyboard Shortcuts Not Working
- Make sure the page is fully loaded
- Try clicking on the page content first
- Check if other extensions are conflicting

## File Structure
```
gem/
├── manifest.json
├── scripts/
│   ├── background.js
│   ├── content.js
│   └── popup.js
├── style/
│   └── content.css
└── view/
    └── popup.html
```

## Support
If you encounter any issues, check the Chrome Developer Tools console for error messages.
