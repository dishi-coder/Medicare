/* ═══════════════════════════════════════════════
   MediCare Hospital — auth.js
   Shared auth logic — localStorage based
   Use karo: sabhi HTML pages mein include karo
   ═══════════════════════════════════════════════ */

const Auth = {

  /* ── Save login info ── */
  login(role, data) {
    localStorage.setItem('mc_logged_in', 'true');
    localStorage.setItem('mc_role', role);           // 'patient' or 'doctor'
    localStorage.setItem('mc_user', JSON.stringify(data));
  },

  /* ── Logout ── */
  logout() {
    localStorage.removeItem('mc_logged_in');
    localStorage.removeItem('mc_role');
    localStorage.removeItem('mc_user');
    window.location.href = 'index.html';
  },

  /* ── Check if logged in ── */
  isLoggedIn() {
    return localStorage.getItem('mc_logged_in') === 'true';
  },

  /* ── Get role ── */
  getRole() {
    return localStorage.getItem('mc_role') || null;
  },

  /* ── Get user data ── */
  getUser() {
    const u = localStorage.getItem('mc_user');
    return u ? JSON.parse(u) : null;
  },

  /* ── Get initials from name ── */
  getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  },

  /* ── Update navbar on index.html ── */
  updateNavbar() {
    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;

    if (this.isLoggedIn()) {
      const user = this.getUser();
      const role = this.getRole();
      const name = user?.name || (role === 'doctor' ? 'Doctor' : 'Patient');
      const initials = this.getInitials(name);
      const dashLink = role === 'doctor' ? 'doctor-dashboard.html' : 'patient-dashboard.html';

      navRight.innerHTML = `
        <a href="${dashLink}" class="nav-profile-btn">
          <div class="nav-avatar">${initials}</div>
          <div class="nav-profile-info">
            <div class="nav-profile-name">${name}</div>
            <div class="nav-profile-role">${role === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}</div>
          </div>
        </a>
        <button class="btn btn-logout" onclick="Auth.logout()">Logout</button>
      `;
    } else {
      navRight.innerHTML = `
        <a href="patient-login.html" class="btn btn-outline">Patient Login</a>
        <a href="doctor-login.html" class="btn btn-blue">Doctor Login</a>
      `;
    }
  },

  /* ── Protect dashboard pages ──
     Call this on dashboard pages to redirect if not logged in ── */
  requireLogin(role) {
    if (!this.isLoggedIn()) {
      window.location.href = role === 'doctor' ? 'doctor-login.html' : 'patient-login.html';
      return false;
    }
    return true;
  }
};