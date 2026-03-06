// settings.js

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // --- Navigation Panel Logic (Global) ---
  const backBtn = document.getElementById('backBtn');
  const userMenuBtn = document.getElementById('userMenuBtn');
  const navPanel = document.getElementById('navPanel');
  const panelItems = document.querySelectorAll('.panel-item');

  if (backBtn) {
    backBtn.onclick = (e) => {
      e.preventDefault();
      window.location.href = '../Dashboard/dashboard.html';
    };
  }

  // Toggle Nav Panel
  if (userMenuBtn && navPanel) {
    userMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navPanel.classList.toggle("hidden");
    });

    // Close Panel on outside click
    document.addEventListener("click", (e) => {
      if (!navPanel.contains(e.target) && !userMenuBtn.contains(e.target)) {
        navPanel.classList.add("hidden");
      }
    });
  }

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

  // Navigation routing
  panelItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      if (targetTab === 'dashboard') {
        window.location.href = '../Main_Dash/mainDash.html';
      } else if (targetTab === 'history') {
        window.location.href = '../History/history.html';
      } else if (targetTab === 'settings') {
        navPanel.classList.add('hidden');
      } else if (targetTab === 'quickscan') {
        window.location.href = '../QuickScan/quickscan.html';
      } else if (targetTab === 'about') {
        window.location.href = '../about/about.html';
      }
    });
  });

  // Logout button
  const logoutBtn = document.querySelector('.panel-item.logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../login-page/login.html';
      }
    });
  }

  // --- Settings Page Specific Logic ---
  initSettingsNavigation();
  loadSettings();
  initControls();
});

/* ---------- Settings Sidebar Navigation ---------- */
function initSettingsNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.settings-section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');

      // Update Sidebar Active State
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show Target Section
      sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetId) {
          section.classList.add('active');
        }
      });

    });
  });
}

/* ---------- Load / Save Settings ---------- */
const defaults = {
  theme: 'dark',
  neonGlow: true,
  accent: '#22d3ee',
  autoScanOnLoad: false,
  deepScanMode: 'standard',
  autoBlock: false,
  saveHistory: true,
  historyTTL: 7,
  enableNotif: true,
  dailySummary: false,
  sessionTimeout: 60
};

let settings = {};

function loadSettings() {
  try {
    const raw = localStorage.getItem('phisheye_settings');
    settings = raw ? JSON.parse(raw) : { ...defaults };
  } catch (e) {
    settings = { ...defaults };
  }
  applySettingsToUI();
  applyTheme();
}

function saveSettings() {
  localStorage.setItem('phisheye_settings', JSON.stringify(settings));
}

/* ---------- Apply settings to UI ---------- */
function applySettingsToUI() {
  // Theme
  const themeRadio = document.querySelector(`input[name="theme"][value="${settings.theme}"]`);
  if (themeRadio) themeRadio.checked = true;

  // Neon Glow
  const neonCheck = document.getElementById('neonGlow');
  if (neonCheck) neonCheck.checked = !!settings.neonGlow;

  // Accent
  applyAccent(settings.accent || '#22d3ee');
  // Also update the picker UI
  document.querySelectorAll('.accent-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === settings.accent);
  });

  // Scan Preferences
  if (document.getElementById('autoScanOnLoad')) document.getElementById('autoScanOnLoad').checked = !!settings.autoScanOnLoad;
  if (document.getElementById('deepScanMode')) document.getElementById('deepScanMode').value = settings.deepScanMode;
  if (document.getElementById('autoBlock')) document.getElementById('autoBlock').checked = !!settings.autoBlock;

  // Privacy
  if (document.getElementById('saveHistory')) document.getElementById('saveHistory').checked = !!settings.saveHistory;
  if (document.getElementById('historyTTL')) document.getElementById('historyTTL').value = settings.historyTTL;

  // Notifications
  if (document.getElementById('enableNotif')) document.getElementById('enableNotif').checked = !!settings.enableNotif;
  if (document.getElementById('dailySummary')) document.getElementById('dailySummary').checked = !!settings.dailySummary;

  // Security
  if (document.getElementById('sessionTimeout')) document.getElementById('sessionTimeout').value = settings.sessionTimeout;
}

