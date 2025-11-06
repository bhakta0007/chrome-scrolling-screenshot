// Background service worker for the extension
chrome.action.onClicked.addListener((tab) => {
  // Inject the content script when the extension icon is clicked
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });

  // Inject the CSS
  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ['content.css']
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureVisible') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ dataUrl: dataUrl });
    });
    return true; // Will respond asynchronously
  }
});
