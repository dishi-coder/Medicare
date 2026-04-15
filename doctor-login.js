/* ═══════════════════════════════════════════════
   MediCare Hospital — doctor-login.js
   Handles: login, OTP, forgot password,
            validation, countdown, live status
   ═══════════════════════════════════════════════ */

let countdownInterval = null;
let otpContact = '';

// ── Status messages shown after login ────────────
const liveMessages = [
  'Connecting to patient alert system...',
  'Loading AI prediction engine...',
  'Syncing emergency log...',
  'Fetching active patient cards...',
  'Dashboard ready. Redirecting...',
];

/* ════════════════════════════════════════════════
   PAGE LOAD
   ════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  setupOTPBoxes();
});

/* ════════════════════════════════════════════════
   TAB SWITCHING — Login / Forgot Password
   ════════════════════════════════════════════════ */
function switchTab(tab) {
  // Tab buttons
  document.getElementById('tab-login').classList.toggle('active',  tab === 'login');
  document.getElementById('tab-forgot').classList.toggle('active', tab === 'forgot');

  // Forms
  document.getElementById('login-form').classList.toggle('hidden',    tab !== 'login');
  document.getElementById('forgot-form').classList.toggle('hidden',   tab !== 'forgot');
  document.getElementById('otp-form').classList.add('hidden');
  document.getElementById('success-msg').classList.add('hidden');
  document.getElementById('forgot-success').classList.add('hidden');
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

function setInputError(inputId, hasError) {
  const el = document.getElementById(inputId);
  if (el) el.classList.toggle('error', hasError);
}

function isValidMobile(num) {
  return /^(\+91)?[6-9]\d{9}$/.test(num.replace(/\s/g, ''));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDoctorID(id) {
  // Format: DOC-YYYY-XXX  e.g. DOC-2024-001
  return /^DOC-\d{4}-\d{3,}$/i.test(id.trim());
}

/* ════════════════════════════════════════════════
   LOGIN FORM HANDLER
   ════════════════════════════════════════════════ */
function handleLogin(e) {
  e.preventDefault();

  const doctorId  = document.getElementById('doctor-id').value.trim();
  const contact   = document.getElementById('doctor-contact').value.trim();
  const password  = document.getElementById('doctor-password').value;
  const spec      = document.getElementById('doctor-spec').value;

  let valid = true;

  // Clear previous errors
  ['err-doctor-id','err-doctor-contact','err-doctor-password','err-doctor-spec']
    .forEach(clearError);
  ['doctor-id','doctor-contact','doctor-password']
    .forEach(id => setInputError(id, false));

  // Doctor ID
  if (!doctorId) {
    showError('err-doctor-id', 'Doctor ID is required.');
    setInputError('doctor-id', true);
    valid = false;
  } else if (!isValidDoctorID(doctorId)) {
    showError('err-doctor-id', 'Format: DOC-2024-001');
    setInputError('doctor-id', true);
    valid = false;
  }

  // Contact (mobile or email)
  if (!contact) {
    showError('err-doctor-contact', 'Mobile or email is required.');
    setInputError('doctor-contact', true);
    valid = false;
  } else if (!isValidMobile(contact) && !isValidEmail(contact)) {
    showError('err-doctor-contact', 'Enter a valid mobile number or email.');
    setInputError('doctor-contact', true);
    valid = false;
  }

  // Password
  if (!password) {
    showError('err-doctor-password', 'Password is required.');
    setInputError('doctor-password', true);
    valid = false;
  } else if (password.length < 6) {
    showError('err-doctor-password', 'Password must be at least 6 characters.');
    setInputError('doctor-password', true);
    valid = false;
  }

  // Specialisation
  if (!spec) {
    showError('err-doctor-spec', 'Please select your specialisation.');
    valid = false;
  }

  if (!valid) return;

  // Show loading state
  const btn    = document.getElementById('login-btn');
  const btnTxt = document.getElementById('login-btn-text');
  const spin   = document.getElementById('login-spinner');

  btn.disabled = true;
  btnTxt.textContent = 'Authenticating...';
  spin.classList.remove('hidden');

  // Simulate API call — replace with real fetch to Flask API
  setTimeout(() => {
    btn.disabled = false;
    btnTxt.textContent = 'Login to Dashboard';
    spin.classList.add('hidden');
    showSuccess();
  }, 1800);
}

/* ════════════════════════════════════════════════
   OTP FLOW
   ════════════════════════════════════════════════ */
function openOTPFlow() {
  const contact = document.getElementById('doctor-contact').value.trim();

  clearError('err-doctor-contact');
  setInputError('doctor-contact', false);

  if (!contact) {
    showError('err-doctor-contact', 'Enter your registered mobile or email first.');
    setInputError('doctor-contact', true);
    document.getElementById('doctor-contact').focus();
    return;
  }

  if (!isValidMobile(contact) && !isValidEmail(contact)) {
    showError('err-doctor-contact', 'Enter a valid mobile number or email.');
    setInputError('doctor-contact', true);
    document.getElementById('doctor-contact').focus();
    return;
  }

  otpContact = contact;

  // Mask display: show only last 4 chars
  const masked = contact.slice(0, -4).replace(/./g, '*') + contact.slice(-4);
  document.getElementById('otp-num-display').textContent = masked;

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

  const btn = e.target.querySelector('.submit-btn');
  btn.disabled    = true;
  btn.textContent = 'Verifying...';

  setTimeout(() => {
    btn.disabled    = false;
    btn.textContent = 'Verify & Login';
    showSuccess();
  }, 1500);
}

function resendOTP() {
  document.getElementById('resend-btn').classList.add('hidden');
  startCountdown(30);
  console.log('OTP resent to', otpContact);
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
   FORGOT PASSWORD HANDLER
   ════════════════════════════════════════════════ */
function handleForgot(e) {
  e.preventDefault();

  const forgotId     = document.getElementById('forgot-id').value.trim();
  const forgotMobile = document.getElementById('forgot-mobile').value.trim();

  let valid = true;

  clearError('err-forgot-id');
  clearError('err-forgot-mobile');

  if (!forgotId) {
    showError('err-forgot-id', 'Doctor ID is required.');
    valid = false;
  } else if (!isValidDoctorID(forgotId)) {
    showError('err-forgot-id', 'Format: DOC-2024-001');
    valid = false;
  }

  if (!forgotMobile) {
    showError('err-forgot-mobile', 'Registered mobile is required.');
    valid = false;
  } else if (!isValidMobile(forgotMobile)) {
    showError('err-forgot-mobile', 'Enter a valid 10-digit mobile number.');
    valid = false;
  }

  if (!valid) return;

  const btn = e.target.querySelector('.submit-btn');
  btn.disabled    = true;
  btn.textContent = 'Sending...';

  setTimeout(() => {
    btn.disabled    = false;
    btn.textContent = 'Send Reset Link';

    // Hide forgot form, show success
    document.getElementById('forgot-form').classList.add('hidden');
    document.getElementById('forgot-success').classList.remove('hidden');
  }, 1600);
}

/* ════════════════════════════════════════════════
   OTP BOX — auto-advance, backspace, paste
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
   SUCCESS STATE — with live status messages
   ════════════════════════════════════════════════ */
function showSuccess() {
  // Hide all forms
  ['login-form', 'otp-form', 'forgot-form', 'forgot-success']
    .forEach(id => document.getElementById(id).classList.add('hidden'));

  document.getElementById('success-msg').classList.remove('hidden');

  // Animate redirect bar
  setTimeout(() => {
    const bar = document.getElementById('redirect-bar');
    if (bar) bar.style.width = '100%';
  }, 100);

  // Cycle through live status messages
  const liveEl = document.getElementById('live-text');
  let msgIndex = 0;

  const msgInterval = setInterval(() => {
    msgIndex++;
    if (msgIndex < liveMessages.length) {
      liveEl.textContent = liveMessages[msgIndex];
    } else {
      clearInterval(msgInterval);
    }
  }, 420);

  // Redirect to doctor dashboard after 2.3s
  setTimeout(() => {
    console.log('Redirecting to doctor dashboard...');
     window.location.href = 'doctor-dashboard.html';
  }, 2300);
}