// ============================================================
// script.js - Main Application Logic
// Hotel Attendance System
// ============================================================

class HotelAttendanceApp {
  constructor() {
    this.currentUser = null;
    this.isOnline = navigator.onLine;
    this.init();
  }

  /**
   * Initialize Application
   */
  async init() {
    this.setupEventListeners();
    this.checkOnlineStatus();
    this.checkAuthentication();
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Logout Button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Navigation Items
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', (e) => this.handleNavigation(e));
    });

    // Online/Offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showAlert('✅ Kembali Online', 'success');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showAlert('❌ Tidak Ada Koneksi Internet', 'error');
    });
  }

  /**
   * Handle login
   */
  async handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validation
    if (!this.validateEmail(email)) {
      this.showAlert('❌ Email tidak valid', 'error');
      return;
    }

    if (password.length < 6) {
      this.showAlert('❌ Password minimal 6 karakter', 'error');
      return;
    }

    if (!this.isOnline) {
      this.showAlert('❌ Tidak ada koneksi internet', 'error');
      return;
    }

    // Show loading
    const btn = document.querySelector('#login-form button');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Menghubungkan...';
    btn.disabled = true;

    try {
      const response = await HotelAPI.auth.login(email, password);

      if (response.success) {
        // Save token
        localStorage.setItem('hotelToken', response.token);
        localStorage.setItem('hotelUser', JSON.stringify(response.user));
        this.currentUser = response.user;

        this.showAlert('✅ Login berhasil!', 'success');
        setTimeout(() => {
          this.showDashboard();
        }, 500);
      } else {
        this.showAlert(`❌ ${response.message || 'Login gagal'}`, 'error');
      }
    } catch (err) {
      this.showAlert(`❌ Error: ${err.message}`, 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  /**
   * Check authentication status
   */
  checkAuthentication() {
    const token = localStorage.getItem('hotelToken');
    const user = localStorage.getItem('hotelUser');

    if (token && user) {
      try {
        this.currentUser = JSON.parse(user);
        this.showDashboard();
      } catch (err) {
        console.error('Error parsing user:', err);
        this.showLogin();
      }
    } else {
      this.showLogin();
    }
  }

  /**
   * Show login section
   */
  showLogin() {
    const loginSection = document.getElementById('login-section');
    const mainDashboard = document.getElementById('main-dashboard');
    
    if (loginSection) loginSection.classList.remove('hidden');
    if (mainDashboard) mainDashboard.classList.add('hidden');
    
    // Clear form
    const form = document.getElementById('login-form');
    if (form) form.reset();
  }

  /**
   * Show dashboard
   */
  showDashboard() {
    const loginSection = document.getElementById('login-section');
    const mainDashboard = document.getElementById('main-dashboard');
    
    if (loginSection) loginSection.classList.add('hidden');
    if (mainDashboard) mainDashboard.classList.remove('hidden');
    
    this.updateUserInfo();
    this.loadPage('home');
  }

  /**
   * Update user info in navbar
   */
  updateUserInfo() {
    if (this.currentUser) {
      const userNameEl = document.getElementById('user-name');
      const userRoleEl = document.getElementById('user-role');
      const avatarEl = document.getElementById('user-avatar');
      
      if (userNameEl) userNameEl.textContent = this.currentUser.name || 'User';
      if (userRoleEl) userRoleEl.textContent = this.currentUser.role || 'Employee';
      
      if (avatarEl) {
        const firstLetter = (this.currentUser.name || 'U').charAt(0).toUpperCase();
        avatarEl.textContent = firstLetter;
      }
    }
  }

  /**
   * Handle navigation
   */
  handleNavigation(e) {
    const page = e.currentTarget.dataset.page;
    
    // Update active button
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.remove('active-nav');
      btn.classList.add('opacity-50');
    });
    
    e.currentTarget.classList.add('active-nav');
    e.currentTarget.classList.remove('opacity-50');
    
    this.loadPage(page);
  }

  /**
   * Load page content
   */
  async loadPage(page) {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
    contentArea.innerHTML = '<div class="text-center text-white">⏳ Memuat...</div>';

    switch (page) {
      case 'home':
        await this.renderHome();
        break;
      case 'attendance':
        await this.renderAttendance();
        break;
      case 'history':
        await this.renderHistory();
        break;
      case 'profile':
        await this.renderProfile();
        break;
      default:
        await this.renderHome();
    }
  }

  /**
   * Render Home Page
   */
  async renderHome() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
    try {
      // Mock data untuk demo (karena API mungkin belum ready)
      const response = {
        clockIn: '08:00 AM',
        clockOut: null,
        workingHours: '-',
      };
      
      // Jika ingin menggunakan API, uncomment:
      // const response = await HotelAPI.attendance.getTodayStatus();
      
      let statusHtml = `
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-white mb-6">📊 Dashboard Hari Ini</h2>
          
          <div class="glass-card p-6 rounded-2xl">
            <h3 class="text-white font-semibold mb-4">Status Kehadiran</h3>
            <div class="space-y-3">
              <div class="flex justify-between text-white">
                <span>Clock In:</span>
                <span class="font-bold">${response.clockIn ? response.clockIn : '⏳ Belum'}</span>
              </div>
              <div class="flex justify-between text-white">
                <span>Clock Out:</span>
                <span class="font-bold">${response.clockOut ? response.clockOut : '⏳ Belum'}</span>
              </div>
              <div class="flex justify-between text-white border-t border-white border-opacity-20 pt-3">
                <span>Total Jam Kerja:</span>
                <span class="font-bold text-green-300">${response.workingHours || '-'}</span>
              </div>
            </div>
          </div>

          <div class="glass-card p-6 rounded-2xl">
            <h3 class="text-white font-semibold mb-4">🎯 Aksi Cepat</h3>
            <div class="grid grid-cols-2 gap-3">
              <button onclick="app.quickAction('clockIn')" class="glass-btn py-3 rounded-xl text-white font-semibold hover:bg-white hover:bg-opacity-20">
                ⏰ Clock In
              </button>
              <button onclick="app.quickAction('clockOut')" class="glass-btn py-3 rounded-xl text-white font-semibold hover:bg-white hover:bg-opacity-20">
                🔔 Clock Out
              </button>
            </div>
          </div>

          <div class="glass-card p-6 rounded-2xl">
            <h3 class="text-white font-semibold mb-4">📌 Informasi Penting</h3>
            <p class="text-blue-100 text-sm leading-relaxed">
              Selamat datang di sistem absensi hotel. Pastikan Anda melakukan clock in dan clock out tepat waktu setiap harinya.
            </p>
          </div>
        </div>
      `;
      
      contentArea.innerHTML = statusHtml;
    } catch (err) {
      console.error('Error rendering home:', err);
      contentArea.innerHTML = `<div class="text-red-300">❌ Error: ${err.message}</div>`;
    }
  }

  /**
   * Render Attendance Page (Camera)
   */
  async renderAttendance() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
    contentArea.innerHTML = `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-white mb-6">📸 Absensi</h2>
        
        <div class="glass-card p-6 rounded-2xl text-center">
          <div id="camera-preview" class="w-full h-64 bg-black rounded-xl mb-4 flex items-center justify-center text-white">
            <span>📷 Preview Kamera</span>
          </div>
          
          <div class="space-y-3">
            <button onclick="app.clockInAction()" class="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition">
              ✅ Clock In dengan Foto
            </button>
            <button onclick="app.clockOutAction()" class="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition">
              ❌ Clock Out dengan Foto
            </button>
          </div>
        </div>

        <div class="glass-card p-6 rounded-2xl">
          <h3 class="text-white font-semibold mb-3">📍 Informasi Lokasi</h3>
          <div id="location-info" class="text-blue-100 text-sm space-y-2">
            <p>Mengambil lokasi...</p>
          </div>
        </div>
      </div>
    `;

    // Get location
    try {
      const locationInfo = await initLocationServices();
      if (locationInfo && locationInfo.success) {
        const locationHtml = `
          <p><strong>Lat:</strong> ${locationInfo.latitude.toFixed(6)}</p>
          <p><strong>Lng:</strong> ${locationInfo.longitude.toFixed(6)}</p>
          <p><strong>Akurasi:</strong> ${locationInfo.accuracy}</p>
        `;
        const locEl = document.getElementById('location-info');
        if (locEl) locEl.innerHTML = locationHtml;
      } else {
        const locEl = document.getElementById('location-info');
        if (locEl) locEl.innerHTML = '<p class="text-yellow-300">⚠️ Lokasi tidak tersedia</p>';
      }
    } catch (err) {
      console.error('Location error:', err);
      const locEl = document.getElementById('location-info');
      if (locEl) locEl.innerHTML = `<p class="text-red-300">❌ ${err.message}</p>`;
    }
  }

  /**
   * Clock In Action
   */
  async clockInAction() {
    this.showAlert('📸 Fitur Clock In sedang dikembangkan', 'info');
    // Nanti implement dengan camera.js
  }

  /**
   * Clock Out Action
   */
  async clockOutAction() {
    this.showAlert('📸 Fitur Clock Out sedang dikembangkan', 'info');
    // Nanti implement dengan camera.js
  }

  /**
   * Render History Page
   */
  async renderHistory() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
    contentArea.innerHTML = '<div class="text-white">⏳ Memuat riwayat...</div>';

    try {
      // Mock data untuk demo
      const response = {
        data: [
          { date: '2026-05-08', clockIn: '08:00 AM', clockOut: '05:00 PM', status: 'present' },
          { date: '2026-05-07', clockIn: '08:15 AM', clockOut: '05:30 PM', status: 'present' },
          { date: '2026-05-06', clockIn: '08:00 AM', clockOut: '05:00 PM', status: 'present' },
        ]
      };
      
      // Jika ingin menggunakan API, uncomment:
      // const response = await HotelAPI.attendance.getHistory({ limit: 10 });
      
      let historyHtml = `
        <h2 class="text-2xl font-bold text-white mb-6">📋 Riwayat Absensi</h2>
        <div class="space-y-3">
      `;

      if (response.data && response.data.length > 0) {
        response.data.forEach((record) => {
          historyHtml += `
            <div class="glass-card p-4 rounded-xl">
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-white font-semibold">${record.date || 'N/A'}</p>
                  <p class="text-blue-200 text-sm">In: ${record.clockIn || '-'} | Out: ${record.clockOut || '-'}</p>
                </div>
                <span class="text-2xl">${record.status === 'present' ? '✅' : '❌'}</span>
              </div>
            </div>
          `;
        });
      } else {
        historyHtml += '<p class="text-blue-200">Belum ada riwayat absensi</p>';
      }

      historyHtml += '</div>';
      contentArea.innerHTML = historyHtml;
    } catch (err) {
      console.error('History error:', err);
      contentArea.innerHTML = `<div class="text-red-300">❌ Error: ${err.message}</div>`;
    }
  }

  /**
   * Render Profile Page
   */
  async renderProfile() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
    const profileHtml = `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-white mb-6">👤 Profil Saya</h2>
        
        <div class="glass-card p-6 rounded-2xl text-center">
          <div class="w-20 h-20 rounded-full bg-white flex items-center justify-center font-bold text-purple-900 mx-auto mb-4 text-2xl">
            ${(this.currentUser?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <h3 class="text-white text-xl font-bold mb-2">${this.currentUser?.name || 'User'}</h3>
          <p class="text-blue-200 mb-4">${this.currentUser?.email || 'email@example.com'}</p>
          <p class="text-blue-100"><strong>Jabatan:</strong> ${this.currentUser?.role || 'Employee'}</p>
        </div>

        <div class="glass-card p-6 rounded-2xl space-y-3">
          <h3 class="text-white font-semibold mb-4">⚙️ Pengaturan</h3>
          <button onclick="app.changePassword()" class="w-full py-3 glass-btn text-white rounded-xl hover:bg-white hover:bg-opacity-20">
            🔐 Ubah Password
          </button>
          <button onclick="app.logout()" class="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition">
            🚪 Logout
          </button>
        </div>
      </div>
    `;

    contentArea.innerHTML = profileHtml;
  }

  /**
   * Quick action handler
   */
  async quickAction(action) {
    if (action === 'clockIn') {
      this.clockInAction();
    } else if (action === 'clockOut') {
      this.clockOutAction();
    }
  }

  /**
   * Change password
   */
  changePassword() {
    const oldPassword = prompt('Masukkan password lama:');
    if (!oldPassword) return;

    const newPassword = prompt('Masukkan password baru (minimal 6 karakter):');
    if (!newPassword || newPassword.length < 6) {
      this.showAlert('❌ Password minimal 6 karakter', 'error');
      return;
    }

    const confirmPassword = prompt('Konfirmasi password baru:');
    if (newPassword !== confirmPassword) {
      this.showAlert('❌ Password tidak cocok', 'error');
      return;
    }

    // Call API
    HotelAPI.auth.changePassword(oldPassword, newPassword).then((response) => {
      if (response.success) {
        this.showAlert('✅ Password berhasil diubah', 'success');
      } else {
        this.showAlert(`❌ ${response.message || 'Gagal mengubah password'}`, 'error');
      }
    });
  }

  /**
   * Logout
   */
  logout() {
    if (!confirm('Yakin ingin logout?')) return;

    HotelAPI.utils.clearAllData();
    this.currentUser = null;
    this.showLogin();
    this.showAlert('✅ Logout berhasil', 'success');
  }

  /**
   * Show alert message
   */
  showAlert(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 p-4 rounded-lg text-white font-semibold max-w-sm z-50 animate-bounce`;

    if (type === 'success') {
      alertDiv.style.backgroundColor = '#10b981';
    } else if (type === 'error') {
      alertDiv.style.backgroundColor = '#ef4444';
    } else {
      alertDiv.style.backgroundColor = '#3b82f6';
    }

    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
      alertDiv.remove();
    }, 3000);
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Check online status
   */
  checkOnlineStatus() {
    this.isOnline = navigator.onLine;
    if (!this.isOnline) {
      this.showAlert('⚠️ Anda sedang offline', 'error');
    }
  }
}

// ==================== INITIALIZE ====================

const app = new HotelAttendanceApp();
window.app = app; // Make it globally accessible
