document.addEventListener('DOMContentLoaded', () => {
  // --- AUTH GUARD ---
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../login-page/login.html';
    return;
  }

  // Initialize Lucide Icons
  lucide.createIcons();

  // --- POPULATE USER INFO ---
  const userEmail = localStorage.getItem('user_email');
  if (userEmail) {
    const initial = userEmail.charAt(0).toUpperCase();
    const avatar = document.querySelector('.user-avatar');
    if (avatar) avatar.textContent = initial;

    const panelName = document.querySelector('.panel-user-name');
    const panelEmail = document.querySelector('.panel-user-email');
    if (panelName) panelName.textContent = userEmail.split('@')[0];
    if (panelEmail) panelEmail.textContent = userEmail;
  }

  // Elements
  const backBtn = document.getElementById('backBtn');
  const userMenuBtn = document.getElementById('userMenuBtn');
  const navPanel = document.getElementById('navPanel');
  const panelItems = document.querySelectorAll('.panel-item[data-tab]');

  if (backBtn) {
    backBtn.onclick = () => {
      // If we have history, go back; otherwise go to the home/dashboard landing page
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '../Dashboard/dashboard.html';
      }
    };
  }

  // CHECK FOR STEPS FLAG
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('showSteps') === 'true' && token) {
    showInstallationSteps(token);
  }

  function showInstallationSteps(activeToken) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(3, 10, 31, 0.9); display: flex; align-items: center; justify-content: center; z-index: 10000;
        color: white; font-family: 'Inter', sans-serif; backdrop-filter: blur(10px);
    `;
    modal.innerHTML = `
        <div style="background: #050b1b; padding: 40px; border-radius: 24px; max-width: 550px; border: 1px solid rgba(6, 182, 212, 0.4); text-align: center; box-shadow: 0 0 60px rgba(6, 182, 212, 0.2);">
            <div style="width: 70px; height: 70px; background: rgba(6, 182, 212, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; border: 1px solid rgba(6, 182, 212, 0.3);">
                <i data-lucide="shield-check" style="color: #06b6d4; width: 35px; height: 35px;"></i>
            </div>
            <h2 style="color: #f3f4f6; margin-bottom: 15px; font-size: 28px; font-weight: 700;">Final Step: Connect Extension</h2>
            <p style="margin-bottom: 30px; color: #9ca3af; font-size: 16px;">Welcome! Open your extension and use this token to enable protection:</p>
            
            <div style="margin-bottom: 25px;">
                <div style="display: flex; align-items: center; justify-content: space-between; background: #0f172a; padding: 12px 16px; border-radius: 10px; border: 1px solid rgba(6, 182, 212, 0.2); font-family: 'Fira Code', monospace; position: relative;">
                    <span id="tokenDisplay" style="color: #06b6d4; word-break: break-all; text-align: left; padding-right: 12px; font-size: 11px; cursor: pointer; transition: all 0.2s;" title="Click to reveal full token">${activeToken.length > 20 ? activeToken.substring(0, 8) + '<span style="color: #475569; margin: 0 2px;">••••••</span>' + activeToken.substring(activeToken.length - 8) : activeToken}</span>
                    <button id="copyTokenBtn" style="background: #06b6d4; color: #030a1f; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 11px; transition: all 0.2s; flex-shrink: 0;">COPY</button>
                </div>
            </div>

            <div style="text-align: left; background: rgba(30, 41, 59, 0.4); padding: 25px; border-radius: 16px; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.03);">
                <p style="color: #f3f4f6; font-weight: 600; margin-bottom: 15px; font-size: 15px;">How to install:</p>
                <ul style="color: #9ca3af; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                    <li>Open <b>chrome://extensions</b> in a new tab</li>
                    <li>Enable <b>Developer mode</b></li>
                    <li style="margin-bottom: 10px;">Download the extension:
                        <a href="../PhishEye-Extension.zip" download="PhishEye-Extension.zip" style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; text-decoration: none; margin-left: 6px; box-shadow: 0 4px 12px rgba(34,197,94,0.3); transition: all 0.25s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 20px rgba(34,197,94,0.4)'" onmouseout="this.style.transform='';this.style.boxShadow='0 4px 12px rgba(34,197,94,0.3)'">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download
                        </a>
                    </li>
                    <li>Click <b>Load unpacked</b> and select the downloaded Extension folder</li>
                </ul>
            </div>

            <button id="closeModalBtn" style="width: 100%; background: linear-gradient(135deg, #06b6d4, #0e7490); color: white; border: none; padding: 16px; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 16px; transition: all 0.3s; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);">I've Added the Extension</button>
        </div>
    `;
    document.body.appendChild(modal);
    lucide.createIcons();

    const copyBtn = document.getElementById('copyTokenBtn');
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(activeToken);
      copyBtn.textContent = "COPIED!";
      copyBtn.style.background = "#22c55e";
      setTimeout(() => {
        copyBtn.textContent = "COPY";
        copyBtn.style.background = "#06b6d4";
      }, 2000);
    };

    // Token reveal toggle
    const tokenDisplay = document.getElementById('tokenDisplay');
    let tokenRevealed = false;
    tokenDisplay.onclick = () => {
      tokenRevealed = !tokenRevealed;
      if (tokenRevealed) {
        tokenDisplay.textContent = activeToken;
        tokenDisplay.title = 'Click to hide token';
      } else {
        tokenDisplay.innerHTML = activeToken.length > 20 ? activeToken.substring(0, 8) + '<span style="color: #475569; margin: 0 2px;">••••••</span>' + activeToken.substring(activeToken.length - 8) : activeToken;
        tokenDisplay.title = 'Click to reveal full token';
      }
    };

    document.getElementById('closeModalBtn').onclick = () => {
      modal.remove();
      // Remove query param from URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
    };
  }

  // Toggle Nav Panel
  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navPanel.classList.toggle('hidden');
  });

  // Close Panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!navPanel.contains(e.target) && !userMenuBtn.contains(e.target)) {
      navPanel.classList.add('hidden');
    }
  });

  // Tab Switching Logic
  panelItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      // Special handling for history tab - redirect to history page
      if (targetTab === 'history') {
        window.location.href = '../History/history.html';
        return;
      }

      // Special handling for settings tab - redirect to settings page
      if (targetTab === 'settings') {
        window.location.href = '../setting/settings.html';
        return;
      }

      // Special handling for quick scan - redirect to quick scan page
      if (targetTab === 'quickscan') {
        window.location.href = '../QuickScan/quickscan.html';
        return;
      }

      // Special handling for about - redirect to about page
      if (targetTab === 'about') {
        window.location.href = '../about/about.html';
        return;
      }

      // Close panel after selection
      navPanel.classList.add('hidden');
    });
  });

  // Logout Button
  const logoutBtn = document.querySelector('.logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        window.location.href = '../login-page/login.html';
      }
    });
  }

  // Fetch Real Dashboard Stats
  if (token) {
    fetch('http://localhost:5000/api/history', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(response => response.json())
      .then(data => {
        const history = data.history;
        updateDashboardStats(history);
        updateDashboardChart(history);
      })
      .catch(err => console.error('Failed to load dashboard data:', err));
  }

  function updateDashboardStats(history) {
    if (history.length === 0) return;

    const total = history.length;
    const safe = history.filter(h => h.result === 'Safe').length;
    const suspicious = history.filter(h => h.result === 'Suspicious').length;
    const malicious = history.filter(h => h.result === 'Malicious' || h.result === 'Unsafe').length;

    const elDomain = document.getElementById('stat-domain');
    const elSafe = document.getElementById('stat-safe');
    const elSusp = document.getElementById('stat-susp');
    const elMalw = document.getElementById('stat-malw');

    if (elDomain) {
      try {
        const urlObj = new URL(history[0].url);
        elDomain.textContent = urlObj.hostname;
      } catch (e) {
        elDomain.textContent = history[0].url.substring(0, 20) + '...';
      }
    }

    if (total > 0) {
      if (elSafe) elSafe.textContent = Math.round((safe / total) * 100) + '%';
      if (elSusp) elSusp.textContent = Math.round((suspicious / total) * 100) + '%';
      if (elMalw) elMalw.textContent = Math.round((malicious / total) * 100) + '%';
    }
  }

  function updateDashboardChart(history) {
    const container = document.getElementById('latestScanContainer');
    if (!container) return;

    if (history.length === 0) {
      container.innerHTML = '<p class="text-muted" style="margin-left: 20px;">No scans performed yet.</p>';
      return;
    }

    // Grab the most recent scan
    const latest = history[0];
    const isSafe = latest.result === 'Safe';
    const type = isSafe ? 'safe' : (latest.result === 'Suspicious' ? 'suspicious' : 'malicious');
    const risk = isSafe ? 10 : (latest.result === 'Suspicious' ? 65 : 98);
    const time = new Date(latest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Render it in a big hero card format (similar to history cards)
    container.innerHTML = `
      <article class="history-card ${type}">
        <div class="row">
          <span class="url" style="font-size: 1.4rem;" title="${latest.url}">${latest.url}</span>
          <span class="badge ${type}" style="font-size: 1rem; padding: 8px 18px;">${latest.result}</span>
        </div>
        <p class="subtitle" style="font-size: 1.1rem; margin-top: 10px;">Scanned via PhishEye AI Engine • Latest Scan</p>
        <div class="meta" style="font-size: 1rem; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
          <span>Risk Score <strong>${risk}%</strong></span>
          <span>Time: <strong>${time}</strong></span>
        </div>
      </article>
    `;
  }
});
