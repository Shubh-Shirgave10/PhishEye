// theme.js — runs on every page to apply the saved theme + accent instantly
(function () {
    try {
        var raw = localStorage.getItem('phisheye_settings');
        if (!raw) return;
        var s = JSON.parse(raw);

        // ---- Theme ----
        if (s.theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        // ---- Accent colour ----
        var color = s.accent;
        if (!color) return;

        // Set CSS variables
        var root = document.documentElement;
        root.style.setProperty('--cyan-400', color);
        root.style.setProperty('--cyan-500', color);
        root.style.setProperty('--accent', color);
        root.style.setProperty('--accent-glow', hexToRgba(color, 0.4));

        // Helper: hex → rgba
        function hexToRgba(hex, alpha) {
            hex = hex.replace('#', '');
            if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
            var r = parseInt(hex.substring(0, 2), 16);
            var g = parseInt(hex.substring(2, 4), 16);
            var b = parseInt(hex.substring(4, 6), 16);
            return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
        }

        // Helper: shift brightness
        function shiftColor(hex, amount) {
            hex = hex.replace('#', '');
            if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
            var r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) + amount));
            var g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) + amount));
            var b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) + amount));
            return '#' + [r, g, b].map(function (v) { return v.toString(16).padStart(2, '0'); }).join('');
        }

        // Inject a <style> tag that overrides all hardcoded accent elements
        var style = document.createElement('style');
        style.id = '__accent_override__';
        style.textContent = [
            '.logo-icon { border-color: ' + color + ' !important; color: ' + color + ' !important; box-shadow: 0 0 20px ' + hexToRgba(color, 0.5) + ' !important; }',
            '.brand-name { color: ' + color + ' !important; -webkit-text-fill-color: ' + color + ' !important; text-shadow: 0 0 10px ' + hexToRgba(color, 0.3) + ' !important; background: none !important; }',
            '.user-avatar { background: ' + color + ' !important; box-shadow: 0 0 15px ' + hexToRgba(color, 0.6) + ' !important; }',
            '.status-badge { color: ' + color + ' !important; border-color: ' + hexToRgba(color, 0.3) + ' !important; background: ' + hexToRgba(color, 0.15) + ' !important; box-shadow: 0 0 15px ' + hexToRgba(color, 0.2) + ' !important; }',
            '.pulse-dot { background-color: ' + color + ' !important; box-shadow: 0 0 10px ' + color + ' !important; }',
            '.back-btn { border-color: ' + hexToRgba(color, 0.3) + ' !important; color: ' + color + ' !important; }',
            '.back-btn:hover { box-shadow: 0 0 15px ' + hexToRgba(color, 0.4) + ' !important; border-color: ' + hexToRgba(color, 0.6) + ' !important; }',
            '.panel-item.active { color: ' + color + ' !important; border-left-color: ' + color + ' !important; box-shadow: -10px 0 20px -10px ' + hexToRgba(color, 0.5) + ' !important; }',
            '.nav-btn.active { color: ' + color + ' !important; border-left-color: ' + color + ' !important; }',
            '.text-cyan { color: ' + color + ' !important; }',
            '.stat-card::before { background: linear-gradient(90deg, ' + color + ', ' + shiftColor(color, 20) + ') !important; }',
            '.stat-card:hover { border-color: ' + hexToRgba(color, 0.4) + ' !important; box-shadow: 0 20px 25px -5px ' + hexToRgba(color, 0.3) + ' !important; }',
            'input:checked + .slider { background-color: ' + color + ' !important; }',
            '.btn-outline { border-color: ' + hexToRgba(color, 0.3) + ' !important; color: ' + color + ' !important; }',
            '.chart-section { border-color: ' + hexToRgba(color, 0.2) + ' !important; }',
            '.chart-side-info { border-color: ' + hexToRgba(color, 0.15) + ' !important; }',
            '.panel-user-avatar { background: linear-gradient(135deg, ' + shiftColor(color, -15) + ', ' + color + ') !important; }',
            '.panel-header { background: linear-gradient(135deg, ' + hexToRgba(color, 0.1) + ', ' + hexToRgba(color, 0.05) + ') !important; border-bottom-color: ' + hexToRgba(color, 0.2) + ' !important; }',
            '.top-bar { border-bottom-color: ' + hexToRgba(color, 0.2) + ' !important; }',
            '.nav-panel { border-color: ' + hexToRgba(color, 0.2) + ' !important; }',
            '.settings-sidebar { border-color: ' + hexToRgba(color, 0.2) + ' !important; }',
            '.icon-ring { border-color: ' + hexToRgba(color, 0.5) + ' !important; box-shadow: 0 0 18px ' + hexToRgba(color, 0.4) + ' !important; }',
            '.cta { background: linear-gradient(135deg, ' + color + ', ' + shiftColor(color, 30) + ') !important; }',
            '.primary-scan-btn { background: linear-gradient(135deg, ' + color + ', ' + shiftColor(color, 30) + ') !important; }',
            '.nav-btn.active { background: linear-gradient(90deg, ' + hexToRgba(color, 0.15) + ', ' + hexToRgba(color, 0.05) + ') !important; }',
            '.theme-option input:checked + .theme-box { border-color: ' + color + ' !important; color: ' + color + ' !important; background: ' + hexToRgba(color, 0.08) + ' !important; }',
            '.accent-btn.active { box-shadow: 0 0 0 2px ' + color + ' !important; }',
        ].join('\n');

        // Append before body loads so no flash
        (document.head || document.documentElement).appendChild(style);

    } catch (e) { /* ignore */ }
})();
