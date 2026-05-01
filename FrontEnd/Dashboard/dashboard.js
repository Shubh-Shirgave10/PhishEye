// PARTICLE ANIMATION BACKGROUND - ANTIGRAVITY EFFECT
(function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particles = [];
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let mousePressed = false;
  const particleCount = 250;
  const repulsionStrength = 0.3;
  const connectionDistance = 150;
  const repulsionDistance = 200;

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 3;
      this.vy = (Math.random() - 0.5) * 3;
      this.size = Math.random() * 3 + 1.5;
      this.opacity = Math.random() * 0.6 + 0.3;
      this.maxOpacity = this.opacity;
    }

    update() {
      // Repel away from cursor with stronger force
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0 && distance < repulsionDistance) {
        const force = mousePressed ? 0.6 : 0.3;
        this.vx -= (dx / distance) * repulsionStrength * force;
        this.vy -= (dy / distance) * repulsionStrength * force;
      }

      // Particle-to-particle collision avoidance
      for (let other of particles) {
        if (other === this) continue;
        const pdx = other.x - this.x;
        const pdy = other.y - this.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        const minDist = this.size + other.size + 10;

        if (pdist < minDist && pdist > 0) {
          this.vx -= (pdx / pdist) * 0.3;
          this.vy -= (pdy / pdist) * 0.3;
        }
      }

      // Add some random noise for organic movement
      this.vx += (Math.random() - 0.5) * 0.2;
      this.vy += (Math.random() - 0.5) * 0.2;

      // Apply velocity with drag
      this.vx *= 0.97;
      this.vy *= 0.97;

      // Limit velocity
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 8) {
        this.vx = (this.vx / speed) * 8;
        this.vy = (this.vy / speed) * 8;
      }

      this.x += this.vx;
      this.y += this.vy;

      // Keep particles within bounds (no bounce, stay visible)
      if (this.x < 0) this.x = 0;
      if (this.x > canvas.width) this.x = canvas.width;
      if (this.y < 0) this.y = 0;
      if (this.y > canvas.height) this.y = canvas.height;

      // Update opacity based on distance from mouse
      const distToMouse = Math.sqrt((mouseX - this.x) ** 2 + (mouseY - this.y) ** 2);
      this.opacity = this.maxOpacity * (1 - Math.min(distToMouse / repulsionDistance, 1) * 0.5);
    }

    draw() {
      // Draw glowing particle
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
      gradient.addColorStop(0, `rgba(0, 168, 255, ${this.opacity * 0.8})`);
      gradient.addColorStop(1, `rgba(0, 168, 255, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw core
      ctx.fillStyle = `rgba(100, 200, 255, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          // Lines are now invisible
        }
      }
    }
  }

  function animate() {
    // Clear canvas completely (no fade trail)
    ctx.fillStyle = 'rgba(10, 26, 47, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    drawConnections();
    requestAnimationFrame(animate);
  }

  animate();

  // Track mouse movement
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener('mousedown', () => {
    mousePressed = true;
  });

  document.addEventListener('mouseup', () => {
    mousePressed = false;
  });

  document.addEventListener('mouseleave', () => {
    mousePressed = false;
  });

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
})();

// AUTH STATE CHECK & HEADER UPDATE
const token = localStorage.getItem('token');
const authContainer = document.getElementById('authContainer');

function updateHeader() {
  if (token && authContainer) {
    authContainer.innerHTML = `
      <div class="user-profile" id="userProfile" style="width: 40px; height: 40px; background: #00a8ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid #0a192f; color: white; font-weight: 700; font-family: 'Inter', sans-serif;">
        ${localStorage.getItem('user_email') ? localStorage.getItem('user_email')[0].toUpperCase() : 'U'}
      </div>
    `;
    document.getElementById('userProfile').onclick = () => {
      window.location.href = "../Main_Dash/mainDash.html";
    };
  }
}
updateHeader();

