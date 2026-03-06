chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "SHOW_POPUP") {
        const statusRaw = request.status || "Safe";
        const status = String(statusRaw).toLowerCase();

        // For suspicious → show big fullscreen warning
        if (status === "suspicious") {
            showSuspiciousWarning();
        } else {
            // For safe & malicious/unsafe → show small toast popup
            showToast(status);
        }
    }
});

// ============================================
// SMALL TOAST POPUP (Safe / Malicious / Unsafe)
// ============================================
function showToast(status) {
    // Clear any existing toasts
    const existing = document.getElementById('phisheye-toast');
    if (existing) existing.remove();

    let bgColor, textColor, borderColor, icon, title, desc, glowColor;

    if (status === 'safe') {
        bgColor = 'rgba(2, 6, 23, 0.92)';
        textColor = '#22d3ee';
        borderColor = 'rgba(34, 211, 238, 0.4)';
        glowColor = 'rgba(34, 211, 238, 0.15)';
        icon = '🛡️';
        title = 'PhishEye Secure';
        desc = 'This website is verified and safe.';
    } else {
        bgColor = 'rgba(2, 6, 23, 0.92)';
        textColor = '#f87171';
        borderColor = 'rgba(248, 113, 113, 0.4)';
        glowColor = 'rgba(248, 113, 113, 0.15)';
        icon = '🚨';
        title = 'Threat Detected';
        desc = 'Malicious patterns detected! Be careful.';
    }

    const div = document.createElement('div');
    div.id = 'phisheye-toast';
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483647;
        width: 340px;
        padding: 16px 20px;
        background: ${bgColor};
        color: white;
        border: 1px solid ${borderColor};
        border-radius: 16px;
        box-shadow: 0 8px 32px ${glowColor}, 0 0 60px ${glowColor}, 0 0 2px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 14px;
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        backdrop-filter: blur(16px);
        animation: phisheye-slideIn 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: auto;
        cursor: pointer;
        transition: all 0.3s ease;
    `;

    // Inject animation styles
    injectToastStyles();

    div.innerHTML = `
        <div style="
            width: 42px; height: 42px; min-width: 42px;
            background: ${borderColor};
            border-radius: 12px; display: flex; align-items: center; justify-content: center;
            font-size: 22px; filter: drop-shadow(0 0 8px ${textColor});
        ">${icon}</div>
        <div style="flex-grow: 1; min-width: 0;">
            <div style="
                font-weight: 700; color: ${textColor}; font-size: 14px;
                letter-spacing: 0.2px; display: flex; align-items: center; gap: 8px;
                margin-bottom: 3px;
            ">
                ${title}
                <span style="
                    font-size: 9px; font-weight: 700; background: ${textColor}18;
                    padding: 2px 7px; border-radius: 6px; border: 1px solid ${textColor}33;
                    color: ${textColor}; letter-spacing: 0.5px;
                ">LIVE</span>
            </div>
            <div style="font-size: 12px; color: #94a3b8; line-height: 1.4;">${desc}</div>
        </div>
        <div style="
            width: 24px; height: 24px; min-width: 24px; display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: #475569; font-size: 18px; border-radius: 6px;
            transition: all 0.2s;
        " id="phisheye-toast-close">✕</div>
    `;

    document.body.appendChild(div);

    // Close on click
    div.querySelector('#phisheye-toast-close').onclick = (e) => {
        e.stopPropagation();
        div.style.animation = 'phisheye-fadeOut 0.35s ease-in forwards';
        setTimeout(() => div.remove(), 350);
    };

    // Auto-disappear after 4 seconds
    setTimeout(() => {
        if (div && div.parentNode) {
            div.style.animation = 'phisheye-fadeOut 0.5s ease-in forwards';
            setTimeout(() => div.remove(), 500);
        }
    }, 4000);
}

// ============================================
// BIG FULLSCREEN WARNING (Suspicious)
// ============================================
function showSuspiciousWarning() {
    // Remove existing warning if any
    const existing = document.getElementById('phisheye-warning-overlay');
    if (existing) existing.remove();

    // Inject animation styles
    injectWarningStyles();

    const overlay = document.createElement('div');
    overlay.id = 'phisheye-warning-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        z-index: 2147483647;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        backdrop-filter: blur(8px);
        animation: phisheye-overlayFadeIn 0.4s ease-out;
        padding: 20px;
    `;

    overlay.innerHTML = `
        <div id="phisheye-warning-card" style="
            max-width: 520px;
            width: 100%;
            background: linear-gradient(170deg, #0f172a 0%, #020617 100%);
            border-radius: 28px;
            padding: 48px 40px;
            text-align: center;
            border: 1px solid rgba(251, 191, 36, 0.3);
            box-shadow:
                0 0 80px rgba(251, 191, 36, 0.15),
                0 40px 80px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
            animation: phisheye-cardSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
        ">
            <!-- Animated warning stripes at top -->
            <div style="
                position: absolute; top: 0; left: 0; right: 0; height: 4px;
                background: repeating-linear-gradient(
                    90deg,
                    #fbbf24 0px, #fbbf24 20px,
                    #020617 20px, #020617 40px
                );
                background-size: 40px 4px;
                animation: phisheye-stripesMove 1s linear infinite;
            "></div>

            <!-- Warning icon -->
            <div style="
                width: 88px; height: 88px;
                background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05));
                border-radius: 24px; display: flex; align-items: center; justify-content: center;
                margin: 0 auto 28px;
                border: 2px solid rgba(251, 191, 36, 0.3);
                font-size: 40px;
                animation: phisheye-iconPulse 2s ease-in-out infinite;
                box-shadow: 0 0 30px rgba(251, 191, 36, 0.2);
            ">⚠️</div>

            <!-- Title -->
            <h2 style="
                color: #fbbf24; font-size: 26px; font-weight: 800;
                margin: 0 0 12px; letter-spacing: -0.02em;
                text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
            ">Suspicious Website Detected</h2>

            <!-- Subtitle -->
            <p style="
                color: #94a3b8; font-size: 15px; line-height: 1.6;
                margin: 0 0 32px; max-width: 380px; margin-left: auto; margin-right: auto;
            ">
                PhishEye AI has detected <strong style="color: #fbbf24;">unusual patterns</strong> on this website.
                This site may be attempting to collect your personal information or credentials.
            </p>

            <!-- Threat details card -->
            <div style="
                background: rgba(251, 191, 36, 0.06);
                border: 1px solid rgba(251, 191, 36, 0.15);
                border-radius: 16px; padding: 20px;
                margin-bottom: 32px; text-align: left;
            ">
                <div style="
                    font-size: 11px; font-weight: 700; color: #fbbf24;
                    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 14px;
                    display: flex; align-items: center; gap: 6px;
                ">
                    <span style="width: 6px; height: 6px; background: #fbbf24; border-radius: 50; display: inline-block; animation: phisheye-blink 1s ease-in-out infinite;"></span>
                    Threat Analysis
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: #cbd5e1;">
                        <span style="color: #fbbf24; font-size: 16px;">🔍</span>
                        <span>Suspicious URL structure or domain pattern</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: #cbd5e1;">
                        <span style="color: #fbbf24; font-size: 16px;">🧠</span>
                        <span>AI confidence: Potential phishing behavior</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: #cbd5e1;">
                        <span style="color: #fbbf24; font-size: 16px;">⏱️</span>
                        <span>Scanned just now by PhishEye engine</span>
                    </div>
                </div>
            </div>

            <!-- URL display -->
            <div style="
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 10px; padding: 10px 14px;
                margin-bottom: 28px; font-family: 'Courier New', monospace;
                font-size: 11px; color: #fbbf24; word-break: break-all;
                text-align: left; max-height: 40px; overflow: hidden;
            ">${window.location.href}</div>

            <!-- Action buttons -->
            <div style="display: flex; gap: 14px;">
                <button id="phisheye-goback-btn" style="
                    flex: 1.3;
                    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                    color: #020617; border: none;
                    padding: 16px 24px; border-radius: 14px;
                    font-weight: 800; font-size: 15px; cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 6px 20px rgba(251, 191, 36, 0.3);
                    font-family: inherit;
                ">← Go Back to Safety</button>

                <button id="phisheye-continue-btn" style="
                    flex: 1;
                    background: rgba(255, 255, 255, 0.04);
                    color: #64748b;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 16px 20px; border-radius: 14px;
                    font-weight: 600; font-size: 13px; cursor: pointer;
                    transition: all 0.25s;
                    font-family: inherit;
                ">Continue Anyway</button>
            </div>

            <!-- Footer -->
            <p style="
                font-size: 11px; color: #475569;
                margin: 20px 0 0; line-height: 1.4;
            ">Protected by <span style="color: #fbbf24; font-weight: 600;">PhishEye AI</span> • Real-time threat detection</p>
        </div>
    `;

    document.body.appendChild(overlay);

    // "Go Back" button → navigate back
    document.getElementById('phisheye-goback-btn').addEventListener('click', () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'about:blank';
        }
    });

    // Hover effects for Go Back button
    const goBackBtn = document.getElementById('phisheye-goback-btn');
    goBackBtn.addEventListener('mouseover', () => {
        goBackBtn.style.transform = 'translateY(-2px)';
        goBackBtn.style.boxShadow = '0 10px 30px rgba(251, 191, 36, 0.4)';
    });
    goBackBtn.addEventListener('mouseout', () => {
        goBackBtn.style.transform = '';
        goBackBtn.style.boxShadow = '0 6px 20px rgba(251, 191, 36, 0.3)';
    });

    // "Continue Anyway" button → dismiss warning
    const continueBtn = document.getElementById('phisheye-continue-btn');
    continueBtn.addEventListener('click', () => {
        overlay.style.animation = 'phisheye-overlayFadeOut 0.35s ease-in forwards';
        setTimeout(() => overlay.remove(), 350);
    });

    // Hover effects for Continue button
    continueBtn.addEventListener('mouseover', () => {
        continueBtn.style.background = 'rgba(255, 255, 255, 0.08)';
        continueBtn.style.color = '#94a3b8';
        continueBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    });
    continueBtn.addEventListener('mouseout', () => {
        continueBtn.style.background = 'rgba(255, 255, 255, 0.04)';
        continueBtn.style.color = '#64748b';
        continueBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });
}

// ============================================
// INJECT STYLES (shared)
// ============================================
function injectToastStyles() {
    if (document.getElementById('phisheye-toast-style')) return;

    const style = document.createElement('style');
    style.id = 'phisheye-toast-style';
    style.innerHTML = `
        @keyframes phisheye-slideIn {
            from { transform: translateX(60px) scale(0.95); opacity: 0; }
            to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes phisheye-fadeOut {
            from { transform: scale(1); opacity: 1; }
            to { transform: scale(0.92) translateX(20px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

function injectWarningStyles() {
    if (document.getElementById('phisheye-warning-style')) return;

    const style = document.createElement('style');
    style.id = 'phisheye-warning-style';
    style.innerHTML = `
        @keyframes phisheye-overlayFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes phisheye-overlayFadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes phisheye-cardSlideUp {
            from { transform: translateY(40px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes phisheye-iconPulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(251, 191, 36, 0.2); }
            50% { transform: scale(1.05); box-shadow: 0 0 50px rgba(251, 191, 36, 0.35); }
        }
        @keyframes phisheye-stripesMove {
            from { background-position: 0 0; }
            to { background-position: 40px 0; }
        }
        @keyframes phisheye-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
    `;
    document.head.appendChild(style);
}
