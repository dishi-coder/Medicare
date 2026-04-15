/* ═══════════════════════════════════════════════
   MediCare Hospital — patient-login.js
   Handles: login, register, OTP, validation,
            password strength, countdown timer
   ═══════════════════════════════════════════════ */

// ── current active tab ───────────────────────────
let currentTab = 'login';
let otpMobile  = '';
let countdownInterval = null;

// ── on page load ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupOTPBoxes();
  setupPasswordStrength();
});

/* ════════════════════════════════════════════════
   TAB SWITCHING — Login / Register
   ════════════════════════════════════════════════ */
function switchTab(tab) {
  currentTab = tab;

  document.getElementById('tab-login').classList.toggle('active',    tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');

  document.getElementById('login-form').classList.toggle('hidden',    tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  document.getElementById('otp-form').classList.add('hidden');
  document.getElementById('success-msg').classList.add('hidden');
}

/* ════════════════════════════════════════════════
   PASSWORD VISIBILITY TOGGLE
   ════════════════════════════════════════════════ */
function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

/* ════════════════════════════════════════════════
   VALIDATION HELPERS
   ════════════════════════════════════════════════ */
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
}

function setInputState(inputId, isError) {
  const el = document.getElementById(inputId);
  if (el) {
    el.classList.toggle('error', isError);
  }
}

function isValidMobile(num) {
  // accepts: 10 digits, or +91 followed by 10 digits
  return /^(\+91)?[6-9]\d{9}$/.test(num.replace(/\s/g, ''));
}

/* ════════════════════════════════════════════════
   LOGIN FORM HANDLER
   ════════════════════════════════════════════════ */
function handleLogin(e) {
  e.preventDefault();

  const mobile   = document.getElementById('login-mobile').value.trim();
  const password = document.getElementById('login-password').value;

  let valid = true;

  clearError('err-login-mobile');
  clearError('err-login-password');
  setInputState('login-mobile', false);
  setInputState('login-password', false);

  if (!mobile) {
    showError('err-login-mobile', 'Mobile number is required.');
    setInputState('login-mobile', true);
    valid = false;
  } else if (!isValidMobile(mobile)) {
    showError('err-login-mobile', 'Enter a valid 10-digit mobile number.');
    setInputState('login-mobile', true);
    valid = false;
  }

  if (!password) {
    showError('err-login-password', 'Password is required.');
    setInputState('login-password', true);
    valid = false;
  } else if (password.length < 6) {
    showError('err-login-password', 'Password must be at least 6 characters.');
    setInputState('login-password', true);
    valid = false;
  }

  if (!valid) return;

  // Show loading spinner
  const btn    = document.getElementById('login-btn');
  const btnTxt = document.getElementById('login-btn-text');
  const spin   = document.getElementById('login-spinner');

  btn.disabled    = true;
  btnTxt.textContent = 'Logging in...';
  spin.classList.remove('hidden');

  // Simulate API call (replace with real fetch to Flask API)
  setTimeout(() => {
    btn.disabled = false;
    btnTxt.textContent = 'Login to Account';
    spin.classList.add('hidden');
    showSuccess();
  }, 1800);
}

/* ════════════════════════════════════════════════
   REGISTER FORM HANDLER
   ════════════════════════════════════════════════ */
function handleRegister(e) {
  e.preventDefault();

  const name     = document.getElementById('reg-name').value.trim();
  const mobile   = document.getElementById('reg-mobile').value.trim();
  const age      = document.getElementById('reg-age').value;
  const password = document.getElementById('reg-password').value;
  const terms    = document.getElementById('reg-terms').checked;

  let valid = true;

  // Clear all errors
  ['err-reg-name','err-reg-mobile','err-reg-age','err-reg-password','err-reg-terms']
    .forEach(clearError);
  ['reg-name','reg-mobile','reg-age','reg-password']
    .forEach(id => setInputState(id, false));

  if (!name || name.length < 2) {
    showError('err-reg-name', 'Please enter your full name.');
    setInputState('reg-name', true);
    valid = false;
  }

  if (!mobile) {
    showError('err-reg-mobile', 'Mobile number is required.');
    setInputState('reg-mobile', true);
    valid = false;
  } else if (!isValidMobile(mobile)) {
    showError('err-reg-mobile', 'Enter a valid 10-digit mobile number.');
    setInputState('reg-mobile', true);
    valid = false;
  }

  if (!age || age < 1 || age > 120) {
    showError('err-reg-age', 'Enter a valid age.');
    setInputState('reg-age', true);
    valid = false;
  }

  if (!password || password.length < 8) {
    showError('err-reg-password', 'Password must be at least 8 characters.');
    setInputState('reg-password', true);
    valid = false;
  }

  if (!terms) {
    showError('err-reg-terms', 'Please accept the Terms & Conditions.');
    valid = false;
  }

  if (!valid) return;

  // Simulate register API call
  const btn = e.target.querySelector('.submit-btn');
  btn.disabled     = true;
  btn.textContent  = 'Creating account...';

  setTimeout(() => {
    btn.disabled    = false;
    btn.textContent = 'Create Account';
    showSuccess();
  }, 2000);
}

/* ════════════════════════════════════════════════
   OTP FLOW
   ════════════════════════════════════════════════ */
function switchToOTP() {
  const mobile = document.getElementById('login-mobile').value.trim();

  clearError('err-login-mobile');
  setInputState('login-mobile', false);

  if (!mobile) {
    showError('err-login-mobile', 'Enter your mobile number first to receive OTP.');
    setInputState('login-mobile', true);
    document.getElementById('login-mobile').focus();
    return;
  }

  if (!isValidMobile(mobile)) {
    showError('err-login-mobile', 'Enter a valid 10-digit mobile number.');
    setInputState('login-mobile', true);
    document.getElementById('login-mobile').focus();
    return;
  }

  otpMobile = mobile;
  document.getElementById('otp-mobile-display').textContent = mobile;
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('otp-form').classList.remove('hidden');

  // Reset OTP boxes
  for (let i = 0; i < 6; i++) {
    const box = document.getElementById('otp' + i);
    box.value = '';
    box.classList.remove('filled');
  }
  document.getElementById('otp0').focus();

  startCountdown(30);
}

function backFromOTP() {
  document.getElementById('otp-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
  clearInterval(countdownInterval);
}

function handleOTP(e) {
  e.preventDefault();

  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += document.getElementById('otp' + i).value;
  }

  clearError('err-otp');

  if (otp.length < 6) {
    showError('err-otp', 'Please enter the complete 6-digit OTP.');
    return;
  }

  // Simulate OTP verify (accept any 6-digit OTP in demo)
  const btn = e.target.querySelector('.submit-btn');
  btn.disabled    = true;
  btn.textContent = 'Verifying...';

  setTimeout(() => {
    btn.disabled    = false;
    btn.textContent = 'Verify OTP';
    showSuccess();
  }, 1500);
}

function resendOTP() {
  document.getElementById('resend-btn').classList.add('hidden');
  document.getElementById('resend-timer').classList.remove('hidden');
  startCountdown(30);

  // Simulate OTP resend
  console.log('OTP resent to', otpMobile);
}

function startCountdown(seconds) {
  clearInterval(countdownInterval);
  let remaining = seconds;

  const timerEl  = document.getElementById('resend-timer');
  const countEl  = document.getElementById('countdown');
  const resendEl = document.getElementById('resend-btn');

  timerEl.classList.remove('hidden');
  resendEl.classList.add('hidden');
  countEl.textContent = remaining;

  countdownInterval = setInterval(() => {
    remaining--;
    countEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      timerEl.classList.add('hidden');
      resendEl.classList.remove('hidden');
    }
  }, 1000);
}