// BUTTON ANIMATION & GET STARTED LOGIC
const startBtn = document.getElementById("startBtn");
if (startBtn) {
  startBtn.addEventListener("click", () => {
    if (!token) {
      // User not logged in (Login button is visible) -> redirect to login page
      window.location.href = "../login-page/login.html";
      return;
    }

    // User logged in (Username icon is visible) -> Show Installation Modal with steps
    const modal = document.createElement('div');
    modal.className = "setup-modal-overlay";
    modal.innerHTML = `
        <style>
          :root {
            --modal-overlay: rgba(2, 6, 23, 0.9);
            --modal-bg: linear-gradient(165deg, #0f172a 0%, #020617 100%);
            --modal-text: #ffffff;
            --modal-text-muted: #94a3b8;
            --modal-border: rgba(56, 189, 248, 0.2);
            --modal-icon-bg: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(56, 189, 248, 0.05));
            --modal-token-bg: rgba(15, 23, 42, 0.8);
            --modal-input-bg: rgba(0, 0, 0, 0.2);
            --modal-btn-primary: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
            --modal-btn-secondary: rgba(255, 255, 255, 0.03);
          }

          [data-theme="light"] {
            --modal-overlay: rgba(255, 255, 255, 0.9) !important;
            --modal-bg: linear-gradient(165deg, #f8fafc 0%, #ffffff 100%) !important;
            --modal-text: #1a202c !important;
            --modal-text-muted: #4a5568 !important;
            --modal-border: rgba(0, 0, 0, 0.1) !important;
            --modal-icon-bg: #ffffff !important;
            --modal-token-bg: #f1f5f9 !important;
            --modal-input-bg: #e2e8f0 !important;
            --modal-btn-primary: linear-gradient(135deg, #0052cc 0%, #0099cc 100%) !important;
            --modal-btn-secondary: #f1f5f9 !important;
          }

          .setup-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: var(--modal-overlay); display: flex; align-items: center; justify-content: center; z-index: 10000;
            color: var(--modal-text); font-family: 'Outfit', 'Inter', sans-serif; backdrop-filter: blur(12px);
            animation: fadeIn 0.3s ease-out; padding: 40px 20px;
          }

          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          
          .modal-window {
            max-height: 90vh;
            width: 100%;
            max-width: 620px;
            display: flex;
            flex-direction: column;
            animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .step-modal {
            background: var(--modal-bg);
            padding: 40px;
            border-radius: 32px;
            border: 1px solid var(--modal-border);
            text-align: center;
            box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.3);
            position: relative;
            overflow-y: auto;
          }

          .icon-box {
            width: 72px; height: 72px; background: var(--modal-icon-bg);
            border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;
            border: 1px solid var(--modal-border); font-size: 28px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          }

          .step-modal h2 {
            background: linear-gradient(to right, var(--modal-text), #38bdf8);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            margin-bottom: 8px; font-size: 30px; font-weight: 800; letter-spacing: -0.02em;
          }

          .step-modal p.intro { color: var(--modal-text-muted); font-size: 16px; margin-bottom: 32px; line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto; }

          .steps-list {
            text-align: left; list-style: none; counter-reset: step-counter; padding: 0; margin-bottom: 32px;
          }

          .steps-list li {
            position: relative; margin-bottom: 20px; padding-left: 52px; color: var(--modal-text); font-size: 15px; line-height: 1.6;
            display: flex; align-items: center;
          }

          .steps-list li::before {
            content: counter(step-counter); counter-increment: step-counter;
            position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 32px; height: 32px;
            background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: 10px; display: flex; align-items: center; justify-content: center;
            color: #38bdf8; font-weight: 700; font-size: 13px;
          }

          .token-section {
            background: var(--modal-token-bg); border: 1px solid var(--modal-border);
            border-radius: 16px; padding: 16px; margin-bottom: 24px; text-align: left;
          }

          .token-label { font-size: 11px; font-weight: 600; color: var(--modal-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: block; }
          
          .token-row { display: flex; align-items: center; gap: 8px; }

          .token-text {
            font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 11px; color: #38bdf8;
            word-break: break-all; flex-grow: 1; padding: 8px 10px; background: var(--modal-input-bg); border-radius: 8px;
            letter-spacing: 0.02em; cursor: pointer; transition: all 0.2s;
          }

          .copy-btn {
            background: #38bdf8; color: #020617; border: none; padding: 8px 14px; border-radius: 8px;
            font-weight: 700; font-size: 11px; cursor: pointer; transition: 0.2s;
          }

          .download-ext-btn {
            display: inline-flex; align-items: center; gap: 6px;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white; border: none; padding: 8px 16px; border-radius: 12px;
            font-weight: 700; font-size: 11px; cursor: pointer; text-decoration: none;
            margin: 12px 0 8px; transition: 0.3s ease;
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
          }
          .download-ext-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(34, 197, 94, 0.3); }
          .download-ext-btn svg { width: 12px; height: 12px; }

          .btn-primary {
            background: var(--modal-btn-primary);
            color: white; border: none; padding: 12px 24px; border-radius: 12px; flex: 2;
            font-weight: 700; font-size: 14px; cursor: pointer; transition: 0.3s;
            box-shadow: 0 4px 15px rgba(0, 153, 204, 0.3);
          }
          .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 153, 204, 0.4); }
          .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

          .btn-secondary {
            background: var(--modal-btn-secondary); color: var(--modal-text-muted); 
            border: 1px solid var(--modal-border);
            padding: 12px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; 
            transition: 0.3s; flex: 1;
            font-size: 13px;
          }
          .btn-secondary:hover { background: rgba(255, 255, 255, 0.05); color: var(--modal-text); }

          .checkbox-container label { font-size: 14px; color: var(--modal-text-muted); cursor: pointer; }
        </style>
        <div class="modal-window">
            <div class="step-modal">
                <div class="icon-box">🛡️</div>
                <h2>Connect PhishEye</h2>
                <p class="intro">Follow these professional steps to sync your local extension with the cloud engine.</p>
                
                <ul class="steps-list">
                    <li>Navigate to <code style="color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 2px 6px; border-radius: 4px; margin-left: 4px;">chrome://extensions</code></li>
                    <li>Activate <b>Developer mode</b> (top right toggle)</li>
                    <li>Download the extension folder:
                        <a href="../PhishEye-Extension.zip" download="PhishEye-Extension.zip" class="download-ext-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download Extension
                        </a>
                    </li>
                    <li>Click <b>Load unpacked</b> and select the downloaded Extension folder</li>
                    <li>Launch the extension and authenticate using the token below:</li>
                </ul>

                <div class="token-section">
                    <span class="token-label">Secure Access Token</span>
                    <div class="token-row">
                        <span class="token-text" id="tokenDisplay" title="Click to reveal full token">${token.length > 20 ? token.substring(0, 8) + '<span class="token-dots">••••••</span>' + token.substring(token.length - 8) : token}</span>
                        <button class="copy-btn" id="copyTokenBtn">COPY</button>
                    </div>
                </div>

                <div class="checkbox-container">
                    <input type="checkbox" id="setupConfirm">
                    <label for="setupConfirm">I have successfully added the extension to my browser</label>
                </div>

                <div class="modal-actions">
                    <button class="btn-primary" id="goToDashBtn" disabled>Open Dashboard</button>
                    <button class="btn-secondary" id="closeModalBtn">Dismiss</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const checkbox = document.getElementById('setupConfirm');
    const goToDashBtn = document.getElementById('goToDashBtn');

    checkbox.onchange = () => {
      goToDashBtn.disabled = !checkbox.checked;
    };

    // Token reveal toggle
    const tokenDisplay = document.getElementById('tokenDisplay');
    let tokenRevealed = false;
    tokenDisplay.onclick = () => {
      tokenRevealed = !tokenRevealed;
      if (tokenRevealed) {
        tokenDisplay.textContent = token;
        tokenDisplay.title = 'Click to hide token';
      } else {
        tokenDisplay.innerHTML = token.length > 20 ? token.substring(0, 8) + '<span class="token-dots">••••••</span>' + token.substring(token.length - 8) : token;
        tokenDisplay.title = 'Click to reveal full token';
      }
    };

    const copyBtn = document.getElementById('copyTokenBtn');
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(token);
      copyBtn.textContent = "COPIED!";
      copyBtn.style.background = "#22c55e";
      copyBtn.style.color = "white";
      setTimeout(() => {
        copyBtn.textContent = "COPY";
        copyBtn.style.background = "#38bdf8";
        copyBtn.style.color = "#020617";
      }, 2000);
    };

    goToDashBtn.onclick = () => {
      window.location.href = "../Main_Dash/mainDash.html";
    };

    document.getElementById('closeModalBtn').onclick = () => modal.remove();
  });
}

// WHY CARDS EXPAND
document.querySelectorAll(".why-card").forEach(card => {
  card.addEventListener("click", () => {
    let details = card.querySelector(".details");
    details.style.display =
      details.style.display === "block" ? "none" : "block";
  });
});

// SECURITY REVEAL ON SCROLL
const securityItems = document.querySelectorAll(".security-item");

function revealSecurity() {
  securityItems.forEach((item, i) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      setTimeout(() => item.classList.add("show"), i * 200);
    }
  });
}

window.addEventListener("scroll", revealSecurity);
revealSecurity();
