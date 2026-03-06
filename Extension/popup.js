document.addEventListener('DOMContentLoaded', function () {
  const authSection = document.getElementById('auth-section');
  const mainSection = document.getElementById('main-section');
  const tokenInput = document.getElementById('api-token');
  const saveTokenBtn = document.getElementById('save-token');
  const scanBtn = document.getElementById('scan-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const scanStatus = document.getElementById('scan-status');
  const currentUrlSpan = document.getElementById('current-url');
  const autoScanToggle = document.getElementById('auto-scan');

  const statusIcon = document.getElementById('status-icon');
  const statusTitle = document.getElementById('status-title');
  const statusDesc = document.getElementById('status-desc');

  // Check stored token and settings
  chrome.storage.local.get(['token', 'autoScan'], (result) => {
    // Default autoScan to false
    const autoScan = result.autoScan !== undefined ? result.autoScan : false;
    autoScanToggle.checked = autoScan;

    if (result.token) {
      showMain(result.token, autoScan);
    } else {
      showAuth();
    }
  });

  autoScanToggle.addEventListener('change', () => {
    const isEnabled = autoScanToggle.checked;
    chrome.storage.local.set({ autoScan: isEnabled });
  });

  saveTokenBtn.addEventListener('click', () => {
    const token = tokenInput.value.trim();
    if (token) {
      saveTokenBtn.disabled = true;
      saveTokenBtn.textContent = 'Linking...';

      chrome.storage.local.set({ token: token, autoScan: false }, () => {
        showMain(token, false);
        fetch('http://localhost:5000/api/extension/link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ device_id: 'browser-extension-' + Date.now() })
        }).catch(err => console.error(err));
      });
    }
  });

  logoutBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['token'], () => showAuth());
  });

  scanBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.storage.local.get(['token'], (result) => {
        if (result.token && tabs[0].url) {
          const url = tabs[0].url;
          const isWebUrl = url.startsWith('http://') || url.startsWith('https://');

          if (!isWebUrl) {
            showInternalStatus(url);
            return;
          }

          scanUrl(url, result.token);
        }
      });
    });
  });

  function showInternalStatus(url) {
    scanStatus.style.display = 'block';
    scanStatus.classList.remove('unsafe-mode');
    scanStatus.classList.add('safe-mode');
    statusIcon.textContent = '⚙️';
    statusTitle.textContent = 'System Page';
    statusDesc.textContent = 'This is an internal browser page and is safe.';
    currentUrlSpan.textContent = url;
  }

  function showAuth() {
    authSection.classList.remove('hidden');
    mainSection.classList.add('hidden');
    saveTokenBtn.disabled = false;
    saveTokenBtn.textContent = 'Link Account';
    tokenInput.value = '';
  }

  function showMain(token, autoScan) {
    authSection.classList.add('hidden');
    mainSection.classList.remove('hidden');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        const url = tabs[0].url;
        currentUrlSpan.textContent = url;
        const isWebUrl = url.startsWith('http://') || url.startsWith('https://');

        if (!isWebUrl) {
          showInternalStatus(url);
          return;
        }

        if (autoScan) {
          scanUrl(url, token);
        }
      }
    });
  }

  function scanUrl(url, token) {
    scanStatus.style.display = 'block';
    scanStatus.classList.remove('safe-mode', 'unsafe-mode');
    statusIcon.textContent = '⏳';
    statusTitle.textContent = 'Analyzing Site...';
    statusDesc.textContent = 'Checking threat signatures and AI patterns';

    fetch('http://localhost:5000/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ url: url })
    })
      .then(async (response) => {
        // Always try to parse JSON; if the server returns non-JSON, show a helpful message
        const contentType = response.headers.get('content-type') || '';
        let payload = null;
        if (contentType.includes('application/json')) {
          payload = await response.json();
        } else {
          const text = await response.text();
          throw new Error(`Non-JSON response (${response.status}): ${text.slice(0, 200)}`);
        }

        if (!response.ok) {
          const msg = payload?.message || `Server error (${response.status})`;
          const details = payload?.details?.error ? `: ${payload.details.error}` : '';
          throw new Error(msg + details);
        }

        return payload;
      })
      .then(data => {
        console.log("Scan API Response:", data);

        const statusRaw =
          data.status ||
          data.result ||
          data.verdict ||
          data.label ||
          data.prediction ||
          "unknown";

        const status = statusRaw.toLowerCase();

        // Also trigger the on-screen toast for manual scans
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "SHOW_POPUP", status: status });
          }
        });

        if (status === "safe") {
          scanStatus.classList.add('safe-mode');
          statusIcon.textContent = '🛡️';
          statusTitle.textContent = 'Website Secure';
          statusDesc.textContent = 'No malicious threats detected by PhishEye AI.';
        } else if (status === "suspicious") {
          scanStatus.classList.add('unsafe-mode');
          statusIcon.textContent = '⚠️';
          statusTitle.textContent = 'Suspicious Activity';
          statusDesc.textContent = 'This site shows suspicious signs. Proceed carefully.';
        } else if (status === "malicious" || status === "phishing") {
          scanStatus.classList.add('unsafe-mode');
          statusIcon.textContent = '🚨';
          statusTitle.textContent = 'Threat Detected';
          statusDesc.textContent = 'This site shows patterns of phishing behavior.';
        } else {
          scanStatus.classList.add('unsafe-mode');
          statusIcon.textContent = '❓';
          statusTitle.textContent = 'Unknown Result';
          statusDesc.textContent = 'Backend did not return a recognizable verdict.';
        }
      })
      .catch(error => {
        statusIcon.textContent = '❌';
        statusTitle.textContent = 'Scan Failed';
        statusDesc.textContent = error?.message || 'Could not reach PhishEye cloud engine.';
        console.error(error);
      });
  }
});