/* ════════════════════════════════════════════════
   OTP BOX — auto-advance & backspace
   ════════════════════════════════════════════════ */
function setupOTPBoxes() {
  for (let i = 0; i < 6; i++) {
    const box = document.getElementById('otp' + i);
    if (!box) continue;

    box.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').slice(-1);
      if (this.value) {
        this.classList.add('filled');
        if (i < 5) document.getElementById('otp' + (i + 1)).focus();
      } else {
        this.classList.remove('filled');
      }
    });

    box.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !this.value && i > 0) {
        document.getElementById('otp' + (i - 1)).focus();
      }
    });

    box.addEventListener('paste', function (e) {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      for (let j = 0; j < pasted.length; j++) {
        const target = document.getElementById('otp' + j);
        if (target) {
          target.value = pasted[j];
          target.classList.add('filled');
        }
      }
      const last = Math.min(pasted.length, 5);
      document.getElementById('otp' + last).focus();
    });
  }
}

/* ════════════════════════════════════════════════
   PASSWORD STRENGTH METER
   ════════════════════════════════════════════════ */
function setupPasswordStrength() {
  const input = document.getElementById('reg-password');
  if (!input) return;

  input.addEventListener('input', function () {
    const val = this.value;
    const bar = document.getElementById('pwd-strength');
    if (!bar) return;

    let score = 0;
    if (val.length >= 8)              score++;
    if (/[A-Z]/.test(val))            score++;
    if (/[0-9]/.test(val))            score++;
    if (/[^A-Za-z0-9]/.test(val))    score++;

    const configs = [
      { width: '0%',   color: '#e2e8f0' },
      { width: '25%',  color: '#ef4444' },
      { width: '50%',  color: '#f97316' },
      { width: '75%',  color: '#eab308' },
      { width: '100%', color: '#22c55e' },
    ];

    const cfg = configs[score];
    bar.style.width      = cfg.width;
    bar.style.background = cfg.color;
  });
}

/* ════════════════════════════════════════════════
   SUCCESS STATE
   ════════════════════════════════════════════════ */
function showSuccess() {
   // Login save karo
  localStorage.setItem('patient_logged_in', 'true');
  localStorage.setItem('patient_name', 'Ravi Kumar');
  
  
  
  // Hide all forms

  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('otp-form').classList.add('hidden');
  document.getElementById('success-msg').classList.remove('hidden');

  // Animate redirect bar
  setTimeout(() => {
    const bar = document.getElementById('redirect-bar');
    if (bar) bar.style.width = '100%';
  }, 100);

  // Redirect after 2.2s (replace URL with your dashboard page)
  setTimeout(() => {
    console.log('Redirecting to patient dashboard...');
     window.location.href = 'patient-dashboard.html';
  }, 2300);
}
