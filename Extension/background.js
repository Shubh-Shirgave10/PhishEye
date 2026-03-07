importScripts('config_ext.js');
const scanCache = {}; // Stores { url, status } per tabId

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // In PhishEye, we want to scan all protocols to provide consistent feedback
    const isSupportedUrl =
        tab.url &&
        (tab.url.startsWith("http://") ||
            tab.url.startsWith("https://") ||
            tab.url.startsWith("chrome://") ||
            tab.url.startsWith("edge://") ||
            tab.url.startsWith("about:"));

    if (
        changeInfo.status !== "complete" ||
        !isSupportedUrl
    ) {
        return;
    }

    chrome.storage.local.get(["token", "autoScan"], (result) => {
        const token = result.token;
        const autoScan = result.autoScan !== undefined ? result.autoScan : false;

        if (!token || !autoScan) return;

        // Skip if we already scanned this exact URL for this tab
        if (scanCache[tabId] && scanCache[tabId].url === tab.url && scanCache[tabId].status !== "scanning...") {
            // Re-show the popup with cached result
            chrome.tabs.sendMessage(tabId, { action: "SHOW_POPUP", status: scanCache[tabId].status });
            return;
        }

        // Mark as scanning
        scanCache[tabId] = { url: tab.url, status: "scanning..." };

        // For internal browser pages (chrome://, edge://, about:) — mark as safe directly
        if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) {
            scanCache[tabId] = { url: tab.url, status: "safe" };
            chrome.action.setBadgeText({ text: "✓", tabId });
            chrome.action.setBadgeBackgroundColor({ color: "#00FF00", tabId });
            chrome.tabs.sendMessage(tabId, { action: "SHOW_POPUP", status: "safe" }).catch(() => { });
            return;
        }

        const API_BASE = self.EXTENSION_CONFIG ? self.EXTENSION_CONFIG.API_BASE : 'http://localhost:5000';
        fetch(`${API_BASE}/api/scan`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify({ url: tab.url }),
        })
            .then(async (response) => {
                const contentType = response.headers.get("content-type") || "";

                if (!contentType.includes("application/json")) {
                    const text = await response.text();
                    throw new Error(
                        `Non-JSON response (${response.status}): ${text.slice(0, 200)}`
                    );
                }

                const data = await response.json();

                if (!response.ok) {
                    const msg = data?.message || `Server error (${response.status})`;
                    const details = data?.details?.error
                        ? `: ${data.details.error}`
                        : "";
                    throw new Error(msg + details);
                }

                return data;
            })
            .then((data) => {
                console.log("🧠 PhishEye Scan API Response:", data);

                // -------------------------------
                // Normalize backend verdict
                // -------------------------------
                const statusRaw =
                    data.status ||
                    data.result ||
                    data.verdict ||
                    data.label ||
                    data.prediction ||
                    "unknown";

                const status = statusRaw.toLowerCase();
                const normalized = status;

                const isMalicious =
                    normalized === "malicious" ||
                    normalized === "unsafe" ||
                    normalized === "phishing";

                const isSuspicious = normalized === "suspicious";

                if (isMalicious) {
                    chrome.action.setBadgeText({ text: "!", tabId });
                    chrome.action.setBadgeBackgroundColor({ color: "#FF0000", tabId });
                } else if (isSuspicious) {
                    chrome.action.setBadgeText({ text: "?", tabId });
                    chrome.action.setBadgeBackgroundColor({ color: "#FFA500", tabId });
                } else {
                    chrome.action.setBadgeText({ text: "✓", tabId });
                    chrome.action.setBadgeBackgroundColor({ color: "#00FF00", tabId });
                }

                // Cache result for tab switching
                scanCache[tabId] = { url: tab.url, status: status };

                // Show notification for all states
                chrome.tabs.sendMessage(tabId, { action: "SHOW_POPUP", status: status }).catch(() => { });
            })
            .catch((error) => {
                console.error("❌ PhishEye Scan Error:", error);

                // Allow retry if backend fails
                delete scanCache[tabId];
            });
    });
});

// Show popup again when user switches back to an already scanned tab
chrome.tabs.onActivated.addListener((activeInfo) => {
    const tabId = activeInfo.tabId;
    chrome.tabs.get(tabId, (tab) => {
        if (tab && tab.url && scanCache[tabId] && scanCache[tabId].url === tab.url) {
            const status = scanCache[tabId].status;
            if (status !== "scanning...") {
                chrome.tabs.sendMessage(tabId, { action: "SHOW_POPUP", status: status }).catch(() => { });
            }
        }
    });
});

// Clear cache when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    delete scanCache[tabId];
});

// Handle proactive status checks from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_SCAN_STATUS" && sender.tab) {
        const tabId = sender.tab.id;
        if (scanCache[tabId] && scanCache[tabId].url === sender.tab.url) {
            const status = scanCache[tabId].status;
            if (status !== "scanning...") {
                sendResponse({ status: status });
                // Also trigger the UI
                chrome.tabs.sendMessage(tabId, { action: "SHOW_POPUP", status: status }).catch(() => { });
            }
        }
    }
    return true; // Keep channel open for async
});
