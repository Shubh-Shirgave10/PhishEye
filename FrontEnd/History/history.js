document.addEventListener('DOMContentLoaded', () => {
  // --- AUTH GUARD ---
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../login-page/login.html';
    return;
  }

  // --- STATE ---
  let timelineLimit = 10;
  let fullHistoryCache = [];

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

  // Navigation Panel Toggle
  const backBtn = document.getElementById('backBtn');
  const userMenuBtn = document.getElementById('userMenuBtn');
  const navPanel = document.getElementById('navPanel');
  const panelItems = document.querySelectorAll('.panel-item[data-tab]');

  if (backBtn) {
    backBtn.onclick = () => {
      if (window.history.length > 1) window.history.back();
      else window.location.href = '../Dashboard/dashboard.html';
    };
  }

  // Toggle Nav Panel
  if (userMenuBtn) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navPanel.classList.toggle('hidden');
    });
  }

  // Close Panel when clicking outside
  document.addEventListener('click', (e) => {
    if (navPanel && !navPanel.contains(e.target) && userMenuBtn && !userMenuBtn.contains(e.target)) {
      navPanel.classList.add('hidden');
    }
  });

  // Navigation routing
  panelItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      if (targetTab === 'dashboard') {
        window.location.href = '../Main_Dash/mainDash.html';
      } else if (targetTab === 'history') {
        // Already on history page, just close panel
        navPanel.classList.add('hidden');
      } else if (targetTab === 'settings') {
        window.location.href = '../setting/settings.html';
      } else if (targetTab === 'quickscan') {
        window.location.href = '../QuickScan/quickscan.html';
      } else if (targetTab === 'about') {
        window.location.href = '../about/about.html';
      }
    });
  });

  // Show More Implementation
  const showMoreBtn = document.getElementById('showMoreBtn');
  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', () => {
      timelineLimit += 10;
      renderTimeline(fullHistoryCache);
    });
  }

  // Logout button
  const logoutBtn = document.querySelector('.panel-item.logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../login-page/login.html';
      }
    });
  }

  // --- EXPORT FUNCTION ---
  const exportBtn = document.querySelector('.cta');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (fullHistoryCache.length === 0) {
        alert("No history to export.");
        return;
      }

      const headers = ["URL", "Result", "Scanned At"];
      const csvContent = [
        headers.join(","),
        ...fullHistoryCache.map(item => `"${item.url}",${item.result},"${new Date(item.created_at).toLocaleString()}"`)
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `PhishEye_Security_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  // Fetch and Populate History Data
  function loadHistory() {
    if (token) {
      fetch('http://localhost:5000/api/history', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
        .then(response => response.json())
        .then(data => {
          const history = data.history;
          fullHistoryCache = history; // Cache for Show More
          updateStats(history);
          updateChart(history);
          renderRecent(history);
          renderTimeline(history);

          // Update Sync Info
          const summaryCard = document.querySelector('.summary-card');
          if (summaryCard) {
            const malCount = history.filter(h => h.result === 'Malicious' || h.result === 'Unsafe').length;
            const susCount = history.filter(h => h.result === 'Suspicious').length;
            summaryCard.innerHTML = `
              <p>Last Sync: <strong>Just Now</strong></p>
              <p>${history.length} total URLs scanned • ${malCount} threats blocked • ${susCount} suspicious</p>
            `;
          }
        })
        .catch(err => console.error('Failed to load history:', err));
    }
  }

  // Initial load
  loadHistory();

  // Polling for reactivity (every 5 seconds)
  const pollInterval = setInterval(() => {
    if (!document.hidden) {
      loadHistory();
    }
  }, 5000);

  // Clear interval on page unload
  window.addEventListener('beforeunload', () => clearInterval(pollInterval));

  function updateStats(history) {
    const total = history.length;
    const safe = history.filter(h => h.result === 'Safe').length;
    const malicious = history.filter(h => h.result === 'Malicious' || h.result === 'Unsafe').length;
    const suspicious = history.filter(h => h.result === 'Suspicious').length;

    document.querySelector('.analytics-card.total strong').textContent = total;
    document.querySelector('.analytics-card.safe strong').textContent = safe;
    document.querySelector('.analytics-card.malicious strong').textContent = malicious + suspicious;
  }

  function renderRecent(history) {
    const container = document.querySelector('.top-cards');
    if (!container) return;

    if (history.length === 0) {
      container.innerHTML = '<p class="text-muted">No scan history available yet.</p>';
      return;
    }

    container.innerHTML = '';

    // Show top 3
    history.slice(0, 3).forEach(item => {
      const type = item.result === 'Safe' ? 'safe' : 'malicious';
      const risk = item.result === 'Safe' ? 10 : 90;
      const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const html = `
      <article class="history-card ${type}">
        <div class="row">
          <span class="url" title="${item.url}">${item.url}</span>
          <span class="badge ${type}">${item.result}</span>
        </div>
        <p class="subtitle">Scanned via PhishEye Extension</p>
        <div class="meta">
          <span>Risk Score <strong>${risk}%</strong></span>
          <span>${time}</span>
        </div>
        <button class="ghost-btn" onclick="viewDetailedReport('${item.url}', '${item.result}', '${time}')">View Report</button>
      </article>`;
      container.insertAdjacentHTML('beforeend', html);
    });
  }

  // Global scope for onclick
  window.viewDetailedReport = (url, result, time) => {
    const isSafe = result === 'Safe';
    const msg = `
PHISHEYE SECURITY REPORT
---------------------------
Target: ${url}
Evaluation: ${result.toUpperCase()}
Timestamp: Today, ${time}
Risk Level: ${isSafe ? 'Low (10%)' : 'Critical (98%)'}
    
Description: Our AI engine analyzed the target URL for structural anomalies and behavioral threat signatures. No further action is required for safe sites. Avoid entering credentials on unsafe sites.
    `;
    alert(msg);
  };

  function renderTimeline(history) {
    const container = document.querySelector('.timeline-premium');
    if (!container) return;
    container.innerHTML = '';

    const items = history.slice(0, timelineLimit);
    items.forEach(item => {
      const type = item.result === 'Safe' ? 'safe' : 'malicious';
      const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const html = `
          <div class="timeline-item ${type}">
            <span class="dot"></span>
            <div>
              <p title="${item.url}">${item.url}</p>
              <small>${item.result} • ${time}</small>
            </div>
          </div>`;
      container.insertAdjacentHTML('beforeend', html);
    });

    // Toggle Show More visibility
    const showMoreWrapper = document.getElementById('showMoreContainer');
    if (showMoreWrapper) {
      showMoreWrapper.style.display = history.length > timelineLimit ? 'flex' : 'none';
    }
  }

  let securityChartInstance = null;

  function updateChart(history) {
    const safe = history.filter(h => h.result === 'Safe').length;
    const unsafe = history.filter(h => h.result === 'Malicious' || h.result === 'Unsafe' || h.result === 'Suspicious').length;

    const canvas = document.getElementById("securityChart");
    const ctx = canvas.getContext("2d");

    // Gradients (re-defined inside or reuse)
    const gradientSafe = ctx.createRadialGradient(140, 140, 10, 140, 140, 140);
    gradientSafe.addColorStop(0, "#4ade80");
    gradientSafe.addColorStop(1, "#15803d");

    const gradientMalicious = ctx.createRadialGradient(140, 140, 10, 140, 140, 140);
    gradientMalicious.addColorStop(0, "#fb7185");
    gradientMalicious.addColorStop(1, "#b91c1c");

    if (securityChartInstance) {
      securityChartInstance.destroy();
    }

    securityChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Safe", "Unsafe"],
        datasets: [
          {
            label: "Scans",
            data: [safe, unsafe],
            backgroundColor: [gradientSafe, gradientMalicious],
            borderColor: "rgba(14, 165, 233, 0.45)",
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1400, easing: "easeOutQuint" },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(3, 10, 31, 0.9)",
            titleColor: "#e0f2ff",
            bodyColor: "#c9dcff",
            borderColor: "rgba(14, 165, 233, 0.45)",
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
          },
        },
        scales: {
          x: {
            grid: { display: false, drawBorder: false },
            ticks: { color: '#9ca3af', font: { size: 12 } },
            beginAtZero: true
          },
          y: {
            grid: { color: '#1f2937', borderDash: [5, 5] },
            ticks: { color: '#9ca3af', font: { size: 14 } }
          }
        }
      },
    });
  }
});
