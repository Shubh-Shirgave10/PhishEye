document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '../Main_Dash/mainDash.html';
        return;
    }
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabIndicator = document.querySelector('.tab-indicator');
    const formsContainer = document.querySelector('.forms-container');
    const authForms = document.querySelectorAll('.auth-form');
    const switchLinks = document.querySelectorAll('[data-switch]');

    /* ---------------------- PASSWORD TOGGLE ---------------------- */
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);

            if (input.type === 'password') {
                input.type = 'text';
                btn.classList.add('active');
            } else {
                input.type = 'password';
                btn.classList.remove('active');
            }
        });
    });

    /* ---------------------- HEIGHT ADJUSTMENT ------------------ */
    function adjustHeight() {
        const activeForm = document.querySelector('.auth-form.active');
        if (activeForm) {
            // Set height to the active form's height
            formsContainer.style.height = activeForm.offsetHeight + 'px';
        }
    }

    // Call on load and resize
    window.addEventListener('load', adjustHeight);
    window.addEventListener('resize', adjustHeight);

    /* ---------------------- TAB SWITCHING ---------------------- */
    function switchTab(target) {
        // Update Buttons
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.target === target);
        });

        // Move Indicator
        if (target === 'signup') {
            tabIndicator.style.transform = 'translateX(100%)';
            formsContainer.style.transform = 'translateX(-50%)';
        } else {
            tabIndicator.style.transform = 'translateX(0)';
            formsContainer.style.transform = 'translateX(0)';
        }

        // Update Active Form (for opacity/pointer-events)
        authForms.forEach(form => {
            if (form.id === target + 'Form') {
                form.classList.add('active');
            } else {
                form.classList.remove('active');
            }
        });

        // Adjust height after state change
        // Small delay to allow CSS display/opacity changes if any
        setTimeout(adjustHeight, 50);
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.target));
    });

    switchLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(link.dataset.switch);
        });
    });



    /* ---------------------- TWILIO OTP LOGIC ---------------------- */
    const API_BASE = 'http://localhost:5000';
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const otpSection = document.getElementById('otpSection');
    const otpInput = document.getElementById('otpInput');
    const otpStatus = document.getElementById('otpStatus');
    const signupPhone = document.getElementById('signup-phone');

    let isOtpVerified = false;
    let signupVerifiedPhone = '';

    /**
     * Normalise phone number to E.164 format.
     * If the user types a 10-digit number without country code, prepend +91.
     */
    function normalizePhone(raw) {
        let phone = raw.replace(/[\s\-()]/g, '');
        if (!phone.startsWith('+')) {
            // Default to India (+91) if no country code provided
            phone = '+91' + phone;
        }
        return phone;
    }

    /**
     * Send OTP via Twilio backend
     */
    async function sendOtpToPhone(phone) {
        const res = await fetch(`${API_BASE}/api/otp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        return res.json();
    }

    /**
     * Verify OTP via Twilio backend
     */
    async function verifyOtpFromPhone(phone, otp) {
        const res = await fetch(`${API_BASE}/api/otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp })
        });
        return { status: res.status, data: await res.json() };
    }

    /* ---------- Signup: Send OTP ---------- */
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', async () => {
            const rawPhone = signupPhone.value.trim();
            if (rawPhone.length < 10) {
                alert("Please enter a valid phone number.");
                return;
            }

            const phone = normalizePhone(rawPhone);
            sendOtpBtn.disabled = true;
            sendOtpBtn.textContent = "Sending...";

            // Reset UI state in case this is a Resend
            isOtpVerified = false;
            otpInput.disabled = false;
            otpInput.value = '';
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = "Verify";
            otpStatus.textContent = "";

            try {
                const result = await sendOtpToPhone(phone);
                otpSection.hidden = false;
                if (result.message === 'OTP sent successfully') {
                    otpStatus.textContent = `OTP sent to ${phone}`;
                    otpStatus.style.color = "var(--success)";
                    signupVerifiedPhone = phone;
                    otpInput.focus();
                } else {
                    otpStatus.textContent = result.message || 'Failed to send OTP';
                    otpStatus.style.color = "var(--error)";
                }
            } catch (err) {
                otpSection.hidden = false;
                otpStatus.textContent = "Network error. Please try again.";
                otpStatus.style.color = "var(--error)";
            } finally {
                sendOtpBtn.textContent = "Resend OTP";
                sendOtpBtn.disabled = false;
                adjustHeight();
            }
        });
    }

    /* ---------- Signup: Verify OTP ---------- */
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', async () => {
            const code = otpInput.value.trim();
            if (code.length !== 6) {
                otpStatus.textContent = "Enter a 6-digit code";
                otpStatus.style.color = "var(--error)";
                adjustHeight();
                return;
            }

            verifyOtpBtn.textContent = "Verifying...";
            verifyOtpBtn.disabled = true;

            try {
                const { status, data } = await verifyOtpFromPhone(signupVerifiedPhone, code);
                if (data.verified) {
                    isOtpVerified = true;
                    otpStatus.textContent = "OTP Verified ✔";
                    otpStatus.style.color = "var(--success)";
                    otpInput.disabled = true;
                    verifyOtpBtn.textContent = "Verified";
                } else {
                    otpStatus.textContent = data.message || "Invalid OTP";
                    otpStatus.style.color = "var(--error)";
                    verifyOtpBtn.textContent = "Verify";
                    verifyOtpBtn.disabled = false;
                }
            } catch (err) {
                otpStatus.textContent = "Network error. Please try again.";
                otpStatus.style.color = "var(--error)";
                verifyOtpBtn.textContent = "Verify";
                verifyOtpBtn.disabled = false;
            }
            adjustHeight();
        });
    }

    /* ---------------------- LOGIN FORM ---------------------- */
    const loginForm = document.getElementById('loginForm');
    // Login OTP elements (we'll create them dynamically)
    let loginOtpPhone = '';
    let loginPendingData = null;

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const email = loginForm.querySelector('input[type="email"]').value;
            const passwordInput = loginForm.querySelector('input[type="password"], input#loginPassword');

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            // If we're in the OTP verification step of login
            const loginOtpSection = document.getElementById('loginOtpSection');
            if (loginOtpSection && !loginOtpSection.hidden) {
                // Already showing OTP, the verify button handles it
                return;
            }

            submitBtn.textContent = "Logging in...";
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password: passwordInput.value })
                });

                if (!response.ok) throw new Error('Invalid credentials');
                const data = await response.json();

                // Login successful — store tokens and redirect
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user_id', data.user_id);
                localStorage.setItem('user_email', email);
                window.location.href = '../Dashboard/dashboard.html';

            } catch (error) {
                alert(error.message);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    /* ---------------------- SIGNUP FORM ---------------------- */
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!isOtpVerified) {
                otpStatus.textContent = "Please verify OTP first";
                otpStatus.style.color = "var(--error)";
                adjustHeight();
                return;
            }

            const password = signupForm.querySelector('input[placeholder="Enter strong password"]').value;
            const confirmPassword = signupForm.querySelector('input[placeholder="Re-enter password"]').value;

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Registering...";
            submitBtn.disabled = true;

            const email = signupForm.querySelector('input[name="email"]').value;

            try {
                const response = await fetch(`${API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, phone: signupVerifiedPhone })
                });

                if (response.status === 201) {
                    alert("Registration Successful! Please Login.");
                    signupForm.reset();
                    isOtpVerified = false;
                    signupVerifiedPhone = '';
                    otpSection.hidden = true;
                    switchTab('login');
                } else if (response.status === 409) {
                    throw new Error('User already exists');
                } else {
                    throw new Error('Registration failed');
                }
            } catch (error) {
                alert(error.message);
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    const resetModal = document.getElementById('resetModal');
    const forgotLink = document.querySelector('.forgot-link');
    const closeModal = document.getElementById('closeModal');
    const resetStep1 = document.getElementById('resetStep1');
    const resetStep2 = document.getElementById('resetStep2');
    const resetStatus = document.getElementById('resetStatus');
    const sendResetOtpBtn = document.getElementById('sendResetOtpBtn');
    const confirmResetBtn = document.getElementById('confirmResetBtn');

    let resetUserPhone = '';

    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            resetModal.classList.add('active');
            resetStatus.textContent = '';
            resetStep1.hidden = false;
            resetStep2.hidden = true;
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            resetModal.classList.remove('active');
        });
    }

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === resetModal) {
            resetModal.classList.remove('active');
        }
    });

    if (sendResetOtpBtn) {
        sendResetOtpBtn.addEventListener('click', async () => {
            const email = document.getElementById('resetEmail').value.trim();
            if (!email) {
                resetStatus.textContent = "Please enter your email.";
                resetStatus.style.color = "var(--error)";
                return;
            }

            sendResetOtpBtn.disabled = true;
            sendResetOtpBtn.textContent = "Sending...";
            resetStatus.textContent = "";

            try {
                const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();

                if (res.ok) {
                    resetUserPhone = data.phone;
                    resetStep1.hidden = true;
                    resetStep2.hidden = false;
                    resetStatus.textContent = data.message;
                    resetStatus.style.color = "var(--success)";
                } else {
                    resetStatus.textContent = data.message;
                    resetStatus.style.color = "var(--error)";
                }
            } catch (err) {
                resetStatus.textContent = "Network error. Try again.";
                resetStatus.style.color = "var(--error)";
            } finally {
                sendResetOtpBtn.disabled = false;
                sendResetOtpBtn.textContent = "Send OTP";
            }
        });
    }

    if (confirmResetBtn) {
        confirmResetBtn.addEventListener('click', async () => {
            const otp = document.getElementById('resetOtp').value.trim();
            const newPassword = document.getElementById('newPassword').value.trim();

            if (otp.length !== 6) {
                resetStatus.textContent = "Enter 6-digit OTP.";
                resetStatus.style.color = "var(--error)";
                return;
            }
            if (newPassword.length < 8) {
                resetStatus.textContent = "Password must be at least 8 characters.";
                resetStatus.style.color = "var(--error)";
                return;
            }

            confirmResetBtn.disabled = true;
            confirmResetBtn.textContent = "Updating...";

            try {
                const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: resetUserPhone, otp, new_password: newPassword })
                });
                const data = await res.json();

                if (res.ok) {
                    resetStatus.textContent = data.message;
                    resetStatus.style.color = "var(--success)";
                    setTimeout(() => resetModal.classList.remove('active'), 2000);
                } else {
                    resetStatus.textContent = data.message;
                    resetStatus.style.color = "var(--error)";
                }
            } catch (err) {
                resetStatus.textContent = "Network error. Try again.";
                resetStatus.style.color = "var(--error)";
            } finally {
                confirmResetBtn.disabled = false;
                confirmResetBtn.textContent = "Update Password";
            }
        });
    }

    // Initial adjustment
    adjustHeight();
});
