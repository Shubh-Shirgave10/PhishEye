const lastScannedUrls = {};

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    const isWebUrl = tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'));

    // Only scan if:
    // 1. Loading is complete
    // 2. It's a real website (not file:// or chrome://)
    // 3. We haven't already scanned this URL for this specific tab
    if (changeInfo.status === 'complete' && isWebUrl && lastScannedUrls[tabId] !== tab.url) {
        chrome.storage.local.get(['token', 'autoScan'], (result) => {
            const token = result.token;
            const autoScan = result.autoScan === true;

            if (!token || !autoScan) return;

            // Mark as scanned immediately to prevent duplicate requests
            lastScannedUrls[tabId] = tab.url;

            fetch('http://localhost:5000/api/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ url: tab.url })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.result === 'Unsafe') {
                        chrome.action.setBadgeText({ text: "!", tabId: tabId });
                        chrome.action.setBadgeBackgroundColor({ color: "#FF0000", tabId: tabId });
                        chrome.tabs.sendMessage(tabId, { action: "SHOW_POPUP", status: data.result });
                    } else {
                        chrome.action.setBadgeText({ text: "✓", tabId: tabId });
                        chrome.action.setBadgeBackgroundColor({ color: "#00FF00", tabId: tabId });
                    }
                })
                .catch(error => {
                    console.error("PhishEye Scan Error:", error);
                    delete lastScannedUrls[tabId]; // Allow retry on failure
                });
        });
    }
});

// Clear cache when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    delete lastScannedUrls[tabId];
});
