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
  const userMenuBtn = document.getElementById('userMenuBtn');
  const navPanel = document.getElementById('navPanel');
  const panelItems = document.querySelectorAll('.panel-item[data-tab]');

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
            
            <div style="margin-bottom: 35px;">
                <div style="display: flex; align-items: center; justify-content: space-between; background: #0f172a; padding: 18px 24px; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.2); font-family: 'Fira Code', monospace; position: relative;">
                    <span id="tokenDisplay" style="color: #06b6d4; word-break: break-all; text-align: left; padding-right: 20px; font-size: 14px;">${activeToken}</span>
                    <button id="copyTokenBtn" style="background: #06b6d4; color: #030a1f; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 12px; transition: all 0.2s; flex-shrink: 0;">COPY</button>
                </div>
            </div>

            <div style="text-align: left; background: rgba(30, 41, 59, 0.4); padding: 25px; border-radius: 16px; margin-bottom: 35px; border: 1px solid rgba(255,255,255,0.03);">
                <p style="color: #f3f4f6; font-weight: 600; margin-bottom: 15px; font-size: 15px;">How to install:</p>
                <ul style="color: #9ca3af; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                    <li>Open <b>chrome://extensions</b> in a new tab</li>
                    <li>Enable <b>Developer mode</b></li>
                    <li>Click <b>Load unpacked</b> and select the Extension folder</li>
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
    const total = history.length;
    const safe = history.filter(h => h.result === 'Safe').length;
    const malicious = history.filter(h => h.result === 'Unsafe').length;

    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
      statCards[0].querySelector('.stat-value').textContent = total;
      statCards[1].querySelector('.stat-value').textContent = safe;
      statCards[2].querySelector('.stat-value').textContent = 0; // Suspicious (placeholder 0)
      statCards[3].querySelector('.stat-value').textContent = malicious;

      // Update subtitles
      const now = new Date();
      const last24h = history.filter(h => (now - new Date(h.created_at)) < 24 * 60 * 60 * 1000).length;
      statCards[0].querySelector('.stat-subtitle').textContent = `Last 24h: ${last24h}`;
      statCards[1].querySelector('.stat-subtitle').textContent = `Verified: ${safe}`;
      statCards[2].querySelector('.stat-subtitle').textContent = `In review: 0`;
      statCards[3].querySelector('.stat-subtitle').textContent = `Blocked: ${malicious}`;
    }
  }

  let dashboardChartInstance = null;

  function updateDashboardChart(history) {
    const safe = history.filter(h => h.result === 'Safe').length;
    const malicious = history.filter(h => h.result === 'Unsafe').length;

    const ctx = document.getElementById('securityChart').getContext('2d');

    if (dashboardChartInstance) {
      dashboardChartInstance.destroy();
    }

    dashboardChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Safe', 'Suspicious', 'Malicious'],
        datasets: [{
          label: 'Detection Analysis',
          data: [safe, 0, malicious],
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: '#06b6d4',
          pointBorderColor: '#0e7490',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#f3f4f6',
            bodyColor: '#f3f4f6',
            borderColor: '#1f2937',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: function (context) {
                return `Value: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false, drawBorder: false },
            ticks: { color: '#9ca3af', font: { size: 14 } }
          },
          y: {
            grid: { color: '#1f2937', borderDash: [5, 5] },
            ticks: { color: '#9ca3af', font: { size: 14 } },
            min: 0,
            suggestedMax: 10
          }
        }
      }
    });
  }
});
