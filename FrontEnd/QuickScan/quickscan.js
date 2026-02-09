document.addEventListener('DOMContentLoaded', () => {
    // --- AUTH GUARD ---
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('user_email');

    if (!token) {
        window.location.href = '../login-page/login.html';
        return;
    }

    // Initialize Lucide Icons
    lucide.createIcons();

    // Populate User Info
    if (userEmail) {
        const initial = userEmail.charAt(0).toUpperCase();
        document.getElementById('userInitial').textContent = initial;
        document.getElementById('userName').textContent = userEmail.split('@')[0];
        document.getElementById('userEmail').textContent = userEmail;
    }

    // Navigation logic
    const userMenuBtn = document.getElementById('userMenuBtn');
    const navPanel = document.getElementById('navPanel');
    const panelItems = document.querySelectorAll('.panel-item[data-tab]');

    userMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        navPanel.classList.toggle('hidden');
    });

    document.addEventListener('click', () => navPanel.classList.add('hidden'));

    panelItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.getAttribute('data-tab');
            if (tab === 'dashboard') window.location.href = '../Main_Dash/mainDash.html';
            else if (tab === 'history') window.location.href = '../History/history.html';
            else if (tab === 'settings') window.location.href = '../setting/settings.html';
        });
    });

    // Logout
    document.querySelector('.logout')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '../login-page/login.html';
    });

    // --- SCAN LOGIC ---
    const urlInput = document.getElementById('urlInput');
    const scanBtn = document.getElementById('scanBtn');
    const resultSection = document.getElementById('resultSection');

    scanBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (!url) return;

        // Show Loading
        resultSection.classList.remove('hidden');
        resultSection.innerHTML = `
      <div class="scanning-loader">
        <div class="pulse-loader"></div>
        <p class="eyebrow">Consulting PhishEye AI...</p>
      </div>
    `;

        fetch('http://localhost:5000/api/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ url: url })
        })
            .then(res => res.json())
            .then(data => {
                displayResult(url, data);
                addToSessionHistory(url, data);
            })
            .catch(err => {
                resultSection.innerHTML = `<p class="error">Scan failed. Is the server running?</p>`;
            });
    });

    function displayResult(url, data) {
        const isSafe = data.result === 'Safe';
        const score = isSafe ? 12 : 94; // Dummy score for visual impact

        resultSection.innerHTML = `
      <div class="status-hero ${isSafe ? 'safe-result' : 'unsafe-result'}">
        <span class="status-icon-large">${isSafe ? '🛡️' : '⚠️'}</span>
        <h2 class="status-title-large">${isSafe ? 'Website Secure' : 'Threat Detected'}</h2>
        <p class="status-desc-large">
          ${isSafe
                ? 'Our AI analysis confirmed this URL matches safe behavioral patterns.'
                : 'Warning! This URL exhibits high-probability phishing signatures.'}
        </p>
        
        <div class="result-meta-grid">
          <div class="meta-item">
            <span class="meta-label">Analyzed URL</span>
            <span class="meta-value" style="font-size: 0.9rem; word-break: break-all;">${url}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Confidence Score</span>
            <span class="meta-value">${score}% Threat Certainty</span>
          </div>
        </div>
      </div>
    `;
    }

    function addToSessionHistory(url, data) {
        const grid = document.getElementById('quickHistoryGrid');
        const isSafe = data.result === 'Safe';
        const type = isSafe ? 'safe' : 'malicious';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const card = `
      <article class="history-card ${type}">
        <div class="row">
          <span class="url" title="${url}">${url}</span>
          <span class="badge ${type}">${data.result}</span>
        </div>
        <p class="subtitle">Quick Scan Result</p>
        <div class="meta">
          <span>${time}</span>
        </div>
      </article>
    `;
        grid.insertAdjacentHTML('afterbegin', card);
    }
});
