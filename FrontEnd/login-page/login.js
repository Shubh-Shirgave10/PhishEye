document.addEventListener('DOMContentLoaded', () => {
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

    /* ---------------------- MOCK OTP LOGIC (No Firebase) ---------------------- */
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const otpSection = document.getElementById('otpSection');
    const otpInput = document.getElementById('otpInput');
    const otpStatus = document.getElementById('otpStatus');
    const signupPhone = document.getElementById('signup-phone');

    let isOtpVerified = false;

    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', () => {
            const phone = signupPhone.value.trim();

            if (phone.length < 10) {
                alert("Please enter a valid phone number.");
                return;
            }

            // Mock: Just show the OTP section
            sendOtpBtn.disabled = true;
            sendOtpBtn.textContent = "Sending...";

            // Simulate sending delay
            setTimeout(() => {
                otpSection.hidden = false;
                otpStatus.textContent = `Mock OTP sent to ${phone} (Use any 6-digit code)`;
                otpStatus.style.color = "var(--success)";
                sendOtpBtn.textContent = "Resend OTP";
                sendOtpBtn.disabled = false;
                otpInput.focus();
                adjustHeight();
            }, 500);
        });
    }

    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', () => {
            const code = otpInput.value.trim();
            if (code.length !== 6) {
                otpStatus.textContent = "Enter a 6-digit code";
                otpStatus.style.color = "var(--error)";
                adjustHeight();
                return;
            }

            verifyOtpBtn.textContent = "Verifying...";

            // Mock: Accept any 6-digit code
            setTimeout(() => {
                isOtpVerified = true;
                otpStatus.textContent = "OTP Verified ✔";
                otpStatus.style.color = "var(--success)";
                otpInput.disabled = true;
                verifyOtpBtn.textContent = "Verified";
                verifyOtpBtn.disabled = true;
                adjustHeight();
            }, 500);
        });
    }

    /* ---------------------- FORM SUBMISSION (MOCK) ---------------------- */
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const email = loginForm.querySelector('input[type="email"]').value;
            const passwordInput = loginForm.querySelector('input[type="password"], input#loginPassword');

            // Real Login Logic
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Logging in...";
            submitBtn.disabled = true;

            fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: passwordInput.value })
            })
                .then(response => {
                    if (response.ok) return response.json();
                    throw new Error('Invalid credentials');
                })
                .then(data => {
                    localStorage.setItem('token', data.access_token);
                    localStorage.setItem('user_id', data.user_id);
                    localStorage.setItem('user_email', email);
                    window.location.href = '../Main_Dash/mainDash.html';
                })
                .catch(error => {
                    alert(error.message);
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                });
        });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
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

            // Real Registration Logic
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Registering...";
            submitBtn.disabled = true;

            const email = signupForm.querySelector('input[name="email"]').value;

            fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password })
            })
                .then(response => {
                    if (response.status === 201) return response.json();
                    if (response.status === 409) throw new Error('User already exists');
                    throw new Error('Registration failed');
                })
                .then(data => {
                    alert("Registration Successful! Please Login.");
                    signupForm.reset();
                    isOtpVerified = false;
                    otpSection.hidden = true;
                    switchTab('login');
                })
                .catch(error => {
                    alert(error.message);
                })
                .finally(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                });
        });
    }

    // Initial adjustment
    adjustHeight();
});