/* ---------- Apply accent colour across all CSS variables ---------- */
function applyAccent(color) {
  // Derive shades using simple brightness shifts for lighter/darker variants
  const root = document.documentElement;

  // Main accent variables
  root.style.setProperty('--cyan-400', color);
  root.style.setProperty('--cyan-500', color);
  root.style.setProperty('--cyan-600', shiftColor(color, -30));

  // Glow / shadow colours
  root.style.setProperty('--accent-glow', hexToRgba(color, 0.4));

  // Also update the navbar inline colour used in mainDash
  root.style.setProperty('--accent', color);

  // Override the hardcoded cyan glow in logo, etc.
  const style = document.getElementById('__accent_override__') || (() => {
    const s = document.createElement('style');
    s.id = '__accent_override__';
    document.head.appendChild(s);
    return s;
  })();

  style.textContent = `
    .logo-icon { border-color: ${color} !important; color: ${color} !important;
      box-shadow: 0 0 20px ${hexToRgba(color, 0.5)} !important; }
    .brand-name { color: ${color} !important; text-shadow: 0 0 10px ${hexToRgba(color, 0.3)} !important; }
    .user-avatar { background: ${color} !important; box-shadow: 0 0 15px ${hexToRgba(color, 0.6)} !important; }
    .status-badge { color: ${color} !important; border-color: ${hexToRgba(color, 0.3)} !important;
      background: ${hexToRgba(color, 0.15)} !important; box-shadow: 0 0 15px ${hexToRgba(color, 0.2)} !important; }
    .pulse-dot { background-color: ${color} !important; box-shadow: 0 0 10px ${color} !important; }
    .back-btn { border-color: ${hexToRgba(color, 0.3)} !important; color: ${color} !important; }
    .back-btn:hover { box-shadow: 0 0 15px ${hexToRgba(color, 0.4)} !important;
      border-color: ${hexToRgba(color, 0.6)} !important; }
    .panel-item.active { color: ${color} !important; border-left-color: ${color} !important;
      box-shadow: -10px 0 20px -10px ${hexToRgba(color, 0.5)} !important; }
    .nav-btn.active { color: ${color} !important; border-left-color: ${color} !important; }
    .text-cyan { color: ${color} !important; }
    .stat-card::before { background: linear-gradient(90deg, ${color}, ${shiftColor(color, 20)}) !important; }
    .stat-card:hover { border-color: ${hexToRgba(color, 0.4)} !important;
      box-shadow: 0 20px 25px -5px ${hexToRgba(color, 0.3)} !important; }
    input:checked + .slider { background-color: ${color} !important; }
    .btn-outline { border-color: ${hexToRgba(color, 0.3)} !important; color: ${color} !important; }
    .chart-section { border-color: ${hexToRgba(color, 0.2)} !important; }
    .chart-side-info { border-color: ${hexToRgba(color, 0.15)} !important; }
    .panel-user-avatar { background: linear-gradient(135deg, ${shiftColor(color, -15)}, ${color}) !important; }
    .panel-header { background: linear-gradient(135deg, ${hexToRgba(color, 0.1)}, ${hexToRgba(color, 0.05)}) !important;
      border-bottom-color: ${hexToRgba(color, 0.2)} !important; }
    .top-bar { border-bottom-color: ${hexToRgba(color, 0.2)} !important; }
    .nav-panel { border-color: ${hexToRgba(color, 0.2)} !important; }
    .settings-sidebar { border-color: ${hexToRgba(color, 0.2)} !important; }
    .icon-ring { border-color: ${hexToRgba(color, 0.5)} !important;
      box-shadow: 0 0 18px ${hexToRgba(color, 0.4)} !important; }
    .cta { background: linear-gradient(135deg, ${color}, ${shiftColor(color, 30)}) !important; }
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px ${hexToRgba(color, 0.5)}; }
      50% { box-shadow: 0 0 30px ${hexToRgba(color, 0.8)}; }
    }
  `;
}

/* Helper: convert hex to rgba */
function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* Helper: lighten (+) or darken (-) a hex color by amount */
function shiftColor(hex, amount) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  let r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) + amount));
  let g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) + amount));
  let b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) + amount));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/* ---------- Apply theme (update DOM/CSS) ---------- */
function applyTheme() {
  const theme = settings.theme || 'dark';
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

/* ---------- Read UI into settings ---------- */
function readUIToSettings() {
  const themeEl = document.querySelector('input[name="theme"]:checked');
  if (themeEl) settings.theme = themeEl.value;

  const neonEl = document.getElementById('neonGlow');
  if (neonEl) settings.neonGlow = neonEl.checked;

  // Accent is handled by click listener directly

  const autoScanEl = document.getElementById('autoScanOnLoad');
  if (autoScanEl) settings.autoScanOnLoad = autoScanEl.checked;

  const deepScanEl = document.getElementById('deepScanMode');
  if (deepScanEl) settings.deepScanMode = deepScanEl.value;

  const autoBlockEl = document.getElementById('autoBlock');
  if (autoBlockEl) settings.autoBlock = autoBlockEl.checked;

  const saveHistEl = document.getElementById('saveHistory');
  if (saveHistEl) settings.saveHistory = saveHistEl.checked;

  const ttlEl = document.getElementById('historyTTL');
  if (ttlEl) settings.historyTTL = Number(ttlEl.value);

  const notifEl = document.getElementById('enableNotif');
  if (notifEl) settings.enableNotif = notifEl.checked;

  const dailyEl = document.getElementById('dailySummary');
  if (dailyEl) settings.dailySummary = dailyEl.checked;

  const sessionEl = document.getElementById('sessionTimeout');
  if (sessionEl) settings.sessionTimeout = Number(sessionEl.value);
}

/* ---------- Wire up controls ---------- */
function initControls() {
  // Wire up dummy buttons for settings to make them "workable"
  const setup2fa = document.getElementById('setup2fa');
  if (setup2fa) setup2fa.onclick = () => alert('2FA Setup: A verification email has been sent to your registered address.');

  const manageDevices = document.getElementById('manageDevices');
  if (manageDevices) manageDevices.onclick = () => alert('Manage Devices: No unfamiliar devices detected on your account.');

  const exportData = document.getElementById('exportData');
  if (exportData) exportData.onclick = () => alert('Export Data: Your scan history JSON is being generated for download.');
  // Accent Picker
  const palette = document.getElementById('accentPalette');
  if (palette) {
    palette.addEventListener('click', (e) => {
      const btn = e.target.closest('.accent-btn');
      if (!btn) return;

      // UI Update
      document.querySelectorAll('.accent-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Apply & persist immediately
      const color = btn.dataset.color;
      settings.accent = color;
      applyAccent(color);
      saveSettings();
    });
  }

  // Live theme switching — instant preview
  document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener('change', () => {
      settings.theme = radio.value;
      applyTheme();
      saveSettings(); // persist immediately so other pages pick it up
    });
  });

  // Save Button
  const saveBtn = document.getElementById('saveSettings');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      readUIToSettings();
      saveSettings();
      alert('Settings saved successfully!');
    });
  }

  // Reset Defaults
  const resetBtn = document.getElementById('resetDefaults');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all settings to default?')) {
        settings = { ...defaults };
        applySettingsToUI();
        saveSettings();
      }
    });
  }

  // Delete Account
  const delBtn = document.getElementById('deleteAccount');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      if (confirm('Are you sure? This will delete all your data permanently.')) {
        localStorage.clear();
        alert('Account deleted.');
        window.location.reload();
      }
    });
  }

}
